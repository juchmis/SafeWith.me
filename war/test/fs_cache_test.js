module("FS Cache");

test("Bucket FS Cache", 6, function() {
	ok(!BUCKETCACHE.current());
	ok(!BUCKETCACHE.current());
	
	var bucket = {
		encryptedFS : 'asdfasdf'
	};
	
	var bucketFS = new FS.BucketFS('testId', 'Test BucketFS', 'test@asdf.com');
	
	BUCKETCACHE.putFS(bucket, bucketFS);
	
	var currentBucket = BUCKETCACHE.current().bucket;
	var currentBucketFS = BUCKETCACHE.current().bucketFS;
	ok(currentBucket);
	ok(currentBucketFS);
	equal(currentBucket.encryptedFS, 'asdfasdf');
	equal(currentBucketFS.name, 'Test BucketFS');
	
	// clear cache
	BUCKETCACHE.clearFSCache();
});