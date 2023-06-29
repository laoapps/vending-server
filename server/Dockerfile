
FROM node:18
ENV NODE_ENV $NODE_ENV
WORKDIR /app
COPY package.json /app

COPY package-lock.json /app/package-lock.json
RUN npm install
RUN npm install typescript -g
COPY . /app
COPY *.pem /app/dist
CMD ["npm","start"]