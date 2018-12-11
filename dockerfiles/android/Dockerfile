FROM node:8 as builder

MAINTAINER Dutisto <dutisto@tutanota.com>

WORKDIR /root

#Building the dependencies

RUN git clone https://github.com/tutao/tutanota.git tmp && \
    cd tmp && \
    npm install && \
    node dist prod

FROM thedrhax/android-sdk

USER root

ADD ./docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh && \
    keytool -genkey -noprompt -keystore /root/MyKeystore.jks -alias dockerKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=docker.tutanota.com, OU=ID, O=IBM, L=Hursley, S=Hants, C=GER"

WORKDIR /home/user/

COPY --from=builder /root/tmp app

ENTRYPOINT ["/docker-entrypoint.sh"]
