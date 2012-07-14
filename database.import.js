var persist = require("persist");
var type = persist.type;
var models = require("./models");
var fs = require('fs');

var images = JSON.parse(fs.readFileSync('content/pictures.json'));

persist.connect(function(err, connection) {
  if(err) { throw err; }
  
  function findTags(tagNames, callback) {
    var tags = [];
    var newTags = [];
    
    tagNames.forEach(function(tagName) {
      models.Tag.using(connection).where('name = ?', tagName).all(function(err, tag) {
        if (tag.length > 0) {
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
  
  function imageExists(originalUrl, callback) {
    models.Image.using(connection).where('originalUrl = ?', originalUrl).all(function(err, image) {
      callback(image.length > 0);
    })
  }
  
  function saveNextImage() {
    console.log(images.length + " images left");
    var data = [];
    
    var imageData = images.shift();
    
    if (!imageData) return;
    
    if (imageData.originalUrl == '') imageData.originalUrl = imageData.referer;
    
    imageExists(imageData.originalUrl, function(result) {
      if (result) {
        //console.log("skipping " + imageData.originalUrl + " ...", imageData);
        saveNextImage();
      }
      else {
        console.log("finding", imageData.tags);
        findTags(imageData.tags, function(tags, newTags) {
          imageData.tags = tags;
          if (newTags.length > 0) { data.push.apply(data, newTags); }
          data.push(new models.Image(imageData));
          connection.save(data, function (err) {
            saveNextImage();
          });
        })
      }
    })
  }
  
  saveNextImage();
  
  findTags(["test1", "test2", "test3"], function(tags, newTags) {    
    //connection.save(newTags, function(err) {    
    //});    
  })
  
  
  /*
  
  var test1Tag = new models.Tag({name:"test1"});
  var test2Tag = new models.Tag({name:"test2"});
  
  var tags = [ test1Tag, test2Tag ];
  var image = new models.Image({referer:"http://localhost", tags: tags});
  
  var data = [test1Tag, test2Tag, image ];
  
  //connection.save(data, function(err) {    
  //});
  
  //models.Image.using(connection).all(function(err, people) {
  //});
  
  var tags
  
  
  
  
  */
  
});