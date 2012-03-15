module("Convergent Crypto");

test("AES", function() {
	openpgp.init();
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + message.length*2);
	
	var startHash = (new Date).getTime();
	var sha1 = str_sha1(message);
	var diffHash = (new Date).getTime() - startHash;
	
	console.log('Time taken for hash [ms]: ' + diffHash + ' sha1: ' + key);
	
	var key = sha1.substr(0, 16);
	var prefix = sha1.substr(4, 16);
	
	var start = (new Date).getTime();
	var ct = openpgp_crypto_symmetricEncrypt(prefix, 7, key, message, 0);
	var diff = (new Date).getTime() - start;
	
	console.log('Time taken for encryption [ms]: ' + diff);
	
	var decrStart = (new Date).getTime();
	var pt = openpgp_crypto_symmetricDecrypt(7, key, ct, 0);
	var decrDiff = (new Date).getTime() - decrStart;
	
	console.log('Time taken for decryption [ms]: ' + decrDiff);	
	equal(pt, message);
});