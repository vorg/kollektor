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
  let info = null
  const buffer = readChunk.sync(orig, 0, 262)
  const extInfo = fileType(buffer)
  const ext = extInfo ? extInfo.ext : null
  if (!ext) {
    return callback(new Error('Unknown file type'), null)
  }
  log('Ext', ext)

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
    log('jimp read', orig)
    jimp.read(orig)
      .then((img) => {
        log('jimp resize', w, w / ratio, thumb)
        img.resize(w, w / ratio).getBuffer(jimp.MIME_JPEG, (err, buf) => {
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
