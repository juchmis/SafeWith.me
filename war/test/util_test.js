module("Util");

test("JQuery basic requirements",7 , function() {
	ok( Array.prototype.push, "Array.push()" );
	ok( Function.prototype.apply, "Function.apply()" );
	ok( document.getElementById, "getElementById" );
	ok( document.getElementsByTagName, "getElementsByTagName" );
	ok( RegExp, "RegExp" );
	ok( jQuery, "jQuery" );
	ok( $, "$" );
});

test("String -> ArrayBuffer", 1, function() {
	var util = new Util();
	var input = "asdf";
	var buf = util.str2ArrBuf(input);
	var output = util.arrBuf2Str(buf);
	equal(output, input);
});

asyncTest("Create URL", 2, function() {
	var util = new Util();
	
	// Create a new Blob and write it to log.txt.
	window.BlobBuilder =  window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;
	var bb = new BlobBuilder();
	bb.append('asdf');
	var blob = bb.getBlob('text/plain');
	
	util.createUrl('test.txt', blob, function(url) {
		ok(url, url);
		
		$.get(url, function(data) {
			ok(data.indexOf('asdf') !== -1);
			
			start();
		});
	});
});

// asyncTest("ArrayBuffer -> String", 2, function() {
// 	var util = new Util();
// 	PDFJS.getPdf('test/helloworld.pdf', function(data) {
// 		ok(data);
// 	 	var str = util.arrBuf2Str(data);
// 		var buf = util.str2ArrBuf(str);
// 	 	var str2 = util.arrBuf2Str(buf);
// 		equal(str, str2);
// 
// 		start();
// 	});
// });
// 
// asyncTest("ArrayBuffer -> Unicode -> Base64 -> Encrypt -> Decrypt -> Base64 -> Unicode -> ArrayBuffer", 11, function() {
// 	var crypto = new Crypto();
// 	crypto.init("test@asdf.com");
// 	var util = new Util();
// 	
// 	PDFJS.getPdf('test/helloworld.pdf', function(data) {
// 		ok(data, "ArrayBuffer size: " + data.byteLength);
// 		
// 		// encode and encrypt
// 		var unicode = util.arrBuf2Str(data);
// 		ok(unicode, "Unicode size: "+ unicode.length*2);
// 		var base64 = util.Base64.encode(unicode); // btoa(unicode);
// 		ok(base64, "Base64 size: "+ base64.length*2);
// 		var cipher = crypto.encrypt(base64, crypto.getPublicKey());
// 		ok(cipher, "Cipher size: " + cipher.length*2);
// 		
// 		// decrypt and decode
// 		var base64Dec = crypto.decrypt(cipher, crypto.getPrivateKey(), '');
// 		ok(base64Dec, "Base64Dec size: " + base64Dec.length*2);
// 		equal(base64.length, base64Dec.length);
// 		equal(base64, base64Dec);
// 		var unicodeDec = util.Base64.decode(base64Dec); // atob(base64);
// 		ok(unicodeDec, "UnicodeDec size: " + unicodeDec.length*2);
// 		equal(unicode.length, unicodeDec.length);
// 		equal(unicode, unicodeDec);
// 		var bufDec = util.str2ArrBuf(unicodeDec);
// 		ok(bufDec, "Decrypted ArrayBuffer size: " + bufDec.byteLength);
// 
// 		start();
// 	});
// });
