package me.safewith.services;

import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.BucketDAO;
import me.safewith.model.Bucket;
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
				String json = new GsonBuilder().create().toJson(buckets);
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
				String json = new GsonBuilder().create().toJson(bucket);
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
				Bucket bucket = new GsonBuilder().create().fromJson(bucketJson, Bucket.class);
				Bucket updated = new BucketDAO().updateBucket(bucket, user.getEmail());
				String json = new GsonBuilder().create().toJson(updated);
				
				resp.setContentType("application/json");
				resp.getWriter().print(json);
				resp.getWriter().close();
			}
		});
	}

}
