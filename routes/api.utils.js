var util = require("util");
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require('path');
var Canvas = require('canvas');
var Image = Canvas.Image;

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

function saveCanvasToFile(canvas, file, callback) {
  var ext = path.extname(file).substr(1).toLowerCase();

  var out = fs.createWriteStream(file)
  var stream = null;

  if (ext == "jpg" || ext == "jpeg") stream = canvas.createJPEGStream({quality:90});
  else if (ext == "png") stream = canvas.createPNGStream();
  else {
    //by default create jpg stream
    stream = canvas.createJPEGStream({quality:90});
  }

  stream.on('data', function(chunk){
    out.write(chunk);
  });

  stream.on('end', function(){
    callback(null, file);
  });

}

exports.resizeImage = function(file, targetFile, targetWidth, targetHeight, callback) {
  var img = new Image();
  var start = new Date();

  img.onerror = function(err){
   callback(err);
  };

  img.onload = function(){
    var width = img.width;
    var height = img.height;

    if (targetWidth != 0) {
      width = targetWidth;
      height = img.height * targetWidth / img.width;
    }
    else if (targetHeight != 0) {
      height = targetHeight;
      width = img.width * targetHeight / img.height;
    }
    else {
      callback("Resizing to with and height at the same time not supported yet.")
    }

    var canvas = new Canvas(width, height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    saveCanvasToFile(canvas, targetFile, function(err) {
      callback(err, width/height);
    });
  };

  img.src = fs.readFileSync(file);
}

exports.downloadAndCreateThumb = function(imageFile, callback) {
  var contentImagesPath = path.normalize(__dirname + "/../content/images");

  var ext = path.extname(imageFile);
  var base = path.basename(imageFile, ext);
  var timestamp = (new Date()).getTime();
  var cachedFile = base + "_" + timestamp + ext;

  exports.downloadFile(imageFile, contentImagesPath + "/" + cachedFile, function(err, file) {
    var dir = path.dirname(file);
    var thumbFile = base + "_" + timestamp + "_thumb" + ext;
    var thumbFilePath = path.join(dir, thumbFile);
    exports.resizeImage(file, thumbFilePath, 300, 0, function(err, ratio) {
      //console.log("Created thumb", err, cachedUrl, thumbUrl, ratio);
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
    exports.resizeImage(cachedFilePath, thumbFilePath, 300, 0, function(err, ratio) {
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