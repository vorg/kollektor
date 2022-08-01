// server.js
//
// This is the kollektor server responsible for
// - scanning given directory for existing files and their metadata
// - maintain in memory database of all files in the collection
// - serving client files for browsing your collection via web interface
// - exposing a REST API for retrieving and modifying the collection
// - watching that directory for file changes due to adding files manuall or API uploads
//
// What it doesn't do
// - sync files across multiple kollektor instances.
//   That's currently handles by 3rd party e.g. Dropbox

const debug = require("debug");
debug.enable("kollektor:*");

const commander = require("commander");
const pacakge = require("./package.json");
const bodyParser = require("body-parser");
const express = require("express");
const scanDir = require("./lib/scan-dir");
const path = require("path");
const url = require("url");
const browserify = require("browserify");
const fs = require("fs");
const generateThumbnail = require("./lib/generate-thumbnail");
const jimp = require("jimp");
const subdir = require("subdir");
const R = require("ramda");
const mkdirp = require("mkdirp");
const crypto = require("crypto");

// Initialize logger
const log = debug("kollektor:server");

const THUMB_WIDTH = 600;

// ## Command line options
//
// Server is a command line app so lets define it's interface

// We support only two options:
// - the port at which we want to run (defaults to 3000)
// - collection's directory
// Todo:
// - [ ] create folder if it doesn't exist
// - [ ] find next available port if 3000 is taken
commander
  .version(pacakge.version)
  .usage("[options] <dir>")
  .option("-p, --port [value]", "Server port")
  .parse(process.argv);

const port = commander.port || 3033;
let dir = commander.args[0];

if (!dir) {
  commander.help();
  process.exit(-1);
}

dir = path.resolve(__dirname, dir);

const cacheDir = path.resolve(__dirname, "cache");
if (!fs.existsSync(cacheDir)) {
  mkdirp.sync(cacheDir);
}

// ## Init/bod

// Scan given folder for all images and their metadata

log(`Scanning "${dir}" for files`);
scanDir(dir, (err, items) => {
  if (err) {
    log("ERROR", err);
    return;
  }
  log(`Scan complete. ${items.length} items found`);

  startServer(items);
});

// ## Server

// Now we start a web server responsible for handline API requests and serving the web interface

function getImageSize(file, ext, cb) {
  jimp.read(file, function (err, img) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, {
        width: img.bitmap.width,
        height: img.bitmap.height,
      });
    }
  });
}

