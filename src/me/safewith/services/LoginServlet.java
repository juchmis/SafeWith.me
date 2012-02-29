package me.safewith.services;

import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.model.LoginInfo;
import me.safewith.model.PublicKey;
import me.safewith.model.ValidUser;


import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.GsonBuilder;

@SuppressWarnings("serial")
public class LoginServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(LoginServlet.class.getName());

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		
		try {
			UserService userService = UserServiceFactory.getUserService();
			User user = userService.getCurrentUser();
			
			resp.setContentType("application/json");
			String requestUri = req.getParameter("requestUri");
			LoginInfo info = new LoginInfo();
	
			// check if a user is logged in
			if (user != null) {
				// a user is logged in
				info.setLoggedIn(true);
				info.setEmail(user.getEmail());
				
				// don't send to user back to /app/ if logout is done somewhere else than the app
				if (requestUri.contains("/app/")) {
					requestUri = requestUri.replace("/app/", "/");
				}
				info.setLogoutUrl(userService.createLogoutURL(requestUri));
				
				// set user's PGP public keyId if he already has a Key
				List<PublicKey> pkList = new GenericDAO().filterBy(PublicKey.class, "ownerEmail", user.getEmail());
				if (pkList.size() > 0) {
					info.setPublicKeyId(pkList.get(0).getKeyId());
				}
				
			} else {
				// no user is logged in
				info.setLoggedIn(false);
				info.setLoginUrl(userService.createLoginURL(requestUri));
			}
			
			String json = new GsonBuilder().create().toJson(info);
			resp.getWriter().println(json);
			resp.getWriter().close();
			
		}  catch (Exception e) {
			// write to log			
			logger.log(Level.SEVERE, e.getMessage(), e);
			resp.sendError(500);
		}
		
	}
	
	public static ValidUser getCurrentUser() {

		UserService userService = UserServiceFactory.getUserService();
		User user = userService.getCurrentUser();
		
		// check if any user is logged in at all
		if (user == null)
			return null;
		
		ValidUser validUser = new GenericDAO().get(ValidUser.class, user.getEmail());
		
		// check if the user exists yet and if not create him
		if (validUser == null) {
			initUser(user.getEmail());
			validUser = new GenericDAO().get(ValidUser.class, user.getEmail());
		}
		
		return validUser;
	}
	
	private static void initUser(String email) {
		ValidUser user = new ValidUser();
		user.setEmail(email);
		user.setAllowedStorage(100*1024*1024); // 100 MB
		new GenericDAO().persist(user);
	}

}
