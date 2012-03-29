module("Asymmetric Crypto");

CRYPTO.setPassphrase('yxcvasdfqwer');
var email = 'test@asdf.com';

test("Generate keys", 4, function() {
	var start = (new Date).getTime();
	var keySize = 2048;
	var keys = CRYPTO.generateKeys(keySize, email);
	var diff = (new Date).getTime() - start;

	var keyId = keys.privateKey.getKeyId();
	CRYPTO.readKeys(email, keyId);

	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair)');
	ok(CRYPTO.getPrivateKey());
	ok(CRYPTO.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(CRYPTO.getPublicKey());
	ok(CRYPTO.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

function helperEncrDecr(plaintext) {
	var cipher = CRYPTO.asymmetricEncrypt(plaintext);
	ok(cipher, "cipher");

	var decrypted =  CRYPTO.asymmetricDecrypt(cipher);
	ok(decrypted, "decrypted");

	equal(decrypted, plaintext, "Decrypted should be the same as the plaintext");
}

test("Encrypt/Decrypt Text", 3, function() {
	helperEncrDecr("Hello, World!");
});

test("Encrypt/Decrypt 7KB Image", 3, function() {
	helperEncrDecr(testImg1Base64);
});

test("Encrypt/Decrypt large Blob", 3, function() {
	// generate large string
	var bigBlob = '';
	for (var i=0; i < 147; i++) {
		bigBlob += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + bigBlob.length);
	
	var start = (new Date).getTime();
	var bigBlobCipher = CRYPTO.asymmetricEncrypt(bigBlob);
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(bigBlobCipher, "cipher: see console output for benchmark");
	console.log('blob cipher size [bytes]: ' + bigBlobCipher.length);
	
	var decrStart = (new Date).getTime();
	var bigBlobDecrypted =  CRYPTO.asymmetricDecrypt(bigBlobCipher);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(bigBlobDecrypted, "decrypted: see console output for benchmark");
	equal(bigBlobDecrypted, bigBlob, "Decrypted should be the same as the plaintext");
	
	console.log('decrypted blob size [bytes]: ' + bigBlobDecrypted.length);
});

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

asyncTest("CRUD PGP KeyPair to Server", 7, function() {
	var email = "test@example.com";
	var loginInfo = {
		email : email
	};
	
	CRYPTO.initKeyPair(loginInfo, function(keyId) {
		ok(keyId);
		
		CRYPTO.fetchKeys(email, keyId, function(keys) {
			CRYPTO.readKeys(loginInfo.email, keyId);

			equal(keys.publicKey.asciiArmored, CRYPTO.getPublicKey());
			equal(keys.publicKey.keyId, CRYPTO.getPublicKeyIdBase64());
			equal(keys.privateKey.asciiArmored, CRYPTO.getPrivateKey());
			equal(keys.privateKey.keyId, CRYPTO.getPublicKeyIdBase64());
			
			var base64Key = btoa(keyId);
			var encodedKeyId = encodeURIComponent(base64Key);
			SERVER.call('DELETE', '/app/publicKeys?keyId=' + encodedKeyId, function(resp) {
				equal(resp, "");
				
				SERVER.call('DELETE', '/app/privateKeys?keyId=' + encodedKeyId, function(resp) {
					equal(resp, "");

					start();
				});
			});
		});
		
	}, function(modalShown) {
		modalShown();
	}, function() {});
});

module("Convergent/Symmetric Crypto");

test("Large blob", 4, function() {
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + message.length);
	
	var start = (new Date).getTime();
	var ct = CRYPTO.symmetricEncrypt(message);
	var diff = (new Date).getTime() - start;

	console.log('Time taken for encryption [ms]: ' + diff);
	// console.log('Ciphertext: ' + ct);
	
	var ct2 = CRYPTO.symmetricEncrypt(message);
	equal(ct.ct, ct2.ct);
	equal(ct.locator, ct2.locator);
	equal(ct.key, ct2.key);
	
	console.log('key: "' + ct.key + '", key length: ' + ct.key.length + ', ct lenght [bytes]: ' + ct.ct.length);
	
	var decrStart = (new Date).getTime();
	var pt = CRYPTO.symmetricDecrypt(ct.key, ct.ct);
	var decrDiff = (new Date).getTime() - decrStart;

	console.log('Time taken for decryption [ms]: ' + decrDiff);
	
	equal(pt, message);
});

asyncTest("Upload blob", 4, function() {
	// build test message
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	// symmetrically encrypt the string
	var ct = CRYPTO.symmetricEncrypt(message);
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
				var pt = CRYPTO.symmetricDecrypt(ct.key, encrStr);
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