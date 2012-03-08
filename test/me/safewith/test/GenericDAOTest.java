package me.safewith.test;

import static org.junit.Assert.*;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.model.Bucket;
import me.safewith.model.ValidUser;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;



public class GenericDAOTest {

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
	public void testCRUD() {
		// create
		ValidUser user1 = new ValidUser();
		user1.setEmail("test@asdf.com");
		long initialStorage = 100;
		user1.setAllowedStorage(initialStorage);

		ValidUser generated = new GenericDAO().persist(user1);
		assertEquals(initialStorage, generated.getAllowedStorage());
		
		// read
		ValidUser read = new GenericDAO().get(ValidUser.class, user1.getEmail());
		assertEquals(generated.getEmail(), read.getEmail());
		assertEquals(initialStorage, read.getAllowedStorage());
		
		// update
		long newStorage = 200;
		read.setAllowedStorage(newStorage);
		ValidUser updated = new GenericDAO().persist(read);
		assertEquals(newStorage, updated.getAllowedStorage());
		
		List<ValidUser> all = new GenericDAO().getAll(ValidUser.class);
		assertTrue(all.size() == 1);
		
		// delete
		String email = read.getEmail();
		new GenericDAO().delete(ValidUser.class, email);
		
		List<ValidUser> afterDelete = new GenericDAO().getAll(ValidUser.class);
		assertTrue(afterDelete.size() == 0);
	}

	@Test
	public void testFilterBy() throws IllegalAccessException, InvocationTargetException, NoSuchMethodException {
		// persist user
		ValidUser user = new ValidUser();
		user.setEmail("test@asdf.com");
		new GenericDAO().persist(user);
		
		// persist bucket
		Bucket bucket = new Bucket();
		bucket.setOwnerEmail(user.getEmail());
		new GenericDAO().persist(bucket);
		
		// read bucket
		Bucket readBucket = new GenericDAO().get(Bucket.class, bucket.getId());
		assertEquals(bucket.getId(), readBucket.getId());
		assertEquals(user.getEmail(), readBucket.getOwnerEmail());
		
		// filter by
		List<Bucket> buckets = new GenericDAO().filterBy(Bucket.class, "ownerEmail", user.getEmail());
		assertEquals(bucket.getId(), buckets.get(0).getId());
	}

}