function startServer(items) {
  var app = express();

  app.use(bodyParser.json());

  // Serve root path / from public folder with static assets (html, css)
  app.use(express.static(path.resolve(__dirname, "public")));

  app.get("/tag/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public/index.html"));
  });

  // Client web interface code is bundled on the fly. This probably shouldn't go into production.
  app.get("/client.bundle.js", (req, res) => {
    var b = browserify();
    b.add(path.resolve(__dirname, "client.js"));
    b.bundle((err, buf) => {
      if (err) {
        log("Client bundle error", err);
        res.end();
      } else {
        res.send(buf);
      }
    });
  });
  app.get("/api/get/tag/:tags", (req, res) => {
    const tags = req.params.tags.split("+");
    const taggedItems = items.filter((item) => {
      let hasTags = 0;
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        if (item.tags.indexOf(tag) !== -1) {
          hasTags++;
        }
      }
      return hasTags === tags.length;
    });
    res.send(JSON.stringify(taggedItems));
  });

  // API for getting all items currently in the db
  app.get("/api/get/items", (req, res) => {
    res.send(JSON.stringify(items));
  });

  function getOrCreate(req, res, basePath, ext, type, createCallback) {
    var file = path.relative(basePath, url.parse(req.path).pathname);
    file = unescape(file);
    var filePath = path.normalize(dir + "/" + file) + ext;
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (!err) {
        res.type(type);
        res.sendFile(filePath);
      } else if (createCallback) {
        createCallback(file, filePath, (err, data) => {
          if (err) log(err);
          try {
            fs.writeFileSync(filePath, data);
          } catch (e) {
            log("Write failed for", filePath, e);
          }
          res.type(type);
          res.sendFile(filePath);
        });
      } else {
        log("ERROR", "Not found");
        res.end();
      }
    });
  }
  app.get("/api/get/image/*", (req, res) => {
    const basePath = "/api/get/image";
    const file = decodeURIComponent(
      path.resolve(dir, path.relative(basePath, req.path))
    );
    res.sendFile(file);
  });

  app.get("/api/get/thumb/*", (req, res) => {
    const basePath = "/api/get/thumb";
    const file = decodeURIComponent(
      path.resolve(dir, path.relative(basePath, req.path))
    );

    fs.stat(file, (err, stat) => {
      if (err) {
        log("Thumbnail error: " + err.message);
        res.end();
        return;
      }
      const hash = crypto
        .createHash("md5")
        .update(path.basename(file) + stat.size)
        .digest("hex");
      const cachedFile = path.resolve(cacheDir, hash + ".jpg");
      if (!fs.existsSync(cachedFile)) {
        generateThumbnail(file, cachedFile, THUMB_WIDTH, (err, done) => {
          log("done generating thumbnail", err, done);
          res.sendFile(cachedFile);
        });
      } else {
        res.sendFile(cachedFile);
      }
    });
  });

  // Serve individual image info from the given path
  app.get("/api/get/info/*", (req, res) => {
    getOrCreate(
      req,
      res,
      "/api/get/info",
      ".json",
      "json",
      (file, filePath, cb) => {
        var ext = path.extname(file);
        var basename = path.basename(file, ext);
        let item = {
          path: file,
          // fullPath: path.resolve(file),
          // file: file,
          // filePath: filePath,
          added: new Date().toISOString(),
          title: basename,
          referer: "",
          original: "",
          cached: basename + ext,
          ratio: 1.8768328445747802,
          tags: [],
        };
        getImageSize(file, ext, (err, size) => {
          if (err) log(file, err);
          if (size) {
            item.ratio = size.width / size.height;
          }
          var str = JSON.stringify(item);
          cb(null, str);
        });
      }
    );
  });

  app.post("/api/move/image", (req, res) => {
    var data = req.body;
    log(`move '${data.from}' -> '${data.to}'`);
    const targetDir = path.resolve(dir, path.dirname(data.to));
    if (!subdir(dir, data.from) || !subdir(dir, data.to)) {
      console.log("path is invalid", data.to, targetDir);
      res.send({ error: "invalid path" });
      return res.end();
    }

    if (!fs.existsSync(targetDir)) {
      console.log("path doesn't exist", targetDir);
      mkdirp.sync(targetDir);
    }

    if (data.from === data.to) {
      res.send({
        status: "ok",
        message: `nothing to move '${data.from}' = '${data.to}'`,
      });
      return res.end();
    }

    if (R.find(R.propEq("path", data.to), items)) {
      var dot = data.to.lastIndexOf(".");
      if (dot !== -1) {
        data.to =
          data.to.substr(0, dot) + `_${Date.now()}` + data.to.substr(dot);
      } else {
        data.to += `_${Date.now()}`;
      }
    }

    try {
      const item = R.find(R.propEq("path", data.from), items);
      console.log("updating item", item);
      item.path = data.to;
      console.log("updating item", item);
      fs.rename(
        path.resolve(dir, data.from),
        path.resolve(dir, data.to),
        (err) => {
          console.log("done", err);
          if (err) res.send({ error: "move failed " + err });
          else
            res.send({
              status: "ok",
              message: `moved '${data.from}' to '${data.to}'`,
            });
          res.end();
        }
      );
    } catch (e) {
      res.send({ error: "move failed " + e.message });
      return res.end();
    }
  });

  // Start the server on a given port
  app.listen(port, () => {
    log(`Starting on port http://localhost:${port}`);
  });
}
