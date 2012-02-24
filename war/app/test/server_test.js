module("Server");

asyncTest("Upload, Download, Delete blob", 3, function() {
	var server = new Server();

	server.uploadBlob(testImg1Base64, function(uri) {
		ok(uri);
		
		server.call('GET', uri, function(download) {
			equal(download, testImg1Base64);
			
			server.call('DELETE', uri, function(resp) {
				equal(resp, "");
				
				start();
			});
		});
	});
});