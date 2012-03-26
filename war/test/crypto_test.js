module("Asymmetric Crypto");

var email = "test@asdf.com";
var keyId = 'wrong ID';
var passphrase = 'yxcv';

test("Generate keys with passphrase", 4, function() {
	var crypto = new Crypto();

	var start = (new Date).getTime();
	var keySize = 2048;
	var keys = crypto.generateKeys(keySize, email, passphrase);
	var diff = (new Date).getTime() - start;

	keyId = keys.privateKey.getKeyId();
	crypto.readKeys(email, keyId);

	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair, passphrase "'+ passphrase + '")');
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

function helperEncrDecr(plaintext) {
	var crypto = new Crypto();
	crypto.readKeys(email, keyId);
	crypto.setPassphrase(passphrase);

	var cipher = crypto.asymmetricEncrypt(plaintext);
	ok(cipher, "cipher");

	var decrypted =  crypto.asymmetricDecrypt(cipher);
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
	var crypto = new Crypto();
	crypto.readKeys(email, keyId);
	crypto.setPassphrase(passphrase);

	// generate large string
	var bigBlob = '';
	for (var i=0; i < 147; i++) {
		bigBlob += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + bigBlob.length);
	
	var start = (new Date).getTime();
	var bigBlobCipher = crypto.asymmetricEncrypt(bigBlob);
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(bigBlobCipher, "cipher: see console output for benchmark");
	console.log('blob cipher size [bytes]: ' + bigBlobCipher.length);
	
	var decrStart = (new Date).getTime();
	var bigBlobDecrypted =  crypto.asymmetricDecrypt(bigBlobCipher);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(bigBlobDecrypted, "decrypted: see console output for benchmark");
	equal(bigBlobDecrypted, bigBlob, "Decrypted should be the same as the plaintext");
	
	console.log('decrypted blob size [bytes]: ' + bigBlobDecrypted.length);
});

asyncTest("CRUD PGP KeyPair to Server", 7, function() {
	var crypto = new Crypto();
	var server = new Server();
	var email = "test@example.com";
	var loginInfo = {
		email : email
	};
	
	crypto.initKeyPair(loginInfo, server, function(keyId) {
		ok(keyId);
		
		crypto.fetchKeys(email, keyId, undefined, server, function(keys) {
			crypto.readKeys(loginInfo.email, keyId);

			equal(keys.publicKey.asciiArmored, crypto.getPublicKey());
			equal(keys.publicKey.keyId, crypto.getPublicKeyIdBase64());
			equal(keys.privateKey.asciiArmored, crypto.getPrivateKey());
			equal(keys.privateKey.keyId, crypto.getPublicKeyIdBase64());
			
			var base64Key = btoa(keyId);
			var encodedKeyId = encodeURIComponent(base64Key);
			server.call('DELETE', '/app/publicKeys?keyId=' + encodedKeyId, function(resp) {
				equal(resp, "");
				
				server.call('DELETE', '/app/privateKeys?keyId=' + encodedKeyId, function(resp) {
					equal(resp, "");

					start();
				});
			});
		});
		
	}, function(modalShown) {
		modalShown();
	}, function() {});
});

asyncTest("Export keys", 3, function() {
	var util = new Util();
	var crypto = new Crypto(util);
	crypto.readKeys(email, keyId);

	crypto.exportKeys(function(url) {
		ok(url);
		
		$.get(url, function(data) {
			ok(data.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') !== -1);
			ok(data.indexOf('-----END PGP PRIVATE KEY BLOCK-----') !== -1);
			
			start();
		});
	});
});

module("Convergent/Symmetric Crypto");

test("Large blob", 4, function() {
	var crypto = new Crypto();
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + message.length);
	
	var start = (new Date).getTime();
	var ct = crypto.symmetricEncrypt(message);
	var diff = (new Date).getTime() - start;

	console.log('Time taken for encryption [ms]: ' + diff);
	// console.log('Ciphertext: ' + ct);
	
	var ct2 = crypto.symmetricEncrypt(message);
	equal(ct.ct, ct2.ct);
	equal(ct.locator, ct2.locator);
	equal(ct.key, ct2.key);
	
	console.log('key: "' + ct.key + '", key length: ' + ct.key.length + ', ct lenght [bytes]: ' + ct.ct.length);
	
	var decrStart = (new Date).getTime();
	var pt = crypto.symmetricDecrypt(ct.key, ct.ct);
	var decrDiff = (new Date).getTime() - decrStart;
	
	util.print_debug("bla");

	console.log('Time taken for decryption [ms]: ' + decrDiff);
	
	equal(pt, message);
});

asyncTest("Upload blob", 4, function() {
	var util = new Util();
	var crypto = new Crypto();
	var server = new Server();
	
	// build test message
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	// symmetrically encrypt the string
	var ct = crypto.symmetricEncrypt(message);
	// convert binary string to ArrayBuffer
	var ctAB = util.binStr2ArrBuf(ct.ct);
	
	// create blob for uploading
	var bb = new BlobBuilder();
	bb.append(ctAB);
	var blob = bb.getBlob('application/octet-stream');
	
	var ctMd5 = md5(ct.ct);
	// upload the encrypted blob to the server
	server.uploadBlob(blob, ctMd5, function(blobKey) {
		ok(blobKey);
		
		// download blob
		server.downloadBlob(blobKey, function(blob) {
			ok(blob);
			
			// read blob as binary string
			var reader = new FileReader();
			reader.onload = function(event) {
				var encrStr = event.target.result;
				
				// symmetrically decrypt the string
				var pt = crypto.symmetricDecrypt(ct.key, encrStr);
				equal(pt, message);
				
				// delete blob again
				server.deleteBlob(blobKey, function(resp) {
					equal(resp, "");

					start();
				});
			};

			reader.readAsBinaryString(blob);
		});
	});
	
});