var util = require("util");
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require('path');
var Canvas = require('canvas');
var Image = Canvas.Image;

exports.downloadFile = function(fileUrl, downloadPath, callback) {
  var host = url.parse(fileUrl).hostname;
  var path = url.parse(fileUrl).path;
  var filename = url.parse(fileUrl).pathname.split("/").pop();
  var downloadfile = fs.createWriteStream(downloadPath + "/" +  filename, {'flags': 'a'});
  
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
  
  if (ext == "jpg" || ext == "jpeg") stream = canvas.createJPEGStream();
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

exports.resizeImage = function(file, targetFile, targetSize, callback) {
  var img = new Image();
  var start = new Date();
  
  img.onerror = function(err){
   callback(err);
  };
  img.onload = function(){
    var width = img.width / 2;
    var height = img.height / 2;
    var canvas = new Canvas(width, height);
    var ctx = canvas.getContext('2d');    
    ctx.drawImage(img, 0, 0, width, height);
    
    saveCanvasToFile(canvas, targetFile, function(err) {
      callback(err);
    });
  };

  img.src = fs.readFileSync(file);  
}
