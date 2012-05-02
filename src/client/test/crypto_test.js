module("Unit - Symmetric Crypto");

function initCrypto() {
	var util = new Util(window);
	var server = new ServerDummy("");
	var crypto = new Crypto(window, openpgp, util, server);
	crypto.setPassphrase('asdf');
	
	return crypto;
}

asyncTest("WebWorker", 2, function() {
	var crypto = initCrypto();
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	crypto.symmetricEncrypt(message, function(ct) {
		ok(ct.ct && ct.key, "ct and key");

		var decrStart = (new Date).getTime();
		
		crypto.symmetricDecrypt(ct.key, ct.ct, function(pt) {
			equal(pt, message, "pt = message");
			
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
// 	var startTime = (new Date).getTime();
// 	
// 	var ct = CRYPTOWORKER.symmetricEncrypt(message);
// 	
// 	var diff = (new Date).getTime() - startTime;
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
// 	var startTime = (new Date).getTime();
// 	
// 	var p = {
// 		mode: 'ocb2'
// 	};
// 	var rp = {};
// 	var ct = sjcl.encrypt('asdf', message);
// 	var diff = (new Date).getTime() - startTime;
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

module("Unit - Asymmetric Crypto");

var keyId;

asyncTest("Generate keys, De/Encrypt, Export keys", 10, function() {
	var crypto = initCrypto();

	var startTime = (new Date).getTime();
	var keySize = 1024;
	var keys = crypto.generateKeys(keySize);
	var diff = (new Date).getTime() - startTime;

	keyId = keys.privateKey.getKeyId();
	crypto.readKeys(keyId);

	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair)');
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
	
	helperEncrDecr(crypto, keyId, "Hello, World!");
	
	crypto.exportKeys(function(url) {
		ok(url, 'export url');
		
		$.get(url, function(data) {
			ok(data.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') !== -1, 'exportd public key');
			ok(data.indexOf('-----END PGP PRIVATE KEY BLOCK-----') !== -1, 'export private key');
			
			start();
		});
	});
});

function helperEncrDecr(crypto, keyId, plaintext) {
	if (!crypto.getPublicKey()) {
		crypto.readKeys(keyId);
	}
	
	console.log('plaintext size [bytes]: ' + plaintext.length);
	
	var startTime = (new Date).getTime();
	var ct = crypto.asymmetricEncrypt(plaintext);
	var diff = (new Date).getTime() - startTime;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(ct, "ciphertext: see console output for benchmark");
	console.log('ciphertext size [bytes]: ' + ct.length);
	
	var decrStart = (new Date).getTime();
	var pt =  crypto.asymmetricDecrypt(ct);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(pt, "decrypted: see console output for benchmark");
	equal(pt, plaintext, "Decrypted should be the same as the plaintext");
}

// test("Encrypt/Decrypt large Blob", 3, function() {
// 	// generate large string
// 	var bigBlob = '';
// 	for (var i=0; i < 147; i++) {
// 		bigBlob += testImg1Base64;
// 	}
// 	
// 	helperEncrDecr(bigBlob);
// });