const lwip = require('lwip')
const fs = require('fs')
const path = require('path')

function generateThumbnail (orig, thumb, w, callback) {
  let info = null
  try {
    info = fs.readFileSync(path.dirname(orig) + '/' + path.basename(orig, path.extname(orig)) + '.json')
    info = JSON.parse(info)
  } catch (e) {
    return callback(e)
  }
  const ratio = info.ratio || 1
  lwip.open(orig, (err, image) => {
    if (err) {
      return callback(err, null)
    }
    image.batch()
      .resize(w, w / ratio)
      .writeFile(thumb, (err) => {
        if (err) return callback(err, null)
        else return callback(null, thumb)
      })
  })
}

module.exports = generateThumbnail
