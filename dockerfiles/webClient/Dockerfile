FROM node:slim

MAINTAINER Dutisto <dutisto@tutanota.com>


#Install git and create tutanota user

RUN  apt update && \
     apt install -y --no-install-recommends git && \
     useradd -ms /bin/bash tutanota && \
     rm -rf /var/lib/apt/lists/*

WORKDIR /home/tutanota

#Building the project

RUN git clone https://github.com/tutao/tutanota.git tmp && \
    cd tmp && \
    npm install && \
    node build prod && \
    cd .. && \
    mv tmp/build build && \
    mv tmp/server.js tmp/package.json tmp/node_modules . && \
    rm -rf tmp && \
    apt remove --purge -y git && \
    chown -R tutanota:tutanota build

USER tutanota

EXPOSE 9000

CMD ["node", "/home/tutanota/server.js"]
