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
	this.uploadBlob = function(data, callback) {
		
		function postBlob(postUrl) {
			var boundary = "----WebKitFormBoundaryU4qBHQLW2dP2URYc";
			var body = '--' + boundary + '\r\n'
		             // Parameter name is "file" and local filename is "file.pgp.txt"
		             + 'Content-Disposition: form-data; name="file"; '
		             + 'filename="file.pgp.txt"\r\n'
		             // Add the file's mime-type
		             + 'Content-type: plain/text\r\n\r\n'
		             + data
					 + '\r\n' + '--' + boundary + '--' + '\r\n' ;

			$.ajax({
				type: 'POST',
				url: postUrl,
				contentType: "multipart/form-data; boundary="+boundary,
				data: body,
				success: function(resp) {
					callback(resp.blobKey);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert('Error uploading blob: ' + errorThrown);
				}
			});
		}
		
		// first get upload url from blobstore
		self.call('GET', '/app/uploadBlob', function(resp) {
			// post data to blobstore
	    	postBlob(resp.uploadUrl);
		});
	};

}