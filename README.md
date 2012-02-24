# PGPbox - an open source document archive with client-side encryption

### In order to run a server locally, you must:
  +  Install the Google App Engine SDK:
      http://code.google.com/intl/en/appengine/downloads.html#Google_App_Engine_SDK_for_Java
  +  Set the $GAE_SDK variable in run_server.sh accordingly
  +  Execute the shellscript:
      ./run_server.sh

### In order to deploy your own version of PGPbox on Google App Engine (You have 5 GBs of free storage per App):
  +  Edit the the App-ID in the App Engine config file:
      war/WEB-INF/appengine-web.xml
      from <application>pgpbox-org</application> e.g. to <application>john-does-pgpbox</application>
  +  Sign up to App Engine and create an Application:
      http://code.google.com/intl/en/appengine/docs/java/gettingstarted/uploading.html
    
### Happy coding :)

