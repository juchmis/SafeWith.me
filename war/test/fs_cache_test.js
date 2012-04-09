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