FROM oven/bun:latest AS base
FROM base AS install

ENV NODE_ENV $NODE_ENV
RUN mkdir -p /logs
RUN chmod u+rwx /logs

RUN mkdir -p /public
RUN chmod u+rwx /public
WORKDIR /app
COPY package.json /app

COPY package-lock.json /app/package-lock.json

COPY . /app

USER bun

CMD ["bun","run","./server.ts"]