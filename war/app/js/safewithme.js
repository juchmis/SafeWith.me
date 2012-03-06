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

'use strict';

/**
 * SafeWith.me uses the model-view-presenter (MVP) pattern to seperate 'view'
 * (DOM manipulation) logic from 'presenter' (business) logic. Dependency
 * injection is used to keep presenters decoupled and testable. The
 * 'model' is implemented using a json filesystem called 'BucketFS', which is
 * encrypted before being persisted on the server. This way the server has
 * no knowledge of file meta-data such as filenames.
 */
function SafeWithMe() {

	// init presenters
	var crypto = new Crypto();
	var server = new Server();
	var menu = new Menu();
	var fs = new FS(crypto, server);

	// init views
	var menuView = new MenuView();
	menuView.presenter = menu;
	menuView.init('/', function(loginInfo) {
		
		// check if user is logged in
		if (!loginInfo.loggedIn || !loginInfo.email) {
			return;
		}

		// init crypto for logged in user
		crypto.init(loginInfo, server, function() {

			// init fs view after menu/login
			var fsView = new FSView();
			fsView.presenter = fs;
			fsView.init();

		}, function() {
			// show disclaimer
			$('#disclaimerModal').modal('show');
		}, function() {
			var msg = '<h1 class="alert alert-success">Completed!</h1>';
			$('#disclaimerModal [class="modal-body"]').html(msg);
		});
	});

}

/**
 * Init on document ready
 */
$(function() {
	var safeWithMe = new SafeWithMe();
});