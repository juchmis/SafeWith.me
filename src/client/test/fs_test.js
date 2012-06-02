module("Unit - FS");

asyncTest("Create, Get, Delete Bucket", 16, function() {
	var util = new Util(window, uuid);
	var cache = new Cache(window);	
	var server = new ServerDummy("");
	var bucketCache = new BucketCache(cache, server);
	var crypto = new Crypto(window, openpgp, util, server);
	var fs = new FS(crypto, server, util, cache,  bucketCache, server);
	
	var email = "test@example.com";
	var publicKeyId = undefined;
	
	// create public key
	crypto.setPassphrase('asdf');
	
	var keys = crypto.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(crypto.readKeys(keyId));
	
	// try to sync to server
	crypto.syncKeysToServer('test@example.com', function(keyId) {
		ok(keyId, 'keyId: ' + keyId);
		
		publicKeyId = window.btoa(keyId);

		createTestData();
	});
	
	function createTestData() {
		// create bucket
		var name = 'Test Bucket';
		fs.createBucket(name, publicKeyId, function(bucket) {
			ok(bucket);
			ok(bucket.encryptedFS);

			// get created fs
			var bucketFS = fs.getBucketFS(bucket);
			// cache decrypted bucketFS in memory
			fs.cacheBucketFS(bucket, bucketFS);

			ok(bucketFS);
			equal(bucketFS.name, name);
			equal(bucketFS.id, bucket.id);

			// create blob for uploading
			var ct = "Hello, World!";
			var ctAB = util.binStr2ArrBuf(ct);
			var blob = util.arrBuf2Blob(ctAB, 'text/plain');
			blob.name = 'test.txt';
			var ctMd5 = md5(ct);

			// DO TEST
			testStoreFile(bucket, bucketFS, blob);
		});
	}
	
	function testStoreFile(bucket, bucketFS, blob) {
		// store file
		fs.storeFile(blob, function() {}, function(file, updatedBucket) {
				
			var updatedBucketFS = fs.getBucketFS(updatedBucket);
			fs.cacheBucketFS(updatedBucket, updatedBucketFS);
			
			equal(JSON.stringify(updatedBucketFS), JSON.stringify(bucketFS));
			equal(bucket.encryptedFS, updatedBucket.encryptedFS);

			// read file
			fs.getFile(file, function() {}, function(url) {
				ok(url);

				// delete file from bucket fs
				fs.deleteFile(file, function() {
					equal(bucketFS.root.length, 0);

					// test getAllBuckets
					fs.getBuckets(publicKeyId, function(bucketPointers) {
						ok(bucketPointers);
						ok(bucketPointers.length >= 1);

						// remove the created bucket
						fs.removeBucket(bucket, function(resp) {
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
		server.xhr({
			type: 'DELETE',
			uri: '/ws/publicKeys?keyId=' + encodeURIComponent(publicKeyId),
			expected: 200,
			success: function(resp) {
				equal(resp, "");

				deletePrivateKey();
			},
			error: function() {
				// test failed
				start();
				return;
			}
		});
	}
	
	function deletePrivateKey() {
		server.xhr({
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