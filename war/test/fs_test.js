module("FS");

asyncTest("Create, Get, Delete Bucket", 10, function() {
	var util = new Util();
	var crypto = new Crypto();
	crypto.readKeys("test@asdf.com");
	crypto.setPassphrase('yxcv');
	
	var server = new Server();
	var fs = new FS(crypto, server);

	var name = 'Test Bucket';
	// create
	fs.createBucket(name, function(bucket) {
		ok(bucket);
		ok(bucket.encryptedFS);
		
		// get created fs
		var bucketFS = fs.getBucketFS(bucket.encryptedFS);
		ok(bucketFS);
		equal(bucketFS.name, name);
		equal(bucketFS.id, bucket.id);
		
		// add file to bucket fs
		var ct = "Hello, World!";
		var ctAB = util.binStr2ArrBuf(ct);

		// create blob for uploading
		var bb = new BlobBuilder();
		bb.append(ctAB);
		var blob = bb.getBlob('application/octet-stream');
		var ctMd5 = md5(ct);
		
		server.uploadBlob(blob, ctMd5, function(fileBlobKey) {
			var file = new fs.File("test file.pdf", "1024", "application/pdf", fileBlobKey);
			fs.addFileToBucketFS(file, bucketFS, bucket, function(updatedBucket) {
				
				var gottenBucketFS = fs.getBucketFS(updatedBucket.encryptedFS);
				equal(gottenBucketFS.root[0].name, bucketFS.root[0].name);
			
				// delete file from bucket fs
				fs.deleteFile(file.blobKey, function() {
					fs.deleteFileFromBucketFS(file.blobKey, bucketFS, bucket, function() {
						equal(bucketFS.root.length, 0);

						// test getAllBuckets
						fs.getBuckets(function(bucketPointers) {
							ok(bucketPointers);
							ok(bucketPointers.length >= 1);

							// remove the created bucket
							fs.removeBucket(bucket, function(resp) {
								equal(resp, "");

								start();
							});
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