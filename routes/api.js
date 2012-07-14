var canvas = require('/Users/vorg/node_modules/canvas/build/Release/canvas.node');
var persist = require("persist");
var type = persist.type;
var models = require('../models');
var utils = require('./api.utils');
var path = require('path');

exports.get = function(req, res) {
  persist.connect(function(err, connection) {
    if(err) { throw err; }

    //limit(5) - paging
    models.Image.using(connection).orderBy('id', 'desc').include("tags").all(function(err, imagesData) {
      var images = [];
      imagesData.forEach(function(imageData) {
        var image = {
          id: imageData.id,
          title: imageData.title,
          referer: imageData.referer,
          originalUrl : imageData.originalUrl,
          cachedUrl : imageData.cachedUrl,
          thumbUrl : imageData.thumbUrl,
          ratio : imageData.ratio,
          tags: []
        }
        imageData.tags.forEach(function(tagData) {
          image.tags.push(tagData.name);
        });
        if (images.push(image) == imagesData.length) {
            res.send(JSON.stringify(images));
        }
      });
    });
  });
};

exports.post = function(req, res) {
  var img = req.query.img;
  var referer = req.query.referer;
  var title = req.query.title;
  var tags = req.query.tags;
  var callback = req.query.callback;

  console.log("Downloading...", title, tags);
  console.log("Downloading...", img);

  utils.downloadAndCreateThumb(img, function(err) {
    res.setHeader("Content-Type", "text/javascript");
    var body = '';
    body += 'var post = false;\n'
    body += 'var result = "' + err + '";';
    body += callback + '();';
    res.send(body);
  })
}
