#!/bin/bash

while getopts b:k:a: option
    do
        case "${option}" in
                a)
                    ALIAS=${OPTARG}
                    ;;

                b)
                    BUILD=${OPTARG}
                    ;;

                k)
                    KEY=${OPTARG}
                    ;;
                *)
                    echo $"Wrong build: $0 -b {debugDist|release|debug}"
                    exit 1
        esac
    done

case "$BUILD" in
        debugDist)
            APKPATH=app/build/outputs/apk/debugDist/app-debugDist.apk
            ;;

        release)
            APKPATH=app/build/outputs/apk/release/app-release-unsigned.apk
            ;;

        debug)
            APKPATH=app/build/outputs/apk/debug/app-debug.apk
            ;;
        *)
            echo $"Wrong build: -b {debugDist|release|debug}"
            exit 1

esac

echo -e "Starting $BUILD build...\n"

cd app/app-android/

gradle assemble$BUILD || { echo "Gradle build failed :/"; exit 1; }

if [[ "$BUILD" == "release" ]]; then

    if [[ -n "$KEY" ]]; then #Check if a key was provided
        if [[ -n "$ALIAS" ]]; then #Check if the key alias was provided

            echo "Running keytool..."
            keytool -v -importkeystore -destkeystore /root/MyKeystore.jks -deststorepass CHANGEME -srckeystore /keystore/$KEY || { echo "Import failed :/"; exit 1; }

            echo "Running Jarsigner..."
            jarsigner -verbose -keystore /root/MyKeystore.jks -storepass CHANGEME $APKPATH $ALIAS || { echo "Signing failed :/"; exit 1; }
        else
            echo -e "Please precise your key alias using -a myAlias\nExiting..." && exit 1
        fi

    else
        #If no key was provided, signing the apk using the default key
        jarsigner -keystore /root/MyKeystore.jks -storepass CHANGEME $APKPATH dockerKey -storepass CHANGEME -keypass CHANGEME  || { echo "Signing failed :/"; exit 1; }

    fi

    echo "Running zipalign... "
    $ANDROID_HOME/build-tools/27.0.3/zipalign -v 4 $APKPATH /outputs/Tutanota-$BUILD.apk  || { echo "Zipalign failed :/"; exit 1; }

else
    mv $APKPATH /outputs/Tutanota-$BUILD.apk
fi

#APK is built as root, doing this allow your host user to do everything with the APK
chmod 777 /outputs/Tutanota-$BUILD.apk

echo -e "\nAPK building is done :]"
