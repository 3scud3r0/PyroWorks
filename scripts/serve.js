import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };

createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const relative = normalize(pathname === "/" ? "index.html" : pathname.slice(1));
  const file = join(root, relative);
  if (!file.startsWith(root)) return response.writeHead(403).end("Forbidden");
  try {
    if (!statSync(file).isFile()) throw new Error("not a file");
    response.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8` });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`PyroWorks running at http://localhost:${port}`));
