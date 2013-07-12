var util = require("util");
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require('path');
var gm = require("gm");

var THUMB_WIDTH = 300;

String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

exports.downloadFile = function(fileUrl, downloadPath, callback) {
  var host = url.parse(fileUrl).hostname;
  var path = url.parse(fileUrl).path;
  //console.log("urls", fileUrl, url.parse(fileUrl));
  var filename = path.split("/").pop();
  var downloadfile = fs.createWriteStream(downloadPath, {'flags': 'a'});

  //console.log("downloadFile", fileUrl, "to", downloadfile);

  var options = {
      host: host,
      port: 80,
      path: path
  };

  var req = http.request(options, function(res) {
    res.on("data", function (chunk) {
      downloadfile.write(chunk, encoding='binary');
    });

    res.on("end", function () {
      downloadfile.end();
      console.log("downloaded", downloadPath);
      callback(null, downloadPath);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}

exports.resizeImage = function(file, thumb, width, height, callback) {
  var img = gm(file);
  img.size(function(err, value) {
    var ratio = value.width / value.height;
    img.resize(width).write(thumb, function(e, a) {
      console.log(e, a);
      callback(err, ratio);
    })
  })
}

exports.downloadAndCreateThumb = function(imageFile, callback) {
  var contentImagesPath = path.normalize(__dirname + "/../content/images");

  var ext = path.extname(imageFile);
  var base = path.basename(imageFile, ext);
  var queryQuestionMarkIndex = ext.indexOf("?");
  console.log(path, ext, base);
  if (queryQuestionMarkIndex !== -1) {
    ext = ext.substr(0, queryQuestionMarkIndex);
  }
  var timestamp = (new Date()).getTime();
  var cachedFile = base + "_" + timestamp + ext;

  exports.downloadFile(imageFile, contentImagesPath + "/" + cachedFile, function(err, file) {
    var dir = path.dirname(file);
    var thumbFile = base + "_" + timestamp + "_thumb" + ext;
    var thumbFilePath = path.join(dir, thumbFile);
    var img = gm(file);
    exports.resizeImage(file, thumbFilePath, THUMB_WIDTH, 0, function(err, ratio) {
      console.log("Created thumb", err, cachedFile, thumbFile, ratio);
      callback(err, cachedFile, thumbFile, ratio);
    });
  });
}

exports.copy = function (src, dst, callback) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(dst);
  util.pump(is, os, callback);
};

exports.copyAndCreateThumb = function(uploadedImageFile, callback) {
  var contentImagesPath = path.normalize(__dirname + "/../content/images");

  var ext = path.extname(uploadedImageFile.name);
  var base = path.basename(uploadedImageFile.name.replace(/\s/g, "-"), ext);

  var timestamp = (new Date()).getTime();
  var cachedFile = base + "_" + timestamp + ext;
  var thumbFile = base + "_" + timestamp + "_thumb" + ext;

  var cachedFilePath = contentImagesPath + "/" + cachedFile;
  var thumbFilePath = contentImagesPath + "/" + thumbFile;

  exports.copy(uploadedImageFile.path, cachedFilePath, function(e) {
    exports.resizeImage(cachedFilePath, thumbFilePath, THUMB_WIDTH, 0, function(err, ratio) {
      callback(err, cachedFile, thumbFile, ratio);
    });
  })
}

exports.deleteImageFile = function(imageFile) {
  var contentImagesPath = path.normalize(__dirname + "/../content/images");
  var imageFilePath = contentImagesPath + "/" + imageFile;
  if (path.existsSync(imageFilePath)) {
    fs.unlinkSync(imageFilePath);
  }
}