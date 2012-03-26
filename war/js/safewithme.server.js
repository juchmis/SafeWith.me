/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

'use strict';

/**
 * This class handles all communication with the server
 */
function Server() {
	
	var self = this;
	
	/**
	 * Make a REST service call
	 */
	this.call = function(httpMethod, uri, callback) {
		$.ajax({
			type: httpMethod,
			url: uri,
			success: function(resp) {
				callback(resp);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('Error calling ' + httpMethod + ' on ' + uri + ': ' + errorThrown);
			}
		});
	};

	/**
	 * Make a REST service call defining the contents of the HTTP body
	 */
	this.upload = function(httpMethod, uri, contentType, body, callback) {
		$.ajax({
			type: httpMethod,
			url: uri,
			contentType: contentType,
			data: body,
			success: function(resp) {
				callback(resp);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert('Error calling ' + httpMethod + ' on ' + uri + ': ' + errorThrown);
			}
		});
	};
	
	/**
	 * Upload a file by first getting an upload url and then posting
	 * the file data to the specified uri
	 */
	this.uploadBlob = function(blob, callback) {
		
		// upload blob to blobstore
		function postBlob(postUrl) {
			var formData = new FormData();
			formData.append('file', blob);

			var xhr = new XMLHttpRequest();
			xhr.open('POST', postUrl, true);
			xhr.onload = function(e) {
				if (this.status == 201) {
					// parse blob-key
					var blobKey = JSON.parse(this.response).blobKey;
					callback(blobKey);
				} else {
					alert('Error uploading blob: ' + this.status);
				}
			};
			xhr.send(formData);  // multipart/form-data
		}
		
		// first get upload url from blobstore
		self.call('GET', '/app/uploadBlob', function(resp) {
			if (resp.blobKey) {
				// a blob with the same MD5 hash is already present
				callback(resp.blobKey);

			} else {
				// post data to blobstore
		    	postBlob(resp.uploadUrl);
			}
		});
	};
	
	/**
	 * Download a blob from the blobstore
	 */
	this.downloadBlob = function(blobKey, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/app/blobs?blob-key=' + blobKey, true);
		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
			if (this.status == 200) {
				var bb = new BlobBuilder();
				bb.append(this.response);
				var blob = bb.getBlob('application/octet-stream');
				
				callback(blob);
			} else {
				alert('Error downloading blob: ' + this.status);
			}
		};

		xhr.send();
	};

}