package me.safewith.dataAccess;

import java.util.List;

import me.safewith.model.Bucket;

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

		// check if it's the owners bucket
		if (bucket.getOwnerEmail().equals(email)) {
			Bucket updated = new GenericDAO().persist(bucket);
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
		
		// check if it's the user's own bucket
		Bucket bucket = dao.get(Bucket.class, bucketId);
		if (bucket.getOwnerEmail().equals(email)) {
			dao.delete(Bucket.class, bucketId);
		} else {
			throw new IllegalArgumentException("Only the owner can delete his buckets!");
		}
	}
}
