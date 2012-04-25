package me.safewith.test;

import static org.junit.Assert.*;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.dataAccess.PGPKeyDAO;
import me.safewith.model.PublicKey;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;

public class PGPKeyDAOTest {

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
	public void testGetKeyForUser() {
		String email = "test@asdf.com";
		
		assertNull(PGPKeyDAO.getKeyForUser(PublicKey.class, email));
		
		PublicKey pk1 = new PublicKey();
		pk1.setOwnerEmail(email);
		pk1.setKeyId("1");
		PGPKeyDAO.putKeyForUser(pk1, PublicKey.class, email);
		
		assertEquals(pk1.getKeyId(), PGPKeyDAO.getKeyForUser(PublicKey.class, email).getKeyId());
	}
	
	@Test(expected=IllegalArgumentException.class)
	public void testErrorGetKeyForUser() {
		String email = "test@asdf.com";

		PublicKey pk1 = new PublicKey();
		pk1.setOwnerEmail(email);
		pk1.setKeyId("1");
		new GenericDAO().persist(pk1);

		PublicKey pk2 = new PublicKey();
		pk2.setOwnerEmail(email);
		pk2.setKeyId("2");
		new GenericDAO().persist(pk2);
		
		PGPKeyDAO.getKeyForUser(PublicKey.class, email);
	}
	
	@Test(expected=IllegalArgumentException.class)
	public void testErrorPutKeyForUser() {
		String email = "test@asdf.com";

		PublicKey pk1 = new PublicKey();
		pk1.setOwnerEmail(email);
		pk1.setKeyId("1");
		PGPKeyDAO.putKeyForUser(pk1, PublicKey.class, email);

		PublicKey pk2 = new PublicKey();
		pk2.setOwnerEmail(email);
		pk2.setKeyId("2");
		PGPKeyDAO.putKeyForUser(pk2, PublicKey.class, email);
	}


}
