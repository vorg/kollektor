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
  items = items.reverse()

  const numColumns = 5
  const columns = []

  for (let i = 0; i < numColumns; i++) {
    columns.push({ items: [], height: 0 })
  }

  items = items.slice(0, 100)

  function findMinColumn () {
    return columns.reduce((col, minCol) => {
      return (col.height < minCol.height) ? col : minCol
    }, { height: Infinity })
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const h = 1 / item.ratio
    const column = findMinColumn()
    column.items.push(item)
    column.height += h
  }

  const imagesList = bel`<ul class="list ma0 pa0 pl2 pt2 helvetica fw2">
    ${columns.map(({items}) => {
      return bel`
        <li class="fl w-20 pr2">
        ${items.map((item) => {
          var url = `images/${item.path}/${item.thumb}`
          return bel`
          <div class="mb2 relative hide-child">
            <a href="images/${item.path}/${item.cached}"><img src="${url}"/></a>
            <div class="absolute top-0 w-100">
              <div class="bg-white ma1 child">
                <a href="${item.referer}" class="no-underline underline-hover gray pa1 f6 db">${extractHost(item.referer)}</a>
                <a href="${item.referer}" class="no-underline underline-hover gray pa1 f5 db link"><h2 class="ma0 fw3 near-black">${item.title}</h2></a>
                <div class="pa1 f6">
                ${item.tags.map((tag, index) => {
                  const comma = (index < item.tags.length - 1) ? bel`, ` : null
                  return [bel`<a href="tag/${tag}" class="red no-underline underline-hover">${tag}</a>`, comma]
                })}
                </div>
              </div>
            </div>
          </div>
          `
        })
        }
        </li>`
    })}
  </ul>`

  document.body.appendChild(imagesList)
})
