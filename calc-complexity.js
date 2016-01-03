var fs = require('fs');
var persist = require("persist");
var type = persist.type;
var models = require('./models');
var path = require('path');
var gm = require('gm');
var im = require('imagemagick');
var exec = require('sync-exec');
var db = require('./routes/api.db');

var DB_CONFIG = {
  'driver': 'sqlite3',
  'filename': __dirname + '/content/kollektor.sqlite',
  'defautFilename': 'content/kollektor.sqlite.default'
};
persist.setDefaultConnectOptions(DB_CONFIG);

var imagesDir = __dirname + '/content/images';
var dbFile = __dirname + '/content/kollektor.sqlite';

var files = fs.readdirSync(imagesDir);
console.log('files', files.length);
console.log(files.slice(0, 10));

persist.connect(function(err, connection) {
  console.log('connected');
  var cached = {};
  var orphants = 0;
  var zombies = 0;
  models.Image.using(connection).orderBy('id', 'desc').include("tags").all(function(err, imagesData) {
    console.log('imagesData', imagesData.length*2, 'orphants:', (files.length - imagesData.length*2)/2 + '?');
    imagesData.forEach(function(img){
      cached[img.cachedUrl] = img;
      cached[img.thumbUrl] = img;
    })


    function processNext() {
      if (files.length == 0) {
        return;
      }
      var file = files.shift();

      while (!cached[file]) {
        file = files.shift();
      }

      if (files.length == 0) {
        return;
      }

      var fileThumb = base + '_thumb' + ext;
      var filePath = imagesDir + '/' + file;
      var fileThumbPath = imagesDir + '/' + file;
      var ext = path.extname(file);
      var base = path.basename(file, ext);
      var stats = fs.statSync(filePath);
      var hasThumb = false;
      var tags = ['sys-orphant']
      if (files[0] == fileThumb) {
        files.shift();
        hasThumb = true;
      }
      else {
        fileThumb = file;
        fileThumbPath = filePath;
        tags.push('sys-no-thumb');
      }

      var img = cached[file];
      var tags = img.tags.map(function(t) { return t.name;});
      var needsRecalc = !img.complexity;
      if (needsRecalc) {
        var complexity = exec("convert " + fileThumbPath + " -delete 1--1 -scale 128x128 -grayscale rec709luma -morphology EdgeOut Octagon -threshold 25% -format '%[fx:mean]' histogram:info:").stdout;
        complexity = complexity.split('\n')[0];
        if (isNaN(complexity)) {
          console.log('invalid', complexity)
        }
        complexity = isNaN(complexity) ? 0 : Number(complexity);
        console.log(files.length, file, complexity);
        var imageData = {
          id: img.id,
          title: img.title,
          referer: img.referer,
          originalUrl : img.originalUrl,
          cachedUrl : img.cachedUrl,
          thumbUrl : img.thumbUrl,
          ratio : img.ratio,
          complexity: complexity,
          tags: tags
        }

        models.Image.update(connection, Number(img.id), { complexity: complexity }, function(err) {
          setTimeout(processNext, 1);
        });
        //
      }
      else {
        setTimeout(processNext, 1);
      }


      //if (ext == '.gif') {
        //var info = exec("identify -format '%W x %H\n' " + filePath);
        //if (info.stdout) {
        //  var size = info.stdout.split('\n')[0].split(' x ');
        //  var ratio = size[0]/size[1];
        //  console.log(files.length, file, size);

        //  var imageData = {
        //    title: base,
        //    referer: "",
        //    originalUrl : "",
        //    cachedUrl : file,
        //    thumbUrl : fileThumb,
        //    ratio : ratio,
        //    tags: tags
        //  }

        //  //db.addImage(connection, imageData, function() {
        //    setTimeout(processNext, 1);
        //  //})
        //}
        //else {
        //  //console.log(files.length, file, 'invalid file');
        //  //fs.unlink(filePath);
        //}
    }

    processNext();
  });
});