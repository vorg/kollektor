var persist = require("persist");
var type = persist.type;

module.exports = persist.define("Tag", {
  "name": type.STRING
});
