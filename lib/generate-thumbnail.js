const jimp = require('jimp')
const fs = require('fs')
const execFile = require('child_process').execFile
const gifsicle = require('gifsicle')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const debug = require('debug')
const log = debug('kollektor:server')

function generateThumbnail (orig, thumb, w, callback) {
  log('Generate Thumbnail', orig)
  const buffer = readChunk.sync(orig, 0, 262)
  const extInfo = fileType(buffer)
  const ext = extInfo ? extInfo.ext : null
  if (!ext) {
    return callback(new Error('Unknown file type'), null)
  }
  if (ext === 'gif') {
    execFile(gifsicle, ['--resize', `${w / 2}x_`, orig, '-o', thumb], (err) => {
      callback(err, thumb)
    })
  } else { // jpeg, png
    jimp.read(orig)
      .then((img) => {
        log('jimp resize', w, thumb)
        img.resize(w, jimp.AUTO).getBuffer(jimp.MIME_JPEG, (err, buf) => {
          log('jimp resize done', err)
          fs.writeFileSync(thumb, buf)
          callback(null, thumb)
        })
      })
      .catch((err) => {
        log('jimp failed', err)
        callback(err, null)
      })
  }
}

module.exports = generateThumbnail
