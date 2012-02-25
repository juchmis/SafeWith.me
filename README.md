## PGPbox - an open source document archive with client-side encryption
http://pgpbox.org

PGPbox lets your store and share your files using OpenPGP encryption. The client is written completely in JavaScript and HTML5, so you can access files from any device.

### In order to run a server locally, you must:
    1. Install the Google App Engine SDK: http://code.google.com/intl/en/appengine/downloads.html#Google_App_Engine_SDK_for_Java
    2. Build the Java code by opening the project in Eclipse with the Google Plugin installed.
    3. Right click on the eclipse project and select "Run as Web Application"

### In order to deploy your own version of PGPbox on Google App Engine (You have 5 GBs of free storage per App):
    1. Edit the the App-ID in the App Engine config file: war/WEB-INF/appengine-web.xml from 'pgpbox-org' e.g. to 'john-does-pgpbox'
    2. Sign up to App Engine and create an Application: http://code.google.com/intl/en/appengine/docs/java/gettingstarted/uploading.html
    
### Happy coding :)

