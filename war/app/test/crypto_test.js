module("Crypto");

test("Init", 4, function() {
	var crypto = new Crypto();
	crypto.init("test@asdf.com");
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

test("Generate Keys", 4, function() {
	var crypto = new Crypto();
	crypto.init("test@asdf.com");
	
	var start = (new Date).getTime();
	var keySize = 2048;
	crypto.generateKeys(keySize, "test@asdf.com");
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair)');
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

asyncTest("CRUD PublicKey to Server", 3, function() {
	var crypto = new Crypto();
	var server = new Server();
	var email = "test@asdf.com";
	var loginInfo = {
		email : email
	};
	
	crypto.initPublicKey(loginInfo, server, function(keyId) {
		ok(keyId);
		
		var encodedKeyId = btoa(keyId);
		server.call('GET', '/app/publicKeys?keyId=' + encodedKeyId, function(resp) {
			crypto.init(loginInfo.email, keyId);
			
			equal(resp.asciiArmored, crypto.getPublicKey());
			var decodedKeyId = window.atob(resp.keyId);
			equal(decodedKeyId, crypto.getPublicKeyId());
			
			start();
		});
	});
});

function helperEncrDecr(plaintext) {
	var crypto = new Crypto();
	crypto.init("test@asdf.com");

	var cipher = crypto.encrypt(plaintext, crypto.getPublicKey());
	ok(cipher, "cipher");

	var decrypted =  crypto.decrypt(cipher, crypto.getPrivateKey(), '');
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
	crypto.init("test@asdf.com");

	// generate large string
	var bigBlob = '';
	for (var i=0; i < 147; i++) {
		bigBlob += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + bigBlob.length*2);
	
	var start = (new Date).getTime();
	var bigBlobCipher = crypto.encrypt(bigBlob, crypto.getPublicKey());
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(bigBlobCipher, "cipher: see console output for benchmark");
	console.log('blob cipher size [bytes]: ' + bigBlobCipher.length*2);
	
	var decrStart = (new Date).getTime();
	var bigBlobDecrypted =  crypto.decrypt(bigBlobCipher, crypto.getPrivateKey(), '');
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(bigBlobDecrypted, "decrypted: see console output for benchmark");
	equal(bigBlobDecrypted, bigBlob, "Decrypted should be the same as the plaintext");
	
	console.log('decrypted blob size [bytes]: ' + bigBlobDecrypted.length*2);
});