const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 5000;

function proxyRequest(targetUrl, req, res) {
  const parsedUrl = new url.URL(targetUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + (parsedUrl.search || ''),
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Referer': 'https://www.google.com/'
    }
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      return proxyRequest(proxyRes.headers.location, req, res);
    }
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message, 'URL:', targetUrl);
    res.status(502).send('Proxy error: ' + err.message);
  });

  proxyReq.end();
}

app.use('/logos/', (req, res) => {
  const targetUrl = `https://www.google.com/logos${req.path}`;
  proxyRequest(targetUrl, req, res);
});

app.use('/doodles/', (req, res) => {
  const targetUrl = `https://www.google.com/doodles${req.path}`;
  proxyRequest(targetUrl, req, res);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Half Moon Doodle server running on port ${PORT}`);
});
