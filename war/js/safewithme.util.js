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

function Util() {	
	
	/**
	 * Converts a binary String from the FileReader Api to an ArrayBuffer [UInt8]
	 */
	this.binStr2ArrBuf = function(str) {
		var b = new ArrayBuffer(str.length);
		var buf = new Uint8Array(b);
		
		for(var i = 0; i < b.byteLength; i++){
			buf[i] = str.charCodeAt(i);
		}

		return b;
	};
	
	/**
	 * Creates a url for a blob
	 * @param fileName [String] the name of the file to display
	 * @param blob [Blob] a file blob built with the BlobBuilder Api
	 * @return url [String] either a data url or a filesystem url
	 */
	this.createUrl = function(fileName, blob, callback) {
		// check browser support
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.URL = window.URL || window.webkitURL || window.mozURL;
		
		// try using HTML5 filesystem api
		if (window.requestFileSystem) {
			
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
	
}