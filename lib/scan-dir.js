var recursive = require('recursive-readdir')
const path = require('path')
const fs = require('fs')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const lwip = require('lwip')
const log = require('debug')('kollektor:scan-dir')

function addJSON (file, item, items, jsonPath) {
  const buffer = readChunk.sync(file, 0, 262)
  const extInfo = fileType(buffer)
  const ext = extInfo ? extInfo.ext : null
  if (ext !== 'jpg' && ext !== 'png' && ext !== 'gif') {
    log(`Skipping unsupported ${file}`)
    return
  }
  lwip.open(file, ext, (err, image) => {
    if (err) {
      log('Skipping', file, err)
      return
    }
    const w = image.width()
    const h = image.height()
    item.width = w
    item.height = h
    item.ratio = w / h
    items.push(item)
    log(`add ${file} @ ${item.width}x${item.height}`)
    fs.writeFileSync(jsonPath, JSON.stringify(item, null, 2))
  })
}

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
          addJSON(file, item, items, jsonPath)
        }
      }
    }
    callback(null, items)
  })
}

module.exports = scanDir
