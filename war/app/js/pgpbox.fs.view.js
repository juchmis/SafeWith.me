/*
 * PGPbox - an open source document archive with client-side encryption
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
		// read, encrypt and upload encrypted file to server
		self.presenter.readFile(file, function(uri) {
			// add file to bucket fs
			var fsFile = new self.presenter.File(file.name, file.size, file.type, uri);
			var bucket = self.presenter.currentBucket();
			var bucketFS = self.presenter.currentBucketFS();
			
			self.presenter.addFileToBucketFS(fsFile, bucketFS, bucket, function() {
				// display link to the file
				self.addLinkToList(fsFile);
			});
		});
	};
	
	/**
	 * Display a bucket in the UI
	 */
	this.displayBucket = function(bucket, index, numBuckets) {
		// get bucket FS
		self.presenter.getBucketFS(bucket.fsBlobUri, function(bucketFS) {
			
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
			
			// // render accordion after the last bucket
			// if(index === numBuckets - 1) {
			// 	// jquery accordion for bucket menu
			// 	$("#accordion").accordion({
			// 		header: "h3",
			// 		fillSpace: true
			// 	});
			// }
		});
	};
	
	/**
	 * Add new documents link to the list of available documents
	 */
	this.addLinkToList = function(file) {
		var uri = file.blobUri;
		var item = '<li><div>' +
				   '<a id="showItem" href="' + uri + '">' + file.name + '</a>' +
				   '<a id="deleteItem" href="' + uri + '"><i class="icon-remove icon-black"></i></a>' +
				   '</div></li>';
		
		$('#buckets').append(item);
		$('#showItem[href="' + uri + '"]').click(function(e) {
			e.preventDefault();
			self.showDocItem(uri);
		});
		
		$('#deleteItem[href="' + uri + '"]').click(function(e) {
			e.preventDefault();
			self.deleteDocItem(uri);
		});
	};

	/**
	 * Downloads the encrypted document, decrypt it and display it
	 */
	this.showDocItem = function(uri) {
		self.presenter.getFile(uri, function(decrypted) {
			self.displayDoc(decrypted);
		});
		
		// prevent default bahavior: dont open href in new window
		return false;
	};
	
	this.deleteDocItem = function(uri) {
		self.presenter.deleteFile(uri, function() {
			var bucket = self.presenter.currentBucket();
			var bucketFS = self.presenter.currentBucketFS();
			self.presenter.deleteFileFromBucketFS(uri, bucketFS, bucket, function() {
				$('[href="' + uri + '"]').remove();
			});
		});
	};

	/**
	 * Displays the document in the main view
	 */
	this.displayDoc = function(dataUrl) {
		// // check mime-type at the beginning of each dataUrl
		// if (dataUrl.indexOf('data:application/pdf') === 0) {
		// 	// add embed view for pdfs
		// 	var embed = '<embed src="' + dataUrl + '" width="100%" height="100%"/>';
		// 	// remove other elems in main_view
		// 	$("#main_view").html(embed);
		// 
		// } else if (dataUrl.indexOf('data:image/') === 0) {
		// 	// add image tag
		// 	var image = '<img src="' + dataUrl + '"/>';
		// 	// remove other elems in main_view
		// 	$("#main_view").html(image);
		// 
		// } else {
			window.open(dataUrl);
		// }
	};
	
}