module("Cache");

asyncTest("Create, Get, Delete Blob", 2, function() {
	var data = "Hello, World!",
		buf = UTIL.binStr2ArrBuf("Hello, World!"),
		blob = UTIL.arrBuf2Blob(buf, 'application/octet-stream'),
		fileName = 'test.txt';
	
	CACHE.save(fileName, blob, function() {
		
		CACHE.read(fileName, function(file) {
			ok(file);
			
			UTIL.blob2BinStr(file, function(str) {
				equal(data, str);
			});
			
			CACHE.remove(fileName, function() {
				start();
			});
		});
	});
});