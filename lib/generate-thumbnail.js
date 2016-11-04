const lwip = require('lwip')
const fs = require('fs')
const path = require('path')
const execFile = require('child_process').execFile
const gifsicle = require('gifsicle')

function generateThumbnail (orig, thumb, w, callback) {
  let info = null
  let ext = path.extname(orig)
  try {
    info = fs.readFileSync(path.dirname(orig) + '/' + path.basename(orig, ext) + '.json')
    info = JSON.parse(info)
  } catch (e) {
    return callback(e)
  }
  const ratio = info.ratio || 1

  if (ext === '.gif') {
    execFile(gifsicle, ['--resize', `${w / 2}x_`, orig, '-o', thumb], (err) => {
      callback(err, thumb)
    })
  } else { // jpeg, png
    lwip.open(orig, (err, image) => {
      if (err) {
        return callback(err, null)
      }
      image.batch()
        .resize(w, w / ratio)
        .writeFile(thumb, (err) => {
          callback(err, thumb)
        })
    })
  }
}

module.exports = generateThumbnail
