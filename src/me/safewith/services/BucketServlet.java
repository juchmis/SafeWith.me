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

package me.safewith.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.BucketDAO;
import me.safewith.model.Bucket;
import me.safewith.model.BucketMsg;
import me.safewith.model.ValidUser;
import me.safewith.services.RequestHelper.Command;


import com.google.gson.GsonBuilder;

@SuppressWarnings("serial")
public class BucketServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(BucketServlet.class.getName());

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// delete the user's bucket
				String bucketId = req.getParameter("bucketId");
				new BucketDAO().deleteBucket(bucketId, user.getEmail());
				resp.getWriter().close();
			}
		});
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// read user buckets and respond in json form
				List<Bucket> buckets = new BucketDAO().listUserBuckets(user.getEmail());
				
				// convert DTO to MSG objects
				List<BucketMsg> bucketMsgs = new ArrayList<BucketMsg>();
				for (Bucket b : buckets) {
					bucketMsgs.add(BucketDAO.dto2msg(b));
				}
				
				String json = new GsonBuilder().create().toJson(bucketMsgs);
				resp.setContentType("application/json");
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
				
				// create new bucket
				Bucket bucket = new BucketDAO().createBucket(user.getEmail());
				BucketMsg msg = BucketDAO.dto2msg(bucket);
				
				String json = new GsonBuilder().create().toJson(msg);
				resp.setStatus(201);
				resp.setContentType("application/json");
				resp.getWriter().print(json);
				resp.getWriter().close();
			}
		});
	}

	@Override
	protected void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				// read json from request body
				String bucketJson = RequestHelper.readRequestBody(req);
				
				// update bucket
				BucketMsg bucketMsg = new GsonBuilder().create().fromJson(bucketJson, BucketMsg.class);
				Bucket bucket = BucketDAO.msg2dto(bucketMsg);
				
				Bucket updated = new BucketDAO().updateBucket(bucket, user.getEmail());
				BucketMsg updatedMsg = BucketDAO.dto2msg(updated);
				String json = new GsonBuilder().create().toJson(updatedMsg);
				
				resp.setContentType("application/json");
				resp.getWriter().print(json);
				resp.getWriter().close();
			}
		});
	}

}
