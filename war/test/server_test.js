module("Server");

asyncTest("Upload, Download, Delete blob", 4, function() {
	var util = new Util();
	var server = new Server();
	
	// create blob for uploading
	var ctAB = util.binStr2ArrBuf(testImg1Base64);
	var bb = new BlobBuilder();
	bb.append(ctAB);
	var blob = bb.getBlob('application/octet-stream');
	var ctMd5 = md5(testImg1Base64);

	server.uploadBlob(blob, ctMd5, function(blobKey) {
		ok(blobKey);
		
		server.downloadBlob(blobKey, function(download) {
			ok(download);
			
			// read blob as binary string
			var reader = new FileReader();
			reader.onload = function(event) {
				var encrStr = event.target.result;
				equal(encrStr, testImg1Base64);

				server.deleteBlob(blobKey, function(resp) {
					equal(resp, "");

					start();
				});
			};
			reader.readAsBinaryString(download);
		});
	});
});