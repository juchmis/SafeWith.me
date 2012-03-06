package me.safewith.services;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.dataAccess.PublicKeyDAO;
import me.safewith.model.PublicKey;
import me.safewith.model.PublicKeyMsg;
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
					pk = PublicKeyDAO.getKeyForUser(email);
				
				} else {
					resp.sendError(400, "You must specify either an email address or a keyId.");
					return;
				}
				
				if (pk == null) {
					resp.sendError(404, "Cannot find a public key for the specified email. Perhaps that user hasn't yet looged into the service.");
					return;
				}
				
				PublicKeyMsg pkMsg = PublicKeyDAO.key2dto(pk);
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
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// create new publicKey
				String json = RequestHelper.readRequestBody(req);
				PublicKeyMsg pkMsg = new GsonBuilder().create().fromJson(json, PublicKeyMsg.class);
				
				PublicKey pk = PublicKeyDAO.msg2dto(pkMsg);
				new GenericDAO().persist(pk);
				
				resp.getWriter().close();
			}
		});
	}

}
