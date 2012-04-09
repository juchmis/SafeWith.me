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
 * This module handles caching both Buckets in local storage
 * as well as decrypted BucketFS objects in memory
 */
var BUCKETCACHE = (function (cache) {
	var self = {};

	//
	// Decrypted BucketFS caching in memory
	//

	var bucketFSCache = [];	// a cache for buckets and their respectable fs

	self.putFS = function(bucket, bucketFS) {
		var pair = {
			bucket : bucket,
			bucketFS : bucketFS
		};
		bucketFSCache.push(pair);
	};
	
	self.current = function() {
		if (bucketFSCache.length === 0) {
			return null;
		}
		// at the moment each user only has one
		return {
			bucket : bucketFSCache[0].bucket,
			bucketFS : bucketFSCache[0].bucketFS
		};
	};
	
	self.clearFSCache = function() {
		bucketFSCache = [];
	};
	
	//
	// Bucket (containing encrypted BucketFS) caching in LocalStorage
	//

	/**
	 * Creates/Updates a bucket in the cache with its ID as a key
	 */
	self.putBucket = function(bucket) {
		// cache bucket in local storage
		cache.storeObject(bucket.id, bucket);
		// update cached bucket ids
		var bucketIds = cache.readObject(bucket.ownerEmail + 'BucketIds');
		if (bucketIds) {
			// check if bucket id is already in the array
			var contained = false;
			for (var i = 0; i < bucketIds.length; i++) {
				if (bucketIds[i] === bucket.id) {
					contained = true;
					break;
				}
			}
			if (!contained) {
				bucketIds.push(bucket.id);
			}
		} else {
			// create new array
			bucketIds = [];
			bucketIds.push(bucket.id);
		}
		cache.storeObject(bucket.ownerEmail + 'BucketIds', bucketIds);
	};

	/**
	 * Returns all the cached buckets
	 */
	self.getAllBuckets = function(email) {
		var cachedBuckets = [];
		// get cached bucket ids
		var bucketIds = cache.readObject(email + 'BucketIds');
		if (!bucketIds) {
			return cachedBuckets;
		}
		for (var i = 0; i < bucketIds.length; i++) {
			// read bucket from local storage
			var bucket = cache.readObject(bucketIds[i]);
			cachedBuckets.push(bucket);
		}
		return cachedBuckets;
	};

	/**
	 * Remove a cache bucket from the cache
	 */
	self.removeBucket = function(bucket) {
		// remove bucket from local storage
		cache.removeObject(bucket.id);
		// update cached bucket ids
		var bucketIds = cache.readObject(bucket.ownerEmail + 'BucketIds');
		for (var i = 0; i < bucketIds.length; i++) {
			if (bucketIds[i] === bucket.id) {
				bucketIds.splice(i, 1);
				break;
			}
		}
		cache.storeObject(bucket.ownerEmail + 'BucketIds', bucketIds);
	};
	
	/**
	 * Clears the bucket cache for a ceratin user
	 */
	self.clearBucketCache = function(email) {
		// get cached bucket ids
		var bucketIds = cache.readObject(email + 'BucketIds');
		if (!bucketIds) {
			return;
		}
		
		for (var i = 0; i < bucketIds.length; i++) {
			// read bucket from local storage
			var bucket = cache.readObject(bucketIds[i]);
			self.removeBucket(bucket);
		}
	};

	/**
	 * Synchronize the local cached buckets with the DTO entries on the server
	 * and uploads any encrypted file-blobs, that are not yet on the server
	 * but in the local filesystem (e.g. because the user imported files offline)
	 * @return [Bucket] the synchronoized buckets that are to be displayed
	 */
	self.syncBuckets = function(serverBuckets, callback) {
		
		//
		// BucketCache (LocalStorage) -> Server
		//
		
		// fetch cached buckets
		var cachedBuckets = self.getAllBuckets();
		for (var i = 0; i < cachedBuckets.length; i++) {
			var cb = cachedBuckets[i];
			
			// check if cached bucket is already stored on the server
			var isOnServer = false;
			for (var j = 0; j < serverBuckets.length; j++) {
				var sb = serverBuckets[j];
				
				if (cb.id === sb.id) {
					// check if local buckets are newer
					var cbTime = new Date(cb.lastUpdate).getTime();
					var sbTime = new Date(sb.lastUpdate).getTime();
					if (cbTime > sbTime) {
						// if newer, send updated buckets to server
						
						// upload missing blobs to server
					
					} else {
						// if older, update cached bucket
						self.putBucket(sb);
					}
					
					isOnServer = true;
				}
			}
			
			if (!isOnServer) {
				// send bucket to server
				// upload missing blobs to server
			}
			
		}
		
		//
		// BucketCache (LocalStorage) <- Server
		//
		
		// get bucket again from the server (should now contain all local changes)
		
		// put all buckets in local cache
		
		// for(var k = 0; k < serverBuckets.length; k++) {
		// 	self.putBucket(serverBuckets[k]);
		// }
		
		callback(serverBuckets);
	};
	
	return self;
}(CACHE));