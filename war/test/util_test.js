module("Util");

test("JQuery and basic requirements", 10, function() {
	ok( Array.prototype.push, "Array.push()" );
	ok( Function.prototype.apply, "Function.apply()" );
	ok( document.getElementById, "getElementById" );
	ok( document.getElementsByTagName, "getElementsByTagName" );
	ok( RegExp, "RegExp" );
	ok( jQuery, "jQuery" );
	ok( $, "$" );
	ok( UTIL.arrBuf2Blob('', ''), "BlobBuilder Api" );
	ok( window.requestFileSystem || window.webkitRequestFileSystem, "FileSystem Api" );
	ok( window.URL || window.webkitURL || window.mozURL, "ObjectURL Api" );
});

asyncTest("String -> ArrayBuffer -> String", 5, function() {
	var util = UTIL;
	
	var input = "asdf";
	var buf = util.binStr2ArrBuf(input);
	ok(buf);
	
	// test slow conversion in js
	var binStr = util.arrBuf2BinStr(buf);
	ok(binStr);
	equal(binStr, input);
	
	// test native conversion with BlobBuilder Api
	var blob = util.arrBuf2Blob(buf, 'application/octet-stream');
	ok(blob);
	
	util.blob2BinStr(blob, function(output) {
		equal(output, input);
	
		start();
	});
});

asyncTest("Create URL", 2, function() {
	var util = UTIL;
	
	// Create a new Blob and write it to log.txt.
	var blob = util.arrBuf2Blob('asdf', 'text/plain');
	
	util.createUrl('test.txt', blob, function(url) {
		ok(url, url);
		
		$.get(url, function(data) {
			ok(data.indexOf('asdf') !== -1);
			
			start();
		});
	});
});
