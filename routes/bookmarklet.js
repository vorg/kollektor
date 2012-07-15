var fs = require('fs');

exports.bookmarklet = function(req, res) {
  fs.readFile(__dirname + '/../public/js/bookmarklet.js', 'utf-8', function(err, bookmarketCode) {
    var serverUrl = "http://" + (req.headers.host + req.url).replace("/bookmarklet", "");
    bookmarketCode = bookmarketCode.replace("SCRAPER_JS", serverUrl + "/js/scraper.js");
    bookmarketCode = bookmarketCode.replace("JQUERY_JS", serverUrl + "/js/jquery.js");
    bookmarketCode = bookmarketCode.replace("SCRAPER_CSS", serverUrl + "/css/scraper.css");
    res.send(bookmarketCode);
  });
};
