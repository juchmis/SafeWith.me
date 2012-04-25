module("FS");

asyncTest("Create, Get, Delete Bucket", 16, function() {
	var email = "test@example.com";
	var publicKeyId = undefined;
	
	// create public key
	CRYPTO.setPassphrase('asdf');
	
	var keys = CRYPTO.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(CRYPTO.readKeys(keyId));
	
	// try to sync to server
	CRYPTO.syncKeysToServer('test@example.com', function(keyId) {
		ok(keyId);
		
		publicKeyId = window.btoa(keyId);

		createTestData();
	});
	
	function createTestData() {
		// create bucket
		var name = 'Test Bucket';
		FS.createBucket(name, publicKeyId, function(bucket) {
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

			// DO TEST
			testStoreFile(bucket, bucketFS, blob);
		});
	}
	
	function testStoreFile(bucket, bucketFS, blob) {
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
					FS.getBuckets(publicKeyId, function(bucketPointers) {
						ok(bucketPointers);
						ok(bucketPointers.length >= 1);

						// remove the created bucket
						FS.removeBucket(bucket, function(resp) {
							equal(resp, "", "Remove Bucket");

							deletePublicKey();
						});
					});
				});
			});
		});
	}
	
	// cleanup
	function deletePublicKey() {
		SERVER.xhr({
			type: 'DELETE',
			uri: '/ws/publicKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				deletePrivateKey();
			}
		});
	}
	
	function deletePrivateKey() {
		SERVER.xhr({
			type: 'DELETE',
			uri: '/ws/privateKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				start();
			}
		});
	}
	
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