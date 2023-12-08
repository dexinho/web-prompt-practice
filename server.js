const fsp = require("fs").promises;
const fs = require("fs");
const path = require("path");
const http = require("http");

const port = 3000;
const hostname = "127.0.0.1";
let currentPath;
let isReadingFile = false;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/navForward")) {
      const url = req.url.split("=")[1].replace(/%20/g, " ");
      currentPath = url === "C:/" ? "C:\\" : path.join(currentPath, url);

      const filesAndDirs = await getFilesAndDirs(currentPath);
      const renderedHTML = renderDirHTML(filesAndDirs);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } else if (req.method === "GET" && req.url === "/navBackward") {
      if (currentPath === "C:\\") return;

      if (!isReadingFile) {
        currentPath = currentPath.replace(/(\\[^\\]+)$/, "");
        currentPath = currentPath.replace(/(\/[^\/]+)$/, "");
      }

      isReadingFile = false;
      if (currentPath === "C:") currentPath = "C:\\";

      const filesAndDirs = await getFilesAndDirs(currentPath);
      const renderedHTML = renderDirHTML(filesAndDirs);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } else if (req.method === "GET" && req.url === "/getPath") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(currentPath);
    } else if (req.method === "GET" && req.url.startsWith("/enterPath")) {
      const url = req.url.split("=")[1];
      currentPath = url;

      if (await isValidPath(url)) {
        const filesAndDirs = await getFilesAndDirs(currentPath);
        const renderedHTML = renderDirHTML(filesAndDirs);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderedHTML);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("It's not valid path!");
        return;
      }
    } else if (req.method === "GET" && req.url.startsWith("/removeItem")) {
      const itemToRemove = req.url.split("=")[1];
      await fsp.unlink(path.join(currentPath, itemToRemove));
      const filesAndDirs = await getFilesAndDirs(currentPath);
      const renderedHTML = renderDirHTML(filesAndDirs);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } else if (req.method === "GET" && req.url.startsWith("/getIcons")) {
      const icon = req.url.split("?")[1];

      const stream = fs.createReadStream(`./assets/icons/${icon}`);
      res.writeHead(200, { "Content-Type": "image/*" });
      stream.pipe(res);
    } else if (req.method === "GET" && req.url.startsWith("/createItem")) {
      const itemName = req.url.split("=")[1];
      await fsp.writeFile(path.join(currentPath, itemName), "");

      const filesAndDirs = await getFilesAndDirs(currentPath);
      const renderedHTML = renderDirHTML(filesAndDirs);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
    } else if (req.method === "GET" && req.url.startsWith("/readFile")) {
      const fileName = req.url.split("=")[1];

      const readFile = await fsp.readFile(
        path.join(currentPath, fileName),
        "utf-8"
      );

      isReadingFile = true;

      const renderedHTML = renderFileHTML(readFile);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(renderedHTML);
      return;
    } else {
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

async function isValidPath(path) {
  try {
    await fsp.access(path);
    return true;
  } catch (err) {
    return false;
  }
}

async function getFilesAndDirs(path) {
  const items = await fsp.readdir(path, { withFileTypes: true });
  return items.map((item) => ({
    name: item.name,
    isDirectory: item.isDirectory(),
  }));
}

function renderDirHTML(list) {
  return `
  ${list
    .map(
      (item) => `
      <div class='item-slot'>
      <img class='item-icons ${item.isDirectory ? "dir" : "file"}' alt='icon'>
  <div class='items ${item.isDirectory ? `dir` : "file"}'>${
        item.isDirectory ? `<strong>${item.name}</strong>` : item.name
      }</div>
  <button class='delete-item-btn'>X</button></div>`
    )
    .join("")}
  `;
}

function renderFileHTML(file) {
  return `
  <div id='current-dir'>
    <div>${file}</div>
  </div>
  `;
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
