
FROM node:20
ENV NODE_ENV $NODE_ENV
WORKDIR /app
COPY package.json /app
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && npm install \
    && apk del .gyp
COPY package-lock.json /app/package-lock.json
RUN npm install
RUN npm install typescript -g
COPY . /app
CMD ["npm","start"]