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
	 * Converts a UTF16 String to an ArrayBuffer
	 */
	this.str2ArrBuf = function(str) {
		var b = new ArrayBuffer(str.length*2);
		var dv = new DataView(b);
		
		for(var i = 0; i < b.byteLength; i+=2){
		    var x = str.charCodeAt(i/2);
		    var a = x%256;
		    x -= a;
		    x /= 256;
			dv.setUint8(i, x);
			dv.setUint8(i+1, a);
		}

		return b;
	};
	
	/**
	 * Converts a binary String from the FileReader Api to an ArrayBuffer
	 */
	this.binStr2ArrBuf = function(str) {
		var b = new ArrayBuffer(str.length);
		var buf = new Uint8Array(b);
		
		for(var i = 0; i < b.byteLength; i++){
		    var x = str.charCodeAt(i);
			x = x%256;
			buf[i] = x;
		}

		return b;
	};

	/**
	 * Converts and ArrayBuffer to an UTF16 String
	 */
	this.arrBuf2Str = function(buf) {
		var dv = new DataView(buf);
		var s = "";
		var high, low;
		
		for(var i = 0; i < buf.byteLength-2;){
			high = dv.getUint8(i++);
			low = dv.getUint8(i++);
		    s += String.fromCharCode(high*256+low);
		}
		high = dv.getUint8(buf.byteLength-2);
		low = 0;
		if (buf.byteLength%2 === 0) {
			low = dv.getUint8(buf.byteLength-1);
		}
	    s += String.fromCharCode(high*256+low);

		return s;
	};
	
	/**
	 * Creates a url for a blob
	 * @param fileName [String] the name of the file to display
	 * @param blob [Blob] a file blob built with the BlobBuilder Api
	 * @return url [String] either a data url or a filesystem url
	 */
	this.createUrl = function(fileName, blob, callback) {
		
		// try using HTML5 filesystem api
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
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