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
import java.util.UUID;

import me.safewith.model.Bucket;
import me.safewith.model.BucketMsg;
import me.safewith.model.PublicKey;

public class BucketDAO {
	
	/**
	 * Create new bucket for a user
	 */
	public Bucket createBucket(Bucket bucket, String email) {
		// check user and id
		if (bucket.getId() == null ||
				bucket.getPublicKeyId() == null ||
				!checkUser(bucket, email)) {
			return null;
		}
		
		// check if bucket id from client has valid UUID
		try {
			UUID.fromString(bucket.getId());
		} catch (IllegalArgumentException e) {
			return null;
		}
		
		// persist client bucket		
		return new GenericDAO().persist(bucket);
	}

	/**
	 * Get the user's bucket in a json repsonse
	 */
	public List<Bucket> listUserBuckets(String email) {
		PublicKey pubKey = PGPKeyDAO.getKeyForUser(PublicKey.class, email);
		if (pubKey == null) {
			throw new IllegalArgumentException("No public key stored for that user yet!");
		}
		List<Bucket> buckets = new GenericDAO().filterBy(Bucket.class, "publicKeyId", pubKey.getKeyId());
		return buckets;
	}

	/**
	 * Get the user's bucket in a json repsonse
	 */
	public Bucket readBucket(String bucketId, String email) {
		Bucket bucket = new GenericDAO().get(Bucket.class, bucketId);
		
		// check if it's the owners bucket
		if (bucket != null && checkUser(bucket, email)) {
			return bucket;
			
		} else {
			return null;
		}
	}
	
	public Bucket updateBucket(Bucket bucket, String email) {
		GenericDAO dao = new GenericDAO();
		Bucket currentBucket = dao.get(Bucket.class, bucket.getId());

		// check if it's the owners bucket
		if (checkUser(currentBucket, email)) {
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
		if (checkUser(bucket, email)) {
			dao.delete(Bucket.class, bucketId);
		} else {
			throw new IllegalArgumentException("Only the owner can delete his buckets!");
		}
	}
	
	/**
	 * Checks if the bucket belongs to a user by his public key
	 */
	public boolean checkUser(Bucket bucket, String email) {
		PublicKey pubKey = PGPKeyDAO.getKeyForUser(PublicKey.class, email);
		if (pubKey == null || bucket.getPublicKeyId() == null) {
			return false;
		}
		
		return pubKey.getKeyId().equals(bucket.getPublicKeyId());
	}
	
	public static Bucket msg2dto(BucketMsg msg) {
		Bucket b = new Bucket();
		
		b.setId(msg.getId());
		b.setPublicKeyId(msg.getPublicKeyId());
		b.setLastUpdate(msg.getLastUpdate());
		b.setEncryptedFS(msg.getEncryptedFS());
		
		return b;
	}
	
	public static BucketMsg dto2msg(Bucket b) {
		BucketMsg msg = new BucketMsg();
		
		msg.setId(b.getId());
		msg.setPublicKeyId(b.getPublicKeyId());
		msg.setLastUpdate(b.getLastUpdate());
		msg.setEncryptedFS(b.getEncryptedFS());
		
		return msg;
	}
}
