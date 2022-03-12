FROM node:12-buster-slim

WORKDIR /opt/oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient
ADD *.js ./
ADD *.json ./
ADD *.zip ./

RUN apt-get update && \
    apt-get install -y libaio1 unzip wget
RUN unzip instantclient.zip && \
    rm -f instantclient.zip && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig
RUN npm i
CMD ["node", "index.js"]