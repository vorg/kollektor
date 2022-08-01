var recursive = require("recursive-readdir");
const path = require("path");
const fs = require("fs");
const readChunk = require("read-chunk");
const fileType = require("file-type");
const jimp = require("jimp");
const log = require("debug")("kollektor:scan-dir");

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

function addJSON(file, item, items, jsonPath) {
  const buffer = readChunk.sync(file, 0, 262);
  const extInfo = fileType(buffer);
  const ext = extInfo ? extInfo.ext : null;
  if (ext !== "jpg" && ext !== "png" && ext !== "gif") {
    log(`Skipping unsupported ${file}`);
    return;
  }
  getImageSize(file, ext, (err, size) => {
    if (err) {
      log("Skipping", file, err);
      return;
    }
    const w = size.width;
    const h = size.height;
    item.width = w;
    item.height = h;
    item.ratio = w / h;
    items.push(item);
    log(`add ${file} @ ${item.width}x${item.height}`);
    fs.writeFileSync(jsonPath, JSON.stringify(item, null, 2));
  });
}

var exts = [".gif", ".jpg", ".jpeg", ".png"];
// var exts = ['.gif']

function isImage(file) {
  var ext = path.extname(file).toLowerCase();
  return exts.includes(ext);
}

function notHidden(file) {
  var ext = path.extname(file);
  var basename = path.basename(file, ext);
  return basename[0] !== ".";
}

function scanDir(dir, callback) {
  recursive(dir, function (err, files) {
    log(files[0]);
    if (err) {
      callback(err, null);
    } else {
      var items = files
        .filter(isImage)
        .filter(notHidden)
        .map((file) => ({
          path: path.relative(dir, file),
          // fullPath: file,
        }));
      callback(null, items);
    }
  });
}

function scanDirOld(dir, callback) {
  var items = [];
  recursive(dir, function (err, files) {
    if (err) {
      return callback(err, null);
    }
    for (var file of files) {
      var ext = path.extname(file);
      var basename = path.basename(file, ext);
      if (ext === ".json") {
        let item = JSON.parse(fs.readFileSync(file, "utf8"));
        item.path = path.relative(dir, path.dirname(file));
        items.push(item);
      } else if (ext === ".thumb") {
      } else if (ext === "TEMP") {
        // original file
        var jsonPath = file + ".json";
        if (!fs.existsSync(jsonPath)) {
          let item = {
            added: new Date().toISOString(),
            title: basename,
            referer: "",
            original: "",
            cached: basename + ext,
            ratio: 1.8768328445747802,
            tags: [],
          };
          item.path = path.relative(dir, path.dirname(file));
          addJSON(file, item, items, jsonPath);
        }
      }
    }
    callback(null, items);
  });
}

module.exports = scanDir;
