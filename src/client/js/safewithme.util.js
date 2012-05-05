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

var Util = function(window, uuid) {
	var self = this;
	
	/**
	 * Set Vendor prefixes for HTML5 Api and check browser support
	 */
	self.checkRuntime = function() {
		// set vendor prefixes for HTML5 Apis
		window.BlobBuilder =  window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.storageInfo = window.storageInfo || window.webkitStorageInfo;
		window.URL = window.URL || window.webkitURL || window.mozURL;

		// check for browser support
		if (!window.crypto.getRandomValues ||
			!window.Worker ||
			!window.BlobBuilder ||
			!window.requestFileSystem ||
			!window.storageInfo) {
			window.alert('Sorry, your browser doesn\'t support all the necessary HTML5 features yet. Try using Chrome.');
			return false;
		}
		return true;
	};
	
	/**
	 * Generates a new RFC 4122 version 4 compliant random UUID
	 */
	self.UUID = function() {
		return uuid.v4();
	};
	
	/**
	 * Converts a binary String (e.g. from the FileReader Api) to an ArrayBuffer
	 * @param str [String] a binary string with integer values (0..255) per character
	 * @return [ArrayBuffer]
	 */
	self.binStr2ArrBuf = function(str) {
		var b = new ArrayBuffer(str.length);
		var buf = new Uint8Array(b);
		
		for(var i = 0; i < b.byteLength; i++){
			buf[i] = str.charCodeAt(i);
		}

		return b;
	};
	
	/**
	 * Creates a Blob from an ArrayBuffer using the BlobBuilder Api
	 * @param str [String] a binary string with integer values (0..255) per character
	 * @return [ArrayBuffer] either a data url or a filesystem url
	 */
	self.arrBuf2Blob = function(buf, mimeType) {
		var bb = new BlobBuilder();
		bb.append(buf);
		var blob = bb.getBlob(mimeType);
		
		return blob;
	};
	
	/**
	 * Creates a binary String from a Blob using the FileReader Api
	 * @param blob [Blob/File] a blob containing the the binary data
	 * @return [String] a binary string with integer values (0..255) per character
	 */
	self.blob2BinStr = function(blob, callback) {
		var reader = new FileReader();

		reader.onload = function(event) {
			callback(event.target.result);
		};

		reader.readAsBinaryString(blob);
	};
	
	/**
	 * Converts an ArrayBuffer to a binary String. This is a slower alternative to
	 * conversion with arrBuf2Blob -> blob2BinStr, since these use native apis,
	 * but it can be used on browsers without the BlodBuilder Api
	 * @param buf [ArrayBuffer]
	 * @return [String] a binary string with integer values (0..255) per character
	 */
	self.arrBuf2BinStr = function(buf) {
		var b = new Uint8Array(buf);
		var str = '';
		
		for(var i = 0; i < b.byteLength; i++){
			str += String.fromCharCode(b[i]);
		}
		
		return str;
	};
	
	/**
	 * Creates a url for a blob
	 * @param fileName [String] the name of the file to display
	 * @param blob [Blob] a file blob built with the BlobBuilder Api
	 * @return [String] either a data url or a filesystem url
	 */
	self.createUrl = function(fileName, blob, callback) {
		
		// check which url options are available
		if (window.requestFileSystem && fileName) {
			// try using HTML5 filesystem api
			window.requestFileSystem(window.TEMPORARY, blob.size, onInitFs);

		} else if (window.URL) {
			// use blob URL api
			var url = window.URL.createObjectURL(blob);
			// TODO: delete URL
			callback(url);

		} else {
			// open file as data url
			var reader = new FileReader();
			reader.onload = function(event) {
				var url = event.target.result;
				callback(url);
			};
			reader.readAsDataURL(blob);
		}
		
		// open file with filesystem apis
		function onInitFs(fs) {
			fs.root.getFile(fileName, {create: true}, function(fileEntry) {

				// Create a FileWriter object for our FileEntry
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {
						var url = fileEntry.toURL();
						
						// return decrypted file url
						callback(url, function() {
							// cleanupCallback
							fileEntry.remove(function() {
								console.log('Decrypted file removed from temp fs.');
							});
						});
					};
					fileWriter.onerror = function(e) {
					  console.log('Write failed: ' + e.toString());
					};
					fileWriter.write(blob);
				});
			});
		}
	};
	
};