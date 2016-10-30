const request = require('d3-request')
const bel = require('bel')
const debug = require('debug')

debug.enable('kollektor-client')
const log = debug('kollektor-client')

log('Trying to request items')
request.json('api/get/', (err, items) => {
  log('Items', err, items)

  const imagesList = bel`<ul class="list ma0 pa0">
    ${items.slice(0, 50).map(function (item) {
      var url = `images/${item.path}/${item.thumb}` 
      return bel`<li class="fl w-20"><img src="${url}"/></li>`
    })}
  </ul>`

  console.log(imagesList)

  document.body.appendChild(imagesList)
})
