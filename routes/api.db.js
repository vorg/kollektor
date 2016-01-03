var persist = require("persist");
var type = persist.type;
var models = require("../models");

exports.findTags = function(connection, tagNames, callback) {
  var tags = [];
  var newTags = [];

  if (!tagNames || tagNames.length == 0) {
    callback(tags, newTags);
    return;
  }

  tagNames.forEach(function(tagName) {
    models.Tag.using(connection).where('name = ?', tagName).all(function(err, tag) {
      if (tag && tag.length > 0) {
        tags.push(tag[0]);
      }
      else {
        tag = new models.Tag({ name : tagName });
        tags.push(tag);
        newTags.push(tag);
      }
      if (tags.length == tagNames.length) {
        callback(tags, newTags);
      }
    });
  })
}

function imageExists(connection, originalUrl, callback) {
  models.Image.using(connection).where('originalUrl = ?', originalUrl).all(function(err, image) {
    callback(image.length > 0);
  })
}

function addImage(connection, imageData, callback) {

  var data = [];
  //console.log("finding", imageData.tags);

  exports.findTags(connection, imageData.tags, function(tags, newTags) {
    imageData.tags = tags;
    if (newTags.length > 0) {
      data.push.apply(data, newTags);
    }

    var image = new models.Image(imageData);
    data.push(image);

    connection.save(data, function (err) {
      callback(err, image.id);
    });
  })
}

exports.addImage = addImage;


exports.saveImage = function(imageData, callback) {
  persist.connect(function(err, connection) {
    if (err) {
      callback(err);
      return;
    }
    else {
      addImage(connection, imageData, function(err, imageId) {
        callback(err, imageId)
      });
    }
    connection.close();
  });
}

exports.delete = function(imageId, callback) {
  persist.connect(function(err, connection) {
    if (err) {
      callback(err);
      return;
    }
    else {
      models.Image.using(connection).where('id = ?', [imageId]).first(function(err, image) {
        var cachedImageFile = image.cachedUrl;
        var thumbImageFile = image.thumbUrl;
        image.tags = [];
        image.save(connection, function(err) {
          if (err) {
            callback(err);
            return;
          }
          else {
            image.delete(connection, function(err) {
              callback(err, cachedImageFile, thumbImageFile);
            });
          }
        });
      });
    }
    connection.close();
  });
}


