# FROM node:20-alpine
# ENV NODE_ENV $NODE_ENV
# WORKDIR /app
# COPY package.json /app
# RUN apk add g++ make py3-pip
# COPY package-lock.json /app/package-lock.json
# RUN npm install
# RUN npm install typescript -g
# COPY . /app
# CMD ["npm","start"]



FROM oven/bun:latest AS base
FROM base AS install

ENV NODE_ENV $NODE_ENV
RUN mkdir -p /logs
RUN chmod u+rwx /logs

RUN mkdir -p /public
RUN chmod u+rwx /public
# USER node
WORKDIR /app
COPY package.json /app

COPY package-lock.json /app/package-lock.json

COPY . /app

USER bun

CMD ["bun","run","./server.ts"]