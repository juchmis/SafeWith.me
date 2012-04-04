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
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.dataAccess.PGPKeyDAO;
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
				PublicKey pk = PGPKeyDAO.getKeyForUser(PublicKey.class, user.getEmail());
				if (pk != null) {
					info.setPublicKeyId(pk.getKeyId());
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
			resp.sendError(500, e.getMessage());
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
