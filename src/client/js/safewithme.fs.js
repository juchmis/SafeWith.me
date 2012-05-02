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
 * This class implements all logic required for filesystem and
 * I/O between the browser's HTML5 File Apis and the application.
 */
var FS = function(crypto, server, util, cache,  bucketCache) {
	var self = this;
	
	//
	// BucketFS json model
	//
	
	self.Bucket = function(publicKeyId) {
		this.id = util.UUID();	// generate new UUID
		this.publicKeyId = publicKeyId;
		this.lastUpdate = new Date().toISOString();
	};

	self.BucketFS = function(id, name) {
		this.version = "1.0";
		this.id = id;
		this.name = name;
		this.created = new Date().toISOString();
		this.root = [];	// format the fs :)
	};
	
	self.Directory = function(name) {
		this.type = "dir";
		this.name = name;
		this.created = new Date().toISOString();
		this.children = [];
	};
	
	self.File = function(name, size, mimeType, blobKey, cryptoKey, md5) {
		this.type = "file";
		this.name = name;
		this.size = size;			// note: this is the unencrypted file size!
		this.created = new Date().toISOString();
		this.mimeType = mimeType;
		this.blobKey = blobKey;		// pointer to the encrypted blob
		this.cryptoKey = cryptoKey;	// secret key required to decrypt the file
		this.md5 = md5;				// md5 hash of the encrypted file blob
	};
	
	//
	// Bucket handling
	//
	
	/**
	 * Create a new bucket by first making a new bucket pointer on the
	 * server and then creating a bucket FS with the pointer's id.
	 * The bucket FS is then ecrypted and persited on the server in order to
	 * get a new blob-key, which is then updated on the bucket pointer.
	 */
	self.createBucket = function(name, publicKeyId, callback) {
		var bucket = new self.Bucket(publicKeyId);
		self.postBucket(bucket, function(updatedBucket) {
			initFS(updatedBucket);
		});
		
		function initFS(bucket) {
			// initialize bucket file system
			var bucketFS = new self.BucketFS(bucket.id, name);
			persistBucketFS(bucketFS, bucket, function(updatedBucket) {
				callback(updatedBucket);
			});
		}
	};
	
	/**
	 * POSTs the bucket to the server
	 */
	self.postBucket = function(bucket, callback) {
		var bucketJson = JSON.stringify(bucket);
		
		server.xhr({
			type: 'POST',
			uri: '/ws/buckets',
			contentType: 'application/json',
			body: bucketJson,
			expected: 201,
			success: function(updatedBucket) {
				console.log('Bucket successfully created on server.');
				callback(updatedBucket);
			},
			error: function(err) {
				console.log('No connection to server... bucket not created on server!');
				callback(bucket);
			}
		});
	};
	
	/**
	 * Get all the user's buckets from server
	 */
	self.getBuckets = function(publicKeyId, callback) {
		// synchronize the server's with local buckets
		bucketCache.syncBuckets(publicKeyId, self, function(syncedBuckets) {
			// cache <-> server buckets are in sync
			callback(syncedBuckets);
		});
	};
	
	/**
	 * Get a bucket by its ID from the server
	 */
	self.getBucket = function(bucketId, callback) {
		server.xhr({
			type: 'GET',
			uri: '/ws/buckets?id=' + bucketId,
			expected: 200,
			success: function(bucket) {
				callback(bucket);
			}
		});
	};
	
	/**
	 * Delete a bucket from the server.
	 */
	self.removeBucket = function(bucket, callback) {
		// TODO: delete any containing file blobs
		
		// remove from local storage cache
		bucketCache.removeBucket(bucket);
		// delete bucket DTO in datastore
		server.xhr({
			type: 'DELETE',
			uri: '/ws/buckets?bucketId=' + bucket.id,
			expected: 200,
			success: function(resp) {
				callback(resp);
			}
		});
	};
	
	//
	// BucketFS handling
	//

	/**
	 * Convert BucketFS to a JSON string, encrypt and then upload
	 */
	function persistBucketFS(bucketFS, bucket, callback, publicKey) {
		var jsonFS = JSON.stringify(bucketFS);
		
		var encryptedFS = null;
		if (publicKey) {
			encryptedFS = crypto.asymmetricEncrypt(jsonFS, publicKey);
		} else {
			encryptedFS = crypto.asymmetricEncrypt(jsonFS);
		}
		
		// update bucket
		bucket.encryptedFS = encryptedFS;
		bucket.publicKeyId = crypto.getPublicKeyIdBase64();
		bucket.lastUpdate = new Date().toISOString();
		// cache bucket in local storage
		bucketCache.putBucket(bucket);
		console.log('Bucket cached locally.');
		// upload to server
		self.updateServerBucket(bucket, callback);
	};
	
	/**
	 * Updates the bucket DTO on the server
	 */
	self.updateServerBucket = function(bucket, callback) {
		var updatedBucketJson = JSON.stringify(bucket);
		server.xhr({
			type: 'PUT',
			uri: '/ws/buckets',
			contentType: 'application/json',
			body: updatedBucketJson,
			expected: 200,
			success: function(updatedBucket) {
				console.log('Bucket successfully updated on server.');
				callback(updatedBucket);
			},
			error: function(err) {
				console.log('No connection to server... bucket not updated on server!');
				callback(bucket);
			}
		});
	};

	/**
	 * Get bucket FS from bucket decrypt it
	 */
	self.getBucketFS = function(bucket) {
		var jsonFS =  crypto.asymmetricDecrypt(bucket.encryptedFS);
		var bucketFS = JSON.parse(jsonFS);
		
		return bucketFS;
	};
	
	/**
	 * cache local user buckets and fs in memory
	 */
	self.cacheBucketFS = function(bucket, bucketFS) {
		bucketCache.putFS(bucket, bucketFS);
	};

	/**
	 * Add a file to the currentyl selected bucket fs
	 */
	self.addFileToBucketFS = function(file, bucketFS, bucket, callback) {
		// at the moment directories are not yet implemented
		bucketFS.root.push(file);
		
		persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	
	/**
	 * Delete a file from the currentyl selected bucket fs
	 */
	self.deleteFileFromBucketFS = function(fileBlobKey, bucketFS, bucket, callback) {
		// rm file from root
		for (var i = 0; i < bucketFS.root.length; i++) {
			var current = bucketFS.root[i];
			if (current.type === 'file' && current.blobKey === fileBlobKey) {
				bucketFS.root.splice(i, 1);
				break;
			}
		}
		
		persistBucketFS(bucketFS, bucket, function(updatedBucket) {
			callback(updatedBucket);
		});
	};
	
	//
	// File/Blob handling
	//
	
	/**
	 * Reads the files that have been dragged onto the page
	 * using the HTML5 FileReader Api, encrypts the file locally
	 * and upload encrypted blob to server
	 */
	self.storeFile = function(file, encryptedCallback, callback) {
		// convert file/blob to binary string
		util.blob2BinStr(file, function(binStr) {
			// symmetrically encrypt the string
			crypto.symmetricEncrypt(binStr, function(ct) {
				
				// create blob for uploading
				var blob = util.arrBuf2Blob(util.binStr2ArrBuf(ct.ct), 'application/octet-stream');
				var ctMd5 = md5(ct.ct);
				
				// switch displaying message
				encryptedCallback();

				// cache the blob locally
				cache.storeBlob(ctMd5, blob, function(success) {
					if (success) {
						// blob was cached locally
						console.log(file.name + ' encrypted blob cached locally.');
						// upload to the server
						persistOnServer(blob, file, ctMd5, ct.key);
					} else {
						throw 'Caching encrypted file blob before uploading failed!';
					}
				});
			});
		});
		
		function persistOnServer(blob, file, ctMd5, encryptionkey) {
			// send encrypted file blob to server
			server.uploadBlob(blob, ctMd5, function(blobKey) {
				// store file and file-metadata in BucketFS with blob-key
				console.log(file.name + ' encrypted blob uploaded successful!');
				createFSFile(file, ctMd5, encryptionkey, blobKey);
				
			}, function(err) {
				// store file and file-metadata in BucketFS without blob-key
				console.log('No connection to server... ' + file.name + ' (encrypted) was not uploaded!');	
				createFSFile(file, ctMd5, encryptionkey);
			});
		}
		
		function createFSFile(file, ctMd5, encryptionkey, blobKey) {
			// add file to bucket fs
			var fsFile = new self.File(file.name, file.size, file.type, blobKey, encryptionkey, ctMd5);
			var current = bucketCache.current();
			self.addFileToBucketFS(fsFile, current.bucketFS, current.bucket, function(updatedBucket) {
				// add link to the file list
				callback(fsFile, updatedBucket);
			});
		}
	};
	
	/**
	 * Downloads the encrypted document and decrypt it
	 */
	self.getFile = function(file, gottenCallback, callback) {
		// try to fetch blob from the local cache
		cache.readBlob(file.md5, function(blob) {
			if (blob) {
				console.log(file.name + ' read from cache.');
				handleBlob(blob);
			} else {
				// get encrypted ArrayBuffer from server
				server.downloadBlob(file.blobKey, function(blob) {
					// cache the downloaded blob
					cache.storeBlob(file.md5, blob, function(success) {
						if (success) {
							handleBlob(blob);
						} else {
							throw 'Caching encrypted file blob locally after download failed!';
						}
					});
				});
			}
		});

		function handleBlob(blob) {
			// display gotten msg
			gottenCallback();
			
			// read blob as binary string
			util.blob2BinStr(blob, function(encrStr) {
				
				// symmetrically decrypt the string
				crypto.symmetricDecrypt(file.cryptoKey, encrStr, function(pt) {
					
					// build plaintext blob
					var blob2 = util.arrBuf2Blob(util.binStr2ArrBuf(pt), file.mimeType);
					// return either data url or filesystem url
					util.createUrl(file.name, blob2, function(url) {
						callback(url);
					});
				});
			});
		}
	};
	
	/**
	 * Deletes an encrypted file blob and removes it from the bucket FS
	 */
	self.deleteFile = function(file, callback) {
		// delete from chache
		cache.removeBlob(file.md5, function(success) {
			// delete from server
			server.deleteBlob(file.blobKey, function(resp) {
				afterDelete();
				
			}, function(e) /* errCallback */ {
				afterDelete();
			});
		});
		
		function afterDelete() {
			// update bucketFS
			var current = bucketCache.current();
			self.deleteFileFromBucketFS(file.blobKey, current.bucketFS, current.bucket, function() {
				callback();
			});
		}
	};
	
	//
	// Filesharing
	//
	
	/**
	 * Share a file with another user
	 */
	self.shareFile = function(file, shareBucketName, shareEmail, callback, displayCallback) {
		// get recipient's public
		server.call('GET', '/ws/publicKeys?email=' + shareEmail, function(recipientKey) {
			
			// display message if recipient's public key is available
			if (recipientKey && displayCallback) {
				displayCallback();
			}
			
			// create a new bucket for the recipient
			server.call('POST', '/ws/buckets', function(shareBucket) {

				// add all the encrypted files to fs
				var shareFS = new self.BucketFS(shareBucket.id, shareBucketName, shareEmail);
				// add file to share FS
				shareFS.root.push(file);
				// hand bucket ownership over to the recipient
				shareBucket.ownerEmail = shareEmail;
				// TODO: set recipient public key id on bucket
				
				persistBucketFS(shareFS, shareBucket, function(updatedShareBucket) {
					callback(updatedShareBucket);
				}, recipientKey.asciiArmored);
			});
		});
	};
	
};