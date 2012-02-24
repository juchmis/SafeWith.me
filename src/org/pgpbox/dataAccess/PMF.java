package org.pgpbox.dataAccess;

import javax.jdo.JDOHelper;
import javax.jdo.PersistenceManagerFactory;

class PMF {
	
    private static final PersistenceManagerFactory pmfInstance =
        JDOHelper.getPersistenceManagerFactory("transactions-optional");

    private PMF() { }

    public static PersistenceManagerFactory getInstance() {
        return pmfInstance;
    }

}
