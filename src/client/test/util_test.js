module("Unit - Util");

test("JQuery and basic requirements", 13, function() {
	ok( Array.prototype.push, "Array.push()" );
	ok( Function.prototype.apply, "Function.apply()" );
	ok( document.getElementById, "getElementById" );
	ok( document.getElementsByTagName, "getElementsByTagName" );
	ok( RegExp, "RegExp" );
	ok( jQuery, "jQuery" );
	ok( $, "$" );
	ok( window.Worker, "Web Worker" );
	ok( window.Blob, "BlobBuilder Api" );
	ok( window.requestFileSystem, "FileSystem Api" );
	ok( window.URL, "ObjectURL Api" );
	ok( window.storageInfo, "StorageInfo Api" );
	ok( window.crypto.getRandomValues, "crypto.getRandomValues()" );
});

test("UUID", 2, function() {
	var util = new Util(window, uuid);
	var id = util.UUID();
	ok(id, "UUID: " + id);
	ok(id.length === 36, "UUID length");
});

asyncTest("String -> ArrayBuffer -> String", 5, function() {
	var util = new Util(window);
	
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
	var util = new Util(window);
	
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
