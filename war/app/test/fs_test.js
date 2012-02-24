module("FS");

asyncTest("Create, Get, Delete Bucket", 9, function() {
	var crypto = new Crypto();
	crypto.init("test@asdf.com");
	var server = new Server();
	var fs = new FS(crypto, server);

	var name = 'Test Bucket';
	// create
	fs.createBucket(name, function(bucket) {
		ok(bucket);
		ok(bucket.fsBlobUri);
		
		// get created fs
		fs.getBucketFS(bucket.fsBlobUri, function(bucketFS) {
			ok(bucketFS);
			equal(bucketFS.name, name);
			
			// add file to bucket fs
			server.uploadBlob("Hello, World!", function(uri) {
				var file = new fs.File("test file.pdf", "1024", "application/pdf", uri);
				fs.addFileToBucketFS(file, bucketFS, bucket, function(updatedBucket) {
					fs.getBucketFS(updatedBucket.fsBlobUri, function(gottenBucketFS) {
						equal(gottenBucketFS.root[0].name, bucketFS.root[0].name);
					
						// delete file from bucket fs
						fs.deleteFile(file.blobUri, function() {
							fs.deleteFileFromBucketFS(file.blobUri, bucketFS, bucket, function() {
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
	});
});