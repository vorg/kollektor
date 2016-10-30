var recursive = require('recursive-readdir')
var path = require('path')
var fs = require('fs')

function scanDir (dir, callback) {
  var items = []
  recursive(dir, function (err, files) {
    if (err) {
      return callback(err, null)
    }
    for (var file of files) {
      var ext = path.extname(file)
      if (ext === '.json') {
        var item = JSON.parse(fs.readFileSync(file, 'utf8'))
        item.path = path.dirname(file)
        items.push(item)
      }
    }
    callback(null, items)
  })
}

module.exports = scanDir
