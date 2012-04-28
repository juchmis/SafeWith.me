module("Convergent/Symmetric Crypto");

asyncTest("WebWorker", 2, function() {
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	CRYPTO.symmetricEncrypt(message, function(ct) {
		ok(ct.ct && ct.key);

		var decrStart = (new Date).getTime();
		
		CRYPTO.symmetricDecrypt(ct.key, ct.ct, function(pt) {
			equal(pt, message);
			
			start();
		});
	});
});

// test("Without WebWorker", 3, function() {
// 	var message = '';
// 	for (var i=0; i < 147; i++) {
// 		message += testImg1Base64;
// 	}
// 
// 	console.log('blob size [bytes]: ' + message.length);
// 	var start = (new Date).getTime();
// 	
// 	var ct = CRYPTOWORKER.symmetricEncrypt(message);
// 	
// 	var diff = (new Date).getTime() - start;
// 	console.log('OpenPGP.js: Time taken for encryption [ms]: ' + diff);
// 	console.log('key: "' + ct.key + '", key length: ' + ct.key.length + ', ct lenght [bytes]: ' + ct.ct.length);
// 	
// 	var ct2 = CRYPTOWORKER.symmetricEncrypt(message);
// 	equal(ct.ct, ct2.ct);
// 	equal(ct.key, ct2.key);
// 	
// 	var decrStart = (new Date).getTime();
// 	
// 	var pt = CRYPTOWORKER.symmetricDecrypt(ct.key, ct.ct);
// 	
// 	var decrDiff = (new Date).getTime() - decrStart;
// 	console.log('OpenPGP.js: Time taken for decryption [ms]: ' + decrDiff);
// 	
// 	equal(pt, message);
// });

// test("SJCL large blob", 1, function() {
// 	var message = '';
// 	for (var i=0; i < 147; i++) {
// 		message += testImg1Base64;
// 	}
// 	
// 	console.log('blob size [bytes]: ' + message.length);
// 	
// 	var start = (new Date).getTime();
// 	
// 	var p = {
// 		mode: 'ocb2'
// 	};
// 	var rp = {};
// 	var ct = sjcl.encrypt('asdf', message);
// 	var diff = (new Date).getTime() - start;
// 
// 	console.log('SJCL: Time taken for encryption [ms]: ' + diff);
// 	
// 	console.log('ct lenght [bytes]: ' + ct.length);
// 	
// 	var decrStart = (new Date).getTime();
// 	var pt = sjcl.decrypt('asdf', ct);
// 	var decrDiff = (new Date).getTime() - decrStart;
// 
// 	console.log('SJCL Time taken for decryption [ms]: ' + decrDiff);
// 	
// 	equal(pt, message);
// });

asyncTest("Upload blob", 4, function() {
	// build test message
	var message = 'Hello, World!';
	
	// symmetrically encrypt the string
	CRYPTO.symmetricEncrypt(message, function(ct) {
		
		// convert binary string to ArrayBuffer
		var ctAB = UTIL.binStr2ArrBuf(ct.ct);
		// create blob for uploading
		var blob = UTIL.arrBuf2Blob(ctAB, 'application/octet-stream');

		var ctMd5 = md5(ct.ct);
		// upload the encrypted blob to the server
		SERVER.uploadBlob(blob, ctMd5, function(blobKey) {
			ok(blobKey);

			// download blob
			SERVER.downloadBlob(blobKey, function(blob) {
				ok(blob);

				// read blob as binary string
				UTIL.blob2BinStr(blob, function(encrStr) {

					// symmetrically decrypt the string
					CRYPTO.symmetricDecrypt(ct.key, encrStr, function(pt) {
						equal(pt, message);

						// delete blob again
						SERVER.deleteBlob(blobKey, function(resp) {
							equal(resp, "");

							start();
						});
					});
				});
			});
		});
	});
	
});

module("Asymmetric Crypto");

var keyId;

CRYPTO.setPassphrase('asdf');

test("Generate keys", 7, function() {
	var start = (new Date).getTime();
	var keySize = 1024;
	var keys = CRYPTO.generateKeys(keySize);
	var diff = (new Date).getTime() - start;

	keyId = keys.privateKey.getKeyId();
	CRYPTO.readKeys(keyId);

	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair)');
	ok(CRYPTO.getPrivateKey());
	ok(CRYPTO.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(CRYPTO.getPublicKey());
	ok(CRYPTO.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
	
	helperEncrDecr("Hello, World!");
});

function helperEncrDecr(plaintext) {
	if (!CRYPTO.getPublicKey()) {
		CRYPTO.readKeys(keyId);
	}
	
	console.log('plaintext size [bytes]: ' + plaintext.length);
	
	var start = (new Date).getTime();
	var ct = CRYPTO.asymmetricEncrypt(plaintext);
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(ct, "ciphertext: see console output for benchmark");
	console.log('ciphertext size [bytes]: ' + ct.length);
	
	var decrStart = (new Date).getTime();
	var pt =  CRYPTO.asymmetricDecrypt(ct);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(pt, "decrypted: see console output for benchmark");
	equal(pt, plaintext, "Decrypted should be the same as the plaintext");
}

test("Encrypt/Decrypt 7KB Image", 3, function() {
	helperEncrDecr(testImg1Base64);
});

// test("Encrypt/Decrypt large Blob", 3, function() {
// 	// generate large string
// 	var bigBlob = '';
// 	for (var i=0; i < 147; i++) {
// 		bigBlob += testImg1Base64;
// 	}
// 	
// 	helperEncrDecr(bigBlob);
// });

asyncTest("Export keys", 3, function() {
	CRYPTO.exportKeys(function(url) {
		ok(url);
		
		$.get(url, function(data) {
			ok(data.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') !== -1);
			ok(data.indexOf('-----END PGP PRIVATE KEY BLOCK-----') !== -1);
			
			start();
		});
	});
});

asyncTest("CRUD PGP KeyPair to Server", 8, function() {
	var email = "test@example.com";
	
	var keys = CRYPTO.generateKeys(1024);
	var keyId = keys.privateKey.getKeyId();
	ok(CRYPTO.readKeys(keyId));
	
	// try to sync to server
	CRYPTO.syncKeysToServer(email, function(keyId) {
		ok(keyId);
		
		checkServerKeys(keyId);
	});
	
	function checkServerKeys(keyId) {
		
		CRYPTO.fetchKeys(email, keyId, function(keys) {
			equal(keys.publicKey.asciiArmored, CRYPTO.getPublicKey());
			equal(keys.publicKey.keyId, CRYPTO.getPublicKeyIdBase64());
			equal(keys.privateKey.asciiArmored, CRYPTO.getPrivateKey());
			equal(keys.privateKey.keyId, CRYPTO.getPublicKeyIdBase64());
			
			var base64Key = btoa(keyId);
			var encodedKeyId = encodeURIComponent(base64Key);
			
			SERVER.xhr({
				type: 'DELETE',
				uri: '/ws/publicKeys?keyId=' + encodedKeyId,
				expected: 200,
				success: function(resp) {
					equal(resp, "");
					
					deletePrivateKey();
				}
			});
			
			function deletePrivateKey() {
				SERVER.xhr({
					type: 'DELETE',
					uri: '/ws/privateKeys?keyId=' + encodedKeyId,
					expected: 200,
					success: function(resp) {
						equal(resp, "");

						start();
					}
				});
			}
		});
		
	}
		
});