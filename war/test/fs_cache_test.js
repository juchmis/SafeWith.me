module("FS Cache");

test("Bucket FS Cache", 1, function() {
	ok(!BUCKETCACHE.current());
	ok(!BUCKETCACHE.current());
	
	BUCKETCACHE.putFS()
});