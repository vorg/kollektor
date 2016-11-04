const fs = require('fs')
const path = require('path')
const endsWith = require('ends-with')

function isThumbnail (file) {
  console.log('checking for thumbnail', file)
  const ext = path.extname(file)
  const dirname = path.dirname(file, ext)
  const basename = dirname + '/' + path.basename(file, ext)
  console.log(' basename: ' + basename)
  if (endsWith(basename, '_thumb')) {
    // Checking if the original file without '_thumb' exists.
    // Otherwise it can mean that our original file has '_thumb' in it.
    // Thumbnail would be then '_thumb_thumb'
    var orig = basename.replace(/_thumb$/, '') + ext
    console.log(' orig: ' + orig)
    return (fs.existsSync(orig)) ? orig : false
  } else {
    return false
  }
}

module.exports = isThumbnail
