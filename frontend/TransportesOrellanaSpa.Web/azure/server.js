const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'browser');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent(req.url.split('?')[0]);

  let filePath = path.join(root, requestPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const extension = path.extname(filePath).toLowerCase();

      res.writeHead(200, {
        'Content-Type': mimeTypes[extension] || 'application/octet-stream'
      });

      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Angular SPA fallback:
    // cualquier ruta que no sea un archivo físico
    // devuelve index.html.
    const indexPath = path.join(root, 'index.html');

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });

    fs.createReadStream(indexPath).pipe(res);
  });
});

const port = process.env.PORT || 8080;

server.listen(port, '0.0.0.0', () => {
  console.log(`TransportesOrellanaSpa.Web escuchando en el puerto ${port}`);
});