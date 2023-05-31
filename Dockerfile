FROM ubuntu:20.04

# Install necessary packages
RUN apt-get update \
    && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs

WORKDIR /usr/src/webproxy

COPY package*.json ./
RUN npm install

COPY . /usr/src/webproxy

EXPOSE 3000

CMD [ "node", "index.js" ]