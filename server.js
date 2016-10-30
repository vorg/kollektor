const commander = require('commander')
const pacakge = require('./package.json')

commander
  .version(pacakge.version)
  .usage('[options] <dir>')
  .option('-p, --port [value]', 'Server port')
  .parse(process.argv)

const port = commander.port || 3000
const dir = commander.args[0]

if (!dir) {
  commander.help()
  process.exit(-1)
}

console.log(`Starting Kollektor from dir: "${dir}" on port http://localhost:${port}`)
