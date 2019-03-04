const request = require('d3-request')
const bel = require('bel')
const debug = require('debug')
const url = require('url')

debug.enable('kollektor-client')
const log = debug('kollektor-client')

const urlPath = url.parse(document.location.href).path

function extractHost (url) {
  if (!url || url === '') return 'Unknown'
  var slashPosition = url.indexOf('/', url.indexOf('//') + 3)
  if (slashPosition === -1) slashPosition = url.length
  return url.substr(0, slashPosition)
}

log('Trying to request items')
request.json(`${server}/api/get/items`, (err, items) => {
  log('Items', err, items)
  const imagesData = items.reverse() // newest first

  const numColumns = Math.ceil(window.innerWidth / 300)
  const columnWidth = `${100 / numColumns}%`
  const columns = []
  let index = 0
  const maxImagesLimit = 50

  for (let i = 0; i < numColumns; i++) {
    const elem = bel`<li class="fl pr2" style="width:${columnWidth}"></li>`
    columns.push({ items: [], height: 0, elem: elem })
  }

  const folderName = (item) => path.dirname(item.path)
  const filesByFolder = R.groupBy(folderName, items)
  const folders = Object.keys(filesByFolder).slice(0, numColumns * 3 - 1)

  const folderList = bel`<ul class="list ma0 pa0 pl2 pt2 code black-70 fw2 overflow-auto fixed w-100 z-1 bg-white f6">
    ${folders.map((folder) => {
      const item = filesByFolder[folder][0]
      const thumbUrl = `${server}/api/get/thumb/${item.path}`
      return bel`<div class="fl pr2 pb2 dim" style="width:${columnWidth}">
        <div class="flex flex-row bg-light-gray"> 
          <div class="bg-red" style="min-width: 2.2em; background: url('${thumbUrl}'); background-size: cover; background-position: 50% 50%;"></div>
          <div class="pa2 pointer truncate">
            ${folder}
          </div>
        </div>
      </div>`
    })}
  </ul>`

  const marginTop = `calc(${Math.ceil(folders.length / numColumns)} * 2.8em);`
  const imagesList = bel`<ul class="list ma0 pa0 pl2 pt2 helvetica fw2 overflow-auto" style="padding-top: ${marginTop}">
    ${columns.map((item) => item.elem)}
  </ul>`

  document.body.appendChild(folderList)
  document.body.appendChild(imagesList)

  function findMinColumn () {
    return columns.reduce((col, minCol) => {
      return (col.height < minCol.height) ? col : minCol
    }, { height: Infinity })
  }

  window.addEventListener('scroll', (e) => {
    var docH = document.body.offsetHeight
    var winH = window.innerHeight
    var scrollTop = window.scrollY
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
    const column = findMinColumn()
    column.items.push(item)
    column.height += 1
    const imageUrl = `${server}/api/get/image/${item.path}`
    const thumbUrl = `${server}/api/get/thumb/${item.path}`
    const jsonUrl = `${server}/api/get/info/${item.path}`
    const itemElem = bel`
      <div class="mb2 relative hide-child">
      </div>`

    request.json(jsonUrl, (err, item) => {
      column.height -= 1
      if (!item) {
        return        
      }
      const h = 1 / item.ratio
      column.height += h
      const contents = bel`<div>
        <a href="${imageUrl}"><img src="${thumbUrl}"/></a>
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
      itemElem.appendChild(contents)
    })

    column.elem.appendChild(itemElem)
  }
})
