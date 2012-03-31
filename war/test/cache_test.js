module("Cache");

test("CRUD object literal", 3, function() {
	var key = 'asdf';
	var data = {
		name : 'testName',
		type : 'testType'
	};
	
	// create
	CACHE.storeObject(key, data);
	
	// read
	var read = CACHE.readObject(key);
	equal(data.name, read.name);
	
	// update
	var newName = 'updatedName';
	read.name = newName;
	CACHE.storeObject(key, read);
	var updated = CACHE.readObject(key);
	equal(updated.name, newName);
	
	// delete
	CACHE.removeObject(key);
	equal(CACHE.readObject(key), null);
});

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