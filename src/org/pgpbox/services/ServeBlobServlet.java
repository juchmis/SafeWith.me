package org.pgpbox.services;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.pgpbox.dataAccess.GenericDAO;
import org.pgpbox.model.ValidUser;
import org.pgpbox.services.RequestHelper.Command;

import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;


@SuppressWarnings("serial")
public class ServeBlobServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(ServeBlobServlet.class.getName());	
	private BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {				

				// serve the blob
				BlobKey blobKey = new BlobKey(req.getParameter("blob-key"));
				blobstoreService.serve(blobKey, resp);
			}
		});
	}

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {				
				
				BlobKey blobKey = new BlobKey(req.getParameter("blob-key"));
				long blobSize = new BlobInfoFactory().loadBlobInfo(blobKey).getSize();
				
				// delete the blob
				blobstoreService.delete(blobKey);
				
				// update user's used storage
				user.updateUsedStorage( (-1) * blobSize );
				new GenericDAO().persist(user);
				
				resp.getWriter().close();
			}
		});
	}	

}
