var util = require("util");
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require('path');
var gm = require("gm");
var mime = require("mime-magic");
var url = require("url");

var THUMB_WIDTH = 600;

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
    if (err) {
      console.log('ERROR resizeImage', err);
      exports.copy(file, thumb, function(copyErr) {
        var ratio = 1;
        callback(copyErr, ratio);
      })
    }
    else {
      var ratio = value.width / value.height;
      img.resize(width).write(thumb, function(e, a) {
        console.log(e, a);
        callback(err, ratio);
      })
    }
  })
}

exports.downloadAndCreateThumb = function(imageFile, callback) {
  var contentImagesPath = path.normalize(__dirname + "/../content/images");
  var urlParts = url.parse(imageFile);
  var urlPath = urlParts.path;
  var queryPos = urlPath.indexOf('?');
  var hashPos = urlPath.indexOf('#');
  var slashSeachEnd = urlPath.length-1;
  if (queryPos != -1) slashSeachEnd = Math.min(slashSeachEnd, queryPos);
  if (hashPos != -1) slashSeachEnd = Math.min(slashSeachEnd, hashPos);
  var lastPathSlash = urlPath.lastIndexOf('/', slashSeachEnd);
  var requestedFile = urlPath.substr(lastPathSlash+1);
  var validChars = /[^-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789]/g
  var validFile = requestedFile.replace(validChars, '_');
  var ext = path.extname(validFile)
  var base = path.basename(validFile, ext);

  var tmpDownloadPath = contentImagesPath + "/00_" + (Date.now() + Math.floor(Math.random()*999999));

  exports.downloadFile(imageFile, tmpDownloadPath, function(err, file) {
    mime(file, function (err, type) {
      if (err) {
        console.log('downloadAndCreateThumb', err);
        callback(err, null, null, 0);
        fs.unlink(tmpDownloadPath);
        return;
      }
      var typeParts = type.split('/');
      if (typeParts[0] != 'image') {
        console.log('downloadAndCreateThumb', 'downloaded file is not an image', type);
        callback('downloaded file is not an image', null, null, 0);
        fs.unlink(tmpDownloadPath);
        return;
      }
      if (typeParts[1] == 'jpeg') { typeParts[1] = 'jpg'; }

      var ext = '.' + typeParts[1];

      var timestamp = Date.now();
      var cachedFile = base + "_" + timestamp + "" + ext;
      var cachedFilePath = path.join(contentImagesPath, cachedFile);
      var thumbFile = base + "_" + timestamp + "_thumb" + ext;
      var thumbFilePath = path.join(contentImagesPath, thumbFile);

      fs.rename(tmpDownloadPath, cachedFilePath, function(err) {
        if (err) {
          console.log('downloadAndCreateThumb', 'rename failed');
          callback('rename failed', null, null, 0);
          fs.unlink(tmpDownloadPath);
          fs.unlink(cachedFile);
          return;
        }
        console.log('downloaded', imageFile, 'to', validFile);
        exports.resizeImage(cachedFilePath, thumbFilePath, THUMB_WIDTH, 0, function(err, ratio) {
          console.log("Created thumb", err, cachedFile, thumbFile, ratio);
          callback(err, cachedFile, thumbFile, ratio);
        });
      })
    });
  });
}

exports.copy = function (src, dst, callback) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(dst);
  is.pipe(os);
  is.on('end', callback);
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
  if (fs.existsSync(imageFilePath)) {
    fs.unlinkSync(imageFilePath);
  }
}
