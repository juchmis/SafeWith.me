module("FS");

asyncTest("Create, Get, Delete Bucket", 11, function() {
	CRYPTO.readKeys("test@asdf.com");

	var name = 'Test Bucket';
	// create
	FS.createBucket(name, function(bucket) {
		ok(bucket);
		ok(bucket.encryptedFS);
		
		// get created fs
		var bucketFS = FS.getBucketFS(bucket.encryptedFS);
		
		ok(bucketFS);
		equal(bucketFS.name, name);
		equal(bucketFS.id, bucket.id);
			
		// cache local user buckets and fs
		FS.cacheBucket(bucket, bucketFS);
		
		// create blob for uploading
		var ct = "Hello, World!";
		var ctAB = UTIL.binStr2ArrBuf(ct);
		var blob = UTIL.arrBuf2Blob(ctAB, 'application/octet-stream');
		blob.name = 'test.txt';
		var ctMd5 = md5(ct);
		
		// store file
		FS.storeFile(blob, function() {}, function(file, updatedBucket) {
			
			// read file
			FS.getFile(file, function(url) {
				ok(url);
				
				var gottenBucketFS = FS.getBucketFS(updatedBucket.encryptedFS);
				equal(gottenBucketFS.root[0].name, bucketFS.root[0].name);

				// delete file from bucket fs
				FS.deleteFile(file, function() {
					equal(bucketFS.root.length, 0);

					// test getAllBuckets
					FS.getBuckets(function(bucketPointers) {
						ok(bucketPointers);
						ok(bucketPointers.length >= 1);

						// remove the created bucket
						FS.removeBucket(bucket, function(resp) {
							equal(resp, "");

							start();
						});
					});
				});
			});
		});
	});
});

// asyncTest("Share bucket", function() {
// 	var crypto = new Crypto();
// 	crypto.readKeys("test@example.com");
// 	var server = new Server();
// 	var fs = new FS(crypto, server);
// 	
// 	fs.shareBucket(bucket, bucketFS, function() {
// 		
// 	});
// 
// 	
// 	start();
// });