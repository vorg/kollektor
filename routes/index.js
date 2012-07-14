exports.index = function(req, res) {
  res.render('index', { })
};

exports.api = require('./api');
exports.bookmarklet = require('./bookmarklet').bookmarklet;