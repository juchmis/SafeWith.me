/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

'use strict';

/**
 * A wrapper for Google Drive communication
 */
var GoogleDrive = function(util, server) {
	var self = this;
	
	var driveBaseUri = 'https://www.googleapis.com/drive/v1/files';
	
	/**
	 * Upload a new file blob to Google Drive by first allocating a
	 * new file resource (POST) and then uploading the file contents (PUT)
	 */
	self.uploadBlob = function(blob, oauthParams, md5, callback, errCallback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
	
		var reader = new FileReader();
		reader.onload = function(e) {
			var contentType = blob.type || 'application/octect-stream';
			var metadata = {
			  'title': 'encrypted.safe',
			  'mimeType': contentType
			};

			var base64Data = btoa(reader.result);
			var multipartRequestBody =
			    delimiter +
			    'Content-Type: application/json\r\n\r\n' +
			    JSON.stringify(metadata) +
			    delimiter +
			    'Content-Type: ' + contentType + '\r\n' +
			    'Content-Transfer-Encoding: base64\r\n' +
			    '\r\n' +
			    base64Data +
			    close_delim;

			//gapi.auth.setToken(oauthParams);
			var request = gapi.client.request({
			    'path': '/upload/drive/v1/files',
			    'method': 'POST',
			    'params': {'uploadType': 'multipart'},
			    'headers': {
					'Authorization': oauthParams.token_type + ' ' + oauthParams.access_token,
					'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			    },
			    'body': multipartRequestBody
			});
			
			request.execute(function(resp) {
				if (resp.error) {
					errCallback(resp.error);
				} else {
					// check md5 checksum
					if (md5 === resp.md5Checksum) {
						callback(resp.id);
					} else {
						errCallback({errMsg: 'MD5 of uploaded blob does not match!'});
					}
				}
			});
		};
		
		reader.readAsBinaryString(blob);
	};
	
	/**
	 * Download a blob from Google Drive
	 */
	self.downloadBlob = function(fileId, oauthParams, callback, errCallback) {
		// first get file downloadUrl from google drive
		server.xhr({
			type: 'GET',
			uri: driveBaseUri + '/' + fileId,
			auth: oauthParams.token_type + ' ' + oauthParams.access_token,
			expected: 200,
			success: function(file) {
				proxyDownload(file.downloadUrl);
			},
			error: function(e) {
				errCallback(e);
			}
		});
		
		// proxy the download of the google drive file through the server,
		// since google drive doesn't allow CORS requests for this
		function proxyDownload(downloadUrl) {
			var reqBody = JSON.stringify({
				downloadUrl: downloadUrl,
				oauthParams: oauthParams
			});

			server.xhr({
				type: 'PUT',
				uri: '/driveFile',
				contentType: 'application/json',
				responseType: 'arraybuffer',
				expected: 200,
				body: reqBody,
				success: function(resp) {
					var blob = util.arrBuf2Blob(resp, 'application/octet-stream');
					callback(blob);
				},
				error: function(e) {
					errCallback(e);
				}
			});
		}
		
	};
	
	/**
	 * Deletes a blob from Google Drive
	 */
	self.deleteBlob = function(fileId, oauthParams, callback, errCallback) {
		var reqBody = JSON.stringify({
			labels: {
				trashed: true
			}
		});
		
		server.xhr({
			type: 'PUT',
			uri: driveBaseUri + '/' + fileId,
			contentType: 'application/json',
			body: reqBody,
			auth: oauthParams.token_type + ' ' + oauthParams.access_token,
			expected: 200,
			success: function(resp) {
				callback(resp);
			},
			error: function(e) {
				errCallback(e);
			}
		});
	};
	
};