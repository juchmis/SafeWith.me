module("Unit - FS Cache");

function initBucketCache() {
	var util = new Util(window, uuid);
	var cache = new Cache(window);
	var server = new ServerDummy("");
	var bucketCache = new BucketCache(cache, server);
	
	return bucketCache;
}

test("Bucket FS Cache (in memory)", 6, function() {
	var bucketCache = initBucketCache();
	var fs = new FS();
	
	ok(!bucketCache.current());
	ok(!bucketCache.current());
	
	var bucket = {
		encryptedFS : 'asdfasdf'
	};
	
	var bucketFS = new fs.BucketFS('testId', 'Test BucketFS');
	
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
	var bucketCache = initBucketCache();
	
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