module("Integration - Google Drive");

asyncTest("Upload, Update, Download, Delete blob", 5, function() {
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
					
					// create updated blob
					var contents2 = 'Hello';
					var buf2 = util.binStr2ArrBuf(contents2);
					var blob2 = util.arrBuf2Blob(buf2, 'text/plain');
					
					// update blob
					gdrive.updateBlob(createdId, blob2, oauthParams, md5(contents2), function(updatedId) {
						ok(createdId, 'Updated ID ' + updatedId);
						
						// download and check updated blob
						gdrive.downloadBlob(createdId, oauthParams, function(downloadedUpd) {
							util.blob2BinStr(downloadedUpd, function(binStrUpd) {
								equal(binStrUpd, contents2, 'Downloaded updated blob');

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