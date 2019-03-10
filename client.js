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

const urlpath = document.location.pathname.split('/')
const server = 'http://' + document.location.host
const state = {
  items: [],
  itemsByFolder: {},
  folders: [],
  columnWidth: 0,
  columns: [],
  filterTag: (urlpath[1] === 'tag') ? urlpath[2] : null
}

window.state = state
window.render = render

function extractHost (url) {
  if (!url || url === '') return 'Unknown'
  var slashPosition = url.indexOf('/', url.indexOf('//') + 3)
  if (slashPosition === -1) slashPosition = url.length
  return url.substr(0, slashPosition)
}

function onFolderClick (event) {
  if (event.shiftKey) {
    event.preventDefault()
    event.stopPropagation()
    var name = event.currentTarget.dataset.name
    const folder = R.find(R.propEq('name', name), state.folders)
    folder.selected = !folder.selected

    window.localStorage.selectedFolders = JSON.stringify(R.pluck('name', state.folders.filter(R.propEq('selected', true))))
    render()
  }
}

function folderElem (folder) {
  const item = folder.items[0]
  const thumbUrl = (item && item.path) ? `${server}/api/get/thumb/${item.path}` : (item ? item.src : '')
  const tagUrl = `${server}/tag/${folder.tag}`
  const bg = folder.dragOver ? 'bg-light-green' : 'bg-white'
  const color = folder.dragOver ? 'black' : 'black'
  let action = folder.action
  if (!action && state.expandFolders) {
    action = onFolderClick
  }
  const opacity = (folder.selected && state.expandFolders) ? 'o-50' : ''
  const wholebg = (folder.selected && state.expandFolders) ? 'bg-green' : ''
  return ['div', {
    class: `fl pr2 pb2 dim pointer`,
    style: { width: state.columnWidth }
  },
    ['a', {
      href: tagUrl,
      class: `no-underline black ${color} ${wholebg} dib w-100`,
      'data-name': folder.name,
      ondragenter: onDragEnter,
      ondragover: onDragOver,
      ondragleave: onDragLeave,
      ondrop: onDrop,
      onclick: action
    },
      ['div', { class: `flex flex-row ${bg} no-pointer-events ${opacity}` },
        ['div', {
          style: {
            'min-width': '2.2em',
            'background': `url('${thumbUrl}')`,
            'background-size': 'cover',
            'background-position': '50% 50%'
          }
        }],
        ['div', { class: 'pa2 truncate' }, folder.name]
      ]
    ]
  ]
}

function onDragStart (event) {
  let elem = event.target
  let path = elem.dataset.path
  if (!path) {
    elem = elem.parentElement
  }
  const item = R.find(R.propEq('path', path), state.items)
  if (!item.selected) {
    state.items.forEach((item) => {
      item.selected = false
    })
  }

  log('onDragStart', path, event.target, event, item)
  event.dataTransfer.setData('text/plain', path)
  event.dataTransfer.dropEffect = 'move'

  const img = event.target.querySelector('img')
  event.dataTransfer.setDragImage(img, 10, 10)

  render()
}

function onDragEnter (event) {
  const name = event.srcElement.dataset.name
  log('onDragEnter', event, name)

  state.folders.forEach((folder) => {
    folder.dragOver = folder.name === name
  })
  event.preventDefault()

  render()
}

function onDragOver (event) {
  event.preventDefault()
}

function onDragLeave (event) {
  state.folders.forEach((folder) => {
    folder.dragOver = false
  })

  render()
}

