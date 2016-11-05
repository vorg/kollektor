const request = require('d3-request')
const bel = require('bel')
const debug = require('debug')

debug.enable('kollektor-client')
const log = debug('kollektor-client')

function extractHost (url) {
  if (!url || url === '') return 'Unknown'
  var slashPosition = url.indexOf('/', url.indexOf('//') + 3)
  if (slashPosition === -1) slashPosition = url.length
  return url.substr(0, slashPosition)
}

log('Trying to request items')
request.json('api/get/', (err, items) => {
  log('Items', err, items)
  const imagesData = items.reverse() // newest first

  const numColumns = 5
  const columns = []
  let index = 0
  const maxImagesLimit = 50

  for (let i = 0; i < numColumns; i++) {
    const elem = bel`<li class="fl w-20 pr2"></li>`
    columns.push({ items: [], height: 0, elem: elem })
  }

  const imagesList = bel`<ul class="list ma0 pa0 pl2 pt2 helvetica fw2 overflow-auto">
    ${columns.map((item) => item.elem)}
  </ul>`

  document.body.appendChild(imagesList)

  function findMinColumn () {
    return columns.reduce((col, minCol) => {
      return (col.height < minCol.height) ? col : minCol
    }, { height: Infinity })
  }

  window.addEventListener('scroll', (e) => {
    var docH = document.body.offsetHeight
    var winH = window.innerHeight
    var scrollTop = document.body.scrollTop
    if (scrollTop + winH > docH - 500) {
      loadMore()
    }
  })

  function loadMore () {
    let i = 0
    while (i < maxImagesLimit) {
      if (index > imagesData.length - 1) break
      addImage(imagesData[index])
      i++
      index++
    }
  }

  loadMore()

  function addImage (item) {
    const h = 1 / item.ratio
    const column = findMinColumn()
    column.items.push(item)
    column.height += h
    const url = `/images/${item.path}/${item.cached}`
    const itemElem = bel`
      <div class="mb2 relative hide-child">
      <a href="${url}"><img src="${url}.thumb"/></a>
      <div class="absolute top-0 w-100">
      <div class="bg-white ma1 child">
      <a href="${item.referer}" class="no-underline underline-hover gray pa1 f6 db">${extractHost(item.referer)}</a>
      <a href="${item.referer}" class="no-underline underline-hover gray pa1 f5 db link"><h2 class="ma0 fw3 near-black">${item.title}</h2></a>
      <div class="pa1 f6">
      ${item.tags.map((tag, index) => {
        const comma = (index < item.tags.length - 1) ? bel`, ` : null
        return [bel`<a href="/tag/${tag}" class="red no-underline underline-hover">${tag}</a>`, comma]
      })}
      </div>
      </div>
      </div>
      </div>
    `
    column.elem.appendChild(itemElem)
  }
})
