package me.safewith.test;

import static org.junit.Assert.*;

import java.util.List;
import java.util.UUID;

import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;

import me.safewith.dataAccess.BucketDAO;
import me.safewith.dataAccess.GenericDAO;
import me.safewith.model.Bucket;
import me.safewith.model.PublicKey;
import me.safewith.model.ValidUser;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;


public class BucketDAOTest {

    private final LocalServiceTestHelper helper =
        new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());

	@BeforeClass
	public static void setUpBeforeClass() throws Exception {
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
	}

	@Before
	public void setUp() throws Exception {
        helper.setUp();
	}

	@After
	public void tearDown() throws Exception {
        helper.tearDown();
	}
	
	@Test
	public void testGetUserBuckets() {
		// persist user
		ValidUser user = new ValidUser();
		user.setEmail("test@asdf.com");
		new GenericDAO().persist(user);
		
		PublicKey pubKey = new PublicKey();
		pubKey.setOwnerEmail(user.getEmail());
		pubKey.setKeyId("12345");
		new GenericDAO().persist(pubKey);
		
		// create bucket
		Bucket falseBucket = new Bucket();
		falseBucket.setId("asdf");
		falseBucket.setPublicKeyId("67890");
		assertNull(new BucketDAO().createBucket(falseBucket, user.getEmail()));
		Bucket trueBucket = new Bucket();
		trueBucket.setId(UUID.randomUUID().toString());
		trueBucket.setPublicKeyId(pubKey.getKeyId());
		Bucket bucket = new BucketDAO().createBucket(trueBucket, user.getEmail());
		assertNotNull(bucket);
		
		// read single bucket
		Bucket single = new BucketDAO().readBucket(bucket.getId(), user.getEmail());
		assertEquals(bucket.getPublicKeyId(), single.getPublicKeyId());
		
		assertNull(bucket.getEncryptedFS());
		String newKey = "asdf";
		bucket.setEncryptedFS(newKey);
		Bucket updated = new BucketDAO().updateBucket(bucket, user.getEmail());
		assertEquals(newKey, updated.getEncryptedFS());
		
		// get users buckets
		List<Bucket> buckets = new BucketDAO().listUserBuckets(user.getEmail());
		assertTrue(buckets.size() == 1);
	}

}