function postData (url, data) {
  return window.fetch(url, {
    method: 'POST', // or 'PUT'
    body: JSON.stringify(data), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
  // .then(response => console.log('Success:', JSON.stringify(response)))
  // .catch(error => console.error('Error:', error))
}

function onDrop (event) {
  console.log('event', event)
  event.preventDefault()
  const path = event.dataTransfer.getData('text/plain')
  let folderName = event.srcElement.dataset.name
  const item = R.find(R.propEq('path', path), state.items)
  const folder = R.find(R.propEq('name', folderName), state.folders)
  log('drop', item, 'to', folderName)
  const moveImageUrl = `${server}/api/move/image`

  if (folder.dropAction) {
    folderName = folder.dropAction(event)
    render()
    if (!folderName) {
      return
    }
  }

  let dropItems = null
  if (item.selected) {
    dropItems = state.items.filter(R.propEq('selected', true))
  } else {
    dropItems = [item]
  }

  onDragLeave(event)

  log('folders after drop', state.folders)

  dropItems.forEach((item) => {
    const moveData = { from: item.path, to: item.path.replace(item.folder, folderName) }
    log('dropping item', moveData)
    postData(moveImageUrl, moveData).then((res) => {
      console.log('done', res)
      if (res.error) {
        return
      }
      const newFolder = R.find(R.propEq('name', folderName), state.folders)
      const oldFolder = R.find(R.propEq('name', item.folder), state.folders)
      // TODO: mutation
      item.tags = item.tags.filter((t) => t !== oldFolder.tag)
      item.tags.push(newFolder.tag)
      item.folder = newFolder.name
      item.selected = false
      item.path = moveData.to
      oldFolder.items.splice(oldFolder.items.indexOf(item), 1)
      newFolder.items.unshift(item)
      log('newFolder', newFolder)
      render()
    })
  })
}

function onItemClick (event) {
  if (event.shiftKey) {
    event.preventDefault()
    event.stopPropagation()
    var path = event.currentTarget.dataset.path
    const item = R.find(R.propEq('path', path), state.items)
    // TODO: mutation
    item.selected = !item.selected
    render()
  }
}

function itemElem (item) {
  const imageUrl = `${server}/api/get/image/${item.path}`
  const thumbUrl = `${server}/api/get/thumb/${item.path}`
  const opacity = item.selected ? ' o-50' : ''
  const dn = item.selected ? 'dn' : ''
  const bg = item.selected ? 'bg-green' : ''
  return ['div', {
    class: 'hide-child relative ' + bg,
    draggable: true,
    ondragstart: onDragStart,
    onclick: [onItemClick, { capture: true }],
    'data-path': item.path
  },
    ['a', { href: imageUrl, class: 'no-drag ' + opacity },
      ['img', { src: thumbUrl, class: 'no-drag' }]
    ],
    ['div', { class: 'absolute top-0 w-100 ' + dn },
      ['div', { class: 'bg-white ma1 child' },
        ['a',
          { href: item.referer, class: 'no-drag no-underline underline-hover gray pa1 f6 db' },
          extractHost(item.referer)
        ],
        ['a',
          { href: item.referer, class: 'no-drag no-underline underline-hover gray pa1 f5 db link' },
          ['h2', { class: 'ma0 fw3 near-black' }, item.title]
        ],
        ['div', { class: 'pa1 f6' },
          (item.tags || []).map((tag, index) => {
            const comma = (index < item.tags.length - 1) ? ', ' : null
            return ['a',
              { href: `/tag/${tag}`, class: 'no-drag red no-underline underline-hover' },
              tag, comma
            ]
          })
        ]
      ]
    ]
  ]
}

function app () {
  let folders = state.folders.slice(0, state.folders.length - 2)
  let selectedFolders = folders.filter(R.propEq('selected', true))
  let numFoldersToShow = state.expandFolders ? folders.length : state.columns.length * 3 - 2
  if (folders.length > numFoldersToShow) {
    folders = folders.slice(0, numFoldersToShow)
  }
  if (!state.expandFolders && selectedFolders.length) {
    folders = selectedFolders
  }
  // add button
  folders.push(state.folders[state.folders.length - 2])
  // more button
  folders.push(state.folders[state.folders.length - 1])
  const marginTop = state.expandFolders ? 0 : `calc(${Math.ceil(folders.length / state.columns.length)} * 2.8em);`

  const fixedHeader = state.expandFolders ? '' : 'fixed'

  return ['div',
    ['ul', { class: `list ma0 pa0 pl2 pt2 code black-70 fw2 overflow-auto ${fixedHeader} w-100 z-1 bg-light-gray f6` },
      folders.map((folder) => folderElem(folder))
    ],
    ['ul', { class: 'list ma0 pa0 pl2 pt2 helvetica fw2 overflow-auto', style: { 'padding-top': marginTop } },
      state.columns.map((column) => ['li', { class: 'fl pr2', style: { width: state.columnWidth } },
        column.items
        .filter((item) => !state.filterTag || item.tags.includes(state.filterTag))
        .map((item) => itemElem(item))
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

  state.items = items.reverse().map((item, i) => ({
    ...item,
    id: `item-${i}`,
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

  const selectedFolders = JSON.parse(window.localStorage.selectedFolders || '[]')
  const itemsByFolder = R.groupBy(R.prop('folder'), state.items)
  const folders = Object.keys(itemsByFolder)
  .map((folder) => ({
    name: folder,
    tag: toAlphaNumeric(folder),
    items: itemsByFolder[folder],
    dragOver: false,
    selected: selectedFolders.includes(folder)
  }))
  console.log(folders, selectedFolders)

  if (state.filterTag) {
    state.items = state.items.filter((item) => item.tags.includes(state.filterTag))
  }

  console.log('state', state)

  console.log('folders', folders, itemsByFolder)

  folders.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })

  folders.push({
    name: 'Add',
    dropAction: (event) => {
      console.log('drop action', event)
      var name = window.prompt('Folder Name')
      name = name.replace(/[^a-zA-Z0-9 _!]/g, '_')
      console.log('drop action', name)
      event.preventDefault()
      event.stopPropagation()
      if (!name) {
        return
      }
      var folder = state.folders.find(R.propEq('name', name))
      if (folder) {
        folder.selected = true
        window.localStorage.selectedFolders = JSON.stringify(R.pluck('name', state.folders.filter(R.propEq('selected', true))))
        console.log('reusing folder', folder)
        return name
      }
      folder = {
        name: name,
        tag: toAlphaNumeric(name),
        items: [],
        selected: true
      }
      console.log('creating folder', folder)
      state.folders.unshift(folder)
      window.localStorage.selectedFolders = JSON.stringify(R.pluck('name', state.folders.filter(R.propEq('selected', true))))
      console.log(state.folders)
      render()
      return name
    },
    action: (event) => {
      event.preventDefault()
      event.stopPropagation()
      window.alert('Drop images here')
    },
    items: [
      { src: '/style/plus.png' }
    ]
  })
  folders.push({
    name: 'More...',
    action: (event) => {
      state.expandFolders = !state.expandFolders
      render()
      event.preventDefault()
      event.stopPropagation()
    },
    items: [
      { src: '/style/dot.png' }
    ]
  })

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
