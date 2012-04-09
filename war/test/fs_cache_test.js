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

// test data
var email = 'test@qwertz.de';

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

test("Bucket Cache (in local storage)", 6, function() {
	bucketCache.clearBucketCache(email);
	
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

asyncTest("BucketCache <- Server", 1, function() {
	bucketCache.clearBucketCache(email);
	
	bucketCache.putBucket(bucket1);
	var serverBuckets = [ bucket1, bucket2 ];
	
	bucketCache.syncBuckets(serverBuckets, function(syncedBuckets) {
		// only check the buckets in local sotarage
		// file blobs are not downloaded automatically from server
		deepEqual(bucketCache.getAllBuckets(email), serverBuckets);
		
		start();
	});
});

asyncTest("BucketCache -> Server", 1, function() {
	var email = 'test@example.com';
	bucketCache.clearBucketCache(email);
	var server = SERVER;

	bucketCache.putBucket(bucket1);
	bucketCache.putBucket(bucket2);
	var serverBuckets = [ bucket1 ];
	
	var createdBucket = undefined;
	
	// create a bucket on the server
	server.xhr({
		type: 'POST',
		uri: '/app/buckets',
		expected: 201,
		success: function(bucket) {
			
			createdBucket = bucket;
			
			// get bucket from the server
			server.xhr({
				type: 'GET',
				uri: '/app/buckets',
				expected: 200,
				success: function(serverBuckets) {
					doSync(serverBuckets);
				}
			});
			
		}
	});
	
	function doSync(serverBuckets) {
		// DO THE ACTUAL TEST AND SYNC
		bucketCache.syncBuckets(serverBuckets, function(syncedBuckets) {
			// compare buckets on server with the ones in local storage
			server.xhr({
				type: 'GET',
				uri: '/app/buckets',
				expected: 200,
				success: function(updatedServerBuckets) {
					// check if buckets match
					deepEqual(bucketCache.getAllBuckets(email), serverBuckets);
					deepEqual(bucketCache.getAllBuckets(email), updatedServerBuckets);

					// check file blobs
					
					// cleanup after test
					deleteBucket();
				}
			});
		});
	}
	
	function deleteBucket() {
		// delete bucket DTO in datastore
		server.xhr({
			type: 'DELETE',
			uri: '/app/buckets?bucketId=' + createdBucket.id,
			expected: 200,
			success: function(resp) {
				start();
			}
		});
	}
	
});