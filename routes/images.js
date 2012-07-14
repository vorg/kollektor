var url = require('url');
var path  = require('path');

exports.images = function(req, res, next) {
  var filename = url.parse(req.path).pathname.split("/").pop();
  var filepath = path.normalize(__dirname + "/../content/images/" + filename);
  res.sendfile(filepath);
};