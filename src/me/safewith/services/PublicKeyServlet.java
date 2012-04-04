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
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.dataAccess.PGPKeyDAO;
import me.safewith.model.PublicKey;
import me.safewith.model.PGPKeyMsg;
import me.safewith.model.ValidUser;
import me.safewith.services.RequestHelper.Command;

import com.google.gson.GsonBuilder;

@SuppressWarnings("serial")
public class PublicKeyServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(PublicKeyServlet.class.getName());

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// delete public key by keyId
				String keyId = req.getParameter("keyId");
				if (keyId == null) {
					resp.sendError(400, "You must specify a keyId.");
					return;
				}
				
				GenericDAO dao = new GenericDAO();
				PublicKey pk = dao.get(PublicKey.class, keyId);
				
				// only users are allowed to delete their own keys
				if (pk.getOwnerEmail().equals(user.getEmail())) {
					dao.delete(PublicKey.class, keyId);
					resp.getWriter().close();
					
				} else {
					resp.sendError(403, "You can only delete your own key!");
				}
			}
		});
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// read public key by keyId
				String email = req.getParameter("email");
				String keyId = req.getParameter("keyId");
				
				PublicKey pk = null;
				if (keyId != null) {
					pk = new GenericDAO().get(PublicKey.class, keyId);
				
				} else if (email != null) {
					pk = PGPKeyDAO.getKeyForUser(PublicKey.class, email);
				
				} else {
					resp.sendError(400, "You must specify either an email address or a keyId.");
					return;
				}
				
				if (pk == null) {
					resp.sendError(404, "Cannot find a public key for the specified email. Perhaps that user hasn't yet looged into the service.");
					return;
				}
				
				PGPKeyMsg pkMsg = PGPKeyDAO.key2dto(pk);
				String json = new GsonBuilder().create().toJson(pkMsg);
				
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
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException, InstantiationException, IllegalAccessException {
				
				// create new publicKey
				String json = RequestHelper.readRequestBody(req);
				PGPKeyMsg pkMsg = new GsonBuilder().create().fromJson(json, PGPKeyMsg.class);
				
				PublicKey pk = PGPKeyDAO.msg2dto(PublicKey.class, pkMsg);
				
				// only users are allowed to create their own keys
				if (!pk.getOwnerEmail().equals(user.getEmail())) {
					resp.sendError(403, "You can only create your own public key!");
					return;
				}
				
				new GenericDAO().persist(pk);
				resp.setStatus(201);
				resp.getWriter().close();
			}
		});
	}

}
