package me.safewith.services;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.dataAccess.GenericDAO;
import me.safewith.model.PublicKey;
import me.safewith.model.PublicKeyMsg;
import me.safewith.model.ValidUser;
import me.safewith.services.RequestHelper.Command;

import com.google.appengine.api.datastore.Text;
import com.google.gson.GsonBuilder;

@SuppressWarnings("serial")
public class PublicKeyServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(PublicKeyServlet.class.getName());

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		super.doDelete(req, resp);
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		RequestHelper.tryRequest(req, resp, logger, new Command() {
			public void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws IOException {
				
				// read public key by keyId
				String keyId = req.getParameter("keyId");
				PublicKey pk = new GenericDAO().get(PublicKey.class, keyId);
				
				PublicKeyMsg pkMsg = new PublicKeyMsg();
				pkMsg.setKeyId(pk.getKeyId());
				pkMsg.setOwnerEmail(pk.getOwnerEmail());
				pkMsg.setAsciiArmored(pk.getAsciiArmored().getValue());
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
				
				PublicKey pk = new PublicKey();
				pk.setKeyId(pkMsg.getKeyId());
				pk.setOwnerEmail(pkMsg.getOwnerEmail());
				pk.setAsciiArmored(new Text(pkMsg.getAsciiArmored()));
				new GenericDAO().persist(pk);
				
				resp.getWriter().close();
			}
		});
	}

	@Override
	protected void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		super.doPut(req, resp);
	}

}
