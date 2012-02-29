package me.safewith.model;

public class LoginInfo {
	
	private boolean loggedIn;
	private String email;
	private String publicKeyId;
	private String logoutUrl;
	private String loginUrl;
	
	public boolean isLoggedIn() {
		return loggedIn;
	}
	public void setLoggedIn(boolean loggedIn) {
		this.loggedIn = loggedIn;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPublicKeyId() {
		return publicKeyId;
	}
	public void setPublicKeyId(String publicKeyId) {
		this.publicKeyId = publicKeyId;
	}
	public String getLogoutUrl() {
		return logoutUrl;
	}
	public void setLogoutUrl(String logoutUrl) {
		this.logoutUrl = logoutUrl;
	}
	public String getLoginUrl() {
		return loginUrl;
	}
	public void setLoginUrl(String loginUrl) {
		this.loginUrl = loginUrl;
	}

}
