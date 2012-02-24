## PGPbox - an open source document archive with client-side encryption

### In order to run a server locally, you must:
  + Install the Google App Engine SDK:
  + http://code.google.com/intl/en/appengine/downloads.html#Google_App_Engine_SDK_for_Java
  + Build the Java code by opening the project in Eclipse with the Google Plugin installed.
  + Right click on the eclipse project an select "run as Web Application"

### In order to deploy your own version of PGPbox on Google App Engine (You have 5 GBs of free storage per App):
  +  Edit the the App-ID in the App Engine config file:
      war/WEB-INF/appengine-web.xml
      from <application>pgpbox-org</application> e.g. to <application>john-does-pgpbox</application>
  +  Sign up to App Engine and create an Application:
      http://code.google.com/intl/en/appengine/docs/java/gettingstarted/uploading.html
    
### Happy coding :)

