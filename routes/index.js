exports.index = function(req, res) {
  res.render('index', { })
};

exports.api = require('./api');
exports.bookmarklet = require('./bookmarklet').bookmarklet;
exports.images = require('./images').images;
exports.tags = require('./tags').tags;