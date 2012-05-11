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
 * This class handles all communication with the server
 */
var Server = function(util) {
	var self = this;
	
	//
	// Generic REST service requests
	//
	
	/**
	 * Helper methods for REST service requests. All requests to the server
	 * in the application use only this function, providing centralized response
	 * parsing and error handling. This makes it easier to defend against XSS and 
	 * code injection attacks.
	 * @param args [Object] with the the following parameters:
	 * {
	 *   type: 'GET',
	 *   uri: '/server/foo',
	 *   expected: 200,
	 *   contentType: 'application/json',	(optional)
	 *   responseType: 'arraybuffer',		(optional)
	 *   body: '{"foo":"bar"}',				(optional)
	 *   auth: Bearer <OAuth 2.0 token>		(optional)
	 *   cors: true
	 *   success: function(resp) {...},
	 *   error: function(e) {...}
	 * }
	 */
	self.xhr = function(args) {
		var xhr = new XMLHttpRequest();
		
		// set request headers
		xhr.open(args.type, args.uri, true);
		if (args.contentType) {
			xhr.setRequestHeader('Content-Type', args.contentType);
		}
		if (args.responseType) {
			xhr.responseType = args.responseType;
		}
		
		// check for CORS support
		if (args.cors && xhr.withCredentials !== undefined) {
			// send credentials
			xhr.withCredentials = true;
		}
		
		// set authentication header
		if (args.auth) {
			xhr.setRequestHeader('Authorization', args.auth);
		}
		
		// response handler
		xhr.onload = function(e) {
			if (this.status === args.expected) {
				// http status is ok
				var respMimeType = xhr.getResponseHeader("Content-Type");
				if (respMimeType && respMimeType.indexOf('application/json') !== -1) {
					// do centralized parsing of data
					args.success(JSON.parse(this.response));
				} else {
					args.success(this.response);
				}
			} else {
				// unexpected http status
				args.error('Unexpected http status: ' + this.status + 
				'; calling ' + args.type + ' on ' + args.uri +
				'; response body: ' + this.resonse);
			}
		};
		
		// error handler + send request
		xhr.onerror = function(e) {
			args.error(e);
		};
		
		xhr.send(args.body);
	};

	//
	// BlobStore specific service requests
	//
	
	/**
	 * Upload a file by first getting an upload url and then posting
	 * the file data to the specified uri
	 */
	self.uploadBlob = function(blob, md5, callback, errCallback) {
		// first get upload url from blobstore
		self.xhr({
			type: 'GET',
			uri: '/ws/uploadBlob?md5=' + md5,
			expected: 200,
			success: function(resp) {
				if (resp.blobKey) {
					// a blob with the same MD5 hash is already present
					callback(resp.blobKey);
				} else {
					// post data to blobstore
			    	postBlob(resp.uploadUrl);
				}
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
		
			self.xhr({
				type: 'POST',
				uri: postUrl,
				body: formData,
				expected: 201,
				success: function(resp) {
					callback(resp.blobKey);
				},
				error: function(e) {
					errCallback(e);
				}
			});
		}
	};
	
	/**
	 * Download a blob from the blobstore
	 */
	self.downloadBlob = function(blobKey, callback, errCallback) {
		self.xhr({
			type: 'GET',
			uri: '/ws/blobs?blob-key=' + blobKey,
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
	};
	
	/**
	 * Deletes a blob from the blobstore
	 */
	self.deleteBlob = function(blobKey, callback, errCallback) {
		self.xhr({
			type: 'DELETE',
			uri: '/ws/blobs?blob-key=' + blobKey,
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