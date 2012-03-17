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
