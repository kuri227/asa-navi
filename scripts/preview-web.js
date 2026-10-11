// Local-only preview of the Expo export with SQLite's required HTTP headers.
const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const { extname, resolve, sep } = require("node:path");

const root = resolve(__dirname, "../dist");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};

const server = createServer(async (request, response) => {
  response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const file = await stat(path).catch(() => null);
    if (!file?.isFile()) {
      if (extname(pathname)) {
        response.writeHead(404).end();
        return;
      }
      path = resolve(root, "index.html");
    }
    const body = await readFile(path);
    response.setHeader(
      "Content-Type",
      mimeTypes[extname(path)] ?? "application/octet-stream",
    );
    response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
  } catch {
    response
      .writeHead(400)
      .end("Web export unavailable. Run npm run web:export.");
  }
});

server.listen(8090, "127.0.0.1", () => {
  console.info("朝ナビ Web preview: http://127.0.0.1:8090");
});
