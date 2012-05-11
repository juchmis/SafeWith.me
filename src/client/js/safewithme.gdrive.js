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
var GoogleDrive = function(oauth, server) {
	var self = this;
	
	var driveBaseUri = 'https://www.googleapis.com/drive/v1/files';
	
	self.init = function() {
		// check if the url's query string contains oauth token
		if (location.hash.substring(1)) {
			// parse the query string
			var oauthParams = oauth.oauth2Callback();
			// $('#loginStatus').html(JSON.stringify(oauthParams));
			self.insert(null, oauthParams);
			
		} else {
			// set the login link
			var loginUri = oauth.getLoginLink();
			$('#loginStatus').attr({ href: loginUri }).html('Login');
		}
	};
	
	self.insert = function(blob, oauthParams, md5, callback, errCallback) {
		// first get upload url from blobstore
		server.xhr({
			type: 'POST',
			uri: driveBaseUri,
			contentType: 'application/json',
			auth: oauthParams.token_type + ' ' + oauthParams.access_token,
			body: JSON.stringify({
				title: 'safe_file',
				mimeType: 'application/octet-stream'
			}),
			expected: 200,
			success: function(resp) {
				postBlob();
			},
			error: function(e) {
				errCallback(e);
			}
		});

		// upload blob to blobstore
		function postBlob(postUrl) {
			var formData = new FormData();	// multipart/form-data
			formData.append('file', blob);
			formData.append('md5', md5);

			// server.xhr({
			// 	type: 'POST',
			// 	uri: postUrl,
			// 	body: formData,
			// 	expected: 201,
			// 	success: function(resp) {
			// 		callback(resp.blobKey);
			// 	},
			// 	error: function(e) {
			// 		errCallback(e);
			// 	}
			// });
		}
	};
	
};