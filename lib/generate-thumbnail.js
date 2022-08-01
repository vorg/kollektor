const jimp = require('jimp')
const fs = require('fs')
const execFile = require('child_process').execFile
const gifsicle = require('gifsicle')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const debug = require('debug')
const log = debug('kollektor:server')
const sharp = require('sharp')
const utils = require('../routes/api.utils.js')

const imageMagickAvailable = false

function generateThumbnail(orig, thumb, w, callback) {
  log('Generate Thumbnail', orig)
  console.log('sharp resize', orig)
  var img = sharp(orig)
  var ratio = 1
  img
    .resize(w)
    .on('info', (info) => {
      ratio = info.width / info.height
    })
    .toFile(thumb, function (err) {
      if (err) {
        console.log('ERROR resizeImage', err);
        utils.copy(orig, thumb, function (copyErr) {
          var ratio = 1;
          callback(copyErr, thumb);
        })
      }
      else {
        callback(err, thumb);        
      }
    })
  /*
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
  } else {
    // jpeg, png
    console.time(thumb)
    if (imageMagickAvailable) {
      execFile('convert', ['-resize', `${w / 2}`, `"${orig}"`, `"${thumb}"`], (err) => {
        console.timeEnd(thumb)
        callback(err, thumb)
      })
    } else {
      jimp
        .read(orig)
        .then((img) => {
          log('jimp resize', w / 2, thumb)
          img.resize(w / 2, jimp.AUTO).getBuffer(jimp.MIME_JPEG, (err, buf) => {
            log('jimp resize done', err)
            fs.writeFileSync(thumb, buf)
            console.timeEnd(thumb)
            callback(null, thumb)
          })
        })
        .catch((err) => {
          log('jimp failed', err)
          callback(err, null)
        })
    }
  }
  */
}

module.exports = generateThumbnail
