module("Integration - Google Drive");

asyncTest("Upload, Download, Delete blob", 2, function() {
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
		gdrive.uploadBlob(blob, oauthParams, md5(contents), function(created) {
			ok(created.id, 'Created ID ' + created.id);
			
			gdrive.downloadBlob(created.downloadUrl, oauthParams, function(downloaded) {
				util.blob2BinStr(downloaded, function(binStr) {
					equal(binStr, contents, 'Downloaded blob');
					
					start();
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