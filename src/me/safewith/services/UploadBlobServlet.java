/*
 * SafeWith.me - store and share your files with OpenPGP encryption on any device via HTML5
 *
 * Copyright (c) 2012 Tankred Hase
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

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


import com.google.appengine.api.blobstore.BlobInfo;
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
				
				// check MD5 hash
				String uploadMd5 = req.getParameter("md5");
				if (uploadMd5 == null) {
					resp.sendError(400, "No MD5 sum specified!");
					return;
				}
				
//				// deduplicate by sending blob-key of MD5 match
//				Iterator<BlobInfo> itInfo = new BlobInfoFactory().queryBlobInfos();
//				while(itInfo.hasNext()) {
//					BlobInfo info = itInfo.next();
//					if (info.getMd5Hash().equals(uploadMd5)) {
//						String json = "{ \"blobKey\" : \"" + info.getBlobKey().getKeyString() + "\" }";
//						resp.setContentType("application/json");
//						resp.getWriter().println(json);
//						resp.getWriter().close();
//						return;
//					}
//				}

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
				
				// check MD5 hash
				String uploadMd5 = req.getParameter("md5");
				if (uploadMd5 == null) {
					resp.sendError(400, "No MD5 sum specified!");
					return;
				}
				
				// parse the request for blob data
				@SuppressWarnings("deprecation")
				Map<String, BlobKey> blobs = blobstoreService.getUploadedBlobs(req);
				BlobKey blobKey = blobs.get("file");
				
				if (blobKey == null) {
					resp.sendError(400, "Could not read the uploaded blob!");
					return;
				}
				
				// validate the request's MD5 hash
				BlobInfo info = new BlobInfoFactory().loadBlobInfo(blobKey);
				if (!uploadMd5.equals(info.getMd5Hash())) {
					blobstoreService.delete(blobKey);
					resp.sendError(400, "The specified MD5 hash does not match!");
					return;
				}
				
				// update user's used storage
				long blobSize = info.getSize();
				user.updateUsedStorage(blobSize);
				new GenericDAO().persist(user);
				
				// redirect to serveBlobServlet
				String json = "{ \"blobKey\" : \"" + blobKey.getKeyString() + "\" }";
				resp.setStatus(201);
				resp.setContentType("application/json");
				resp.getWriter().println(json);
				resp.getWriter().close();
			}
		});
	}

}
