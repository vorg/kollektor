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
      var basename = path.basename(file, ext)
      if (ext === '.json') {
        let item = JSON.parse(fs.readFileSync(file, 'utf8'))
        item.path = path.relative(dir, path.dirname(file))
        items.push(item)
      } else if (ext === '.thumb') {
      } else {
        // original file
        var jsonPath = file + '.json'
        if (!fs.existsSync(jsonPath)) {
          let item = {
            added: (new Date()).toISOString(),
            title: basename,
            referer: '',
            original: '',
            cached: basename + ext,
            ratio: 1.8768328445747802,
            tags: []
          }
          item.path = path.relative(dir, path.dirname(file))
          items.push(item)
          fs.writeFileSync(jsonPath, JSON.stringify(item, null, 2))
        }
      }
    }
    callback(null, items)
  })
}

module.exports = scanDir
