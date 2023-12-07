const fsp = require("fs").promises;
const path = require("path");
const http = require("http");

const port = 3000;
const hostname = "127.0.0.1";
let finalPath;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/navForward")) {
      const url = req.url.split("+")[1].replace(/%20/g, " ");
      finalPath = url === "C:/" ? "C:\\" : path.join(finalPath, url);

      if (url.match(/\..+/)) {
        const data = await fsp.readFile(finalPath, "utf-8");
        console.log('data', data)
        const renderedHTML = renderHTML([data]);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderedHTML);
        return;
      }

      const filesAndFolders = await getFilesAndFolders(finalPath);
      const renderedHTML = renderHTML(filesAndFolders);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } else if (req.method === "GET" && req.url === "/navBackward") {
      if (finalPath === "C:\\") return;
      finalPath = finalPath.replace(/(\\[^\\]+)$/, "");
      if (finalPath === "C:") finalPath = "C:\\";
      const filesAndFolders = await getFilesAndFolders(finalPath);
      const renderedHTML = renderHTML(filesAndFolders);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } 
    else if (req.method === 'GET' && req.url === '/getPath') {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(finalPath)
    }
    else {
      const urlPath =
        req.url === "/" ? "./public/index.html" : `./public/${req.url}`;
      const extname = String(path.extname(urlPath)).toLowerCase();
      const contentType =
        {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "text/javascript",
        }[extname] || "application/octet-stream";
      res.statusCode = 200;
      const data = await fsp.readFile(path.join(__dirname, urlPath));
      res.setHeader("Content-Type", contentType);
      res.end(data, "utf-8");
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

async function getFilesAndFolders(path) {
  console.log(path);
  const items = await fsp.readdir(path, { withFileTypes: true });
  return items.map((item) => ({
    name: item.name,
    isDirectory: item.isDirectory(),
  }));
}

function renderHTML(list) {
  return `
  <div id='current-folder'>${list
    .map(
      (item) => `
  <div class='items'>${
    item.isDirectory ? `<strong>${item.name}</strong>` : item.name
  }</div>`
    )
    .join("")}
  </div>
  `;
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
