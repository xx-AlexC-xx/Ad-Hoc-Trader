// server/ws-proxy.js
// Node + Express + ws
// Usage: node server/ws-proxy.js
// Ensure you set ALPACA_KEY_ID and ALPACA_SECRET_KEY env vars on the server.

const express = require('express');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');
const http = require('http');

const ALPACA_WS = process.env.ALPACA_WS || 'wss://stream.data.alpaca.markets/v2/sip';
const ALPACA_KEY = process.env.ALPACA_KEY_ID;
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY;
if (!ALPACA_KEY || !ALPACA_SECRET) {
  console.error('Missing ALPACA_KEY_ID / ALPACA_SECRET_KEY env vars');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (clientSocket) => {
  console.log('client connected to proxy');

  // For each browser client, open (or reuse) a connection to Alpaca and forward messages.
  // For simplicity we create a dedicated Alpaca WS per client here.
  const upstream = new WebSocket(ALPACA_WS);

  upstream.on('open', () => {
    upstream.send(JSON.stringify({ action: 'auth', key: ALPACA_KEY, secret: ALPACA_SECRET }));
  });

  upstream.on('message', (data) => {
    // directly forward to client
    try { clientSocket.send(data); } catch (e) {}
  });

  clientSocket.on('message', (msg) => {
    // allow client to send subscription messages which we forward upstream
    try { upstream.send(msg); } catch (e) {}
  });

  clientSocket.on('close', () => { try { upstream.close(); } catch {} });

  upstream.on('close', () => {
    try { clientSocket.close(); } catch {}
  });

  upstream.on('error', (err) => {
    console.error('Upstream error', err);
    try { clientSocket.send(JSON.stringify({ type: 'error', message: 'Upstream error' })); } catch {}
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`WS proxy listening on :${port}/ws`));
