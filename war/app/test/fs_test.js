module("FS");

asyncTest("Create, Get, Delete Bucket", 10, function() {
	var crypto = new Crypto();
	crypto.initKeyStore("test@asdf.com");
	var server = new Server();
	var fs = new FS(crypto, server);

	var name = 'Test Bucket';
	// create
	fs.createBucket(name, function(bucket) {
		ok(bucket);
		ok(bucket.fsBlobKey);
		
		// get created fs
		fs.getBucketFS(bucket.fsBlobKey, function(bucketFS) {
			ok(bucketFS);
			equal(bucketFS.name, name);
			equal(bucketFS.id, bucket.id);
			
			// add file to bucket fs
			server.uploadBlob("Hello, World!", function(fileBlobKey) {
				var file = new fs.File("test file.pdf", "1024", "application/pdf", fileBlobKey);
				fs.addFileToBucketFS(file, bucketFS, bucket, function(updatedBucket) {
					fs.getBucketFS(updatedBucket.fsBlobKey, function(gottenBucketFS) {
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
	});
});