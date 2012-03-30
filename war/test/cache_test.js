module("Cache");

asyncTest("Create, Get, Delete Blob", 5, function() {
	var data = "Hello, World!",
		buf = UTIL.binStr2ArrBuf("Hello, World!"),
		blob = UTIL.arrBuf2Blob(buf, 'application/octet-stream'),
		fileName = 'test.txt';
	
	CACHE.storeBlob(fileName, blob, function() {
		
		CACHE.readBlob(fileName, function(file) {
			ok(file);
			
			UTIL.blob2BinStr(file, function(str) {
				equal(data, str);
			});
			
			CACHE.removeBlob(fileName, function(success) {
				ok(success);
				
				CACHE.readBlob(fileName, function(file) {
					ok(!file);
					
					CACHE.removeBlob(fileName, function(success) {
						ok(!success);
						
						start();
					});
				});
			});
		});
	});
});