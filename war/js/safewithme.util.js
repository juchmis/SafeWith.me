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

var UTIL = (function (window) {
	var self = {};
	
	/**
	 * Converts a binary String (e.g. from the FileReader Api) to an ArrayBuffer
	 * @param str [String] a binary string with integer values (0..255) per character
	 * @return [ArrayBuffer] either a data url or a filesystem url
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
		// check for BlobBuilder support
		window.BlobBuilder =  window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder;
		if (!window.BlobBuilder) {
			throw 'BlobBuilder Api not supported!';
		}
		
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
	 * Creates a url for a blob
	 * @param fileName [String] the name of the file to display
	 * @param blob [Blob] a file blob built with the BlobBuilder Api
	 * @return [String] either a data url or a filesystem url
	 */
	self.createUrl = function(fileName, blob, callback) {
		// check browser support
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.URL = window.URL || window.webkitURL || window.mozURL;
		
		// open file with filesystem apis
		function onInitFs(fs) {
			fs.root.getFile(fileName, {create: true}, function(fileEntry) {

				// Create a FileWriter object for our FileEntry
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {
						var url = fileEntry.toURL();
						callback(url);
					};

					fileWriter.onerror = function(e) {
					  console.log('Write failed: ' + e.toString());
					};

					fileWriter.write(blob);
				});
			});
		}
		
		if (window.requestFileSystem) {
			// try using HTML5 filesystem api
			window.requestFileSystem(window.TEMPORARY, blob.size, onInitFs);
			
		} else if (window.URL) {
			// use blob URL api
			var url = window.URL.createObjectURL(blob);
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
	};
	
	return self;
}(window));