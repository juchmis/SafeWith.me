module("Crypto");

var email = "test@asdf.com";

test("Generate keys without passphrase", 4, function() {
	var crypto = new Crypto();
	
	var start = (new Date).getTime();
	var keySize = 2048;
	var keys = crypto.generateKeys(keySize, email);
	var diff = (new Date).getTime() - start;
	
	var keyId = keys.privateKey.getKeyId();
	crypto.readKeys(email, keyId);
	
	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair, passphrase "undefined")');
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

test("Generate keys with passphrase", 4, function() {
	var crypto = new Crypto();
	var email = "test@yxcv.com";
	var passphrase = 'yxcv';

	var start = (new Date).getTime();
	var keySize = 2048;
	var keys = crypto.generateKeys(keySize, email, passphrase);
	var diff = (new Date).getTime() - start;

	var keyId = keys.privateKey.getKeyId();
	crypto.readKeys(email, keyId);

	console.log('Time taken for key generation [ms]: ' + diff + ' (' + keySize + ' bit RSA keypair, passphrase "'+ passphrase + '")');
	ok(crypto.getPrivateKey());
	ok(crypto.getPrivateKey().indexOf('-----BEGIN PGP PRIVATE KEY BLOCK-----') === 0);
	ok(crypto.getPublicKey());
	ok(crypto.getPublicKey().indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') === 0);
});

asyncTest("CRUD PublicKey to Server", 4, function() {
	var crypto = new Crypto();
	var server = new Server();
	var email = "test@example.com";
	var loginInfo = {
		email : email
	};
	
	crypto.initPublicKey(loginInfo, server, function(keyId) {
		ok(keyId);
		
		var base64Key = btoa(keyId);
		var encodedKeyId = encodeURIComponent(base64Key);
		server.call('GET', '/app/publicKeys?keyId=' + encodedKeyId, function(resp) {
			crypto.readKeys(loginInfo.email, keyId);
			
			equal(resp.asciiArmored, crypto.getPublicKey());
			equal(resp.keyId, crypto.getPublicKeyIdBase64());
			
			server.call('DELETE', '/app/publicKeys?keyId=' + encodedKeyId, function(resp) {
				equal(resp, "");
				
				start();
			});
		});
	});
});

asyncTest("Export keys", 3, function() {
	var crypto = new Crypto();
	crypto.readKeys(email);

	crypto.exportKeys(function(url) {
		ok(url);
		
		$.get(url, function(data) {
			ok(data.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') !== -1);
			ok(data.indexOf('-----END PGP PRIVATE KEY BLOCK-----') !== -1);
			
			start();
		});
	});
});

function helperEncrDecr(plaintext) {
	var crypto = new Crypto();
	crypto.readKeys(email);

	var cipher = crypto.encrypt(plaintext);
	ok(cipher, "cipher");

	var decrypted =  crypto.decrypt(cipher);
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
	crypto.readKeys(email);

	// generate large string
	var bigBlob = '';
	for (var i=0; i < 147; i++) {
		bigBlob += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + bigBlob.length*2);
	
	var start = (new Date).getTime();
	var bigBlobCipher = crypto.encrypt(bigBlob);
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	ok(bigBlobCipher, "cipher: see console output for benchmark");
	console.log('blob cipher size [bytes]: ' + bigBlobCipher.length*2);
	
	var decrStart = (new Date).getTime();
	var bigBlobDecrypted =  crypto.decrypt(bigBlobCipher);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);
	ok(bigBlobDecrypted, "decrypted: see console output for benchmark");
	equal(bigBlobDecrypted, bigBlob, "Decrypted should be the same as the plaintext");
	
	console.log('decrypted blob size [bytes]: ' + bigBlobDecrypted.length*2);
});