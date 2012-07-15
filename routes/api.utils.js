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

exports.downloadFile = function(fileUrl, downloadFile, callback) {
  var host = url.parse(fileUrl).hostname;
  var path = url.parse(fileUrl).path;
  var filename = url.parse(fileUrl).pathname.split("/").pop();
  var downloadfile = fs.createWriteStream(downloadFile, {'flags': 'a'});

  console.log("downloadFile", fileUrl);

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
      callback(null, downloadPath + "/" +  filename);
    });
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
    callback("Uknown image file type. Must be JPEG or PNG.");
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
  exports.downloadFile(imageFile, __dirname + "/../content/images", function(err, file) {
    var dir = path.dirname(file);
    var ext = path.extname(file);
    var base = path.basename(file, ext);
    var timestamp = (new Date()).getTime();
    var cachedUrl = base + "_" + timestamp + ext;
    var thumbUrl = base + "_" + timestamp + "_thumb" + ext;
    var thumbFile = path.join(dir, thumbUrl);

    exports.resizeImage(file, thumbFile, 300, 0, function(err, ratio) {
      console.log("Created thumb", err, cachedUrl, thumbUrl, ratio);
      callback(err, cachedUrl, thumbUrl, ratio);
    });
  });
}
