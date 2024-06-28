FROM node:20-alpine
ENV NODE_ENV $NODE_ENV
WORKDIR /app
COPY package.json /app
RUN apk add g++ make py3-pip
COPY package-lock.json /app/package-lock.json
RUN npm install
RUN npm install typescript -g
COPY . /app
CMD ["npm","start"]