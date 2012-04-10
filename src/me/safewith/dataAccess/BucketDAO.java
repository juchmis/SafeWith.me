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

package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.Bucket;
import me.safewith.model.BucketMsg;

public class BucketDAO {
	
	/**
	 * Create new bucket for a user
	 */
	public Bucket createBucket(String email) {
		// create new bucket
		Bucket bucket = new Bucket();
		bucket.setOwnerEmail(email);
		new GenericDAO().persist(bucket);
		
		return bucket;
	}

	/**
	 * Get the user's bucket in a json repsonse
	 */
	public List<Bucket> listUserBuckets(String email) {
		List<Bucket> buckets = new GenericDAO().filterBy(Bucket.class, "ownerEmail", email);
		return buckets;
	}

	/**
	 * Get the user's bucket in a json repsonse
	 */
	public Bucket readBucket(String bucketId, String email) {
		Bucket bucket = new GenericDAO().get(Bucket.class, bucketId);
		
		// check if it's the owners bucket
		if (bucket.getOwnerEmail().equals(email)) {
			return bucket;
			
		} else {
			throw new IllegalArgumentException("Only the owner can read his buckets!");
		}
	}
	
	public Bucket updateBucket(Bucket bucket, String email) {
		GenericDAO dao = new GenericDAO();
		Bucket currentBucket = dao.get(Bucket.class, bucket.getId());

		// check if it's the owners bucket
		if (currentBucket.getOwnerEmail().equals(email)) {
			Bucket updated = dao.persist(bucket);
			return updated;
			
		} else {
			throw new IllegalArgumentException("Only the owner can update his buckets!");
		}
	}
	
	/**
	 * Deletes a users bucket
	 */
	public void deleteBucket(String bucketId, String email) {
		GenericDAO dao = new GenericDAO();
		Bucket bucket = dao.get(Bucket.class, bucketId);
		
		// check if it's the user's own bucket
		if (bucket.getOwnerEmail().equals(email)) {
			dao.delete(Bucket.class, bucketId);
		} else {
			throw new IllegalArgumentException("Only the owner can delete his buckets!");
		}
	}
	
	public static Bucket msg2dto(BucketMsg msg) {
		Bucket b = new Bucket();
		
		b.setId(msg.getId());
		b.setOwnerEmail(msg.getOwnerEmail());
		b.setPublicKeyId(msg.getPublicKeyId());
		b.setLastUpdate(msg.getLastUpdate());
		b.setEncryptedFS(msg.getEncryptedFS());
		
		return b;
	}
	
	public static BucketMsg dto2msg(Bucket b) {
		BucketMsg msg = new BucketMsg();
		
		msg.setId(b.getId());
		msg.setOwnerEmail(b.getOwnerEmail());
		msg.setPublicKeyId(b.getPublicKeyId());
		msg.setLastUpdate(b.getLastUpdate());
		msg.setEncryptedFS(b.getEncryptedFS());
		
		return msg;
	}
}
