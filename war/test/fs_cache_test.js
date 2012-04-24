module("FS Cache");

var bucketCache = BUCKETCACHE;

test("Bucket FS Cache (in memory)", 6, function() {
	ok(!bucketCache.current());
	ok(!bucketCache.current());
	
	var bucket = {
		encryptedFS : 'asdfasdf'
	};
	
	var bucketFS = new FS.BucketFS('testId', 'Test BucketFS', 'test@asdf.com');
	
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

test("Bucket Cache (in local storage)", 6, function() {
	// test data
	var email = 'test@qwertz.de';
	bucketCache.clearBucketCache(email);

	var bucket1 = {
		id: '1',
		encryptedFS: 'asdfasdf',
		ownerEmail: email,
		publicKeyId: 'pubKeyId123'
	};

	var bucket2 = {
		id: '2',
		encryptedFS: 'yxcvycxv',
		ownerEmail: email,
		publicKeyId: 'pubKeyId123'
	};
	
	// get all buckets
	equal(bucketCache.getAllBuckets(email).length, 0);
	
	// put bucket
	bucketCache.putBucket(bucket1);
	equal(bucketCache.getAllBuckets(email).length, 1);
	equal(bucketCache.getAllBuckets(email)[0].id, bucket1.id);
	
	// remove bucket
	bucketCache.removeBucket(bucket1);
	equal(bucketCache.getAllBuckets(email).length, 0);
	
	// clear bucket cache
	bucketCache.putBucket(bucket1);
	bucketCache.putBucket(bucket2);
	equal(bucketCache.getAllBuckets(email).length, 2);
	bucketCache.clearBucketCache(email);
	equal(bucketCache.getAllBuckets(email).length, 0);
});

module("Sync: FS Cache");

asyncTest("Single bucket: Cache <-> Server", 4, function() {
	var email = "test@example.com";
	bucketCache.clearBucketCache(email);
	
	CRYPTO.setPassphrase('asdf');
	var keys = CRYPTO.generateKeys(1024);
	keyId = keys.privateKey.getKeyId();
	if (!CRYPTO.readKeys(keyId)) {
		throw 'keys could not be read!';
	}
	
	var createdBucketId = undefined;
	
	// create bucket on server (this also caches it locally after)
	FS.createBucket('Test Bucket1', email, function(bucket) {
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
				bucketCache.clearBucketCache(email);
				start();
			}
		});
	}
});

// asyncTest("BucketCache <- Server", 1, function() {
// 	// test data
// 	var email = 'test@qwertz.de';
// 	bucketCache.clearBucketCache(email);
// 
// 	var bucket1 = {
// 		id: '1',
// 		encryptedFS: 'asdfasdf',
// 		ownerEmail: email,
// 		publicKeyId: 'pubKeyId123'
// 	};
// 
// 	var bucket2 = {
// 		id: '2',
// 		encryptedFS: 'yxcvycxv',
// 		ownerEmail: email,
// 		publicKeyId: 'pubKeyId123'
// 	};
// 	
// 	bucketCache.putBucket(bucket1);
// 	var serverBuckets = [ bucket1, bucket2 ];
// 	
// 	bucketCache.syncBuckets(email, FS, function(syncedBuckets) {
// 		// only check the buckets in local sotarage
// 		// file blobs are not downloaded automatically from server
// 		deepEqual(bucketCache.getAllBuckets(email), serverBuckets);
// 		
// 		start();
// 	});
// });

asyncTest("BucketCache <- Server", 2, function() {
	var email = 'test@example.com';
	bucketCache.clearBucketCache(email);

	var bucket1 = {
		id: '3',
		encryptedFS: 'asdfasdf',
		ownerEmail: email,
		publicKeyId: 'pubKeyId123'
	};

	var bucket2 = {
		id: '4',
		encryptedFS: 'yxcvycxv',
		ownerEmail: email,
		publicKeyId: 'pubKeyId123'
	};
	
	// bucketCache.putBucket(bucket1);
	// bucketCache.putBucket(bucket2);
	
	var server = SERVER,
		createdBucketId = undefined;
	
	// create a bucket on the server
	var bucketJson = JSON.stringify(new FS.Bucket(email));
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
	
	function doTest() {
		// DO THE ACTUAL TEST AND SYNC
		bucketCache.syncBuckets(email, FS, function(syncedBuckets) {
			// compare buckets on server with the ones in local storage
			server.xhr({
				type: 'GET',
				uri: '/ws/buckets',
				expected: 200,
				success: function(updatedServerBuckets) {
					// check if buckets match
					var cachedBuckets = bucketCache.getAllBuckets(email);
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
				bucketCache.clearBucketCache(email);
				start();
			}
		});
	}
	
});