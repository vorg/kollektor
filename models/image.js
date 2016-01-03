var persist = require("persist");
var type = persist.type;

var Tag = require("./tag");

module.exports = persist.define("Image", {
  "title": type.STRING,
  "referer": type.STRING,
  "originalUrl": type.STRING,  
  "cachedUrl": type.STRING,
  "thumbUrl": type.STRING,
  "ratio": type.REAL,
  "complexity": type.REAL,
}).hasMany(Tag, { through:'images_tags' });
