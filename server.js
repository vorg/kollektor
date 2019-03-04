// server.js
//
// This is the kollektor server responsible for
// - scanning given directory for existing files and their metadata
// - maintain in memory database of all files in the collection
// - serving client files for browsing your collection via web interface
// - exposing a REST API for retrieving and modifying the collection
// - watching that directory for file changes due to adding files manuall or API uploads
//
// What it doesn't do
// - sync files across multiple kollektor instances.
//   That's currently handles by 3rd party e.g. Dropbox

const debug = require('debug')
debug.enable('kollektor:*')

const commander = require('commander')
const pacakge = require('./package.json')
const express = require('express')
const scanDir = require('./lib/scan-dir')
const path = require('path')
const url = require('url')
const browserify = require('browserify')
const fs = require('fs')
const generateThumbnail = require('./lib/generate-thumbnail')
const endsWith = require('ends-with')
const jimp = require('jimp')

// Initialize logger
const log = debug('kollektor:server')

const THUMB_WIDTH = 600

// ## Command line options
//
// Server is a command line app so lets define it's interface

// We support only two options:
// - the port at which we want to run (defaults to 3000)
// - collection's directory
// Todo:
// - [ ] create folder if it doesn't exist
// - [ ] find next available port if 3000 is taken
commander
  .version(pacakge.version)
  .usage('[options] <dir>')
  .option('-p, --port [value]', 'Server port')
  .parse(process.argv)

const port = commander.port || 3000
let dir = commander.args[0]

if (!dir) {
  commander.help()
  process.exit(-1)
}

dir = path.resolve(__dirname, dir)

// ## Init

// Scan given folder for all images and their metadata

log(`Scanning "${dir}" for files`)
scanDir(dir, (err, items) => {
  if (err) {
    log('ERROR', err)
    return
  }
  log(`Scan complete. ${items.length} items found`)

  startServer(items)
})

// ## Server

// Now we start a web server responsible for handline API requests and serving the web interface

function getImageSize (file, ext, cb) {
  jimp.read(file, function (err, img) {
    if (err) {
      cb(err, null)
    } else {
      cb(null, {
        width: img.bitmap.width,
        height: img.bitmap.height
      })
    }
  })
}

function startServer (items) {
  var app = express()

  // Serve root path / from public folder with static assets (html, css)
  app.use(express.static(__dirname + '/public'))

  app.get('/tag/*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
  })

  // Client web interface code is bundled on the fly. This probably shouldn't go into production.
  app.get('/client.bundle.js', (req, res) => {
    var b = browserify()
    b.add(__dirname + '/client.js')
    b.bundle((err, buf) => {
      if (err) {
        log('Client bundle error', err)
        res.end()
      } else {
        res.send(buf)
      }
    })
  })
  app.get('/api/get/tag/:tags', (req, res) => {
    const tags = req.params.tags.split('+')
    const taggedItems = items.filter((item) => {
      let hasTags = 0
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
        if (item.tags.indexOf(tag) !== -1) {
          hasTags++
        }
      }
      return hasTags === tags.length
    })
    res.send(JSON.stringify(taggedItems))
  })

  // API for getting all items currently in the db
  app.get('/api/get/items', (req, res) => {
    res.send(JSON.stringify(items))
  })

  function getOrCreate (req, res, basePath, ext, type, createCallback) {
    var file = path.relative(basePath, url.parse(req.path).pathname)
    file = unescape(file)
    var filePath = path.normalize(dir + '/' + file) + ext
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (!err) {
        res.type(type)
        res.sendFile(filePath)
      } else if (createCallback) {
        createCallback(file, filePath, (err, data) => {
          if (err) log(err)
          try {
            fs.writeFileSync(filePath, data)
          } catch (e) {
            log('Write failed for', filePath, e)
          }
          res.type(type)
          res.sendFile(filePath)
        })
      } else {
        log('ERROR', 'Not found')
        res.end()
      }
    })
  }
  app.get('/api/get/image/*', (req, res) => {
    getOrCreate(req, res, '/api/get/image', '', 'jpg')
  })

  app.get('/api/get/thumb/*', (req, res) => {
    getOrCreate(req, res, '/api/get/thumb', '', 'jpg', (filePath, cb) => {
    })
  })

  // Serve individual image info from the given path
  app.get('/api/get/info/*', (req, res) => {
    getOrCreate(req, res, '/api/get/info', '.json', 'json', (file, filePath, cb) => {
      var ext = path.extname(file)
      var basename = path.basename(file, ext)
      let item = {
        path: file,
        added: (new Date()).toISOString(),
        title: basename,
        referer: '',
        original: '',
        cached: basename + ext,
        ratio: 1.8768328445747802,
        tags: []
      }
      getImageSize(file, ext, (err, size) => {
        if (err) log(file, err)
        if (size) {
          item.ratio = size.width / size.height
        }
        var str = JSON.stringify(item)
        cb(null, str)
      })
    })
  })

  // Start the server on a given port
  app.listen(port, () => {
    log(`Starting on port http://localhost:${port}`)
  })
}
