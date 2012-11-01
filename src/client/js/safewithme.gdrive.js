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

/**
 * A wrapper for Google Drive communication
 */
var GoogleDrive = function(util, server) {
	'use strict';
	
	var self = this;
	var	driveBaseUri = 'https://www.googleapis.com/drive/v2/files';
	
	/**
	 * Upload a new file blob to Google Drive by first allocating a
	 * new file resource (POST) and then uploading the file contents (PUT)
	 */
	self.uploadBlob = function(blob, md5, callback, errCallback) {		
		uploadHelper('POST', '/upload/drive/v2/files', blob, md5, callback, errCallback);
	};
	
	/**
	 * Update an existing file blob on Google Drive by ID and an upload of
	 * the file contents (PUT)
	 */
	self.updateBlob = function(fileId, blob, md5, callback, errCallback) {		
		uploadHelper('PUT', '/upload/drive/v2/files/' + fileId, blob, md5, callback, errCallback);
	};
	
	/**
	 * Private upload helper method
	 */
	var uploadHelper = function(method, path, blob, md5, callback, errCallback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
	
		var reader = new FileReader();
		reader.onload = function(e) {
			var fileName = blob.name || 'encrypted.safe',
				contentType = blob.type || 'application/octect-stream';
				
			var metadata = {
			  'title' : fileName,
			  'mimeType' : contentType
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

			var request = gapi.client.request({
			    'path': path,
			    'method': method,
			    'params': {'uploadType': 'multipart'},
			    'headers': {
					'Authorization': self.oauthParams.token_type + ' ' + self.oauthParams.access_token,
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
	self.downloadBlob = function(fileId, callback, errCallback) {
		// first get file downloadUrl from google drive
		server.xhr({
			type: 'GET',
			uri: driveBaseUri + '/' + fileId,
			auth: self.oauthParams.token_type + ' ' + self.oauthParams.access_token,
			expected: 200,
			success: function(file) {
				corsDownload(file.downloadUrl);
			},
			error: function(e) {
				errCallback(e);
			}
		});
		
		// then download the file contents with a CORS request
		function corsDownload(downloadUrl) {
			server.xhr({
				type: 'GET',
				uri: downloadUrl,
				auth: self.oauthParams.token_type + ' ' + self.oauthParams.access_token,
				responseType: 'arraybuffer',
				expected: 200,
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
	self.deleteBlob = function(fileId, callback, errCallback) {
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
			auth: self.oauthParams.token_type + ' ' + self.oauthParams.access_token,
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