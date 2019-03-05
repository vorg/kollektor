const request = require('d3-request')
const path = require('path')
const R = require('ramda')
const rs = require('@thi.ng/rstream')
const tx = require('@thi.ng/transducers')
const { updateDOM } = require('@thi.ng/transducers-hdom')

const renderStream = rs.stream()

const debug = require('debug')
debug.enable('kollektor-client')
const log = debug('kollektor-client')

const server = 'http://' + document.location.host
const state = {
  items: [],
  itemsByFolder: {},
  folders: [],
  columnWidth: 0,
  columns: [],
  urlpath: document.location.pathname.split('/')
}

function extractHost (url) {
  if (!url || url === '') return 'Unknown'
  var slashPosition = url.indexOf('/', url.indexOf('//') + 3)
  if (slashPosition === -1) slashPosition = url.length
  return url.substr(0, slashPosition)
}

function folderElem (folder, folderItems) {
  const item = folderItems[0]
  const thumbUrl = `${server}/api/get/thumb/${item.path}`
  const tagUrl = `${server}/tag/${toAlphaNumeric(folder)}`
  return ['div', { class: 'fl pr2 pb2 dim pointer', style: { width: state.columnWidth } },
    ['a', { href: tagUrl, class: 'no-underline black' },
      ['div', { class: 'flex flex-row bg-white' },
        ['div', {
          style: {
            'min-width': '2.2em',
            'background': `url('${thumbUrl}')`,
            'background-size': 'cover',
            'background-position': '50% 50%'
          }
        }],
        ['div', { class: 'pa2 truncate' }, folder]
      ]
    ]
  ]
}

function itemElem (item) {
  const imageUrl = `${server}/api/get/image/${item.path}`
  const thumbUrl = `${server}/api/get/thumb/${item.path}`
  return ['div', { class: 'hide-child relative' },
    ['a', { href: imageUrl },
      ['img', { src: thumbUrl }]
    ],
    ['div', { class: 'absolute top-0 w-100' },
      ['div', { class: 'bg-white ma1 child' },
        ['a',
          { href: item.referer, class: 'no-underline underline-hover gray pa1 f6 db' },
          extractHost(item.referer)
        ],
        ['a',
          { href: item.referer, class: 'no-underline underline-hover gray pa1 f5 db link' },
          ['h2', { class: 'ma0 fw3 near-black' }, item.title]
        ],
        ['div', { class: 'pa1 f6' },
          (item.tags || []).map((tag, index) => {
            const comma = (index < item.tags.length - 1) ? ', ' : null
            return ['a',
              { href: `/tag/${tag}`, class: 'red no-underline underline-hover' },
              tag, comma
            ]
          })
        ]
      ]
    ]
  ]
}

function app () {
  const marginTop = `calc(${Math.ceil(state.folders.length / state.columns.length)} * 2.8em);`
  return ['div',
    ['ul', { class: 'list ma0 pa0 pl2 pt2 code black-70 fw2 overflow-auto fixed w-100 z-1 bg-light-gray f6' },
      state.folders.map((folder) => folderElem(folder, state.itemsByFolder[folder]))
    ],
    ['ul', { class: 'list ma0 pa0 pl2 pt2 helvetica fw2 overflow-auto', style: { 'padding-top': marginTop } },
      state.columns.map((column) => ['li', { class: 'fl pr2', style: { width: state.columnWidth } },
        column.items.map((item) => itemElem(item))
      ])
    ]
  ]
}

rs.sync({
  src: {
    render: renderStream
  },
  reset: false
}).transform(
  tx.map(app),
  updateDOM({ root: document.body })
)

function render () {
  log('render')
  renderStream.next(0)
}

const folderName = (item) => path.dirname(item.path)
const toAlphaNumeric = (s) => s.replace(/[^0-9a-z]/gi, '_')

log('Trying to request items')
request.json(`${server}/api/get/items`, (err, items) => {
  log('Items', err, items)

  state.items = items.reverse().map((item) => ({
    ...item,
    title: path.basename(item.path),
    folder: folderName(item),
    tags: [toAlphaNumeric(folderName(item))]
  }))

  let index = 0
  const maxImagesLimit = 50

  const numColumns = Math.ceil(window.innerWidth / 300)
  const columnWidth = `${100 / numColumns}%`
  const columns = []

  for (let i = 0; i < numColumns; i++) {
    // const elem = bel`<li class="fl pr2" style="width:${columnWidth}"></li>`
    columns.push({ items: [], height: 0 })
  }

  const itemsByFolder = R.groupBy(R.prop('folder'), state.items)
  const folders = Object.keys(itemsByFolder).slice(0, numColumns * 3 - 1)

  if (state.urlpath[1] === 'tag') {
    const tag = state.urlpath[2]
    state.items = state.items.filter((item) => item.tags.includes(tag))
  }

  console.log('state', state.items)

  state.itemsByFolder = itemsByFolder
  state.folders = folders
  state.columnWidth = columnWidth
  state.columns = columns

  function loadMore () {
    let i = 0
    while (i < maxImagesLimit) {
      if (index > state.items.length - 1) break
      addImage(state.items[index])
      i++
      index++
    }
  }

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
      render()
    }
  })

  render()
  loadMore()

  function addImage (item) {
    const column = findMinColumn()
    column.items.push(item)
    column.height += 1

    // const jsonUrl = `${server}/api/get/info/${item.path}`
    // request.json(jsonUrl, (err, item) => {
    // })
    render()
  }
})
