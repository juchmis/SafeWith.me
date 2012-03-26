module("Util");

window.BlobBuilder =  window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;

test("JQuery and basic requirements", 8, function() {
	ok( Array.prototype.push, "Array.push()" );
	ok( Function.prototype.apply, "Function.apply()" );
	ok( document.getElementById, "getElementById" );
	ok( document.getElementsByTagName, "getElementsByTagName" );
	ok( RegExp, "RegExp" );
	ok( jQuery, "jQuery" );
	ok( $, "$" );
	ok(window.BlobBuilder, "BlobBuilder");
});

asyncTest("String -> ArrayBuffer -> String", 2, function() {
	var util = new Util();
	
	var input = "asdf";
	var buf = util.binStr2ArrBuf(input);
	ok(buf);
	
	var bb = new BlobBuilder();
	bb.append(buf);
	var blob = bb.getBlob('application/octet-stream');
	
	var reader = new FileReader();
	reader.onload = function(event) {
		var output = event.target.result;
		equal(output, input);
		
		start();
	};
	reader.readAsBinaryString(blob);
});

asyncTest("Create URL", 2, function() {
	var util = new Util();
	
	// Create a new Blob and write it to log.txt.
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
