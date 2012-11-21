var http = require('http');
var utils = require('./api.utils');

//http.get("http://marcinignac.com/projects/nine-point-five/ninepointfive_alternatives1.jpg", function(res) {
//  console.log("Got response: " + res.statusCode);
//}).on('error', function(e) {
//  console.log("Got error: " + e.message);
//});

var url = "http://marcinignac.com/projects/nine-point-five/ninepointfive_alternatives1.jpg";

utils.downloadAndCreateThumb(url, function(err, cachedUrl, thumbUrl, ratio) {
  console.log(err);
});