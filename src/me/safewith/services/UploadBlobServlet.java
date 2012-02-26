package me.safewith.services;

import java.io.IOException;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.model.ValidUser;
import me.safewith.services.RequestHelper.Command;


import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;


@SuppressWarnings("serial")
public class UploadBlobServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(UploadBlobServlet.class.getName());
	private BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {

				// build upload url for the upload form
				String uploadUrl = blobstoreService.createUploadUrl("/app/uploadBlob");
				
				resp.setContentType("application/json");
				String json = "{ \"uploadUrl\" : \"" + uploadUrl + "\" }";
				resp.getWriter().print(json);
				resp.getWriter().close();
			}
		});
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {				

				long requiredUserStorage = req.getContentLength() + user.getUsedStorage();
				if (requiredUserStorage >= user.getAllowedStorage()) {
					resp.sendError(403, "Sorry, your account does not have enough free storage.");
					return;
				}
				
				// parse the request for blob data
				@SuppressWarnings("deprecation")
				Map<String, BlobKey> blobs = blobstoreService.getUploadedBlobs(req);
				BlobKey blobKey = blobs.get("file");
				
				// update user's used storage
				long blobSize = new BlobInfoFactory().loadBlobInfo(blobKey).getSize();
				user.updateUsedStorage(blobSize);
				new GenericDAO().persist(user);
				
				// redirect to serveBlobServlet
				if (blobKey == null) {
					resp.sendError(500, "Invalid or no blob-key specified!");
				} else {
					String json = "{ \"uri\" : \"/app/blobs?blob-key=" + blobKey.getKeyString() + "\" }";
					resp.setStatus(201);
					resp.setContentType("application/json");
					resp.getWriter().println(json);
					resp.getWriter().close();
				}	
			}
		});
	}

}
