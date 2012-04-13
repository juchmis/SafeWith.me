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
 * This class contains all logic that makes changes to the DOM
 */
var FSVIEW = (function (window, document, $, fs) {
	var self = {};
	
	/**
	 * init UI
	 */
	self.init = function(loginInfo) {
		// drag and drop area
		var holder = document.getElementById('mainPage');
		// holder.ondragover = function () { this.className = 'hover'; return false; };
		// holder.ondragend = function () { this.className = ''; return false; };
		holder.ondragover = function () { return false; };
		holder.ondragend = function () { return false; };

		holder.ondrop = function(e) {
			// this.className = '';			
			e.preventDefault();
			
			var files = e.dataTransfer.files;
			for (var i = 0; i < files.length; i++) {
				self.handleFileDrop(files[i]);
			}
		};
		
		// upload button
		function handleFileSelect(e) {
			var files = e.target.files;
			for (var i = 0; i < files.length; i++) {
				self.handleFileDrop(files[i]);
			}
		}
		document.getElementById('files').addEventListener('change', handleFileSelect, false);
		
		// get user's bucket if logged in
		fs.getBuckets(loginInfo.email, function(buckets) {
			// if the user does not have any buckets create a default bucket for him
			if (buckets.length === 0) {
				fs.createBucket('Personal Documents', function(bucket) {
					self.displayBucket(bucket, 0, 1);
				});
			} else {
				for (var i = 0; i < buckets.length; i++) {
					self.displayBucket(buckets[i], i, buckets.length);
				}
			}
		});
	};

	/**
	 * Process a file after it has been droped on the droparea
	 */
	self.handleFileDrop = function(file) {		
		// show progress bar
		$.mobile.showPageLoadingMsg();
			
		// read, encrypt and upload encrypted file to server
		fs.storeFile(file, function() {
			// hide progress bar
			$.mobile.hidePageLoadingMsg();
		}, function(fsFile) {
			// display link to the file
			self.addLinkToList(fsFile);
			// refresh listView
			$('#itemList').listview("refresh");
		});
	};
	
	/**
	 * Display a bucket in the UI
	 */
	self.displayBucket = function(bucket, index, numBuckets) {
		// get bucket FS
		var bucketFS = fs.getBucketFS(bucket);
		// cache decrypted bucketFS in memory
		fs.cacheBucketFS(bucket, bucketFS);
		
		// add bucket to accordion
		//var html = '<li class="nav-header">' + bucketFS.name + '</li>';
		// var html = '<div>' +
		// 				'<h3><a href="#">' + bucketFS.name + '</a></h3>' +
		// 				'<ol id="docList"></ol>' +
		// 			'</div>';
		//$('#buckets').append(html);
		
		// sort files in bucketFS by name
		bucketFS.root.sort(function (a, b) {
			var nameA = a.name.toLowerCase( );
			var nameB = b.name.toLowerCase( );
			if (nameA < nameB) { return -1; }
			if (nameA > nameB) { return 1; }
			return 0;
		});
		
		// display file links
		for (var i=0; i < bucketFS.root.length; i++) {
			self.addLinkToList(bucketFS.root[i]);
		}
		
		// refresh listView
		$('#itemList').listview("refresh");
	};
	
	/**
	 * Add new documents link to the list of available documents
	 */
	self.addLinkToList = function(file) {
		var blobKey = file.blobKey;
		// var item = '<li><div>' +
		// 		   '<a id="deleteItem" href="' + blobKey + '"><i class="icon-remove icon-black"></i></a>' +
		// 		   '<a id="showItem" href="' + blobKey + '">' + file.name + '</a>' +
		// 		   '<a id="shareItem" href="' + blobKey + '"><i class="icon-share-alt icon-black"></i></a>' +
		// 		   '</div></li>';
		
		var anchor = $('<a></a>').attr({ id: "showItem", href: blobKey }).append(file.name);
		var item = $('<li></li>').append(anchor);
		$('#itemList').append(item);
		
		// show document
		$('#showItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.showDocItem(file);
			return false;
		});
		
		// delete document
		$('#deleteItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.deleteDocItem(file);
		});
		
		// share document
		$('#shareItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			$('#shareModal').modal('show');
		});	
			
		$('#shareForm').submit(function(e) {
			e.preventDefault();
			
			var senderEmail = $('#login a').html();
			var shareEmail = $('#shareEmail').val();
			
			if (!shareEmail || shareEmail === '') {
				alert('You must specify the recipient\'s email!');
				return false;
			}
			
			fs.shareFile(file, 'shared by ' + senderEmail , shareEmail, function(sharedBucket) {
				$('#encryptModal').modal('hide');
			}, function() {
				$('#shareModal').modal('hide');
				$('#encryptModal').modal('show');
			});

			return false;
		});

	};

	/**
	 * Downloads the encrypted document, decrypt it and display it
	 */
	self.showDocItem = function(file) {
		// show progress bar
		$.mobile.showPageLoadingMsg();
		
		// get encrypted fiel and decrypt
		fs.getFile(file, function(decryptedUrl) {
			// hide progress bar
			$.mobile.hidePageLoadingMsg();
			
			// if (file.mimeType === 'application/pdf') {
			// 	window.location.href = 'pdfjs/viewer.html?file=' + decrypted;
			// 	return;
			// }
			
			// display the document
			window.location.href = decryptedUrl;
		});
	};
	
	self.deleteDocItem = function(file) {
		fs.deleteFile(file, function() {
			$('[href="' + file.blobKey + '"]').remove();
		});
	};
	
	return self;
}(window, document, $, FS));