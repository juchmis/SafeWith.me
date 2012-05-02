module("FS Cache");

test("Bucket FS Cache (in memory)", 6, function() {
	var cache = new Cache(window);
	var server = new Server();
	var bucketCache = new BucketCache(cache, server);
	
	ok(!bucketCache.current());
	ok(!bucketCache.current());
	
	var bucket = {
		encryptedFS : 'asdfasdf'
	};
	
	var bucketFS = new FS.BucketFS('testId', 'Test BucketFS');
	
	bucketCache.putFS(bucket, bucketFS);
	
	var currentBucket = bucketCache.current().bucket;
	var currentBucketFS = bucketCache.current().bucketFS;
	ok(currentBucket);
	ok(currentBucketFS);
	equal(currentBucket.encryptedFS, 'asdfasdf');
	equal(currentBucketFS.name, 'Test BucketFS');
	
	// clear cache
	bucketCache.clearFSCache();
});

var publicKeyId = 'pubKeyId123';

test("Bucket Cache (in local storage)", 6, function() {
	// test data
	bucketCache.clearBucketCache(publicKeyId);

	var bucket1 = {
		id: '1',
		encryptedFS: 'asdfasdf',
		publicKeyId: publicKeyId
	};

	var bucket2 = {
		id: '2',
		encryptedFS: 'yxcvycxv',
		publicKeyId: publicKeyId
	};
	
	// get all buckets
	equal(bucketCache.getAllBuckets(publicKeyId).length, 0);
	
	// put bucket
	bucketCache.putBucket(bucket1);
	equal(bucketCache.getAllBuckets(publicKeyId).length, 1);
	equal(bucketCache.getAllBuckets(publicKeyId)[0].id, bucket1.id);
	
	// remove bucket
	bucketCache.removeBucket(bucket1);
	equal(bucketCache.getAllBuckets(publicKeyId).length, 0);
	
	// clear bucket cache
	bucketCache.putBucket(bucket1);
	bucketCache.putBucket(bucket2);
	equal(bucketCache.getAllBuckets(publicKeyId).length, 2);
	bucketCache.clearBucketCache(publicKeyId);
	equal(bucketCache.getAllBuckets(publicKeyId).length, 0);
});

module("Sync: FS Cache");

asyncTest("Single bucket: Cache <-> Server", 8, function() {

	var createdBucketId = undefined;
	var publicKeyId = undefined;
	
	// create public key
	CRYPTO.setPassphrase('asdf');
	
	var keys = CRYPTO.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(CRYPTO.readKeys(keyId));
	
	// try to sync to server
	CRYPTO.syncKeysToServer('test@example.com', function(keyId) {
		ok(keyId);
		
		publicKeyId = window.btoa(keyId);
		
		createBucket();
	});
	
	function createBucket() {
		// create bucket on server (this also caches it locally after)
		FS.createBucket('Test Bucket1', publicKeyId, function(bucket) {
			var bucketFS = FS.getBucketFS(bucket);

			createdBucketId = bucket.id;

			// create file without blob-key to emulate local import without upload
			var file = new FS.File('Test file1', '4', 'text/plain', undefined, 'cryptoKey', 'md5');
			// add file to fs		
			bucketFS.root.push(file);
			var jsonFS = JSON.stringify(bucketFS);
			var encryptedFS = CRYPTO.asymmetricEncrypt(jsonFS);

			// update local bucket
			bucket.encryptedFS = encryptedFS;
			bucket.publicKeyId = CRYPTO.getPublicKeyIdBase64();
			bucket.lastUpdate = new Date().toISOString();
			// cache bucket in local storage
			bucketCache.putBucket(bucket);

			// sync to server
			doTest1(bucket.id);
		});
	}
	
	function doTest1(bucketId) {
		// DO TEST SYNC: Cache -> Server
		bucketCache.syncSingleBucket(bucketId, FS, function(syncedBucket) {
			// get bucket from server
			FS.getBucket(bucketId, function(serverBucket) {
				// check buckets
				deepEqual(syncedBucket, serverBucket);
				deepEqual(syncedBucket, CACHE.readObject(bucketId));
				
				updateOnlyServerBucket(serverBucket);
			});		
		});
	}
	
	function updateOnlyServerBucket(serverBucket) {
		// update bucket time
		serverBucket.lastUpdate = new Date().toISOString();
		FS.updateServerBucket(serverBucket, function(updatedServerBucket) {
			// sync from server
			doTest2(updatedServerBucket.id);
		});
	}

	function doTest2(bucketId) {
		// DO TEST SYNC: Cache -> Server
		bucketCache.syncSingleBucket(bucketId, FS, function(syncedBucket) {
			// get bucket from server
			FS.getBucket(bucketId, function(serverBucket) {
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
		SERVER.xhr({
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
		SERVER.xhr({
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
		SERVER.xhr({
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

function cleanup(createdBucketId, publicKeyId) {
	
}

asyncTest("BucketCache <- Server", 6, function() {
	
	var server = SERVER;
	var createdBucketId = undefined;
	var publicKeyId = undefined;

	// create public key
	CRYPTO.setPassphrase('asdf');
	
	var keys = CRYPTO.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(CRYPTO.readKeys(keyId));
	
	// try to sync to server
	CRYPTO.syncKeysToServer('test@example.com', function(keyId) {
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
		var bucketJson = JSON.stringify(new FS.Bucket(publicKeyId));
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
			}
		});
	}
	
	function doTest() {
		// DO THE ACTUAL TEST AND SYNC
		bucketCache.syncBuckets(publicKeyId, FS, function(syncedBuckets) {
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
		SERVER.xhr({
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
		SERVER.xhr({
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
		SERVER.xhr({
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