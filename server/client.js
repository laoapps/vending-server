#!/usr/bin/env node
'use strict';

const port = 51223;
const hostname = 'laoapps.com';

const tls = require('tls');
const fs = require('fs');



const socket = tls.connect({
    host:hostname,
    port,
    key: fs.readFileSync('certs/client/client.key'),
    cert: fs.readFileSync('certs/client/client.crt'),
    // Necessary only if the server uses the self-signed certificate
    ca: fs.readFileSync('certs/ca/ca.crt')
}, () => {
  console.log('client connected', socket.authorized ? 'authorized' : 'unauthorized');
  if (!socket.authorized) {
    console.log("Error: ", socket.authorizationError());
    socket.end();
  }
})
  .setEncoding('utf8')
  .on('data', (data) => {
    console.log("Received: ", data);

    // Close after receive data
    socket.end();
  })
  .on('close', () => {
    console.log("Connection closed");
  })
  .on('end', () => {
    console.log("End connection");
  })
  .on('error', (error) => {
    console.error(error);
    socket.destroy();
  });