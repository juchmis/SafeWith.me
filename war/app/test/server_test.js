module("Server");

asyncTest("Upload, Download, Delete blob", 3, function() {
	var server = new Server();
	var blobServicePrefix = '/app/blobs?blob-key=';

	server.uploadBlob(testImg1Base64, function(blobKey) {
		ok(blobKey);
		
		var uri = blobServicePrefix + blobKey;
		server.call('GET', uri, function(download) {
			equal(download, testImg1Base64);
			
			server.call('DELETE', uri, function(resp) {
				equal(resp, "");
				
				start();
			});
		});
	});
});