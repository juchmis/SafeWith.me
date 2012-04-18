module("FS");

asyncTest("Create, Get, Delete Bucket", 12, function() {
	var email = "test@example.com";
	if(!CRYPTO.readKeys(email)) {
		return;
	}

	var name = 'Test Bucket';
	// create
	FS.createBucket(name, email, function(bucket) {
		ok(bucket);
		ok(bucket.encryptedFS);
		
		// get created fs
		var bucketFS = FS.getBucketFS(bucket);
		// cache decrypted bucketFS in memory
		FS.cacheBucketFS(bucket, bucketFS);
		
		ok(bucketFS);
		equal(bucketFS.name, name);
		equal(bucketFS.id, bucket.id);
		
		// create blob for uploading
		var ct = "Hello, World!";
		var ctAB = UTIL.binStr2ArrBuf(ct);
		var blob = UTIL.arrBuf2Blob(ctAB, 'text/plain');
		blob.name = 'test.txt';
		var ctMd5 = md5(ct);
		
		// store file
		FS.storeFile(blob, function() {}, function(file, updatedBucket) {
				
			var updatedBucketFS = FS.getBucketFS(updatedBucket);
			FS.cacheBucketFS(updatedBucket, updatedBucketFS);
			
			equal(JSON.stringify(updatedBucketFS), JSON.stringify(bucketFS));
			equal(bucket.encryptedFS, updatedBucket.encryptedFS);

			// read file
			FS.getFile(file, function() {}, function(url) {
				ok(url);

				// delete file from bucket fs
				FS.deleteFile(file, function() {
					equal(bucketFS.root.length, 0);

					// test getAllBuckets
					FS.getBuckets(email, function(bucketPointers) {
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