module("Integration - Google Drive");

asyncTest("Upload, Download, Delete blob", 3, function() {
	var util = new Util(window, uuid);
	var server = new Server(util);
	var oauth = new OAuth(window);
	var gdrive = new GoogleDrive(util, server);
	
	var oauthParams = oauth.oauth2Callback();
	if (oauthParams) {
		// if oauth params are present, do test
		testUpload();
		
	} else {
		// test failed
		start();
		return;
	}
	
	function testUpload() {
		// create test blob
		var contents = 'Hello World';
		var buf = util.binStr2ArrBuf(contents);
		var blob = util.arrBuf2Blob(buf, 'text/plain');
		
		// upload to google drive
		gdrive.uploadBlob(blob, oauthParams, md5(contents), function(createdId) {
			ok(createdId, 'Created ID ' + createdId);
			
			// download
			gdrive.downloadBlob(createdId, oauthParams, function(downloaded) {
				util.blob2BinStr(downloaded, function(binStr) {
					equal(binStr, contents, 'Downloaded blob');
					
					// delete
					gdrive.deleteBlob(createdId, oauthParams, function(resp) {
						ok(resp.labels.trashed, 'Deleted blob');
						
						start();
					});
					
				});
			}, function(err) {				
				// test failed
				start();
				return;
			});
			
		}, function(err) {
			// test failed
			start();
			return;
		});
	}
});