var fs = require('fs')
var persist = require('persist')
var models = require('./models')
var path = require('path')
var exec = require('sync-exec')

var DB_CONFIG = {
  'driver': 'sqlite3',
  'filename': __dirname + '/content/kollektor.sqlite',
  'defautFilename': 'content/kollektor.sqlite.default'
}
persist.setDefaultConnectOptions(DB_CONFIG)

var imagesDir = __dirname + '/content/images'

var files = fs.readdirSync(imagesDir)
var numFiles = files.length
console.log('files', files.length)
console.log(files.slice(0, 10))

var targetPath = '/Users/vorg/Downloads/Kollektor'

if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath)
}

persist.connect(function (err, connection) {
  if (err) {
    console.log(err)
    return
  }
  console.log('connected')
  var timeout = 1000

  function processNext () {
    if (files.length === 0) {
      return
    }
    var file = files.shift()
    console.log(`processing ${file} - ${numFiles - files.length}/${numFiles}`)

    var extName = path.extname(file)
    var baseFileName = path.basename(file, extName)
    if (baseFileName.lastIndexOf('_thumb') === baseFileName.length - '_thumb'.length) {
      console.log(' skipping thumbnail')
      setTimeout(processNext, 1)
      return
    }
    var fullFilePath = imagesDir + '/' + file
    var fullThumbPath = imagesDir + '/' + baseFileName + '_thumb' + extName

    console.log('', fullFilePath)
    console.log('', fullThumbPath)

    var stat = fs.statSync(fullFilePath)
    var month = stat.ctime.getFullYear() + '-' + ('0' + stat.ctime.getMonth()).slice(-2)
    var targetMonthPath = targetPath + '/' + month
    var targetFilePath = targetMonthPath + '/' + file
    var targetThumbPath = targetMonthPath + '/' + baseFileName + '_thumb' + extName
    var targetDataPath = targetMonthPath + '/' + baseFileName + '.json'

    if (!fs.existsSync(targetMonthPath)) {
      fs.mkdirSync(targetMonthPath)
    }

    exec(`cp ${fullFilePath} ${targetFilePath}`)
    exec(`cp ${fullThumbPath} ${targetThumbPath}`)

    function saveData (data) {
      var dataStr = JSON.stringify(data, null, 2)
      fs.writeFileSync(targetDataPath, dataStr)
    }

    models.Image.where({ cachedUrl: file }).all(connection, function (err, imageData) {
      if (err) console.log(err)
      imageData = imageData ? imageData[0] : null
      if (!imageData) {
        setTimeout(processNext, timeout)
        return
      }
      var data = {
        // Here we use created as we know files were added by collector so the time
        // is increasing as we add new files. However if we now add support for
        // just dragging files into a folder, then we probably should use the date from json
        // or the date when the json was created. This will bring another problem when uploading files: 
        // how to detect if file was uploaded and we are about to create json file immediately with user suplied data
        // or somebody just put a new file into a folder and we have create json file ourselves with default data.
        added: stat.ctime.toISOString(),
        title: imageData.title || '',
        referer: imageData.referer || '',
        original: imageData.originalUrl || '',
        cached: imageData.cachedUrl || '',
        thumb: imageData.thumbUrl || '',
        ratio: imageData.ratio || '',
        tags: []
      }
      if (imageData.tags) {
        imageData.tags.all(function (err, tagsData) {
          if (err) console.log(err)
          var tags = tagsData.map(function (tag) {
            return tag.name
          })
          data.tags = tags
          saveData(data)
          setTimeout(processNext, timeout)
        })
      } else {
        saveData(data)
        setTimeout(processNext, timeout)
      }
    })

    // processNext()
  }

  processNext()

  /*
  models.Image.using(connection).orderBy('id', 'desc').all(function (err, imagesData) {
    if (err) {
      console.log(err)
      return
    }
    console.log('imagesData', imagesData.length, 'orphants:', (files.length - imagesData.length * 2) / 2 + '?')
    imagesData.forEach(function (img) {
      cached[img.cachedUrl] = true
      cached[img.thumbUrl] = true
    })

    function processNext () {

      while (cached[file]) {
        file = files.shift()
      }

      if (files.length === 0) {
        return
      }

      var filePath = imagesDir + '/' + file
      var ext = path.extname(file)
      var base = path.basename(file, ext)
      var fileThumb = base + '_thumb' + ext
      var hasThumb = false
      var tags = ['sys-orphant']
      if (files[0] === fileThumb) {
        files.shift()
        hasThumb = true
      } else {
        fileThumb = file
        tags.push('sys-no-thumb')
      }

      // if (ext == '.gif') {
      var info = exec("identify -format '%W x %H\n' " + filePath)
      if (info.stdout) {
        var size = info.stdout.split('\n')[0].split(' x ')
        var ratio = size[0] / size[1]
        console.log(files.length, file, size, hasThumb)

        var imageData = {
          title: base,
          referer: '',
          originalUrl: '',
          cachedUrl: file,
          thumbUrl: fileThumb,
          ratio: ratio,
          tags: tags
        }

        db.addImage(connection, imageData, function (err, ok) {
          if (err) {
            console.log(err)
          }
          //  console.log(err, ok)
          setTimeout(processNext, 1)
        })
      } else {
        console.log(files.length, file, 'invalid file')
        // fs.unlink(filePath)
      }
    }

    processNext()
  })
  */
})
