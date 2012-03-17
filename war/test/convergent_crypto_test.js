module("Convergent Crypto");

test("Large blob", 4, function() {
	var convergentCrypto = new ConvergentCrypto();
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	console.log('blob size [bytes]: ' + message.length*2);
	
	var start = (new Date).getTime();
	var ct = convergentCrypto.encrypt(message);
	var diff = (new Date).getTime() - start;

	console.log('Time taken for encryption [ms]: ' + diff);
	// console.log('Ciphertext: ' + ct);
	
	var ct2 = convergentCrypto.encrypt(message);
	equal(ct.ct, ct2.ct);
	equal(ct.locator, ct2.locator);
	equal(ct.key, ct2.key);
	
	console.log('key: "' + ct.key + '", key length: ' + ct.key.length + ', ct lenght: ' + ct.ct.length);
	
	var decrStart = (new Date).getTime();
	var pt = convergentCrypto.decrypt(ct.key, ct.ct);
	var decrDiff = (new Date).getTime() - decrStart;
	
	util.print_debug("bla");

	console.log('Time taken for decryption [ms]: ' + decrDiff);
	
	equal(pt, message);
});

asyncTest("Upload blob", 3, function() {
	var convergentCrypto = new ConvergentCrypto();
	var server = new Server();
	
	var message = '';
	for (var i=0; i < 147; i++) {
		message += testImg1Base64;
	}
	
	var ct = convergentCrypto.encrypt(message);
	server.uploadBlob(ct.ct, function(blobKey) {
		ok(blobKey);
		
		server.call('GET', '/app/blobs?blob-key=' + blobKey, function(download) {
			equal(ct.ct, download);
			
			var pt = convergentCrypto.decrypt(ct.key, download);

			equal(pt, message);
			
			start();
		});
	});
	
});