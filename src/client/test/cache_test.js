module("Unit - Cache");

test("CRUD object literal", 3, function() {
	var cache = new Cache(window);
	
	var key = 'asdf';
	var data = {
		name : 'testName',
		type : 'testType'
	};
	
	// create
	cache.storeObject(key, data);
	
	// read
	var read = cache.readObject(key);
	equal(data.name, read.name);
	
	// update
	var newName = 'updatedName';
	read.name = newName;
	cache.storeObject(key, read);
	var updated = cache.readObject(key);
	equal(updated.name, newName);
	
	// delete
	cache.removeObject(key);
	equal(cache.readObject(key), null);
});

asyncTest("Create, Get, Delete Blob", 5, function() {
	var cache = new Cache(window);
	var util = new Util(window);
	
	var data = "Hello, World!",
		buf = util.binStr2ArrBuf("Hello, World!"),
		blob = util.arrBuf2Blob(buf, 'application/octet-stream'),
		fileName = 'test.txt';
	
	cache.storeBlob(fileName, blob, function() {
		
		cache.readBlob(fileName, function(file) {
			ok(file);
			
			util.blob2BinStr(file, function(str) {
				equal(data, str);
			});
			
			cache.removeBlob(fileName, function(success) {
				ok(success);
				
				cache.readBlob(fileName, function(file) {
					ok(!file);
					
					cache.removeBlob(fileName, function(success) {
						ok(!success);
						
						start();
					});
				});
			});
		});
	});
});