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
 * This class contains all logic that makes changes to the DOM
 */
function FSView() {
	
	var self = this;
	
	/**
	 * init UI
	 */
	this.init = function() {
		// drag and drop area
		var holder = document.getElementById('holder');
		// holder.ondragover = function () { this.className = 'hover'; return false; };
		// holder.ondragend = function () { this.className = ''; return false; };
		holder.ondragover = function () { return false; };
		holder.ondragend = function () { return false; };

		holder.ondrop = function(e) {
			// this.className = '';			
			e.preventDefault();
			var file = e.dataTransfer.files[0];
			self.handleFileDrop(file);
		};
		
		// upload button
		function handleFileSelect(e) {
			var file = e.target.files[0];
			self.handleFileDrop(file);
		}
		document.getElementById('files').addEventListener('change', handleFileSelect, false);
		
		// get user's bucket if logged in
		self.presenter.getBuckets(function(buckets) {
			// if the user does not have any buckets create a default bucket for him
			if (buckets.length === 0) {
				self.presenter.createBucket('Personal Documents', function(bucket) {
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
	this.handleFileDrop = function(file) {
		
		// show progress bar
		$('#encryptModal').modal('show');
		
		// wait for modal to appear, then start encryption
		setTimeout(function() {
			
			// read, encrypt and upload encrypted file to server
			self.presenter.readFile(file, function(blobKey) {
				// add file to bucket fs
				var fsFile = new self.presenter.File(file.name, file.size, file.type, blobKey);
				var bucket = self.presenter.currentBucket();
				var bucketFS = self.presenter.currentBucketFS();

				self.presenter.addFileToBucketFS(fsFile, bucketFS, bucket, function() {
					// hide progress bar
					$('#encryptModal').modal('hide');
					
					// display link to the file
					self.addLinkToList(fsFile);
				});
			});
			
		}, 500);
	};
	
	/**
	 * Display a bucket in the UI
	 */
	this.displayBucket = function(bucket, index, numBuckets) {
		// get bucket FS
		var bucketFS = self.presenter.getBucketFS(bucket.encryptedFS);
			
		// cache local user buckets and fs
		self.presenter.cacheBucket(bucket, bucketFS);
		
		// add bucket to accordion
		var html = '<li class="nav-header">' + bucketFS.name + '</li>';
		// var html = '<div>' +
		// 				'<h3><a href="#">' + bucketFS.name + '</a></h3>' +
		// 				'<ol id="docList"></ol>' +
		// 			'</div>';
		$('#buckets').append(html);
		
		// display file links
		for (var i=0; i < bucketFS.root.length; i++) {
			self.addLinkToList(bucketFS.root[i]);
		}
	};
	
	/**
	 * Add new documents link to the list of available documents
	 */
	this.addLinkToList = function(file) {
		var blobKey = file.blobKey;
		var item = '<li><div>' +
				   '<a id="deleteItem" href="' + blobKey + '"><i class="icon-remove icon-black"></i></a>' +
				   '<a id="showItem" href="' + blobKey + '">' + file.name + '</a>' +
				   '<a id="shareItem" href="' + blobKey + '"><i class="icon-share-alt icon-black"></i></a>' +
				   '</div></li>';
		
		$('#buckets').append(item);
		
		// show document
		$('#showItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.showDocItem(blobKey);
		});
		
		// delete document
		$('#deleteItem[href="' + blobKey + '"]').click(function(e) {
			e.preventDefault();
			self.deleteDocItem(blobKey);
		});
		
		// share document
		var shareSelector = '#shareItem[href="' + blobKey + '"]';
		// $(shareSelector).popover({
		// 	title : 'encrypted share',
		// 	trigger : 'manual',
		// 	content : '<form id="submitForm" href="' + blobKey + '" class="form-inline">' + 
		// 				'<input type="text" class="input-medium" placeholder="recipient\'s email"/>' + 
		// 				'<button type="submit" class="btn">share</button>' + 
		// 			  '</form>'
		// });
		
		$(shareSelector).click(function(e) {
			e.preventDefault();
			// $(shareSelector).popover('toggle');	
			
			self.presenter.shareFile(file, 'shareBucketName', "test@example.com", function(sharedBucket) {
				alert('Sharing successful!');
			});
		});
		
		// $('#submitForm[href="' + blobKey + '"]').submit(function() {
		// 	
		// 	var shareEmail = $("input:first").val();
		// 	self.presenter(file, 'shareBucketName', shareEmail, function(sharedBucket) {
		// 		alert('Sharing successful!');
		// 	});	
		// 	
		// 	return false;
		// });
	};

	/**
	 * Downloads the encrypted document, decrypt it and display it
	 */
	this.showDocItem = function(blobKey) {
		
		// show progress bar
		$('#decryptModal').modal('show');

		// wait for modal to appear, then start encryption
		setTimeout(function() {
			
			self.presenter.getFile(blobKey, function(decrypted) {
				// hide progress bar
				$('#decryptModal').modal('hide');
				self.displayDoc(decrypted);
			});

		}, 500);
		
		
		// prevent default bahavior: dont open href in new window
		return false;
	};
	
	this.deleteDocItem = function(blobKey) {
		self.presenter.deleteFile(blobKey, function() {
			var bucket = self.presenter.currentBucket();
			var bucketFS = self.presenter.currentBucketFS();
			self.presenter.deleteFileFromBucketFS(blobKey, bucketFS, bucket, function() {
				$('[href="' + blobKey + '"]').remove();
			});
		});
	};

	/**
	 * Displays the document in the main view
	 */
	this.displayDoc = function(dataUrl) {
		window.location = dataUrl;
	};
	
}