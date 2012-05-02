module("FS Cache Integration");

asyncTest("Single bucket: Cache <-> Server", 8, function() {
	var util = new Util(window, uuid);
	var cache = new Cache(window);	
	var server = new Server(util);
	var bucketCache = new BucketCache(cache, server);
	var crypto = new Crypto(window, openpgp, util, server);
	var fs = new FS(crypto, server, util, cache,  bucketCache);

	var createdBucketId = undefined;
	var publicKeyId = undefined;
	
	// create public key
	crypto.setPassphrase('asdf');
	
	var keys = crypto.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(crypto.readKeys(keyId));
	
	// try to sync to server
	crypto.syncKeysToServer('test@example.com', function(keyId) {
		ok(keyId);
		
		publicKeyId = window.btoa(keyId);
		
		createBucket();
	});
	
	function createBucket() {
		// create bucket on server (this also caches it locally after)
		fs.createBucket('Test Bucket1', publicKeyId, function(bucket) {
			var bucketFS = fs.getBucketFS(bucket);

			createdBucketId = bucket.id;

			// create file without blob-key to emulate local import without upload
			var file = new fs.File('Test file1', '4', 'text/plain', undefined, 'cryptoKey', 'md5');
			// add file to fs		
			bucketFS.root.push(file);
			var jsonFS = JSON.stringify(bucketFS);
			var encryptedFS = crypto.asymmetricEncrypt(jsonFS);

			// update local bucket
			bucket.encryptedFS = encryptedFS;
			bucket.publicKeyId = crypto.getPublicKeyIdBase64();
			bucket.lastUpdate = new Date().toISOString();
			// cache bucket in local storage
			bucketCache.putBucket(bucket);

			// sync to server
			doTest1(bucket.id);
		});
	}
	
	function doTest1(bucketId) {
		// DO TEST SYNC: Cache -> Server
		bucketCache.syncSingleBucket(bucketId, fs, function(syncedBucket) {
			// get bucket from server
			fs.getBucket(bucketId, function(serverBucket) {
				// check buckets
				deepEqual(syncedBucket, serverBucket);
				deepEqual(syncedBucket, CACHE.readObject(bucketId));
				
				updateOnlyServerBucket(serverBucket);
				
			}, function(err) {
				// fetching bucket from server failed... stop test
				start();
				return;
			});		
		});
	}
	
	function updateOnlyServerBucket(serverBucket) {
		// update bucket time
		serverBucket.lastUpdate = new Date().toISOString();
		fs.updateServerBucket(serverBucket, function(updatedServerBucket) {
			// sync from server
			doTest2(updatedServerBucket.id);
		});
	}

	function doTest2(bucketId) {
		// DO TEST SYNC: Cache -> Server
		bucketCache.syncSingleBucket(bucketId, fs, function(syncedBucket) {
			// get bucket from server
			fs.getBucket(bucketId, function(serverBucket) {
				// check buckets
				deepEqual(syncedBucket, serverBucket);
				deepEqual(syncedBucket, CACHE.readObject(bucketId));

				deleteBucket();
			});
		});
	}

	// cleanup
	function deleteBucket() {
		// delete bucket DTO in datastore
		server.xhr({
			type: 'DELETE',
			uri: '/ws/buckets?bucketId=' + createdBucketId,
			expected: 200,
			success: function(resp) {
				// clean cache
				bucketCache.clearBucketCache(publicKeyId);
				
				deletePublicKey();
			}
		});
	}
	
	function deletePublicKey() {
		server.xhr({
			type: 'DELETE',
			uri: '/ws/publicKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				deletePrivateKey();
			}
		});
	}
	
	function deletePrivateKey() {
		server.xhr({
			type: 'DELETE',
			uri: '/ws/privateKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				start();
			}
		});
	}
	
});

asyncTest("BucketCache <- Server", 6, function() {
	var util = new Util(window, uuid);
	var cache = new Cache(window);	
	var server = new Server(util);
	var bucketCache = new BucketCache(cache, server);
	var crypto = new Crypto(window, openpgp, util, server);
	var fs = new FS(crypto, server, util, cache,  bucketCache);
	
	var createdBucketId = undefined;
	var publicKeyId = undefined;

	// create public key
	crypto.setPassphrase('asdf');
	
	var keys = crypto.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(crypto.readKeys(keyId));
	
	// try to sync to server
	crypto.syncKeysToServer('test@example.com', function(keyId) {
		ok(keyId);
		
		publicKeyId = window.btoa(keyId);
		
		createTestData();
	});
	
	function createTestData() {
		// create test data
		var bucket1 = {
			id: '3',
			encryptedFS: 'asdfasdf',
			publicKeyId: publicKeyId
		};

		var bucket2 = {
			id: '4',
			encryptedFS: 'yxcvycxv',
			publicKeyId: publicKeyId
		};
	
		// create a bucket on the server
		var bucketJson = JSON.stringify(new fs.Bucket(publicKeyId));
		server.xhr({
			type: 'POST',
			uri: '/ws/buckets',
			contentType: 'application/json',
			body: bucketJson,
			expected: 201,
			success: function(bucket) {

				// update bucket on client and cache new version
				bucket.encryptedFS = 'asdf5467569';
				bucket.lastUpdate = new Date().toISOString();
				bucketCache.putBucket(bucket);
				createdBucketId = bucket.id;

				doTest();
			},
			error: function() {
				// test failed
				start();
				return;
			}
		});
	}
	
	function doTest() {
		// DO THE ACTUAL TEST AND SYNC
		bucketCache.syncBuckets(publicKeyId, fs, function(syncedBuckets) {
			// compare buckets on server with the ones in local storage
			server.xhr({
				type: 'GET',
				uri: '/ws/buckets',
				expected: 200,
				success: function(updatedServerBuckets) {
					// check if buckets match
					var cachedBuckets = bucketCache.getAllBuckets(publicKeyId);
					deepEqual(syncedBuckets, cachedBuckets, 'Compare cached to synced');
					deepEqual(updatedServerBuckets, cachedBuckets, 'Compare cached to server');

					// check file blobs
					
					// cleanup after test
					deleteBucket();
				}
			});
		});
	}	

	// cleanup
	function deleteBucket() {
		// delete bucket DTO in datastore
		server.xhr({
			type: 'DELETE',
			uri: '/ws/buckets?bucketId=' + createdBucketId,
			expected: 200,
			success: function(resp) {
				// clean cache
				bucketCache.clearBucketCache(publicKeyId);
				
				deletePublicKey();
			}
		});
	}
	
	function deletePublicKey() {
		server.xhr({
			type: 'DELETE',
			uri: '/ws/publicKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				deletePrivateKey();
			}
		});
	}
	
	function deletePrivateKey() {
		server.xhr({
			type: 'DELETE',
			uri: '/ws/privateKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				start();
			}
		});
	}
	
});