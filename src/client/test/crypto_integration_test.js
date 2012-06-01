module("Integration - Crypto, Google Drive");

asyncTest("Upload, Download, Delete encrypted blob", 3, function() {
	var util = new Util(window);
	var server = new Server(util);
	var crypto = new Crypto(window, openpgp, util);
	var oauth = new OAuth(window);
	var gdrive = new GoogleDrive(util, server);
	
	var oauthParams = oauth.oauth2Callback();
	if (oauthParams) {
		// if oauth params are present, do test
		testUpload();
		
	} else {
		// test failed
		start();
		return;
	}
	
	function testUpload() {
		// build test message
		var message = 'Hello, World!';

		// symmetrically encrypt the string
		crypto.symmetricEncrypt(message, function(ct) {

			// convert binary string to ArrayBuffer
			var ctAB = util.binStr2ArrBuf(ct.ct);
			// create blob for uploading
			var blob = util.arrBuf2Blob(ctAB, 'application/octect-stream');
			var ctMd5 = md5(ct.ct);

			// upload to google drive
			gdrive.uploadBlob(blob, oauthParams, ctMd5, function(created) {
				ok(created.id, 'Created ID ' + created.id);

				// download
				gdrive.downloadBlob(created.downloadUrl, oauthParams, function(downloaded) {
					util.blob2BinStr(downloaded, function(encrStr) {				

						// symmetrically decrypt the string
						crypto.symmetricDecrypt(ct.key, encrStr, function(pt) {
							equal(pt, message);

							// delete
							gdrive.deleteBlob(created.id, oauthParams, function(resp) {
								ok(resp.labels.trashed, 'Deleted blob');

								start();
							});
						});

					});
				});

			}, function(err) {
				// test failed
				start();
				return;
			});

		});
	}
	
});

module("Integration - Crypto, PKI");

asyncTest("CRUD PGP KeyPair to Server", 8, function() {
	var util = new Util(window);
	var server = new Server(util);
	var crypto = new Crypto(window, openpgp, util, server);
	crypto.setPassphrase('asdf');
	
	var email = "test@example.com";
	
	var keys = crypto.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(crypto.readKeys(keyId));
	
	// try to sync to server
	crypto.syncKeysToServer(email, function(keyId) {
		ok(keyId);
		
		checkServerKeys(keyId);
	});
	
	function checkServerKeys(keyId) {
		
		crypto.fetchKeys(email, keyId, function(keys) {
			equal(keys.publicKey.asciiArmored, crypto.getPublicKey());
			equal(keys.publicKey.keyId, crypto.getPublicKeyIdBase64());
			equal(keys.privateKey.asciiArmored, crypto.getPrivateKey());
			equal(keys.privateKey.keyId, crypto.getPublicKeyIdBase64());
			
			var base64Key = btoa(keyId);
			var encodedKeyId = encodeURIComponent(base64Key);
			
			server.xhr({
				type: 'DELETE',
				uri: '/ws/publicKeys?keyId=' + encodedKeyId,
				expected: 200,
				success: function(resp) {
					equal(resp, "");
					
					deletePrivateKey();
				}
			});
			
			function deletePrivateKey() {
				server.xhr({
					type: 'DELETE',
					uri: '/ws/privateKeys?keyId=' + encodedKeyId,
					expected: 200,
					success: function(resp) {
						equal(resp, "");

						start();
					}
				});
			}
		}, function(err) {
			// test failed
			start();
			return;
		});
		
	}
		
});