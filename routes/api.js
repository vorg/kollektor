var canvas = require('/Users/vorg/node_modules/canvas/build/Release/canvas.node');
var persist = require("persist");
var type = persist.type;
var models = require('../models');
var utils = require('./api.utils');
var db = require('./api.db');
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
  var callback = req.query.callback;

  var imageData = {
    title: req.query.title || "Unknown",
    referer: req.query.referer,
    originalUrl : req.query.img,
    cachedUrl : "",
    thumbUrl : "",
    ratio : 1,
    tags: req.query.tags.split(" ")
  }

  console.log("Downloading...", imageData);

  utils.downloadAndCreateThumb(imageData.originalUrl, function(err, cachedUrl, thumbUrl, ratio) {
    imageData.cachedUrl = cachedUrl;
    imageData.thumbUrl = thumbUrl;
    imageData.ratio = ratio;

    console.log("Downloaded...", imageData);

    res.setHeader("Content-Type", "text/javascript");
    var id = -1;
    if (err != null) {
      var body = "{0}({1},{2})".format(callback, err, id);
      res.send(body);
    }
    else {
      db.saveImage(imageData, function(err) {
        var body = "{0}({1},{2})".format(callback, err || "null", id);
        res.send(body);
      })
    }
  })
}

