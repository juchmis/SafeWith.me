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

test("Bucket Cache (in local storage)", 2, function() {
	var email = 'test@qwertz.de';
	
	var bucket = {
		id: '1',
		encryptedFS: 'asdfasdf',
		ownerEmail: email,
		publicKeyId: 'pubKeyId123'
	};
	
	bucketCache.putBucket(bucket);
	equal(bucketCache.getAllBuckets(email)[0].id, bucket.id);
	
	bucketCache.removeBucket(bucket);
	equal(bucketCache.getAllBuckets(email).length, 0);
});