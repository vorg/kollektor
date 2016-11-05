const lwip = require('lwip')
const fs = require('fs')
const execFile = require('child_process').execFile
const gifsicle = require('gifsicle')
const readChunk = require('read-chunk')
const fileType = require('file-type')
function generateThumbnail (orig, thumb, w, callback) {
  let info = null
  const buffer = readChunk.sync(orig, 0, 262)
  const extInfo = fileType(buffer)
  const ext = extInfo ? extInfo.ext : null
  if (!ext) {
    return callback('Unknown file type', null)
  }

  const dataFile = orig + '.json'
  try {
    info = fs.readFileSync(dataFile)
    info = JSON.parse(info)
  } catch (e) {
    console.log('ERR failed to load json file', dataFile)
    return callback(e)
  }
  const ratio = info.ratio || 1

  if (ext === 'gif') {
    execFile(gifsicle, ['--resize', `${w / 2}x_`, orig, '-o', thumb], (err) => {
      callback(err, thumb)
    })
  } else { // jpeg, png
    lwip.open(orig, ext, (err, image) => {
      if (err) {
        return callback(err, null)
      }
      image.batch()
        .resize(w, w / ratio)
        .writeFile(thumb, ext, (err) => {
          callback(err, thumb)
        })
    })
  }
}

module.exports = generateThumbnail
