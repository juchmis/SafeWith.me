package me.safewith.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import me.safewith.model.ValidUser;

public class RequestHelper {

	public interface Command {
		void execute(HttpServletRequest req, HttpServletResponse resp, ValidUser user) throws Exception;
	}
	
	/**
	 * Executes a command by validating the user before and does centralized exception handling
	 */
	public static void tryRequest(HttpServletRequest req, HttpServletResponse resp, Logger logger, Command cmd)
			throws IOException {

		try {
			// check if user is logged in
			ValidUser user = LoginServlet.getCurrentUser();
			if (user == null) {
				resp.sendError(401, "You must login with a valid user account!");
				return;
			}
			
			// execute the command
			cmd.execute(req, resp, user);

		} catch (Exception e) {
			// write to log			
			logger.log(Level.SEVERE, e.getMessage(), e);
			resp.sendError(500, e.getMessage());
		}
	}
	
	/**
	 * Reads text from an http request body and returns it as a string
	 */
	public static String readRequestBody(HttpServletRequest req) throws IOException {
		BufferedReader reader = req.getReader();
		StringBuilder sb = new StringBuilder();
		String line = reader.readLine();
		while(line != null) {
			sb.append(line);
			line = reader.readLine();
		}
		reader.close();
		String body = sb.toString();
		
		return body;		
	}

}
