<h1 align="center">
<br>
  <img src="resources/images/logo-red.svg" alt="Tutanota logo" width="300">
  <br>
    <br>
  Tutanota makes encryption easy
  <br>
</h1>

Tutanota is the [secure email](https://tutanota.com) service with built-in end-to-end encryption that enables you to communicate securely with anyone.

* Issue and feature tracker: https://github.com/tutao/tutanota/issues (legacy tracker: https://tutanota.uservoice.com/forums/237921-general)

<a href="https://play.google.com/store/apps/details?id=de.tutao.tutanota"><img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png" height="75"></a><a href="https://f-droid.org/packages/de.tutao.tutanota/"><img src="https://f-droid.org/badge/get-it-on.png" height="75"></a>

## Building and running your own Tutanota (new beta) web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on 
your own. If you prefer the auto-update feature, you can use the official [mail](https://mail.tutanota.com) client.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the repository directory: `cd tutanota`
3. Do `npm install`
4. Build the web part: `node dist prod`
5. Switch into the build directory: `cd build/dist`
6. Run local server. Either use `node server` or `python -m SimpleHTTPServer 9000`.
7. Open the `` with your favorite browser (tested: Firefox, Chrome/Chromium, Safari).

## Building and running your own Tutanota (new beta) Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically.
If you prefer the auto-update feature, use the Google Play Store or F-Droid in the future.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed
* An up-to-date version of the Android SDK is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the Tutanota directory: `cd tutanota`
3. Install dependencies: `npm install`
4. Build the web part: `node dist prod`
5. Switch to the Android folder: `cd app-android`
6. Create a keystore if you don't have one: `keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"`
7. Build the Android app: `./gradlew assembleRelease`
8. Sign the app: `jarsigner -verbose -keystore MyKeystore.jks -storepass CHANGEME app/build/outputs/apk/release/app-release-unsigned.apk tutaKey`
9. Install the app on your device: `adb install -r app/build/outputs/apk/release/app-release-unsigned.apk`


## Docker Support

### Web client on Docker

1. You just need the Dockerfile in `dockerfiles/webClient`
2. Build the image running `docker build -t tutanota:web .`
3. Start a container using `docker run --rm -p 9000:9000 --hostname localhost --name tutanota tutanota:web`
4. Visit `http://localhost:9000`

### Android APK on Docker

1. You need the files in `dockerfiles/android`
2. Build the image running `docker build -t tutanota:android`
3. Start a container using `docker run --rm -v $(pwd):/outputs tutanota:android -b release`
4. After the container has finished the building, you will find `Tutanota-release.apk` in your current directory
5. The APK have root ownership, you can change it by running `sudo chown $USER:$USER Tutanota-release.apk `
6. Install the APK with `ADB` or by copying it to your device  

7. You got the possibility to use your own key for signing the APK. In order to do it, `docker run --rm -it -v myKeyFolder:/keystore -v $(pwd):/outputs tutanota:android -b release -k myKey.jks -a myKeyAlias`
8. You can also build debug or debugDist build by running `docker run --rm -v $(pwd):/outputs tutanota:android -b debug|debugDist`
 
