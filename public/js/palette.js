(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./main.js":[function(require,module,exports){
var sys = require('pex-sys');
var geom = require('pex-geom');
var color = require('pex-color');

var Platform = sys.Platform;
var Vec3 = geom.Vec3;
var Octree = geom.Octree;
var Color = color.Color;

Color.fromBytes = function(r, g, b, a) {
  return new Color(r/255, g/255, b/255, a/255);
}

function Pixels() {

}

Pixels.fromImage = function(src, cb) {
  if (Platform.isPlask) {
    var SkCanvas = require('plask').SkCanvas;
    var img = SkCanvas.createFromImage(src);
    var w = img.width;
    var h = img.height;
    var n = w * h;
    var pixels = [];
    for(var i=0; i<n; i++) {
      var b = img[i*4+0];
      var g = img[i*4+1];
      var r = img[i*4+2];
      var a = img[i*4+3];
      var p = new Vec3(r, g, b);
      pixels.push(p);
    }
    cb(null, pixels);
  }
  else if (Platform.isBrowser) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);

      var pixels = [];

      var imgData = ctx.getImageData(0, 0, c.width, c.height);
      for(var y = 0; y < imgData.height; y++) {
        for(var x = 0; x < imgData.width; x++) {
          var i = (x + y * imgData.width) * 4;
          var p = new Vec3(imgData.data[i], imgData.data[i+1], imgData.data[i+2]);
          pixels.push(p);
        }
      }
      cb(null, pixels);
    }
    img.src = src;
  }
}

function Palette() {

}

Palette.fromImage = function(src, cb) {
  Pixels.fromImage(src, function(err, pixels) {
    var octree = new Octree(new Vec3(0, 0, 0), new Vec3(255, 255, 255));
    for(var i=0; i<pixels.length; i++) {
      octree.add(pixels[i]);
    }

    var colors = [];
    var level = 1;
    var cells = getAllCellsAtLevel(octree.root, level);
    for(var i=0; i<cells.length; i++) {
      var c = getAveragePoint(cells[i]);
      colors.push({
        color: Color.fromBytes(c.x, c.y, c.z, 255),
        numPoints: cells[i].points.length
      });
    }
    colors.sort(function(a, b) {
      return b.numPoints - a.numPoints;
    });
    cb(null, colors);
  })
}

function getAllCellsAtLevel(cell, level, result) {
  result = result || [];
  if (cell.level == level) {
    if (cell.points.length > 0)
      result.push(cell);
    return result;
  }
  else {
    for(var i=0; i<cell.children.length; i++) {
      getAllCellsAtLevel(cell.children[i], level, result);
    }
    return result;
  }
}

function getAveragePoint(cell) {
  var result = new Vec3(0, 0, 0);
  for(var i=0; i<cell.points.length; i++) {
    result.add(cell.points[i]);
  }
  result.scale(1/cell.points.length);
  return result;
}
window.Palette = Palette;

},{"pex-color":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/index.js","pex-geom":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/index.js","pex-sys":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/index.js","plask":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/lib/_empty.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/lib/_empty.js":[function(require,module,exports){

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/path-browserify/index.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/process/browser.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/index.js":[function(require,module,exports){
module.exports.Color = require('./lib/Color');
},{"./lib/Color":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/lib/Color.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/lib/Color.js":[function(require,module,exports){
//Color utility class

//## Example use
//     var Color = require('pex-color').Color;
//
//     var red = new Color(1.0, 0.0, 0.0, 1.0);
//     var green = Color.fromHSL(0.2, 1.0, 0.0, 0.5);

//## Reference

//Dependencies imports
var lerp = require('lerp');

//### Color(r, g, b, a)  
//RGBA color constructor  
//`r` - red component *{ Number 0..1 }* = 0  
//`g` - green component *{ Number 0..1 }* = 0  
//`b` - blue component *{ Number 0..1 }* = 0  
//`a` - alpha component *{ Number 0..1 }* = 1
function Color(r, g, b, a) {
  this.r = (r !== undefined) ? r : 0;
  this.g = (g !== undefined) ? g : 0;
  this.b = (b !== undefined) ? b : 0;
  this.a = (a !== undefined) ? a : 1;
}

//### create(r, g, b, a)  
//RGBA color constructor function  
//`r` - red component *{ Number 0..1 }* = 0  
//`g` - green component *{ Number 0..1 }* = 0  
//`b` - blue component *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1
Color.create = function(r, g, b, a) {
  return new Color(r, g, b, a);
};

//### fromRGB(r, g, b, a)  
//Alias for create(r, g, b, a)
Color.fromRGB = Color.create;

//### fromArray(a)  
//Creates new color from array of 4 values [r, g, b, a]  
//`a` - array of rgba values *{ Array of Numbers 0..1 }* = [0, 0, 0, 1]
Color.fromArray = function(a) {
 return new Color(a[0], a[1], a[2], a[3]);
};

//### fromHSV(h, s, v, a)
//Creates new color from hue, saturation and value  
//`h` - hue *{ Number 0..1 }* = 0  
//`s` - saturation *{ Number 0..1 }* = 0  
//`v` - value *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1
Color.fromHSV = function(h, s, v, a) {
  var c = new Color();
  c.setHSV(h, s, v, a);
  return c;
};

//### fromHSL(h, s, l, a)
//Creates new color from hue, saturation and lightness  
//`h` - hue *{ Number 0..1 }* = 0  
//`s` - saturation *{ Number 0..1 }* = 0  
//`l` - lightness *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1
Color.fromHSL = function(h, s, l, a) {
  var c = new Color();
  c.setHSL(h, s, l, a);
  return c;
};

//### fromHex(hex)  
//Creates new color from html hex value e.g. #FF0000  
//`hex` - html hex color string (with or without #) *{ String }*
Color.fromHex = function(hex) {
  var c = new Color();
  c.setHex(hex);
  return c;
};

//### fromXYZ(x, y, z)  
//Creates new color from XYZ representation  
//x - *{ Number 0..1 }*  
//y - *{ Number 0..1 }*  
//z - *{ Number 0..1 }*  
Color.fromXYZ = function(x, y, z) {
  var c = new Color();
  c.setXYZ(x, y, z);
  return c;
};

//### fromLab(l, a, b)  
//Creates new color from Lab representation  
//l - *{ Number 0..100 }*  
//a - *{ Number -128..127 }*  
//b - *{ Number -128..127 }*  
Color.fromLab = function(l, a, b) {
  var c = new Color();
  c.setLab(l, a, b);
  return c;
};

//### set(r, g, b, a)  
//`r` - red component *{ Number 0..1 }* = 0  
//`g` - green component *{ Number 0..1 }* = 0  
//`b` - blue component *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1
Color.prototype.set = function(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = (a !== undefined) ? a : 1;

  return this;
};

//### setHSV(h, s, l, a)  
//Sets rgb color values from a hue, saturation, value and alpha  
//`h` - hue *{ Number 0..1 }* = 0  
//`s` - saturation *{ Number 0..1 }* = 0  
//`v` - value *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1  
Color.prototype.setHSV = function(h, s, v, a) {
  a = a || 1;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: this.r = v; this.g = t; this.b = p; break;
    case 1: this.r = q; this.g = v; this.b = p; break;
    case 2: this.r = p; this.g = v; this.b = t; break;
    case 3: this.r = p; this.g = q; this.b = v; break;
    case 4: this.r = t; this.g = p; this.b = v; break;
    case 5: this.r = v; this.g = p; this.b = q; break;
  }

  this.a = a;
  return this;
};

//### getHSV()  
//Returns hue, saturation, value and alpha of color as  
//*{ Object h:0.1, s:0..1, v:0..1, a:0..1 }*  
Color.prototype.getHSV = function() {
  var r = this.r;
  var g = this.g;
  var b = this.b;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h;
  var v = max;
  var d = max - min;
  var s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  }
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h, s: s, v: v, a: this.a };
};

//### setHSL(h, s, l, a)  
//Sets rgb color values from a hue, saturation, lightness and alpha  
//`h` - hue *{ Number 0..1 }* = 0  
//`s` - saturation *{ Number 0..1 }* = 0  
//`l` - lightness *{ Number 0..1 }* = 0  
//`a` - alpha opacity *{ Number 0..1 }* = 1  
//Based on [https://gist.github.com/mjijackson/5311256](https://gist.github.com/mjijackson/5311256)
Color.prototype.setHSL = function(h, s, l, a) {
  a = a || 1;

  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }

  if (s === 0) {
    this.r = this.g = this.b = l; // achromatic
  }
  else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    this.r = hue2rgb(p, q, h + 1/3);
    this.g = hue2rgb(p, q, h);
    this.b = hue2rgb(p, q, h - 1/3);
    this.a = a;
  }

  return this;
};

//### getHSL()  
//Returns hue, saturation, lightness and alpha of color as  
//*{ Object h:0.1, s:0..1, l:0..1, a:0..1 }*  
//Based on [https://gist.github.com/mjijackson/5311256](https://gist.github.com/mjijackson/5311256)
Color.prototype.getHSL = function() {
  var r = this.r;
  var g = this.g;
  var b = this.b;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var l = (max + min) / 2;
  var h;
  var s;

  if (max === min) {
    h = s = 0; // achromatic
  }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return { h: h, s: s, l: l, a: this.a };
};

//### setHex(hex)  
//Sets rgb color values from a html hex value e.g. #FF0000  
//`hex` - html hex color string (with or without #) *{ String }*
Color.prototype.setHex = function(hex) {
  hex = hex.replace(/^#/, "");
  var num = parseInt(hex, 16);

  var color = [ num >> 16, num >> 8 & 255, num & 255 ].map(function(val) {
    return val / 255;
  });

  this.r = color[0];
  this.g = color[1];
  this.b = color[2];

  return this;
};

//### getHex()  
//Returns html hex representation of this color *{ String }*
Color.prototype.getHex = function() {
  var color = [ this.r, this.g, this.b ].map(function(val) {
    return Math.floor(val * 255);
  });

  return "#" + ((color[2] | color[1] << 8 | color[0] << 16) | 1 << 24)
    .toString(16)
    .slice(1)
    .toUpperCase();
};


//### setXYZ(x, y, z)  
//Sets rgb color values from XYZ
//x - *{ Number 0..1 }*  
//y - *{ Number 0..1 }*  
//z - *{ Number 0..1 }*  
Color.prototype.setXYZ = function(x, y, z) {
  var rgb = {
    r: x *  3.2406 + y * -1.5372 + z * -0.4986,
    g: x * -0.9689 + y *  1.8758 + z *  0.0415,
    b: x *  0.0557 + y * -0.2040 + z *  1.0570
  };

  [ "r", "g", "b" ].forEach(function(key) {
    rgb[key] /= 100;

    if (rgb[key] < 0) {
      rgb[key] = 0;
    }

    if (rgb[key] > 0.0031308) {
      rgb[key] = 1.055 * Math.pow(rgb[key], (1 / 2.4)) - 0.055;
    }
    else {
      rgb[key] *= 12.92;
    }
  });

  this.r = rgb.r;
  this.g = rgb.g;
  this.b = rgb.b;
  this.a = 1.0;

  return this;
};

//### getXYZ()  
//Returns xyz representation of this color as  
//*{ Object x:0..1, y:0..1, z:0..1 }*  
Color.prototype.getXYZ = function() {
  var rgb = this.clone();

  [ "r", "g", "b" ].forEach(function(key) {
    if (rgb[key] > 0.04045) {
      rgb[key] = Math.pow(((rgb[key] + 0.055) / 1.055), 2.4);
    } else {
      rgb[key] /= 12.92;
    }

    rgb[key] = rgb[key] * 100;
  });

  return {
    x: rgb.r * 0.4124 + rgb.g * 0.3576 + rgb.b * 0.1805,
    y: rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722,
    z: rgb.r * 0.0193 + rgb.g * 0.1192 + rgb.b * 0.9505
  };
};

//### setLab(l, a, b)  
//Sets rgb color values from Lab  
//l - *{ Number 0..100 }*  
//a - *{ Number -128..127 }*  
//b - *{ Number -128..127 }*  
Color.prototype.setLab = function(l, a, b) {
  var y = (l + 16) / 116;
  var x = a / 500 + y;
  var z = y - b / 200;

  var xyz = { x: x, y: y, z: z };
  var pow;

  [ "x", "y", "z" ].forEach(function(key) {
    pow = Math.pow(xyz[key], 3);

    if (pow > 0.008856) {
      xyz[key] = pow;
    }
    else {
      xyz[key] = (xyz[key] - 16 / 116) / 7.787;
    }
  });

  var color = Color.fromXYZ(xyz.x, xyz.y, xyz.z);

  this.r = color.r;
  this.g = color.g;
  this.b = color.b;
  this.a = color.a;

  return this;
};

//### getLab()  
//Returns Lab representation of this color as  
//*{ Object l: 0..100, a: -128..127, b: -128..127 }*  
Color.prototype.getLab = function() {
  var white = { x: 95.047, y: 100.000, z: 108.883 };
  var xyz = this.getXYZ();

  [ "x", "y", "z" ].forEach(function(key) {
    xyz[key] /= white[key];

    if (xyz[key] > 0.008856) {
      xyz[key] = Math.pow(xyz[key], 1 / 3);
    }
    else {
      xyz[key] = (7.787 * xyz[key]) + (16 / 116);
    }
  });

  return {
    l: 116 * xyz.y - 16,
    a: 500 * (xyz.x - xyz.y),
    b: 200 * (xyz.y - xyz.z)
  };
};

//### copy()  
//Copies rgba values from another color into this instance  
//`c` - another color to copy values from *{ Color }*
Color.prototype.copy = function(c) {
  this.r = c.r;
  this.g = c.g;
  this.b = c.b;
  this.a = c.a;

  return this;
};

//### clone()  
//Returns a copy of this color *{ Color }*
Color.prototype.clone = function() {
  return new Color(this.r, this.g, this.b, this.a);
};

//### hash()  
//Returns one (naive) hash number representation of this color *{ Number }*
Color.prototype.hash = function() {
  return 1 * this.r + 12 * this.g + 123 * this.b + 1234 * this.a;
};

//### distance(color)  
//Returns distance (CIE76) between this and given color using Lab representation *{ Number }*  
//Based on [http://en.wikipedia.org/wiki/Color_difference](http://en.wikipedia.org/wiki/Color_difference)
Color.prototype.distance = function(color) {
  var lab1 = this.getLab();
  var lab2 = color.getLab();

  var dl = lab2.l - lab1.l;
  var da = lab2.a - lab1.a;
  var db = lab2.b - lab1.b;

  return Math.sqrt(dl * dl, da * da, db * db);
};

//### lerp(startColor, endColor, t, mode)  
//Creates new color from linearly interpolated two colors  
//`startColor` - *{ Color }*  
//`endColor` - *{ Color } *  
//`t` - interpolation ratio *{ Number 0..1 }*  
//`mode` - interpolation mode : 'rgb', 'hsv', 'hsl' *{ String }* = 'rgb'  
Color.lerp = function(startColor, endColor, t, mode) {
  mode = mode || 'rgb';

  if (mode === 'rgb') {
    return Color.fromRGB(
      lerp(startColor.r, endColor.r, t),
      lerp(startColor.g, endColor.g, t),
      lerp(startColor.b, endColor.b, t),
      lerp(startColor.a, endColor.a, t)
    );
  }
  else if (mode === 'hsv') {
    var startHSV = startColor.getHSV();
    var endHSV = endColor.getHSV();
    return Color.fromHSV(
      lerp(startHSV.h, endHSV.h, t),
      lerp(startHSV.s, endHSV.s, t),
      lerp(startHSV.v, endHSV.v, t),
      lerp(startHSV.a, endHSV.a, t)
    );
  }
  else if (mode === 'hsl') {
    var startHSL = startColor.getHSL();
    var endHSL = endColor.getHSL();
    return Color.fromHSL(
      lerp(startHSL.h, endHSL.h, t),
      lerp(startHSL.s, endHSL.s, t),
      lerp(startHSL.l, endHSL.l, t),
      lerp(startHSL.a, endHSL.a, t)
    );
  }
  else {
    return startColor;
  }
};

//## Predefined colors ready to use

Color.Transparent = new Color(0, 0, 0, 0);
Color.None = new Color(0, 0, 0, 0);
Color.Black = new Color(0, 0, 0, 1);
Color.White = new Color(1, 1, 1, 1);
Color.DarkGrey = new Color(0.25, 0.25, 0.25, 1);
Color.Grey = new Color(0.5, 0.5, 0.5, 1);
Color.LightGrey = new Color(0.75, 0.75, 0.75, 1);
Color.Red = new Color(1, 0, 0, 1);
Color.Green = new Color(0, 1, 0, 1);
Color.Blue = new Color(0, 0, 1, 1);
Color.Yellow = new Color(1, 1, 0, 1);
Color.Pink = new Color(1, 0, 1, 1);
Color.Cyan = new Color(0, 1, 1, 1);
Color.Orange = new Color(1, 0.5, 0, 1);

module.exports = Color;

},{"lerp":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/node_modules/lerp/index.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-color/node_modules/lerp/index.js":[function(require,module,exports){
function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}
module.exports = lerp
},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/index.js":[function(require,module,exports){
module.exports.Vec2 = require('./lib/Vec2');
module.exports.Vec3 = require('./lib/Vec3');
module.exports.Vec4 = require('./lib/Vec4');
module.exports.Mat4 = require('./lib/Mat4');
module.exports.Quat = require('./lib/Quat');
module.exports.Path = require('./lib/Path');
module.exports.Rect = require('./lib/Rect');
module.exports.Spline3D = require('./lib/Spline3D');
module.exports.Spline2D = require('./lib/Spline2D');
module.exports.Spline1D = require('./lib/Spline1D');
module.exports.Ray = require('./lib/Ray');
module.exports.Plane = require('./lib/Plane');
module.exports.Geometry = require('./lib/Geometry');
module.exports.BoundingBox = require('./lib/BoundingBox');
module.exports.Triangle2D = require('./lib/Triangle2D');
module.exports.Triangle3D = require('./lib/Triangle3D');
module.exports.Octree = require('./lib/Octree');
},{"./lib/BoundingBox":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/BoundingBox.js","./lib/Geometry":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Geometry.js","./lib/Mat4":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Mat4.js","./lib/Octree":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Octree.js","./lib/Path":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Path.js","./lib/Plane":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Plane.js","./lib/Quat":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Quat.js","./lib/Ray":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Ray.js","./lib/Rect":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Rect.js","./lib/Spline1D":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline1D.js","./lib/Spline2D":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline2D.js","./lib/Spline3D":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline3D.js","./lib/Triangle2D":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Triangle2D.js","./lib/Triangle3D":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Triangle3D.js","./lib/Vec2":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec2.js","./lib/Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js","./lib/Vec4":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec4.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/BoundingBox.js":[function(require,module,exports){
//A bounding box is a box with the smallest possible measure 
//(area for 2D or volume for 3D) for a given geometry or a set of points
//
//## Example use
//     var someGeometryMin = new Vec3(0, 0, 0)
//     var someGeometryMax = new Vec3(2, 2, 2);
//     var bbox = new BoundingBox(someGeometryMin, someGeometryMax);
//     console.log(bbox.getSize());
//     console.log(bbox.getCenter());
//
//## Reference
var Vec3 = require('./Vec3');

//### BoundingBox ( min, max )
//`min` - *{ [Vec3](Vec3.html) }*  
//`max` - *{ [Vec3](Vec3.html) }*  
function BoundingBox(min, max) {
  this.min = min;
  this.max = max;
}

//### fromPositionSize ( pos, size )
//`pos`  - The position of the enclosed geometry *{ [Vec3](Vec3.html) }*  
//`size` - Size of the enclosed geometry *{ [Vec3](Vec3.html) }*  
//returns *{ BoundingBox }*
BoundingBox.fromPositionSize = function(pos, size) {
  return new BoundingBox(Vec3.create(pos.x - size.x / 2,
                                     pos.y - size.y / 2,
                                     pos.z - size.z / 2),
                                     Vec3.create(pos.x + size.x / 2,
                                                 pos.y + size.y / 2,
                                                 pos.z + size.z / 2));
};

//### fromPoints ( points )
//`points` - Points in space that the bounding box will enclose *{ Array of *{ [Vec3](Vec3.html) }* }*  
//returns *{ BoundingBox }* 
BoundingBox.fromPoints = function(points) {
  var bbox = new BoundingBox(points[0].clone(), points[0].clone());
  points.forEach(bbox.addPoint.bind(bbox));
  return bbox;
};

//### isEmpty ()
//returns *{ Boolean }*
BoundingBox.prototype.isEmpty = function() {
  if (!this.min || !this.max) return true;
  else return false;
};

//### addPoint (p)
//`p` - point to be added to the enclosing space of the bounding box *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.addPoint = function(p) {
  if (this.isEmpty()) {
    this.min = p.clone();
    this.max = p.clone();
  }
  if (p.x < this.min.x) this.min.x = p.x;
  if (p.y < this.min.y) this.min.y = p.y;
  if (p.z < this.min.z) this.min.z = p.z;
  if (p.x > this.max.x) this.max.x = p.x;
  if (p.y > this.max.y) this.max.y = p.y;
  if (p.z > this.max.z) this.max.z = p.z;
};

//### getSize ()
//returns the size of the bounding box as a *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.getSize = function() {
  return Vec3.create(this.max.x - this.min.x,
                     this.max.y - this.min.y,
                     this.max.z - this.min.z);
};

//### getCenter ()
//returns the center of the bounding box as a *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.getCenter = function() {
  return Vec3.create(this.min.x + (this.max.x - this.min.x) / 2,
                     this.min.y + (this.max.y - this.min.y) / 2,
                     this.min.z + (this.max.z - this.min.z) / 2);
};

//### contains(p)
//returns true if point is inside the bounding box
BoundingBox.prototype.contains = function(p) {
  return p.x >= this.min.x
      && p.x <= this.max.x
      && p.y >= this.min.y
      && p.y <= this.max.y
      && p.z >= this.min.z
      && p.z <= this.max.z;
}

module.exports = BoundingBox;


},{"./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Geometry.js":[function(require,module,exports){
//A collection of vertices, vertex attributes and faces or edges defining a 3d shape.
//(area for 2D or volume for 3D) for a given geometry or a set of points
//
//## Example use
//      var vertices = [
//        new Vec3(0, 1, 0),
//        new Vec3(0, 0, 0),
//        new Vec3(1, 1, 0)
//      ];
//      var faces = [
//        new Face3(0, 1, 2)
//      ];
//
//      var geom = new Geometry({
//        vertices: vertices,
//        faces: faces
//      });
//      geom.computeNormals();
//
//      var material = new SolidColorMaterial();
//      var mesh = new Mesh(geom, material);
//
//Geometry can't be rendered by itself. First it has to be convertet to a Vbo. The Mesh from pex-glu class does it for us automaticaly.

//## Reference

var Vec3 = require('./Vec3');
var Ray = require('./Ray');
var BoundingBox = require('./BoundingBox');

//## Private utility functions

//where does this should go? geom.Utils expanded to geom?
function centroid(points) {
  var n = points.length;
  var center = points.reduce(function(center, p) {
    return center.add(p);
  }, new Vec3(0, 0, 0));
  center.scale(1 / points.length);
  return center;
}

function edgeLoop(edge, cb) {
  var curr = edge;

  var i = 0;
  do {
    cb(curr, i++);
    curr = next(curr);
  }
  while(curr != edge);
}

function vertexEdgeLoop(edge, cb) {
  var curr = edge;

  do {
    cb(curr);
    curr = prev(curr).opposite;
  }
  while(curr != edge);
}

function next(edge) {
  return edge.face.halfEdges[(edge.slot + 1) % edge.face.length]
}

function prev(edge) {
  return edge.face.halfEdges[(edge.slot - 1 + edge.face.length) % edge.face.length]
}

function elements(list, indices) {
  return indices.map(function(i) { return list[i]; })
}

function move(a, b, t) {
  return b.dup().sub(a).normalize().scale(t).add(a);
}

//### Geometry(o)  
//`o` - options *{ Object }*  
//Available options  
//`vertices` - *{ Array of Vec3 }* or *{ Boolean }* = false  
//`normals` - *{ Array of Vec3 }* or *{ Boolean }* = false  
//`texCoords` - *{ Array of Vec2 }* or *{ Boolean }* = false  
//`tangents` - *{ Array of Vec3 }* or *{ Boolean }* = false  
//`colors` - *{ Array of Color }* or *{ Boolean }* = false  
//`indices` - *{ Array of Int }* = []  
//`edges` - *{ Array of [Int, Int] }* = []  
//`faces` - *{ Array of [Int, Int, ...] }* = []

function Geometry(o) {
  o = o || {};
  this.attribs = {};

  if (o.vertices) this.addAttrib('vertices', 'position', o.vertices, false);
  if (o.normals) this.addAttrib('normals', 'normal', o.normals, false);
  if (o.texCoords) this.addAttrib('texCoords', 'texCoord', o.texCoords, false);
  if (o.tangents) this.addAttrib('tangents', 'tangent', o.tangents, false);
  if (o.colors) this.addAttrib('colors', 'color', o.colors, false);
  if (o.indices) this.addIndices(o.indices);
  if (o.edges) this.addEdges(o.edges);
  if (o.faces) this.addFaces(o.faces);
}

//### generateVolumePoints(numPoints)  
//`numPoints` - number of points to generate *{ Int }* = 5000  
//Generates poins inside of the geometry
Geometry.prototype.generateVolumePoints = function(numPoints) {
  numPoints = numPoints || 5000;

  var bbox = BoundingBox.fromPoints(this.vertices);
  var xMulti = -bbox.min.x + bbox.max.x;
  var yMulti = -bbox.min.y + bbox.max.y;
  var zMulti = -bbox.min.z + bbox.max.z;

  var pointsCounter = 0;
  var hits = [];
  var generatedPoints = [];

  for (var i=0; ; i++) {

    if (pointsCounter >= numPoints) break;

    var boxFace = (Math.floor(Math.random() * 6) + 1);

    var topX = bottomX = (Math.random() - 0.5) * xMulti;
    var topY = (Math.random() + 0.5) * yMulti;
    var topZ = bottomZ= (Math.random() - 0.5) * zMulti;
    var bottomY = -topY;

    var leftX =  -(Math.random() + 0.5) * xMulti;
    var leftY = rightY = (Math.random() - 0.5) * yMulti;
    var leftZ = rightZ = (Math.random() - 0.5) * zMulti;
    var rightX = -leftX;

    var backX = frontX = (Math.random() - 0.5) * xMulti;
    var backY = frontY = (Math.random() - 0.5) * yMulti;
    var backZ = -(Math.random() + 0.5) * zMulti;
    var frontZ = -backZ;

    switch (boxFace) {
      case 1:
        // left to right
        var A = new Vec3(leftX, leftY, leftZ);
      var B = new Vec3(rightX, rightY, rightZ);
      break;

      case 2:
        // right to left
        var A = new Vec3(rightX, rightY, rightZ);
      var B = new Vec3(leftX, leftY, leftZ);
      break;

      case 3:
        // top to bottom
        var A = new Vec3(topX, topY, topZ);
      var B = new Vec3(bottomX, bottomY, bottomY);
      break;

      case 4:
        // bottom to top
        var A = new Vec3(bottomX, bottomY, bottomZ);
      var B = new Vec3(topX, topY, topZ);
      break;

      case 5:
        // back to front
        var A = new Vec3(backX, backY, backZ);
      var B = new Vec3(frontX, frontY, frontZ);
      break;

      case 6:
        // front to back
        var A = new Vec3(frontX, frontY, frontZ);
      var B = new Vec3(backX, backY, backZ);
      break;

      default:
        break;
    }

    var rayOrigin = A.dup();
    var rayDirection = B.dup().sub(A).normalize();

    var triangulatedGeom = this.clone().triangulate();
    var counter = 0;
    var pointsForRay = [];

    triangulatedGeom.faces.forEach(function(face) {

      var triangle = {};
      triangle.a = triangulatedGeom.vertices[face[0]];
      triangle.b = triangulatedGeom.vertices[face[1]];
      triangle.c = triangulatedGeom.vertices[face[2]];

      var ray = new Ray(rayOrigin, rayDirection);
      var point = ray.hitTestTriangle(triangle);
      if (isNaN(point)) {
        pointsCounter++;
        counter++;
        pointsForRay.push(point);
      }

    });

    pointsForRay.forEach(function(point) {
      if (counter % 2 !== 0) return;
      hits.push(point);
   });

    if (hits.length < 2) continue;
    var pointA = hits[hits.length - 2];
    var pointB = hits[hits.length - 1];
    var direction = pointB.dup().sub(pointA);

    var randomPoint = pointA.dup().addScaled(direction, Math.random());
    generatedPoints.push(randomPoint);
  }

  return generatedPoints;

}

//### generateSurfacePoints(numPoints)  
//`numPoints` - number of points to generate *{ Int }* = 5000  
//Generates poins on the surface of the geometry
Geometry.prototype.generateSurfacePoints = function(numPoints) {
  numPoints = numPoints || 5000;

  var faceAreas = [];
  var triangles = [];

  for (var k=0, length=this.faces.length; k<length; k++) {

    var triangle = {};

    var AVertIndex = this.faces[k][0];
    var BVertIndex = this.faces[k][1];
    var CVertIndex = this.faces[k][2];

    var A = this.vertices[AVertIndex];
    var B = this.vertices[BVertIndex];
    var C = this.vertices[CVertIndex];

    var AB = B.dup().sub(A);
    var AC = C.dup().sub(A);

    var cross = AB.cross(AC);
    var area = 0.5 * Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);

    triangle.A = A;
    triangle.B = B;
    triangle.C = C;
    triangles.push(triangle);

    faceAreas.push(area);

  }

  var min = Math.min.apply( Math, faceAreas );
  var ratios = faceAreas.map(function(area) {
    return Math.ceil(area / min);
  });

  var chanceIndexes = [];
  ratios.forEach(function(ratio, i) {
    for (var k=0;k<ratio;k++) {
      chanceIndexes.push(i);
    }
  });

  var generatedPoints = [];
  for (var i=0; i<numPoints; i++) {

    var randomIndex = Math.ceil(Math.random() * chanceIndexes.length) - 1;
    var triangle = triangles[chanceIndexes[randomIndex]];
    var A = triangle.A.clone();
    var B = triangle.B.clone();
    var C = triangle.C.clone();

    var u = Math.random();
    var v = Math.random();

    if ((u + v) > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    var w = 1 - (u + v);

    var newA = A.dup().scale(u);
    var newB = B.dup().scale(v);
    var newC = C.dup().scale(w);

    var s = newA.add(newB).add(newC);

    generatedPoints.push(s);

  }

  return generatedPoints;
}

//### addAttribute(propertyName, attributeName, data, dynamic)  
//`propertyName` - geometry object property name *{ String }*  
//`attributeName` - shader attribute name *{ String }*  
//`data` - *{ Array of Vec2/Vec3/Vec4/Color }*  
//`dynamic` - is data static or updated every frame (dynamic) *{ Boolean }* = false  
//Adds addtribute
Geometry.prototype.addAttrib = function(propertyName, attributeName, data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this[propertyName] = data && data.length ? data : [];
  this[propertyName].name = attributeName;
  this[propertyName].dirty = true;
  this[propertyName].dynamic = dynamic;
  this.attribs[propertyName] = this[propertyName];
  return this;
};

//### addFaces(data, dynamic)  
//`data` - *{ Array of [Int, Int, .. ] }*  
//`dynamic` - is data static or updated every frame (dynamic) *{ Boolean }* = false  
//Adds faces index array
Geometry.prototype.addFaces = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.faces = data && data.length ? data : [];
  this.faces.dirty = true;
  this.faces.dynamic = false;
  return this;
};

//### addEdges(data, dynamic)  
//`data` - *{ Array of [Int, Int] }*  
//`dynamic` - is data static or updated every frame (dynamic) *{ Boolean }* = false  
//Adds edges index array
Geometry.prototype.addEdges = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.edges = data && data.length ? data : [];
  this.edges.dirty = true;
  this.edges.dynamic = false;
  return this;
};

//### addIndices(data, dynamic)  
//`data` - *{ Array of Int }*  
//`dynamic` - is data static or updated every frame (dynamic) *{ Boolean }* = false  
//Adds index array
Geometry.prototype.addIndices = function(data, dynamic) {
  if (data == null) {
    data = null;
  }
  if (dynamic == null) {
    dynamic = false;
  }
  this.indices = data && data.length ? data : [];
  this.indices.dirty = true;
  this.indices.dynamic = false;
  return this;
};

Geometry.prototype.isDirty = function(attibs) {
  var dirty = false;
  dirty || (dirty = this.faces && this.faces.dirty);
  dirty || (dirty = this.edges && this.edges.dirty);
  for (attribAlias in this.attribs) {
    var attrib = this.attribs[attribAlias];
    dirty || (dirty = attrib.dirty);
  }
  return dirty;
};

//### addEdge(a, b)  
//`a` - stating edge index *{ Int }*  
//`b` - ending edge index *{ Int }*  
//Computes unique edges from existing faces.
Geometry.prototype.addEdge = function(a, b) {
  if (!this.edges) {
    this.addEdges();
  }
  if (!this.edgeHash) {
    this.edgeHash = {};
  }
  var ab = a + '_' + b;
  var ba = b + '_' + a;
  if (!this.edgeHash[ab] && !this.edgeHash[ba]) {
    this.edges.push([a, b]);
    return this.edgeHash[ab] = this.edgeHash[ba] = true;
  }
};

//### computeEdges()
//Computes unique edges from existing faces.
Geometry.prototype.computeEdges = function() {
  if (!this.edges) {
    this.addEdges();
  }
  else {
    this.edgeHash = null;
    this.edges.length = 0;
  }

  if (this.faces && this.faces.length) {
    this.faces.forEach(function(face) {
      for(var i=0; i<face.length; i++) {
        this.addEdge(face[i], face[(i+1)%face.length]);
      }
    }.bind(this));
  }
  else {
    for (var i=0; i<this.vertices.length-1; i++) {
      this.addEdge(i, i+1);
    }
  }
};

//### computeNormals()
//Computes per vertex normal by averaging the normals of faces connected with that vertex.
Geometry.prototype.computeNormals = function() {
  if (!this.faces) {
    throw 'Geometry[2]omputeSmoothNormals no faces found';
  }
  if (!this.normals) {
    this.addAttrib('normals', 'normal', null, false);
  }

  if (this.normals.length > this.vertices.length) {
    this.normals.length = this.vertices.length;
  }
  else {
    while (this.normals.length < this.vertices.length) {
      this.normals.push(new Vec3(0, 0, 0));
    }
  }

  var count = [];
  this.vertices.forEach(function(v, i) {
    count[i] = 0;
  }.bind(this));

  var ab = new Vec3();
  var ac = new Vec3();
  var n = new Vec3();

  this.faces.forEach(function(f) {
    var a = this.vertices[f[0]];
    var b = this.vertices[f[1]];
    var c = this.vertices[f[2]];
    ab.asSub(b, a).normalize();
    ac.asSub(c, a).normalize();
    n.asCross(ab, ac);
    for(var i=0; i<f.length; i++) {
      this.normals[f[i]].add(n);
      count[f[i]]++;
    }
  }.bind(this));

  this.normals.forEach(function(n, i) {
    n.normalize();
  });
  this.normals.dirty = true;
};

//### toFlatGeometry
//Builds a copy of this geomety with all faces separated. Useful for flat shading.
//returns new *{ Geometry }*  
Geometry.prototype.toFlatGeometry = function() {
  var g = new Geometry({ vertices: true, faces: true });

  var vertices = this.vertices;

  this.faces.forEach(function(face) {
    var newFace = [];
    face.forEach(function(vi) {
      newFace.push(g.vertices.length);
      g.vertices.push(vertices[vi]);
    });
    g.faces.push(newFace);
  });

  return g;
}

//### clone()
//Builds a copy of this geometry.  
//Currenlty only vertices, texCoords, faces and edges are copied.  
//returns new *{ Geometry }*
Geometry.prototype.clone = function() {
  var edges = null;
  var clonedAttribs = {};
  Object.keys(this.attribs).forEach(function(attribName) {
    var attrib = this.attribs[attribName];
    clonedAttribs[attribName] = attrib.map(function(v) {
      return v.dup ? v.dup() : v;
    })
  }.bind(this));
  clonedAttribs.faces = this.faces.map(function(f) { return f.slice(0); });
  clonedAttribs.edges = this.edges ? this.edges.map(function(e) { return e.slice(0); }) : null;
  return new Geometry(clonedAttribs);
}

///### merge(g)
//Returns new combined geometry. This is not a boolean operation, faces and vertices inside the mesh will be kept.
//`g` - another geometry to merge with *{ Geometry }*
Geometry.prototype.merge = function(g) {
  var edges = null;
  var mergedAttribs = {};
  Object.keys(this.attribs).forEach(function(attribName) {
    var myAttrib = this.attribs[attribName];
    var anotherAttrib = g.attribs[attribName];
    if (anotherAttrib) {
      mergedAttribs[attribName] = [];
      myAttrib.forEach(function(v) {
        mergedAttribs[attribName].push(v.dup ? v.dup() : v);
      })
      anotherAttrib.forEach(function(v) {
        mergedAttribs[attribName].push(v.dup ? v.dup() : v);
      })
    }
  }.bind(this));
  var myVerticesLength = this.vertices.length;
  if (this.faces && g.faces) {
    mergedAttribs.faces = [];
    this.faces.forEach(function(f) {
      mergedAttribs.faces.push(f.slice(0));
    });
    g.faces.forEach(function(f) {
      var newFace = f.map(function(fi) { return fi + myVerticesLength; })
      mergedAttribs.faces.push(newFace);
    })
  }
  if (this.edges && g.edges) {
    mergedAttribs.edges = [];
    this.edges.forEach(function(f) {
      mergedAttribs.edges.push(f.slice(0));
    });
    g.edges.forEach(function(e) {
      var newEdge = e.map(function(ei) { return ei + myVerticesLength; })
      mergedAttribs.edges.push(newEdge);
    })
  }
  return new Geometry(mergedAttribs);
}

//### triangulate()
//Splits all the faces into triangles. Non destructive operation.  
//returns new *{ Geometry }*
Geometry.prototype.triangulate = function() {
  var g = this.clone();
  g.faces = [];
  this.faces.forEach(function(face) {
    g.faces.push([face[0],face[1],face[2]]);
    for(var i=2; i<face.length-1; i++) {
      g.faces.push([face[0],face[i],face[i+1]]);
    }

  });
  return g;
}

//computeHalfEdges()
//Computes half edges used for efficient geometry operations.  
//returns new *{ Array of half edge objects }*  
//Based on ideas from  
//http://fgiesen.wordpress.com/2012/04/03/half-edges-redux/
Geometry.prototype.computeHalfEdges = function() {
  var halfEdges = this.halfEdges = [];
  var faces = this.faces;

  faces.forEach(function(face, faceIndex) {
    face.halfEdges = [];
    face.forEach(function(vertexIndex, i) {
      var v0 = vertexIndex;
      var v1 = face[(i + 1) % face.length];
      var halfEdge = {
        edgeIndex: halfEdges.length,
        face: face,
        faceIndex: faceIndex,
        //vertexIndex: vertexIndex,
        slot: i,
        opposite: null,
        v0: Math.min(v0, v1),
        v1: Math.max(v0, v1)
      };
      face.halfEdges.push(halfEdge);
      halfEdges.push(halfEdge);
    });
  });

  halfEdges.sort(function(a, b) {
    if (a.v0 > b.v0) return 1;
    else if (a.v0 < b.v0) return -1;
    else if (a.v1 > b.v1) return 1;
    else if (a.v1 < b.v1) return -1;
    else return 0;
  });

  for(var i=1; i<halfEdges.length; i++) {
    var prev = halfEdges[i-1];
    var curr = halfEdges[i];
    if (prev.v0 == curr.v0 && prev.v1 == curr.v1) {
      prev.opposite = curr;
      curr.opposite = prev;
    }
  }

  return halfEdges;
}

//### subdivideEdges()
//Non destructive operation edge subdivision.  
//Subdivides geometry by adding new point in the middle of each edge.  
//returns new *{ Geometry }*
Geometry.prototype.subdivideEdges = function() {
  var vertices = this.vertices;
  var faces = this.faces;

  var halfEdges = this.computeHalfEdges();

  var newVertices = vertices.map(function(v) { return v; });
  var newFaces = [];

  //edge points are an average of both edge vertices
  var edgePoints = [];
  //console.log('halfEdges', halfEdges.length, halfEdges.map(function(e) { return '' + (e.v0) + '-' + (e.v1); }));
  halfEdges.forEach(function(e) {
    if (!edgePoints[e.edgeIndex]) {
      var midPoint = centroid([
        vertices[e.face[e.slot]],
        vertices[next(e).face[next(e).slot]]
      ]);
      edgePoints[e.edgeIndex] = midPoint;
      edgePoints[e.opposite.edgeIndex] = midPoint;
      newVertices.push(midPoint);
    }
  });

  faces.forEach(function(face) {
    var newFace = [];
    edgeLoop(face.halfEdges[0], function(edge) {
      newFace.push(newVertices.indexOf(edgePoints[edge.edgeIndex]));
    });
    newFaces.push(newFace);
  });

  var visitedVertices = [];
  var verts = 0;
  halfEdges.forEach(function(e) {
    if (visitedVertices.indexOf(e.face[e.slot]) !== -1) return;
    visitedVertices.push(e.face[e.slot]);
    var neighborPoints = [];
    vertexEdgeLoop(e, function(edge) {
      neighborPoints.push(newVertices.indexOf(edgePoints[edge.edgeIndex]));
    });
    neighborPoints.forEach(function(point, i) {
      var nextPoint = neighborPoints[(i+1)%neighborPoints.length];
      newFaces.push([e.face[e.slot], point, nextPoint]);
    });
  });

  var g = new Geometry({ vertices: newVertices, faces: newFaces });
  g.computeEdges();

  return g;
}

//### getFaceVertices()
//Returns vertices for that face
//`face` - *{ Array of Int }*
//returns new *{ Array of Vec3 }*
Geometry.prototype.getFaceVertices = function(face) {
  return face.map(function(i) { return this.vertices[i]; }.bind(this));
}

//### catmullClark()
//Non destructive Catmull-Clark subdivision
//returns new *{ Geometry }*
//
//Catmull-Clark subdivision for half-edge meshes
//Based on http://en.wikipedia.org/wiki/Catmull–Clark_subdivision_surface
//TODO: Study Doo-Sabin scheme for new vertices 1/n*F + 1/n*R + (n-2)/n*v
//http://www.cse.ohio-state.edu/~tamaldey/course/784/note20.pdf
//
//The shady part at the moment is that we put all vertices together at the end and have to manually
//calculate offsets at which each vertex, face and edge point end up
Geometry.prototype.catmullClark = function() {
  var vertices = this.vertices;
  var faces = this.faces;
  var halfEdges = this.computeHalfEdges();

  //face points are an average of all face points
  var facePoints = faces.map(this.getFaceVertices.bind(this)).map(centroid);

  //edge points are an average of both edge vertices and center points of two neighbor faces
  var edgePoints = [];
  halfEdges.forEach(function(e) {
    if (!edgePoints[e.edgeIndex]) {
      var midPoint = centroid([
        vertices[e.v0],
        vertices[e.v1],
        facePoints[e.faceIndex],
        facePoints[e.opposite.faceIndex]
      ]);
      edgePoints[e.edgeIndex] = midPoint;
      edgePoints[e.opposite.edgeIndex] = midPoint;
    }
  });

  //vertex points are and average of neighbor edges' edge points and neighbor faces' face points
  var vertexPoints = [];
  halfEdges.map(function(edge) {
    var vertexIndex = faces[edge.faceIndex][edge.slot];
    var vertex = vertices[vertexIndex];
    if (vertexPoints[vertexIndex]) return;
    var neighborFacePoints = [];
    //vertexEdgeLoop(edge).map(function(edge) { return facePoints[edge.faceIndex] } )
    //vertexEdgeLoop(edge).map(function(edge) { return edge.face.facePoint } )
    //extract(facePoints, vertexEdgeLoop(edge).map(prop('faceIndex'))
    var neighborEdgeMidPoints = [];
    vertexEdgeLoop(edge, function(edge) {
      neighborFacePoints.push(facePoints[edge.faceIndex]);
      neighborEdgeMidPoints.push(centroid([vertices[edge.v0], vertices[edge.v1]]));
    });
    var facesCentroid = centroid(neighborFacePoints);
    var edgesCentroid = centroid(neighborEdgeMidPoints);

    var n = neighborFacePoints.length;
    var v = new Vec3(0, 0, 0);
    v.add(facesCentroid);
    v.add(edgesCentroid.dup().scale(2));
    v.add(vertex.dup().scale(n - 3));
    v.scale(1/n);

    vertexPoints[vertexIndex] = v;
  });

  //create list of points for the new mesh
  //vertx poitns and face points are unique
  var newVertices = vertexPoints.concat(facePoints);

  //halfEdge mid points are not (each one is doubled)
  halfEdges.forEach(function(e) {
    if (e.added > -1) return;
    e.added = newVertices.length;
    e.opposite.added = newVertices.length;
    newVertices.push(edgePoints[e.edgeIndex]);
  })

  var newFaces = [];
  var newEdges = [];

  //construct new faces from face point, two edges mid points and a vertex between them
  faces.forEach(function(face, faceIndex) {
    var facePointIndex = faceIndex + vertexPoints.length;
    edgeLoop(face.halfEdges[0], function(edge) {
      var edgeMidPointsIndex = edge.added;
      var nextEdge = next(edge);
      var nextEdgeVertexIndex = face[nextEdge.slot];
      var nextEdgeMidPointIndex = nextEdge.added;
      newEdges.push([facePointIndex, edgeMidPointsIndex]);
      newEdges.push([edgeMidPointsIndex, nextEdgeVertexIndex]);
      newFaces.push([facePointIndex, edgeMidPointsIndex, nextEdgeVertexIndex, nextEdgeMidPointIndex])
    });
  });

  return new Geometry({ vertices: newVertices, faces: newFaces, edges: newEdges });
}

//### catmullClark()
//Non destructive Doo-Sabin subdivision  
//`depth` - edge inset depth *{ Number }*  
//returns new *{ Geometry }*  
//Doo-Sabin subdivision as desribed in WIRE AND COLUMN MODELING
//http://repository.tamu.edu/bitstream/handle/1969.1/548/etd-tamu-2004A-VIZA-mandal-1.pdf  
Geometry.prototype.dooSabin = function(depth) {
  var vertices = this.vertices;
  var faces = this.faces;
  var halfEdges = this.computeHalfEdges();

  var newVertices = [];
  var newFaces = [];
  var newEdges = [];

  depth = depth || 0.1;

  var facePointsByFace = [];

  var self = this;

  faces.forEach(function(face, faceIndex) {
    var facePoints = facePointsByFace[faceIndex] = [];
    edgeLoop(face.halfEdges[0], function(edge) {
      var v = vertices[edge.face[edge.slot]];
      var p = centroid([
        v,
        centroid(elements(vertices, edge.face)),
        centroid(elements(vertices, [edge.v0, edge.v1])),
        centroid(elements(vertices, [prev(edge).v0, prev(edge).v1]))
      ]);
      facePoints.push(newVertices.length);
      newVertices.push(move(v, p, depth));
      //newVertices.push(p);
    });
    return facePoints;
  });

  //face face
  faces.forEach(function(face, faceIndex) {
    newFaces.push(facePointsByFace[faceIndex]);
  });

  halfEdges.forEach(function(edge, edgeIndex) {
    if (edge.edgeVisited) return;

    edge.edgeVisited = true;
    edge.opposite.edgeVisited = true;

    //edge face
    var e0 = edge;
    var e1 = next(e0.opposite);
    var e2 = e0.opposite;
    var e3 = next(e0);
    var newFace = [
      facePointsByFace[e0.faceIndex][e0.slot],
      facePointsByFace[e1.faceIndex][e1.slot],
      facePointsByFace[e2.faceIndex][e2.slot],
      facePointsByFace[e3.faceIndex][e3.slot]
    ];
    newFaces.push(newFace);
    newEdges.push([newFace[0], newFace[3]]);
    newEdges.push([newFace[1], newFace[2]]);
  });

  halfEdges.forEach(function(edge, edgeIndex) {
    if (edge.vertexVisited) return;

    //vertex face
    var vertexFace = [];
    vertexEdgeLoop(edge, function(e) {
      e.vertexVisited = true;
      vertexFace.push(facePointsByFace[e.faceIndex][e.slot])
    });
    newFaces.push(vertexFace)
    vertexFace.forEach(function(i, index) {
      newEdges.push([i, vertexFace[(index+1)%vertexFace.length]]);
    });
  });

  return new Geometry({ vertices: newVertices, faces: newFaces, edges: newEdges });
}

//### catmullClark(edgeDepth, insetDepth)
//Non destructive wire modelling.
//`edgeDepth` - how thick should be the edge *{ Number }*
//`insetDepth` - how deeply inside should be the edge *{ Number }*
//returns new *{ Geometry }*
//Mesh wire modelling as described in where each edge is replaced by a column
//http://repository.tamu.edu/bitstream/handle/1969.1/548/etd-tamu-2004A-VIZA-mandal-1.pdf  
Geometry.prototype.wire = function(edgeDepth, insetDepth) {
  insetDepth = (insetDepth != null) ? insetDepth : (edgeDepth || 0.1);
  edgeDepth = edgeDepth || 0.1;
  var newGeom = this.dooSabin(edgeDepth);
  newGeom.computeNormals();
  var halfEdges = newGeom.computeHalfEdges();
  var innerGeom = this.dooSabin(edgeDepth);
  innerGeom.computeNormals();

  //shrink the inner geometry
  innerGeom.vertices.forEach(function(v, vi) {
    v.sub(innerGeom.normals[vi].dup().scale(insetDepth));
  });

  //remove middle faces
  var cutFaces = newGeom.faces.splice(0, this.faces.length);
  innerGeom.faces.splice(0, this.faces.length);

  var vertexOffset = newGeom.vertices.length;

  //add inner vertices to new geom
  innerGeom.vertices.forEach(function(v, vi) {
    newGeom.vertices.push(v);
  });

  //add inner faces to new geom
  innerGeom.faces.forEach(function(f) {
    newGeom.faces.push(f.map(function(vi) {
      return vi + vertexOffset;
    }).reverse());
  });

  //add inner edges to new geom
  innerGeom.edges.forEach(function(e) {
    newGeom.edges.push(e.map(function(vi) {
      return vi + vertexOffset;
    }));
  });

  cutFaces.forEach(function(face) {
    edgeLoop(face.halfEdges[0], function(e) {
      var pe = prev(e);
      newGeom.faces.push([
        pe.face[pe.slot],
        e.face[e.slot],
        e.face[e.slot] + vertexOffset,
        pe.face[pe.slot] + vertexOffset
      ]);

      newGeom.edges.push([
        pe.face[pe.slot],
        pe.face[pe.slot] + vertexOffset
      ]);

      newGeom.edges.push([
        e.face[e.slot],
        e.face[e.slot] + vertexOffset
      ]);
    });
  });

  return newGeom;
}

//### extrude(height, faceIndices, shrink)
//Non destructive face extrusion.
//, faceIndices, shrink
//`height` - how much to extrude along the normal *{ Number }*  
//`faceIndices` - indices of faces to extrude *{ Array of Int }*  
//`shrink` - how much to shring new extruded face, 0 - at all, 1 - will create point *{ Number }*  
//returns new *{ Geometry }*
Geometry.prototype.extrude = function(height, faceIndices, shrink) {
  height = height || 0.1;
  shrink = shrink || 0;
  if (!faceIndices) faceIndices = this.faces.map(function(face, faceIndex) { return faceIndex; });
  var g = this.clone();
  var halfEdges = g.computeHalfEdges();

  var ab = new Vec3();
  var ac = new Vec3();
  var faceNormal = new Vec3();
  var tmp = new Vec3();

  faceIndices.forEach(function(faceIndex) {
    var face = g.faces[faceIndex];
    var faceVerts = elements(g.vertices, face);
    var faceTexCoords = g.texCoords ? elements(g.texCoords, face) : null;

    var a = faceVerts[0];
    var b = faceVerts[1];
    var c = faceVerts[2];
    ab.asSub(b, a).normalize();
    ac.asSub(c, a).normalize();
    faceNormal.asCross(ab, ac).normalize();
    faceNormal.scale(height);

    var newVerts = faceVerts.map(function(v) {
      return v.dup().add(faceNormal);
    });

    var newVertsIndices = [];

    newVerts.forEach(function(nv) {
      newVertsIndices.push(g.vertices.length);
      g.vertices.push(nv);
    });

    if (faceTexCoords) {
      var newTexCoords = faceTexCoords.map(function(tc) {
        return tc.dup();
      });

      newTexCoords.forEach(function(tc) {
        g.texCoords.push(tc);
      });
    }

    if (shrink) {
      var c = centroid(newVerts);
      newVerts.forEach(function(nv) {
        tmp.asSub(c, nv);
        tmp.scale(shrink);
        nv.add(tmp);
      })
    }

    //add new face for each extruded edge
    edgeLoop(face.halfEdges[0], function(e) {
      g.faces.push([
        face[e.slot],
        face[next(e).slot],
        newVertsIndices[next(e).slot],
        newVertsIndices[e.slot]
      ]);
    });

    //add edges
    if (g.edges) {
      newVertsIndices.forEach(function(i, index) {
        g.edges.push([i, face[index]]);
      });
      newVertsIndices.forEach(function(i, index) {
        g.edges.push([i, newVertsIndices[(index+1)%newVertsIndices.length]]);
      });
    }

    //push the old face outside
    newVertsIndices.forEach(function(nvi, i) {
      face[i] = nvi;
    });
  });

  return g;
}

///### transform(m)
//Returns new geometry with all vertices transform with the given matrix
//`m` - transformation matrix *{ Mat4 }*
Geometry.prototype.transform = function(m) {
  var g = this.clone();
  for(var i=0; i<g.vertices.length; i++) {
    g.vertices[i].transformMat4(m);
  }
  if (g.normals) {
    g.computeNormals();
  }
  return g;
}

module.exports = Geometry;

},{"./BoundingBox":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/BoundingBox.js","./Ray":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Ray.js","./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Mat4.js":[function(require,module,exports){
//A 4 by 4 for Matrix
//## Example use
//     var mat4 = new Mat4()
//     console.log(mat4)
//     // returns the matrix [1, 0, 0, 0,
//     //                     0, 1, 0, 0,
//     //                     0, 0, 1, 0,
//     //                     0, 0, 0, 1]
//
//## Reference
var Vec3 = require('./Vec3');

//### Mat4 ()
function Mat4() {
  this.reset();
}

//### create ()
//returns new *{ Mat4 }*
Mat4.create = function() {
  return new Mat4();
};

//### equals (m, tolerance)
//`m` - matrix for equals check *{ Mat4 }*  
//`tolerance` - the tolerance of comparance *{ Number }* = 0.0000001  
//returns *{ Boolean }*
Mat4.prototype.equals = function(m, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(m.a11 - this.a11) <= tolerance)
  && (Math.abs(m.a12 - this.a12) <= tolerance)
  && (Math.abs(m.a13 - this.a13) <= tolerance)
  && (Math.abs(m.a14 - this.a14) <= tolerance)
  && (Math.abs(m.a21 - this.a21) <= tolerance)
  && (Math.abs(m.a22 - this.a22) <= tolerance)
  && (Math.abs(m.a23 - this.a23) <= tolerance)
  && (Math.abs(m.a24 - this.a24) <= tolerance)
  && (Math.abs(m.a31 - this.a31) <= tolerance)
  && (Math.abs(m.a32 - this.a32) <= tolerance)
  && (Math.abs(m.a33 - this.a33) <= tolerance)
  && (Math.abs(m.a34 - this.a34) <= tolerance)
  && (Math.abs(m.a41 - this.a41) <= tolerance)
  && (Math.abs(m.a42 - this.a42) <= tolerance)
  && (Math.abs(m.a43 - this.a43) <= tolerance)
  && (Math.abs(m.a44 - this.a44) <= tolerance);
};

//### hash ()
//returns the hash of the matrix as *{ Number }*
Mat4.prototype.hash = function() {
  return this.a11 * 0.01 + this.a12 * 0.02
  + this.a13 * 0.03 + this.a14 * 0.04
  + this.a21 * 0.05 + this.a22 * 0.06
  + this.a23 * 0.07 + this.a24 * 0.08
  + this.a31 * 0.09 + this.a32 * 0.10
  + this.a33 * 0.11 + this.a34 * 0.12
  + this.a41 * 0.13 + this.a42 * 0.14
  + this.a43 * 0.15 + this.a44 * 0.16;
};

//### set4x4r ( a11 .. a44 )
//`a11` .. `a44` - all elements of the matrix *{ Number }*  
//returns the matrix *{ Mat4 }*
Mat4.prototype.set4x4r = function(a11, a12, a13, a14,
                                  a21, a22, a23, a24,
                                  a31, a32, a33, a34,
                                  a41, a42, a43, a44) {
  this.a11 = a11;
  this.a12 = a12;
  this.a13 = a13;
  this.a14 = a14;
  this.a21 = a21;
  this.a22 = a22;
  this.a23 = a23;
  this.a24 = a24;
  this.a31 = a31;
  this.a32 = a32;
  this.a33 = a33;
  this.a34 = a34;
  this.a41 = a41;
  this.a42 = a42;
  this.a43 = a43;
  this.a44 = a44;
  return this;
};

//### copy ( m )
//`m` - the matrix to be copied onto this one *{ Mat4}*  
//returns the matrix *{ Mat4 }*
Mat4.prototype.copy = function(m) {
  this.a11 = m.a11;
  this.a12 = m.a12;
  this.a13 = m.a13;
  this.a14 = m.a14;
  this.a21 = m.a21;
  this.a22 = m.a22;
  this.a23 = m.a23;
  this.a24 = m.a24;
  this.a31 = m.a31;
  this.a32 = m.a32;
  this.a33 = m.a33;
  this.a34 = m.a34;
  this.a41 = m.a41;
  this.a42 = m.a42;
  this.a43 = m.a43;
  this.a44 = m.a44;
  return this;
};

//### dup ()
//returns a new copy of this matrix *{ Mat4 }*
Mat4.prototype.dup = function() {
  return Mat4.create().copy(this);
};

//### reset ()
//returns the matrix with reset values *{ Mat4 }*
Mat4.prototype.reset = function() {
  this.set4x4r(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  return this;
};

//### identity ()
//returns the matrix with reset values *{ Mat4 }*
Mat4.prototype.identity = function() {
  this.reset();
  return this;
};

//### mul4x4r ( b11 .. b44 )
//`b11` .. `b44` - multipliers *{ Number }*  
//returns the matrix with the new values after the multiplication *{ Mat4 }*
Mat4.prototype.mul4x4r = function(b11, b12, b13, b14,
                                  b21, b22, b23, b24,
                                  b31, b32, b33, b34,
                                  b41, b42, b43, b44) {
  var a11 = this.a11;
  var a12 = this.a12;
  var a13 = this.a13;
  var a14 = this.a14;
  var a21 = this.a21;
  var a22 = this.a22;
  var a23 = this.a23;
  var a24 = this.a24;
  var a31 = this.a31;
  var a32 = this.a32;
  var a33 = this.a33;
  var a34 = this.a34;
  var a41 = this.a41;
  var a42 = this.a42;
  var a43 = this.a43;
  var a44 = this.a44;
  this.a11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
  this.a12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
  this.a13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
  this.a14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
  this.a21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
  this.a22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
  this.a23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
  this.a24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
  this.a31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
  this.a32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
  this.a33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
  this.a34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
  this.a41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
  this.a42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
  this.a43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
  this.a44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
  return this;
};

//### perspective ( fovy, aspect, znear, zfar )
//`fovy` -  
//`aspect` -  
//`znear` -  
//`zfar` -  
//returns the matrix *{ Mat4 }*
Mat4.prototype.perspective = function(fovy, aspect, znear, zfar) {
  var f = 1.0 / Math.tan(fovy / 180 * Math.PI / 2);
  var nf = 1.0 / (zfar - znear);
  this.mul4x4r(f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0,
               -(zfar + znear) * nf,
               -2 * zfar * znear * nf, 0, 0, -1, 0);
  return this;
};

//### ortho ( l, r, b, t, n, f )
//
//returns the matrix *{ Mat4 }*
Mat4.prototype.ortho = function(l, r, b, t, n, f) {
  this.mul4x4r(2 / (r - l), 0, 0, (r + l) / (l - r), 0, 2 / (t - b),
               0, (t + b) / (b - t), 0, 0, 2 / (n - f), (f + n) / (n - f),
               0, 0, 0, 1);
  return this;
};

//### lookAt ( eye, target, up )
//`eye` - the eye to look from as a *{ [Vec3](Vec3.html) }*  
//`target` - the target to be looking at as a *{ [Vec3](Vec3.html) }*  
//`up` - the up vector *{ [Vec3](Vec3.html) }*  
//returns the matrix *{ Mat4 }*
Mat4.prototype.lookAt = function(eye, target, up) {
  var z = (Vec3.create(eye.x - target.x, eye.y - target.y, eye.z - target.z)).normalize();
  var x = (Vec3.create(up.x, up.y, up.z)).cross(z).normalize();
  var y = Vec3.create().copy(z).cross(x).normalize();
  this.mul4x4r(x.x, x.y, x.z, 0, y.x, y.y, y.z, 0, z.x, z.y, z.z, 0, 0, 0, 0, 1);
  this.translate(-eye.x, -eye.y, -eye.z);
  return this;
};

//### translate ( dx, dy, dz )
//`dx` - *{ Number }*  
//`dy` - *{ Number }*  
//`dz` - *{ Number }*  
//returns the matrix *{ Mat4 }*
Mat4.prototype.translate = function(dx, dy, dz) {
  this.mul4x4r(1, 0, 0, dx, 0, 1, 0, dy, 0, 0, 1, dz, 0, 0, 0, 1);
  return this;
};

//### rotate ( theta, x ,y , z )
//theta - rotation angle *{ Number }*  
//`x` - *{ Number }*  
//`y` - *{ Number }*  
//`z` - *{ Number }*  
//returns the matrix *{ Mat4 }*
Mat4.prototype.rotate = function(theta, x, y, z) {
  var s = Math.sin(theta);
  var c = Math.cos(theta);
  this.mul4x4r(x * x * (1 - c) + c, x * y * (1 - c) - z * s, x * z * (1 - c) + y * s,
               0, y * x * (1 - c) + z * s, y * y * (1 - c) + c, y * z * (1 - c) - x * s,
               0, x * z * (1 - c) - y * s, y * z * (1 - c) + x * s, z * z * (1 - c) + c,
               0, 0, 0, 0, 1);
  return this;
};

//### asMul ( a, b )
//`a` - the first matrix used in the multiplication *{ Mat4 }*  
//`b` - the second matrix used in the multiplication *{ Mat4 }*  
//returns the matrix with its values being  
//the result of the multiplied a and b matrices *{ Mat4 }*
Mat4.prototype.asMul = function(a, b) {
  var a11 = a.a11;
  var a12 = a.a12;
  var a13 = a.a13;
  var a14 = a.a14;
  var a21 = a.a21;
  var a22 = a.a22;
  var a23 = a.a23;
  var a24 = a.a24;
  var a31 = a.a31;
  var a32 = a.a32;
  var a33 = a.a33;
  var a34 = a.a34;
  var a41 = a.a41;
  var a42 = a.a42;
  var a43 = a.a43;
  var a44 = a.a44;
  var b11 = b.a11;
  var b12 = b.a12;
  var b13 = b.a13;
  var b14 = b.a14;
  var b21 = b.a21;
  var b22 = b.a22;
  var b23 = b.a23;
  var b24 = b.a24;
  var b31 = b.a31;
  var b32 = b.a32;
  var b33 = b.a33;
  var b34 = b.a34;
  var b41 = b.a41;
  var b42 = b.a42;
  var b43 = b.a43;
  var b44 = b.a44;
  this.a11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
  this.a12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
  this.a13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
  this.a14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
  this.a21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
  this.a22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
  this.a23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
  this.a24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
  this.a31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
  this.a32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
  this.a33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
  this.a34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
  this.a41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
  this.a42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
  this.a43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
  this.a44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
  return this;
};

//### mul ( b )
//`b` - the matrix to be multipled by *{ Mat4 }*  
//returns the matrix multiplied by b *{ Mat4 }*
Mat4.prototype.mul = function(b) {
  return this.asMul(this, b);
};

//### scale ( sx, sy, sz )
//`sx` = *{ Number }*  
//`sy` = *{ Number }*  
//`sz` = *{ Number }*  
//returns the matrix scaled *{ Mat4 }*
Mat4.prototype.scale = function(sx, sy, sz) {
  this.mul4x4r(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
  return this;
};

//### invert ()
//returns the matrix inverted *{ Mat4 }*
Mat4.prototype.invert = function() {
  var x0 = this.a11;
  var x1 = this.a12;
  var x2 = this.a13;
  var x3 = this.a14;
  var x4 = this.a21;
  var x5 = this.a22;
  var x6 = this.a23;
  var x7 = this.a24;
  var x8 = this.a31;
  var x9 = this.a32;
  var x10 = this.a33;
  var x11 = this.a34;
  var x12 = this.a41;
  var x13 = this.a42;
  var x14 = this.a43;
  var x15 = this.a44;
  var a0 = x0 * x5 - x1 * x4;
  var a1 = x0 * x6 - x2 * x4;
  var a2 = x0 * x7 - x3 * x4;
  var a3 = x1 * x6 - x2 * x5;
  var a4 = x1 * x7 - x3 * x5;
  var a5 = x2 * x7 - x3 * x6;
  var b0 = x8 * x13 - x9 * x12;
  var b1 = x8 * x14 - x10 * x12;
  var b2 = x8 * x15 - x11 * x12;
  var b3 = x9 * x14 - x10 * x13;
  var b4 = x9 * x15 - x11 * x13;
  var b5 = x10 * x15 - x11 * x14;
  var invdet = 1 / (a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0);
  this.a11 = (+x5 * b5 - x6 * b4 + x7 * b3) * invdet;
  this.a12 = (-x1 * b5 + x2 * b4 - x3 * b3) * invdet;
  this.a13 = (+x13 * a5 - x14 * a4 + x15 * a3) * invdet;
  this.a14 = (-x9 * a5 + x10 * a4 - x11 * a3) * invdet;
  this.a21 = (-x4 * b5 + x6 * b2 - x7 * b1) * invdet;
  this.a22 = (+x0 * b5 - x2 * b2 + x3 * b1) * invdet;
  this.a23 = (-x12 * a5 + x14 * a2 - x15 * a1) * invdet;
  this.a24 = (+x8 * a5 - x10 * a2 + x11 * a1) * invdet;
  this.a31 = (+x4 * b4 - x5 * b2 + x7 * b0) * invdet;
  this.a32 = (-x0 * b4 + x1 * b2 - x3 * b0) * invdet;
  this.a33 = (+x12 * a4 - x13 * a2 + x15 * a0) * invdet;
  this.a34 = (-x8 * a4 + x9 * a2 - x11 * a0) * invdet;
  this.a41 = (-x4 * b3 + x5 * b1 - x6 * b0) * invdet;
  this.a42 = (+x0 * b3 - x1 * b1 + x2 * b0) * invdet;
  this.a43 = (-x12 * a3 + x13 * a1 - x14 * a0) * invdet;
  this.a44 = (+x8 * a3 - x9 * a1 + x10 * a0) * invdet;
  return this;
};

//### transpose ()
//returns the matrix transposed *{ Mat4 }*
Mat4.prototype.transpose = function() {
  var a11 = this.a11;
  var a12 = this.a12;
  var a13 = this.a13;
  var a14 = this.a14;
  var a21 = this.a21;
  var a22 = this.a22;
  var a23 = this.a23;
  var a24 = this.a24;
  var a31 = this.a31;
  var a32 = this.a32;
  var a33 = this.a33;
  var a34 = this.a34;
  var a41 = this.a41;
  var a42 = this.a42;
  var a43 = this.a43;
  var a44 = this.a44;
  this.a11 = a11;
  this.a12 = a21;
  this.a13 = a31;
  this.a14 = a41;
  this.a21 = a12;
  this.a22 = a22;
  this.a23 = a32;
  this.a24 = a42;
  this.a31 = a13;
  this.a32 = a23;
  this.a33 = a33;
  this.a34 = a43;
  this.a41 = a14;
  this.a42 = a24;
  this.a43 = a34;
  this.a44 = a44;
  return this;
};

//### toArray ()
//returns the matrix as an array [a11 ... a44] *{ Array }*
Mat4.prototype.toArray = function() {
  return [
      this.a11, this.a21, this.a31, this.a41,
      this.a12, this.a22, this.a32, this.a42,
      this.a13, this.a23, this.a33, this.a43,
      this.a14, this.a24, this.a34, this.a44];
};

//### fromArray ()
//`a` - the array providing the values for the matrix *{ Array }*
//returns the matrix with values taken from the array *{ Mat4 }*
Mat4.prototype.fromArray = function(a) {
  this.a11 = a[0](this.a21 = a[1](this.a31 = a[2](this.a41 = a[3])));
  this.a12 = a[4](this.a22 = a[5](this.a32 = a[6](this.a42 = a[7])));
  this.a13 = a[8](this.a23 = a[9](this.a33 = a[10](this.a43 = a[11])));
  this.a14 = a[12](this.a24 = a[13](this.a34 = a[14](this.a44 = a[15])));
  return this;
};

module.exports = Mat4;


},{"./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Octree.js":[function(require,module,exports){
var geom = require('pex-geom');

var Vec3 = geom.Vec3;

//position is bottom left corner of the cell
function Octree(position, size, accuracy) {
  this.maxDistance = Math.max(size.x, Math.max(size.y, size.z));
  this.accuracy = 0;
  this.root = new Octree.Cell(this, position, size, 0);
}

Octree.fromBoundingBox = function (bbox) {
  return new Octree(bbox.min.clone(), bbox.getSize().clone());
};

Octree.MaxLevel = 8;

Octree.prototype.add = function (p, data) {
  this.root.add(p, data);
};

//check if the point was already added to the octreee
Octree.prototype.has = function (p) {
  return this.root.has(p);
};

//includeData - return both point and it's data, defaults to false
//maxDist - don't include points further than maxDist, defaults to Inifinity
//notSelf - return point only if different than submited point, defaults to false
Octree.prototype.findNearestPoint = function (p, options) {
  options.includeData = options.includeData ? options.includeData : false;
  options.bestDist = options.maxDist ? options.maxDist : Infinity;
  options.notSelf = options.notSelf ? options.notSelf : false;

  var result = this.root.findNearestPoint(p, options);
  if (result) {
    if (options.includeData) return result;
    else return result.point;
  }
  else return null;
};

Octree.prototype.findNearbyPoints = function (p, r, options) {
  options = options || { };
  var result = { points: [], data: [] };
  this.root.findNearbyPoints(p, r, result, options);
  return result;
};

Octree.prototype.getAllCellsAtLevel = function (cell, level, result) {
  if (typeof level == 'undefined') {
    level = cell;
    cell = this.root;
  }
  result = result || [];
  if (cell.level == level) {
    if (cell.points.length > 0) {
      result.push(cell);
    }
    return result;
  } else {
    cell.children.forEach(function (child) {
      this.getAllCellsAtLevel(child, level, result);
    }.bind(this));
    return result;
  }
};

Octree.Cell = function (tree, position, size, level) {
  this.tree = tree;
  this.position = position;
  this.size = size;
  this.level = level;
  this.points = [];
  this.data = [];
  this.temp = new Vec3(); //temp vector for distance calculation
  this.children = [];
};

Octree.Cell.prototype.has = function (p) {
  if (!this.contains(p))
    return null;
  if (this.children.length > 0) {
    for (var i = 0; i < this.children.length; i++) {
      var duplicate = this.children[i].has(p);
      if (duplicate) {
        return duplicate;
      }
    }
    return null;
  } else {
    var minDistSqrt = this.tree.accuracy * this.tree.accuracy;
    for (var i = 0; i < this.points.length; i++) {
      var o = this.points[i];
      var distSq = p.squareDistance(o);
      if (distSq <= minDistSqrt) {
        return o;
      }
    }
    return null;
  }
};

Octree.Cell.prototype.add = function (p, data) {
  this.points.push(p);
  this.data.push(data);
  if (this.children.length > 0) {
    this.addToChildren(p, data);
  } else {
    if (this.points.length > 1 && this.level < Octree.MaxLevel) {
      this.split();
    }
  }
};

Octree.Cell.prototype.addToChildren = function (p, data) {
  for (var i = 0; i < this.children.length; i++) {
    if (this.children[i].contains(p)) {
      this.children[i].add(p, data);
      break;
    }
  }
};

Octree.Cell.prototype.contains = function (p) {
  return p.x >= this.position.x - this.tree.accuracy
      && p.y >= this.position.y - this.tree.accuracy
      && p.z >= this.position.z - this.tree.accuracy
      && p.x < this.position.x + this.size.x + this.tree.accuracy
      && p.y < this.position.y + this.size.y + this.tree.accuracy
      && p.z < this.position.z + this.size.z + this.tree.accuracy;
};

// 1 2 3 4
// 5 6 7 8
Octree.Cell.prototype.split = function () {
  var x = this.position.x;
  var y = this.position.y;
  var z = this.position.z;
  var w2 = this.size.x / 2;
  var h2 = this.size.y / 2;
  var d2 = this.size.z / 2;
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y + h2, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y + h2, z), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x, y + h2, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  this.children.push(new Octree.Cell(this.tree, Vec3.create(x + w2, y + h2, z + d2), Vec3.create(w2, h2, d2), this.level + 1));
  for (var i = 0; i < this.points.length; i++) {
    this.addToChildren(this.points[i], this.data[i]);
  }
};

Octree.Cell.prototype.squareDistanceToCenter = function(p) {
  var dx = p.x - (this.position.x + this.size.x / 2);
  var dy = p.y - (this.position.y + this.size.y / 2);
  var dz = p.z - (this.position.z + this.size.z / 2);
  return dx * dx + dy * dy + dz * dz;
}

Octree.Cell.prototype.findNearestPoint = function (p, options) {
  var nearest = null;
  var nearestData = null;
  var bestDist = options.bestDist;

  if (this.points.length > 0 && this.children.length == 0) {
    for (var i = 0; i < this.points.length; i++) {
      var dist = this.points[i].distance(p);
      if (dist <= bestDist) {
        if (dist == 0 && options.notSelf)
          continue;
        bestDist = dist;
        nearest = this.points[i];
        nearestData = this.data[i];
      }
    }
  }

  var children = this.children;

  //traverse children in order from closest to furthest
  var children = this.children
    .map(function(child) { return { child: child, dist: child.squareDistanceToCenter(p) } })
    .sort(function(a, b) { return a.dist - b.dist; })
    .map(function(c) { return c.child; });

  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.points.length > 0) {
        if (p.x < child.position.x - bestDist || p.x > child.position.x + child.size.x + bestDist ||
            p.y < child.position.y - bestDist || p.y > child.position.y + child.size.y + bestDist ||
            p.z < child.position.z - bestDist || p.z > child.position.z + child.size.z + bestDist
          ) {
          continue;
        }
        var childNearest = child.findNearestPoint(p, options);
        if (!childNearest || !childNearest.point) {
          continue;
        }
        var childNearestDist = childNearest.point.distance(p);
        if (childNearestDist < bestDist) {
          nearest = childNearest.point;
          bestDist = childNearestDist;
          nearestData = childNearest.data;
        }
      }
    }
  }
  return {
    point: nearest,
    data: nearestData
  }
};

Octree.Cell.prototype.findNearbyPoints = function (p, r, result, options) {
  if (this.points.length > 0 && this.children.length == 0) {
    for (var i = 0; i < this.points.length; i++) {
      var dist = this.points[i].distance(p);
      if (dist <= r) {
        if (dist == 0 && options.notSelf)
          continue;
        result.points.push(this.points[i]);
        if (options.includeData) result.data.push(this.data[i]);
      }
    }
  }

  //children order doesn't matter
  var children = this.children;

  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.points.length > 0) {
        if (p.x < child.position.x - r || p.x > child.position.x + child.size.x + r ||
            p.y < child.position.y - r || p.y > child.position.y + child.size.y + r ||
            p.z < child.position.z - r || p.z > child.position.z + child.size.z + r
          ) {
          continue;
        }
        child.findNearbyPoints(p, r, result, options);
      }
    }
  }
};

module.exports = Octree;

},{"pex-geom":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/index.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Path.js":[function(require,module,exports){
//Path of points
//
//## Example use
//     var points = [
//       new Vec3(-1.5, -1.0, 0),
//       new Vec3(-0.5, -0.7, 0),
//       new Vec3( 0.5,  0.7, 0),
//       new Vec3( 1.5,  1.0, 0)
//     ]
//
//     var path = new Path(points)
//
//## Reference
var Vec3 = require('./Vec3');

//### Path ( points, closed )
//`points` - Array of points *{ Array of [Vec3](Vec3.html) }*  
//`closed` - is it a closed path or not? *{ Boolean }*
function Path(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 1000;
}

//### addPoint ( p )
//`p` - point as a *{ [Vec3](Vec3.html) }*  
//returns 
Path.prototype.addPoint = function(p) {
  return this.points.push(p);
  // shouldnt this return `this`?
};

//### getPoint ( t, debug )
//`t` -  
//`debug` -  what is this lol  
//returns point as a *{ [Vec3](Vec3.html) }*
Path.prototype.getPoint = function(t, debug) {
  var point = t * (this.points.length - 1);
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0 = intPoint;
  var c1 = intPoint + 1;
  if (intPoint === this.points.length - 1) {
    c0 = intPoint;
    c1 = intPoint;
  }
  var vec = new Vec3();
  vec.x = this.points[c0].x + (this.points[c1].x - this.points[c0].x) * weight;
  vec.y = this.points[c0].y + (this.points[c1].y - this.points[c0].y) * weight;
  vec.z = this.points[c0].z + (this.points[c1].z - this.points[c0].z) * weight;
  return vec;
};

//### getPointAt ( d )
//`d` - ?  
//returns point as a *{ [Vec3](Vec3.html) }*
Path.prototype.getPointAt = function(d) {
  if (!this.closed) {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var k = 0;
  for (var i=0; i<this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k, true);
};

//naive implementation
//### getClosestPoint ( point )
//Finds closest point to given point  
//`point` - point as a *{ [Vec3](Vec3.html) }*  
//returns point as a *{ [Vec3](Vec3.html) }*
Path.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

//### getClosestPointRatio ( point )
//`point` - point as a *{ [Vec3](Vec3.html) }*  
//returns 
Path.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

//### close ()
//
Path.prototype.close = function() {
  return this.closed = true;
};

//### isClosed ()
//returns *{ Boolean }*
Path.prototype.isClosed = function() {
  return this.closed;
};

//### reverse ()
//
Path.prototype.reverse = function() {
  this.points = this.points.reverse();
  return this.dirtyLength = true;
};

//### precalculateLength ()
//
Path.prototype.precalculateLength = function() {
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];

  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  var point = null;
  var prevPoint = null;

  for (var i=0; i<this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      totalLength += point.dup().sub(prevPoint).length();;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i=0; i<this.accumulatedLengths.length - 1; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  return this.dirtyLength = false;
};

module.exports = Path;


},{"./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Plane.js":[function(require,module,exports){
var Vec2 = require('./Vec2');
var Vec3 = require('./Vec3');

function Plane(point, normal) {
  this.point = point;
  this.normal = normal;
  this.u = new Vec3();
  this.v = new Vec3();
  this.updateUV();
}

Plane.prototype.set = function(point, normal) {
  this.point = point;
  this.normal = normal;
}

Plane.prototype.setPoint = function(point) {
  this.point = point;
}

Plane.prototype.setNormal = function(normal) {
  this.normal = normal;
}

Plane.prototype.project = function(p) {
  var D = Vec3.create().asSub(p, this.point);
  var scale = D.dot(this.normal);
  var scaled = this.normal.clone().scale(scale);
  var projected = p.clone().sub(scaled);
  return projected;
}

Plane.prototype.intersectRay = function(ray) {
  return ray.hitTestPlane(this.point, this.normal)[0];
}

Plane.prototype.updateUV = function() {
  if (Math.abs(this.normal.x) > Math.abs(this.normal.y)) {
    var invLen = 1 / Math.sqrt(this.normal.x * this.normal.x + this.normal.z * this.normal.z);
    this.u.set( this.normal.x * invLen, 0, -this.normal.z * invLen);
  }
  else {
    var invLen = 1 / Math.sqrt(this.normal.y * this.normal.y + this.normal.z * this.normal.z);
    this.u.set( 0, this.normal.z * invLen, -this.normal.y * invLen);
  }

  this.v.setVec3(this.normal).cross(this.u);
}

Plane.prototype.project = function(p) {
  var D = Vec3.create().asSub(p, this.point);
  var scale = D.dot(this.normal);
  var scaled = this.normal.clone().scale(scale);
  var projected = p.clone().sub(scaled);
  return projected;
}

Plane.prototype.rebase = function(p) {
  var diff = p.dup().sub(this.point);
  var x = this.u.dot(diff);
  var y = this.v.dot(diff);
  return new Vec2(x, y);
}

module.exports = Plane;
},{"./Vec2":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec2.js","./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Quat.js":[function(require,module,exports){
var Mat4 = require('./Mat4');
var Vec3 = require('./Vec3');
var kEpsilon = Math.pow(2, -24);

function Quat(x, y, z, w) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
  this.w = w != null ? w : 1;
}

Quat.create = function(x, y, z, w) {
  return new Quat(x, y, z, w);
};

Quat.fromArray = function(a) {
  return new Quat(a[0], a[1], a[2], a[3]);
}

Quat.prototype.identity = function() {
  this.set(0, 0, 0, 1);
  return this;
};

Quat.prototype.equals = function(q, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(q.x - this.x) <= tolerance) && (Math.abs(q.y - this.y) <= tolerance) && (Math.abs(q.z - this.z) <= tolerance) && (Math.abs(q.w - this.w) <= tolerance);
};

Quat.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z + 1234 * this.w;
};

Quat.prototype.copy = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

Quat.prototype.clone = function() {
  return new Quat(this.x, this.y, this.z, this.w);
};

Quat.prototype.dup = function() {
  return this.clone();
};

Quat.prototype.setAxisAngle = function(v, a) {
  a = a * 0.5;
  var s = Math.sin(a / 180 * Math.PI);
  this.x = s * v.x;
  this.y = s * v.y;
  this.z = s * v.z;
  this.w = Math.cos(a / 180 * Math.PI);
  return this;
};

Quat.prototype.setQuat = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

Quat.prototype.set = function(x, y, z, w) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Quat.prototype.asMul = function(p, q) {
  var px = p.x;
  var py = p.y;
  var pz = p.z;
  var pw = p.w;
  var qx = q.x;
  var qy = q.y;
  var qz = q.z;
  var qw = q.w;
  this.x = px * qw + pw * qx + py * qz - pz * qy;
  this.y = py * qw + pw * qy + pz * qx - px * qz;
  this.z = pz * qw + pw * qz + px * qy - py * qx;
  this.w = pw * qw - px * qx - py * qy - pz * qz;
  return this;
};

Quat.prototype.mul = function(q) {
  this.asMul(this, q);
  return this;
};

Quat.prototype.mul4 = function(x, y, z, w) {
  var ax = this.x;
  var ay = this.y;
  var az = this.z;
  var aw = this.w;
  this.x = w * ax + x * aw + y * az - z * ay;
  this.y = w * ay + y * aw + z * ax - x * az;
  this.z = w * az + z * aw + x * ay - y * ax;
  this.w = w * aw - x * ax - y * ay - z * az;
  return this;
};

Quat.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

Quat.prototype.normalize = function() {
  var len = this.length();
  if (len > kEpsilon) {
    this.x /= len;
    this.y /= len;
    this.z /= len;
    this.w /= len;
  }
  return this;
};

Quat.prototype.toMat4 = function(out) {
  var xs = this.x + this.x;
  var ys = this.y + this.y;
  var zs = this.z + this.z;
  var wx = this.w * xs;
  var wy = this.w * ys;
  var wz = this.w * zs;
  var xx = this.x * xs;
  var xy = this.x * ys;
  var xz = this.x * zs;
  var yy = this.y * ys;
  var yz = this.y * zs;
  var zz = this.z * zs;
  var m = out || new Mat4();
  return m.set4x4r(1 - (yy + zz), xy - wz, xz + wy, 0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx, 1 - (xx + yy), 0, 0, 0, 0, 1);
};

Quat.prototype.setDirection = function(direction, debug) {
  var dir = Vec3.create().copy(direction).normalize();

  var up = Vec3.create(0, 1, 0);

  var right = Vec3.create().asCross(up, dir);

  //if debug then console.log('right', right)

  if (right.length() == 0) {
    up.set(1, 0, 0)
    right.asCross(up, dir);
  }

  up.asCross(dir, right);
  right.normalize();
  up.normalize();

  if (debug) console.log('dir', dir);
  if (debug) console.log('up', up);
  if (debug) console.log('right', right);

  var m = new Mat4();
  m.set4x4r(
    right.x, right.y, right.z, 0,
    up.x, up.y, up.z, 0,
    dir.x, dir.y, dir.z, 0,
    0, 0, 0, 1
  );

  //Step 3. Build a quaternion from the matrix
  var q = new Quat()
  if (1.0 + m.a11 + m.a22 + m.a33 < 0.001) {
    if (debug) console.log('singularity');
    dir = direction.dup();
    dir.z *= -1;
    dir.normalize();
    up.set(0, 1, 0);
    right.asCross(up, dir);
    up.asCross(dir, right);
    right.normalize();
    up.normalize();
    m = new Mat4();
    m.set4x4r(
      right.x, right.y, right.z, 0,
      up.x, up.y, up.z, 0,
      dir.x, dir.y, dir.z, 0,
      0, 0, 0, 1
    );
    q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
    var dfWScale = q.w * 4.0;
    q.x = ((m.a23 - m.a32) / dfWScale);
    q.y = ((m.a31 - m.a13) / dfWScale);
    q.z = ((m.a12 - m.a21) / dfWScale);
    if (debug) console.log('dir', dir);
    if (debug) console.log('up', up);
    if (debug) console.log('right', right);

    q2 = new Quat();
    q2.setAxisAngle(new Vec3(0,1,0), 180)
    q2.mul(q);
    return q2;
  }
  q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
  dfWScale = q.w * 4.0;
  q.x = ((m.a23 - m.a32) / dfWScale);
  q.y = ((m.a31 - m.a13) / dfWScale);
  q.z = ((m.a12 - m.a21) / dfWScale);

  this.copy(q);
  return this;
}

Quat.prototype.slerp = function(qb, t) {
  var qa = this;

  // Calculate angle between the quaternions
  var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;

  // If qa=qb or qa=-qb then theta = 0 and we can return qa
  if (Math.abs(cosHalfTheta) >= 1.0){
    return this;
  }

  var halfTheta = Math.acos(cosHalfTheta);
  var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);

  // If theta = 180 degrees then result is not fully defined
  // we could rotate around any axis normal to qa or qb
  if (Math.abs(sinHalfTheta) < 0.001){ // fabs is floating point absolute
    this.w = (qa.w * 0.5 + qb.w * 0.5);
    this.x = (qa.x * 0.5 + qb.x * 0.5);
    this.y = (qa.y * 0.5 + qb.y * 0.5);
    this.z = (qa.z * 0.5 + qb.z * 0.5);
    return this;
  }

  var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
  var ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

  this.w = (qa.w * ratioA + qb.w * ratioB);
  this.x = (qa.x * ratioA + qb.x * ratioB);
  this.y = (qa.y * ratioA + qb.y * ratioB);
  this.z = (qa.z * ratioA + qb.z * ratioB);
  return this;
}

Quat.fromAxisAngle = function(v, a) {
  return new Quat().setAxisAngle(v, a);
}

Quat.fromDirection = function(direction) {
  return new Quat().setDirection(direction);
}


module.exports = Quat;

},{"./Mat4":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Mat4.js","./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Ray.js":[function(require,module,exports){
var Vec3 = require('./Vec3');

var EPSILON = 0.0001;

//A ray.  
//
//Consists of the starting point *origin* and the *direction* vector.  
//Used for collision detection.
//### Ray ( )
function Ray(origin, direction) {
  this.origin = origin || new Vec3(0, 0, 0);
  this.direction = direction || new Vec3(0, 0, 1);
}

//http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection
Ray.prototype.hitTestSphere = function (pos, r) {
  var hits = [];
  var d = this.direction;
  var o = this.origin;
  var osp = o.dup().sub(pos);
  var A = d.dot(d);
  if (A == 0) {
    return hits;
  }
  var B = 2 * osp.dot(d);
  var C = osp.dot(osp) - r * r;
  var sq = Math.sqrt(B * B - 4 * A * C);
  if (isNaN(sq)) {
    return hits;
  }
  var t0 = (-B - sq) / (2 * A);
  var t1 = (-B + sq) / (2 * A);
  hits.push(o.dup().add(d.dup().scale(t0)));
  if (t0 != t1) {
    hits.push(o.dup().add(d.dup().scale(t1)));
  }
  return hits;
};

//http://www.cs.princeton.edu/courses/archive/fall00/cs426/lectures/raycast/sld017.htm
//http://cgafaq.info/wiki/Ray_Plane_Intersection
Ray.prototype.hitTestPlane = function (pos, normal) {
  if (this.direction.dot(normal) == 0) {
    return [];
  }
  var t = normal.dup().scale(-1).dot(this.origin.dup().sub(pos)) / this.direction.dot(normal);
  return [this.origin.dup().add(this.direction.dup().scale(t))];
};

Ray.prototype.hitTestBoundingBox = function (bbox) {
  var hits = [];
  var self = this;
  function testFace(pos, size, normal, u, v) {
    var faceHits = self.hitTestPlane(pos, normal);
    if (faceHits.length > 0) {
      var hit = faceHits[0];
      if (hit[u] > pos[u] - size[u] / 2 && hit[u] < pos[u] + size[u] / 2 && hit[v] > pos[v] - size[v] / 2 && hit[v] < pos[v] + size[v] / 2) {
        hits.push(hit);
      }
    }
  }
  var bboxCenter = bbox.getCenter();
  var bboxSize = bbox.getSize();
  testFace(bboxCenter.dup().add(new Vec3(0, 0, bboxSize.z / 2)), bboxSize, new Vec3(0, 0, 1), 'x', 'y');
  testFace(bboxCenter.dup().add(new Vec3(0, 0, -bboxSize.z / 2)), bboxSize, new Vec3(0, 0, -1), 'x', 'y');
  testFace(bboxCenter.dup().add(new Vec3(bboxSize.x / 2, 0, 0)), bboxSize, new Vec3(1, 0, 0), 'y', 'z');
  testFace(bboxCenter.dup().add(new Vec3(-bboxSize.x / 2, 0, 0)), bboxSize, new Vec3(-1, 0, 0), 'y', 'z');
  testFace(bboxCenter.dup().add(new Vec3(0, bboxSize.y / 2, 0)), bboxSize, new Vec3(0, 1, 0), 'x', 'z');
  testFace(bboxCenter.dup().add(new Vec3(0, -bboxSize.y / 2, 0)), bboxSize, new Vec3(0, -1, 0), 'x', 'z');

  hits.forEach(function (hit) {
    hit._distance = hit.distance(self.origin);
  });

  hits.sort(function (a, b) {
    return a._distance - b._distance;
  });

  hits.forEach(function (hit) {
    delete hit._distance;
  });

  if (hits.length > 0) {
    hits = [hits[0]];
  }

  return hits;
};

//http://geomalgorithms.com/a06-_intersect-2.html#intersect3D_RayTriangle()
Ray.prototype.hitTestTriangle = function(triangle) {
  //Vector    u, v, n;              // triangle vectors
  //Vector    dir, w0, w;           // ray vectors
  //float     r, a, b;              // params to calc ray-plane intersect

  var ray = this;

  //// get triangle edge vectors and plane normal
  //u = T.V1 - T.V0;
  //v = T.V2 - T.V0;
  var u = triangle.b.dup().sub(triangle.a);
  var v = triangle.c.dup().sub(triangle.a);
  //n = u * v;              // cross product
  var n = Vec3.create().asCross(u, v);
  //if (n == (Vector)0)             // triangle is degenerate
  //    return -1;                  // do not deal with this case

  if (n.length() < EPSILON) return -1;

  //dir = R.P1 - R.P0;              // ray direction vector
  //w0 = R.P0 - T.V0;
  var w0 = ray.origin.dup().sub(triangle.a);

  //a = -dot(n,w0);
  //b = dot(n,dir);
  var a = -n.dot(w0);
  var b = n.dot(ray.direction);

  //if (fabs(b) < SMALL_NUM) {     // ray is  parallel to triangle plane
  //    if (a == 0)                 // ray lies in triangle plane
  //        return 2;
  //    else return 0;              // ray disjoint from plane
  //}
  if (Math.abs(b) < EPSILON) {
    if (a == 0) return -2;
    else return -3;
  }

  //// get intersect point of ray with triangle plane
  //r = a / b;
  //if (r < 0.0)                    // ray goes away from triangle
  //    return 0;                   // => no intersect
  //// for a segment, also test if (r > 1.0) => no intersect
  var r = a / b;
  if (r < -EPSILON) {
    return -4;
  }

  //*I = R.P0 + r * dir;            // intersect point of ray and plane
  var I = ray.origin.dup().add(ray.direction.dup().scale(r));

  //// is I inside T?
  //float    uu, uv, vv, wu, wv, D;
  //uu = dot(u,u);
  //uv = dot(u,v);
  //vv = dot(v,v);
  var uu = u.dot(u);
  var uv = u.dot(v);
  var vv = v.dot(v);

  //w = *I - T.V0;
  var w = I.dup().sub(triangle.a);

  //wu = dot(w,u);
  //wv = dot(w,v);
  var wu = w.dot(u);
  var wv = w.dot(v);

  //D = uv * uv - uu * vv;
  var D = uv * uv - uu * vv;

  //// get and test parametric coords
  //float s, t;
  //s = (uv * wv - vv * wu) / D;
  var s = (uv * wv - vv * wu) / D;

  //if (s < 0.0 || s > 1.0)         // I is outside T
  //    return 0;
  if (s < -EPSILON || s > 1.0 + EPSILON) return -5;

  //t = (uv * wu - uu * wv) / D;
  var t = (uv * wu - uu * wv) / D;

  //if (t < 0.0 || (s + t) > 1.0)  // I is outside T
  //    return 0;
  if (t < -EPSILON || (s + t) > 1.0 + EPSILON) {
    return -6;
  }

  //return { s: s, t : t};                       // I is in T

  return u.scale(s).add(v.scale(t)).add(triangle.a);
}

module.exports = Ray;

},{"./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Rect.js":[function(require,module,exports){
function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.set = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Rect.prototype.contains = function(point) {
  return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
};

module.exports = Rect;
},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline1D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html

//## Example use 
//
//     var points = [ 
//       -2, 
//       -1, 
//        1, 
//        2
//     ];
//
//     var spline = new Spline1D(points);
//
//     spline.getPointAt(0.25);

//## Reference

//### Spline1D ( points, [ closed ] )
//`points` - *{ Array of Vec3 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline1D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 2000;
}

//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
Spline1D.prototype.getPoint = function ( t ) {
  if (this.closed) {
    t = (t + 1 ) % 1;
  }
  else {
    t = Math.max(0, Math.min(t, 1));
  }

  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor( point );
  var weight = point - intPoint;

  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length ) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1 ) % points.length;
    c3 = (intPoint + 2 ) % points.length;
  }
  else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }

  return this.interpolate( points[ c0 ], points[ c1 ], points[ c2 ], points[ c3 ], weight );
}

//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec3 }* 
Spline1D.prototype.addPoint = function ( p ) {
  this.dirtyLength = true;
  this.points.push(p)
}

//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline1D.prototype.getPointAt = function ( d ) {
  if (this.closed) {
    d = (d + 1 ) % 1;
  }
  else {
    d = Math.max(0, Math.min(d, 1));
  }

  if (this.dirtyLength) {
    this.precalculateLength();
  }

  //TODO: try binary search
  var k = 0;
  for(var i=0; i<this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }

  return this.getPoint(k);
}

//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline1D.points.length)*
Spline1D.prototype.getPointAtIndex = function ( i ) {
  if (i < this.points.length) {
    return this.points[i];
  }
  else {
    return null;
  }
}

//### getNumPoints ( )
//Return number of base points in the spline
Spline1D.prototype.getNumPoints = function() {
  return this.points.length;
}

//### getLength ( )
//Returns the total length of the spline.
Spline1D.prototype.getLength = function() {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
}

//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline1D.prototype.precalculateLength = function() {
  var step = 1/this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];

  var point;
  var prevPoint;
  var k = 0;
  for(var i=0; i<this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);

    if (i > 0) {
      var len = Math.sqrt(1 + (point - prevPoint)*(point - prevPoint));
      totalLength += len;
    }

    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength)

    k += step;
  }

  for(var i=0; i<this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }

  this.length = totalLength;
  this.dirtyLength = false;
}

//### close ( )
//Closes the spline. It will form a closed now.
Spline1D.prototype.close = function( ) {
  this.closed = true;
}

//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline1D.prototype.isClosed = function() {
  return this.closed;
}

//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline1D.prototype.interpolate = function(p0, p1, p2, p3, t) {
  var v0 = ( p2 - p0 ) * 0.5;
  var v1 = ( p3 - p1 ) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
}

module.exports = Spline1D;

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline2D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html
//## Example use 
//
//     var points = [ 
//       new Vec2(-2,  0), 
//       new Vec2(-1,  0), 
//       new Vec2( 1,  1), 
//       new Vec2( 2, -1) 
//     ];
//
//     var spline = new Spline2D(points);
//
//     spline.getPointAt(0.25);
//## Reference

var Vec2 = require('./Vec2');

//### Spline2D ( points, [ closed ] )
//`points` - *{ Array of Vec2 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline2D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 100;
}
//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
//returns [Vec2](Vec2.html)
Spline2D.prototype.getPoint = function (t) {
  if (this.closed) {
    t = (t + 1) % 1;
  } else {
    t = Math.max(0, Math.min(t, 1));
  }
  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1) % points.length;
    c3 = (intPoint + 2) % points.length;
  } else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }
  var vec = new Vec2();
  vec.x = this.interpolate(points[c0].x, points[c1].x, points[c2].x, points[c3].x, weight);
  vec.y = this.interpolate(points[c0].y, points[c1].y, points[c2].y, points[c3].y, weight);
  return vec;
};
//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec2 }* 
Spline2D.prototype.addPoint = function (p) {
  this.dirtyLength = true;
  this.points.push(p);
};
//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline2D.prototype.getPointAt = function (d) {
  if (this.closed) {
    d = (d + 1) % 1;
  } else {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  //TODO: try binary search
  var k = 0;
  for (var i = 0; i < this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k);
};

//naive implementation
Spline2D.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

Spline2D.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline2D.points.length)*
Spline2D.prototype.getPointAtIndex = function (i) {
  if (i < this.points.length) {
    return this.points[i];
  } else {
    return null;
  }
};
//### getNumPoints ( )
//Return number of base points in the spline
Spline2D.prototype.getNumPoints = function () {
  return this.points.length;
};
//### getLength ( )
//Returns the total length of the spline.
Spline2D.prototype.getLength = function () {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
};
//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline2D.prototype.precalculateLength = function () {
  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];
  var point;
  var prevPoint;
  for (var i = 0; i < this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      var len = point.dup().sub(prevPoint).length();
      totalLength += len;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i = 0; i < this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  this.dirtyLength = false;
};
//### close ( )
//Closes the spline. It will form a closed now.
Spline2D.prototype.close = function () {
  this.closed = true;
};
//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline2D.prototype.isClosed = function () {
  return this.closed;
};
//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline2D.prototype.interpolate = function (p0, p1, p2, p3, t) {
  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
};

module.exports = Spline2D;
},{"./Vec2":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec2.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Spline3D.js":[function(require,module,exports){
//Camtull-Rom spline implementation  
//Inspired by code from [Tween.js][1]
//[1]: http://sole.github.com/tween.js/examples/05_spline.html
//## Example use 
//
//     var points = [ 
//       new Vec3(-2,  0, 0), 
//       new Vec3(-1,  0, 0), 
//       new Vec3( 1,  1, 0), 
//       new Vec3( 2, -1, 0) 
//     ];
//
//     var spline = new Spline3D(points);
//
//     spline.getPointAt(0.25);
//## Reference

var Vec3 = require('./Vec3');

//### Spline3D ( points, [ closed ] )
//`points` - *{ Array of Vec3 }* = [ ]  
//`closed` - is the spline a closed loop? *{ Boolean }* = false
function Spline3D(points, closed) {
  this.points = points || [];
  this.dirtyLength = true;
  this.closed = closed || false;
  this.samplesCount = 1000;
}
//### getPoint ( t )
//Gets position based on t-value.
//It is fast, but resulting points will not be evenly distributed.
//
//`t` - *{ Number } <0, 1>*
//returns [Vec3](Vec3.html)
Spline3D.prototype.getPoint = function (t) {
  if (this.closed) {
    t = (t + 1) % 1;
  } else {
    t = Math.max(0, Math.min(t, 1));
  }
  var points = this.points;
  var len = this.closed ? points.length : points.length - 1;
  var point = t * len;
  var intPoint = Math.floor(point);
  var weight = point - intPoint;
  var c0, c1, c2, c3;
  if (this.closed) {
    c0 = (intPoint - 1 + points.length) % points.length;
    c1 = intPoint % points.length;
    c2 = (intPoint + 1) % points.length;
    c3 = (intPoint + 2) % points.length;
  } else {
    c0 = intPoint == 0 ? intPoint : intPoint - 1;
    c1 = intPoint;
    c2 = intPoint > points.length - 2 ? intPoint : intPoint + 1;
    c3 = intPoint > points.length - 3 ? intPoint : intPoint + 2;
  }
  var vec = new Vec3();
  vec.x = this.interpolate(points[c0].x, points[c1].x, points[c2].x, points[c3].x, weight);
  vec.y = this.interpolate(points[c0].y, points[c1].y, points[c2].y, points[c3].y, weight);
  vec.z = this.interpolate(points[c0].z, points[c1].z, points[c2].z, points[c3].z, weight);
  return vec;
};
//### addPoint ( p )
//Adds point to the spline
//
//`p` - point to be added *{ Vec3 }* 
Spline3D.prototype.addPoint = function (p) {
  this.dirtyLength = true;
  this.points.push(p);
};
//### getPointAt ( d )
//Gets position based on d-th of total length of the curve.
//Precise but might be slow at the first use due to need to precalculate length.
//
//`d` - *{ Number } <0, 1>*
Spline3D.prototype.getPointAt = function (d) {
  if (this.closed) {
    d = (d + 1) % 1;
  } else {
    d = Math.max(0, Math.min(d, 1));
  }
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  //TODO: try binary search
  var k = 0;
  for (var i = 0; i < this.accumulatedLengthRatios.length; i++) {
    if (this.accumulatedLengthRatios[i] > d - 1/this.samplesCount) {
      k = this.accumulatedRatios[i];
      break;
    }
  }
  return this.getPoint(k);
};

//naive implementation
Spline3D.prototype.getClosestPoint = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p };
    }
    else return best;
  }, { dist: Infinity, point: null });
  return closesPoint.point;
}

Spline3D.prototype.getClosestPointRatio = function(point) {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  var closesPoint = this.precalculatedPoints.reduce(function(best, p, pIndex) {
    var dist = point.squareDistance(p);
    if (dist < best.dist) {
      return { dist: dist, point: p, index: pIndex };
    }
    else return best;
  }, { dist: Infinity, point: null, index: -1 });
  return this.accumulatedLengthRatios[closesPoint.index];
}

//### getTangentAt ( t )
Spline3D.prototype.getTangentAt = function(t) {
  var currT = (t < 0.99) ? t : t - 0.01;
  var nextT  = (t < 0.99) ? t + 0.01 : t;
  var p = this.getPointAt(currT);
  var np = this.getPointAt(nextT);
  return Vec3.create().asSub(np, p).normalize();
};
//### getPointAtIndex ( i )
//Returns position of i-th point forming the curve
//
//`i` - *{ Number } <0, Spline3D.points.length)*
Spline3D.prototype.getPointAtIndex = function (i) {
  if (i < this.points.length) {
    return this.points[i];
  } else {
    return null;
  }
};
//### getNumPoints ( )
//Return number of base points in the spline
Spline3D.prototype.getNumPoints = function () {
  return this.points.length;
};
//### getLength ( )
//Returns the total length of the spline.
Spline3D.prototype.getLength = function () {
  if (this.dirtyLength) {
    this.precalculateLength();
  }
  return this.length;
};
//### precalculateLength ( )
//Goes through all the segments of the curve and calculates total length and
//the ratio of each segment.
Spline3D.prototype.precalculateLength = function () {
  var step = 1 / this.samplesCount;
  var k = 0;
  var totalLength = 0;
  this.accumulatedRatios = [];
  this.accumulatedLengthRatios = [];
  this.accumulatedLengths = [];
  this.precalculatedPoints = [];
  var point;
  var prevPoint;
  for (var i = 0; i < this.samplesCount; i++) {
    prevPoint = point;
    point = this.getPoint(k);
    if (i > 0) {
      var len = point.dup().sub(prevPoint).length();
      totalLength += len;
    }
    this.accumulatedRatios.push(k);
    this.accumulatedLengths.push(totalLength);
    this.precalculatedPoints.push(point);
    k += step;
  }
  for (var i = 0; i < this.samplesCount; i++) {
    this.accumulatedLengthRatios.push(this.accumulatedLengths[i] / totalLength);
  }
  this.length = totalLength;
  this.dirtyLength = false;
};
//### close ( )
//Closes the spline. It will form a closed now.
Spline3D.prototype.close = function () {
  this.closed = true;
};
//### isClosed ( )
//Returns true if spline is closed (forms a closed) *{ Boolean }*
Spline3D.prototype.isClosed = function () {
  return this.closed;
};
//### interpolate ( p0, p1, p2, p3, t)
//Helper function to calculate Catmul-Rom spline equation  
//
//`p0` - previous value *{ Number }*  
//`p1` - current value *{ Number }*  
//`p2` - next value *{ Number }*  
//`p3` - next next value *{ Number }*  
//`t` - parametric distance between p1 and p2 *{ Number } <0, 1>*
Spline3D.prototype.interpolate = function (p0, p1, p2, p3, t) {
  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  var t2 = t * t;
  var t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
};

module.exports = Spline3D;
},{"./Vec3":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Triangle2D.js":[function(require,module,exports){
function sign(a, b, c) {
  return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
}

function Triangle2D(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

//http://stackoverflow.com/a/2049593
//doesn't properly handle points on the edge of the triangle
Triangle2D.prototype.contains = function (p) {
  var signAB = sign(this.a, this.b, p) < 0;
  var signBC = sign(this.b, this.c, p) < 0;
  var signCA = sign(this.c, this.a, p) < 0;
  return signAB == signBC && signBC == signCA;
};

//Calculates triangle area using Heron's formula
//http://en.wikipedia.org/wiki/Triangle#Using_Heron.27s_formula
Triangle2D.prototype.getArea = function() {
  var ab = this.a.distance(this.b);
  var ac = this.a.distance(this.c);
  var bc = this.b.distance(this.c);

  var s = (ab + ac + bc) / 2; //perimeter
  return Math.sqrt(s * (s - ab) * (s - ac) * (s - bc));
}


module.exports = Triangle2D;
},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Triangle3D.js":[function(require,module,exports){
function Triangle3D(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

//Calculates triangle area using Heron's formula
//http://en.wikipedia.org/wiki/Triangle#Using_Heron.27s_formula
Triangle3D.prototype.getArea = function() {
  var ab = this.a.distance(this.b);
  var ac = this.a.distance(this.c);
  var bc = this.b.distance(this.c);

  var s = (ab + ac + bc) / 2; //perimeter
  return Math.sqrt(s * (s - ab) * (s - ac) * (s - bc));
}

module.exports = Triangle3D;
},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec2.js":[function(require,module,exports){
function Vec2(x, y) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
}

Vec2.create = function(x, y) {
  return new Vec2(x, y);
};

Vec2.fromArray = function(a) {
  return new Vec2(a[0], a[1]);
}

Vec2.fromDirection = function(angle, dist) {
  return new Vec2().setDirection(angle, dist);
}

Vec2.prototype.set = function(x, y) {
  this.x = x;
  this.y = y;
  return this;
};

Vec2.prototype.setDirection = function(angle, dist) {
  dist = dist || 1;

  this.x = dist * Math.cos(angle / 360 * Math.PI * 2);
  this.y = dist * Math.sin(angle / 360 * Math.PI * 2);

  return this;
};

Vec2.prototype.equals = function(v, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance);
};

Vec2.prototype.hash = function() {
  return 1 * this.x + 12 * this.y;
};

Vec2.prototype.setVec2 = function(v) {
  this.x = v.x;
  this.y = v.y;
  return this;
};

Vec2.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  return this;
};

Vec2.prototype.sub = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  return this;
};

Vec2.prototype.scale = function(f) {
  this.x *= f;
  this.y *= f;
  return this;
};

Vec2.prototype.distance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Vec2.prototype.squareDistance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  return dx * dx + dy * dy;
};

Vec2.prototype.simpleDistance = function(v) {
  var dx = Math.abs(v.x - this.x);
  var dy = Math.abs(v.y - this.y);
  return Math.min(dx, dy);
};

Vec2.prototype.dot = function(b) {
  return this.x * b.x + this.y * b.y;
};

Vec2.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  return this;
};

Vec2.prototype.clone = function() {
  return new Vec2(this.x, this.y);
};

Vec2.prototype.dup = function() {
  return this.clone();
};

Vec2.prototype.asAdd = function(a, b) {
  this.x = a.x + b.x;
  this.y = a.y + b.y;
  return this;
};

Vec2.prototype.asSub = function(a, b) {
  this.x = a.x - b.x;
  this.y = a.y - b.y;
  return this;
};

Vec2.prototype.direction = function() {
  var rad = Math.atan2(this.y, this.x);
  var deg = rad * 180 / Math.PI;
  if (deg < 0) deg = 360 + deg;

  return deg;
};

Vec2.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.normalize = function() {
  var len = this.length();
  if (len > 0) {
    this.scale(1 / len);
  }
  return this;
};

Vec2.prototype.limit = function(s) {
  var len = this.length();

  if (len > s && len > 0) {
    this.scale(s / len);
  }

  return this;
};

Vec2.prototype.lerp = function(v, t) {
  this.x = this.x + (v.x - this.x) * t;
  this.y = this.y + (v.y - this.y) * t;
  return this;
}

Vec2.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + "}";
};

module.exports = Vec2;

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec3.js":[function(require,module,exports){
function Vec3(x, y, z) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
}

Vec3.create = function(x, y, z) {
  return new Vec3(x, y, z);
};

Vec3.fromArray = function(a) {
  return new Vec3(a[0], a[1], a[2]);
}

Vec3.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z;
};

Vec3.prototype.set = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vec3.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  this.z += v.z;
  return this;
};

Vec3.prototype.sub = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  this.z -= v.z;
  return this;
};

Vec3.prototype.scale = function(f) {
  this.x *= f;
  this.y *= f;
  this.z *= f;
  return this;
};

Vec3.prototype.distance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  var dz = v.z - this.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

Vec3.prototype.squareDistance = function(v) {
  var dx = v.x - this.x;
  var dy = v.y - this.y;
  var dz = v.z - this.z;
  return dx * dx + dy * dy + dz * dz;
};

Vec3.prototype.simpleDistance = function(v) {
  var dx = Math.abs(v.x - this.x);
  var dy = Math.abs(v.y - this.y);
  var dz = Math.abs(v.z - this.z);
  return Math.min(dx, dy, dz);
};

Vec3.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

Vec3.prototype.setVec3 = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

Vec3.prototype.clone = function() {
  return new Vec3(this.x, this.y, this.z);
};

Vec3.prototype.dup = function() {
  return this.clone();
};

Vec3.prototype.cross = function(v) {
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var vx = v.x;
  var vy = v.y;
  var vz = v.z;
  this.x = y * vz - z * vy;
  this.y = z * vx - x * vz;
  this.z = x * vy - y * vx;
  return this;
};

Vec3.prototype.dot = function(b) {
  return this.x * b.x + this.y * b.y + this.z * b.z;
};

Vec3.prototype.asAdd = function(a, b) {
  this.x = a.x + b.x;
  this.y = a.y + b.y;
  this.z = a.z + b.z;
  return this;
};

Vec3.prototype.asSub = function(a, b) {
  this.x = a.x - b.x;
  this.y = a.y - b.y;
  this.z = a.z - b.z;
  return this;
};

Vec3.prototype.asCross = function(a, b) {
  return this.copy(a).cross(b);
};

Vec3.prototype.addScaled = function(a, f) {
  this.x += a.x * f;
  this.y += a.y * f;
  this.z += a.z * f;
  return this;
};

Vec3.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

Vec3.prototype.lengthSquared = function() {
  return this.x * this.x + this.y * this.y + this.z * this.z;
};

Vec3.prototype.normalize = function() {
  var len = this.length();
  if (len > 0) {
    this.scale(1 / len);
  }
  return this;
};

Vec3.prototype.limit = function(s) {
  var len = this.length();

  if (len > s && len > 0) {
    this.scale(s / len);
  }

  return this;
};

Vec3.prototype.transformQuat = function(q) {
  var x = this.x;
  var y = this.y;
  var z = this.z;
  var qx = q.x;
  var qy = q.y;
  var qz = q.z;
  var qw = q.w;
  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;
  this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return this;
};

Vec3.prototype.transformMat4 = function(m) {
  var x = m.a14 + m.a11 * this.x + m.a12 * this.y + m.a13 * this.z;
  var y = m.a24 + m.a21 * this.x + m.a22 * this.y + m.a23 * this.z;
  var z = m.a34 + m.a31 * this.x + m.a32 * this.y + m.a33 * this.z;
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vec3.prototype.equals = function(v, tolerance) {
  tolerance = tolerance != null ? tolerance : 0.0000001;
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance) && (Math.abs(v.z - this.z) <= tolerance);
};

Vec3.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + ", " + Math.floor(this.z*1000)/1000 + "}";
};

Vec3.prototype.lerp = function(v, t) {
  this.x = this.x + (v.x - this.x) * t;
  this.y = this.y + (v.y - this.y) * t;
  this.z = this.z + (v.z - this.z) * t;
  return this;
}

Vec3.Zero = new Vec3(0, 0, 0);

module.exports = Vec3;

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-geom/lib/Vec4.js":[function(require,module,exports){
function Vec4(x, y, z, w) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
  this.w = w != null ? w : 0;
}

Vec4.prototype.equals = function(v, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(v.x - this.x) <= tolerance) && (Math.abs(v.y - this.y) <= tolerance) && (Math.abs(v.z - this.z) <= tolerance) && (Math.abs(v.w - this.w) <= tolerance);
};

Vec4.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z + 1234 * this.w;
};

Vec4.create = function(x, y, z, w) {
  return new Vec4(x, y, z, w);
};

Vec4.fromArray = function(a) {
  return new Vec4(a[0], a[1], a[2], a[3]);
}

Vec4.prototype.set = function(x, y, z, w) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Vec4.prototype.setVec4 = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  this.w = v.w;
  return this;
};

Vec4.prototype.transformMat4 = function(m) {
  var x = m.a14 * this.w + m.a11 * this.x + m.a12 * this.y + m.a13 * this.z;
  var y = m.a24 * this.w + m.a21 * this.x + m.a22 * this.y + m.a23 * this.z;
  var z = m.a34 * this.w + m.a31 * this.x + m.a32 * this.y + m.a33 * this.z;
  var w = m.a44 * this.w + m.a41 * this.x + m.a42 * this.y + m.a43 * this.z;
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Vec4.prototype.toString = function() {
  return "{" + Math.floor(this.x*1000)/1000 + ", " + Math.floor(this.y*1000)/1000 + ", " + Math.floor(this.z*1000)/1000 + ", " + Math.floor(this.w*1000)/1000 + "}";
};

module.exports = Vec4;

},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/index.js":[function(require,module,exports){
module.exports.Platform = require('./lib/Platform');
module.exports.Window = require('./lib/Window');
module.exports.Time = require('./lib/Time');
module.exports.IO = require('./lib/IO');
module.exports.Log = require('./lib/Log');
},{"./lib/IO":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/IO.js","./lib/Log":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js","./lib/Platform":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Platform.js","./lib/Time":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Time.js","./lib/Window":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Window.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/BrowserWindow.js":[function(require,module,exports){
var Platform = require('./Platform');
var Log = require('./Log');
var merge = require('merge');

var requestAnimFrameFps = 60;

if (Platform.isBrowser) {
  window.requestAnimFrame = function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
      window.setTimeout(callback, 1000 / requestAnimFrameFps);
    };
  }();
}
var eventListeners = [];
function fireEvent(eventType, event) {
  for (var i = 0; i < eventListeners.length; i++) {
    if (eventListeners[i].eventType == eventType) {
      eventListeners[i].handler(event);
    }
  }
}

function registerEvents(canvas, win) {
  makeMouseDownHandler(canvas, win);
  makeMouseUpHandler(canvas, win);
  makeMouseDraggedHandler(canvas, win);
  makeMouseMovedHandler(canvas, win);
  makeScrollWheelHandler(canvas, win);
  makeTouchDownHandler(canvas, win);
  makeTouchUpHandler(canvas, win);
  makeTouchMoveHandler(canvas, win);
  makeKeyDownHandler(canvas, win);
}

function makeMouseDownHandler(canvas, win) {
  canvas.addEventListener('mousedown', function(e) {
    fireEvent('leftMouseDown', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * win.settings.highdpi,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * win.settings.highdpi,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeMouseUpHandler(canvas, win) {
  canvas.addEventListener('mouseup', function(e) {
    fireEvent('leftMouseUp', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * win.settings.highdpi,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * win.settings.highdpi,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeMouseDraggedHandler(canvas, win) {
  var down = false;
  var px = 0;
  var py = 0;
  canvas.addEventListener('mousedown', function(e) {
    down = true;
    px = (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * win.settings.highdpi;
    py = (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * win.settings.highdpi;
  });
  canvas.addEventListener('mouseup', function(e) {
    down = false;
  });
  canvas.addEventListener('mousemove', function(e) {
    if (down) {
      var x = (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * win.settings.highdpi;
      var y = (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * win.settings.highdpi;
      fireEvent('mouseDragged', {
        x: x,
        y: y,
        dx: x - px,
        dy: y - py,
        option: e.altKey,
        shift: e.shiftKey,
        control: e.ctrlKey
      });
      px = x;
      py = y;
    }
  });
}

function makeMouseMovedHandler(canvas, win) {
  canvas.addEventListener('mousemove', function(e) {
    fireEvent('mouseMoved', {
      x: (e.offsetX || e.layerX || e.clientX - e.target.offsetLeft) * win.settings.highdpi,
      y: (e.offsetY || e.layerY || e.clientY - e.target.offsetTop) * win.settings.highdpi,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function makeScrollWheelHandler(canvas, win) {
  var mousewheelevt = /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel';
  document.addEventListener(mousewheelevt, function(e) {
    fireEvent('scrollWheel', {
      x: (e.offsetX || e.layerX) * win.settings.highdpi,
      y: (e.offsetY || e.layerY) * win.settings.highdpi,
      dy: e.wheelDelta / 10 || -e.detail / 10,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}
var lastTouch = null;
function makeTouchDownHandler(canvas, win) {
  canvas.addEventListener('touchstart', function(e) {
    lastTouch = {
      clientX: e.touches[0].clientX * win.settings.highdpi,
      clientY: e.touches[0].clientY * win.settings.highdpi
    };
    var touches = Array.prototype.slice.call(this, e.touches).map(function(touch) {
      touch.x = touch.clientX * win.settings.highdpi;
      touch.y = touch.clientY * win.settings.highdpi;
      return touch;
    });
    fireEvent('leftMouseDown', {
      x: e.touches[0].clientX * win.settings.highdpi,
      y: e.touches[0].clientY * win.settings.highdpi,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
  });
}

function makeTouchUpHandler(canvas, win) {
  canvas.addEventListener('touchend', function(e) {
    var touches = Array.prototype.slice.call(this, e.touches).map(function(touch) {
      touch.x = touch.clientX * win.settings.highdpi;
      touch.y = touch.clientY * win.settings.highdpi;
      return touch;
    });
    fireEvent('leftMouseUp', {
      x: lastTouch ? lastTouch.clientX : 0,
      y: lastTouch ? lastTouch.clientY : 0,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
    lastTouch = null;
  });
}

function makeTouchMoveHandler(canvas, win) {
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    lastTouch = {
      clientX: e.touches[0].clientX * win.settings.highdpi,
      clientY: e.touches[0].clientY * win.settings.highdpi
    };
    var touches = Array.prototype.slice.call(this, e.touches).map(function(touch) {
      touch.x = touch.clientX * win.settings.highdpi;
      touch.y = touch.clientY * win.settings.highdpi;
      return touch;
    });
    fireEvent('mouseDragged', {
      x: e.touches[0].clientX * win.settings.highdpi,
      y: e.touches[0].clientY * win.settings.highdpi,
      option: false,
      shift: false,
      control: false,
      touches: touches
    });
    return false;
  });
}

function makeKeyDownHandler(canvas, win) {
  var timeout = 0;
  window.addEventListener('keydown', function(e) {
    timeout = setTimeout(function() {
      fireEvent('keyDown', {
        str: '',
        keyCode: e.keyCode,
        option: e.altKey,
        shift: e.shiftKey,
        control: e.ctrlKey
      }, 1);
    });
  });
  window.addEventListener('keypress', function(e) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = 0;
    }
    fireEvent('keyDown', {
      str: String.fromCharCode(e.charCode),
      keyCode: e.keyCode,
      option: e.altKey,
      shift: e.shiftKey,
      control: e.ctrlKey
    });
  });
}

function simpleWindow(obj) {
  var canvas = obj.settings.canvas;
  if (obj.settings.fullscreen) {
    obj.settings.width = window.innerWidth;
    obj.settings.height = window.innerHeight;
  }
  if (!canvas) {
    canvas = document.getElementById('canvas');
  }
  else if (obj.settings.width && obj.settings.height) {
    canvas.width = obj.settings.width;
    canvas.height = obj.settings.height;
  }
  else {
    obj.settings.width = canvas.width;
    obj.settings.height = canvas.height;
  }
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = obj.settings.width;
    canvas.height = obj.settings.height;
  }
  if (window.devicePixelRatio == 2) {
    if (obj.settings.highdpi == 2) {
      canvas.width = obj.settings.width * 2;
      canvas.height = obj.settings.height * 2;
      canvas.style.width = obj.settings.width + 'px';
      canvas.style.height = obj.settings.height + 'px';
      obj.settings.width = canvas.width;
      obj.settings.height = canvas.height;
    }
  }
  else {
    obj.settings.highdpi = 1;
  }

  if (obj.settings.multisample) {
    canvas.msaaEnabled = true;
    canvas.msaaSamples = 2;
  }

  obj.width = obj.settings.width;
  obj.height = obj.settings.height;
  obj.canvas = canvas;
  canvas.style.backgroundColor = '#000000';
  function go() {
    if (obj.stencil === undefined)
      obj.stencil = false;
    if (obj.settings.fullscreen) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
    }
    var gl = null;
    var ctx = null;
    if (obj.settings.type == '3d') {
      try {
        gl = canvas.getContext('experimental-webgl', {
          antialias: true,
          stencil: obj.settings.stencil,
          premultipliedAlpha : obj.settings.premultipliedAlpha,
          preserveDrawingBuffer: obj.settings.preserveDrawingBuffer
        });
      }
      catch (err) {
        Log.error(err.message);
        return;
      }
      if (gl === null) {
        throw 'No WebGL context is available.';
      }
    }else if (obj.settings.type == '2d') {
      ctx = canvas.getContext('2d');
    }
    obj.framerate = function(fps) {
      requestAnimFrameFps = fps;
    };
    obj.on = function(eventType, handler) {
      eventListeners.push({
        eventType: eventType,
        handler: handler
      });
    };
    registerEvents(canvas, obj);
    obj.dispose = function() {
      obj.__disposed = true;
    };
    obj.gl = gl;
    obj.ctx = ctx;
    obj.init();
    function drawloop() {
      if (!obj.__disposed) {
        obj.draw();
        requestAnimFrame(drawloop);
      }
    }
    requestAnimFrame(drawloop);
  }
  if (!canvas.parentNode) {
    if (document.body) {
      document.body.appendChild(canvas);
      go();
    }else {
      window.addEventListener('load', function() {
        document.body.appendChild(canvas);
        go();
      }, false);
    }
  }
  else {
    go();
  }
  return obj;
}

var BrowserWindow = { simpleWindow: simpleWindow };

module.exports = BrowserWindow;
},{"./Log":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Platform.js","merge":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/node_modules/merge/merge.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/IO.js":[function(require,module,exports){
(function (process){
var Platform = require('./Platform');
var Log = require('./Log');
var plask = require('plask');
var path = require('path');

var merge = require('merge');

var PlaskIO = function() {
  function IO() {
  }

  IO.loadTextFile = function (file, callback) {
    var fullPath = path.resolve(IO.getWorkingDirectory(), file);
    if (!fs.existsSync(fullPath)) {
      if (callback) {
        return callback(null);
      }
    }
    var data = fs.readFileSync(fullPath, 'utf8');
    if (callback) {
      callback(data);
    }
  };

  IO.getWorkingDirectory = function () {
    return path.dirname(process.mainModule.filename);
  };

  //textureHandle - texture handl
  //textureTarget - gl.TEXTURE_2D, gl.TEXTURE_CUBE
  //dataTarget - gl.TEXTURE_2D, gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  IO.loadImageData = function (gl, textureHandle, textureTarget, dataTarget, file, options, callback) {
    var defaultOptions = { flip: false, lod: 0 };
    options = merge(defaultOptions, options);
    var fullPath = path.resolve(IO.getWorkingDirectory(), file);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, textureHandle);
    var canvas = plask.SkCanvas.createFromImage(fullPath);
    if (options.flip) {
      gl.texImage2DSkCanvas(dataTarget, options.lod, canvas);
    }
    else {
      gl.texImage2DSkCanvasNoFlip(dataTarget, options.lod, canvas);
    }
    if (callback) {
      callback(canvas);
    }
  };

  IO.watchTextFile = function (file, callback) {
    fs.watch(file, {}, function (event, fileName) {
      if (event == 'change') {
        var data = fs.readFileSync(file, 'utf8');
        if (callback) {
          callback(data);
        }
      }
    });
  };

  IO.saveTextFile = function (file, data) {
    fs.writeFileSync(file, data);
  };
  return IO;
};

var WebIO = function () {
  function IO() {
  }

  IO.getWorkingDirectory = function () {
    return '.';
  };

  IO.loadTextFile = function (url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function (e) {
      if (request.readyState == 4) {
        if (request.status == 200) {
          if (callback) {
            callback(request.responseText);
          }
        } else {
          Log.error('WebIO.loadTextFile error : ' + request.statusText);
        }
      }
    };
    request.send(null);
  };

  IO.loadImageData = function (gl, textureHandle, textureTarget, dataTarget, url, options, callback) {
    var defaultOptions = { flip: false, lod: 0 };
    options = merge(defaultOptions, options);
    var image = new Image();
    if (options.crossOrigin) image.crossOrigin = options.crossOrigin;
    image.onload = function () {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(textureTarget, textureHandle);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flip);
      gl.texImage2D(dataTarget, options.lod, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      if (callback) {
        callback(image);
      }
    };
    image.src = url;
  };

  IO.watchTextFile = function () {
    console.log('Warning: WebIO.watch is not implemented!');
  };

  IO.saveTextFile = function (url, data, callback) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.onreadystatechange = function (e) {
      if (request.readyState == 4) {
        if (request.status == 200) {
          if (callback) {
            callback(request.responseText, request);
          }
        } else {
          Log.error('WebIO.saveTextFile error : ' + request.statusText);
        }
      }
    };
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('data=' + encodeURIComponent(data));
  };

  return IO;
};

if (Platform.isPlask) module.exports = PlaskIO();
else if (Platform.isBrowser) module.exports = WebIO();
}).call(this,require('_process'))
},{"./Log":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Platform.js","_process":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/process/browser.js","merge":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/node_modules/merge/merge.js","path":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/path-browserify/index.js","plask":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/lib/_empty.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js":[function(require,module,exports){
function Log() {
}

Log.message = function(msg) {
  if (console !== undefined) {
    var msgs = Array.prototype.slice.call(arguments);
    console.log(msgs.join(' '));
  }
};

Log.error = function(msg) {
  var msgs = Array.prototype.slice.call(arguments);
  if (console !== undefined) {
    console.log('ERROR: ' + msgs.join(' '));
  }
};

module.exports = Log;
},{}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Platform.js":[function(require,module,exports){
(function (process){
module.exports.isPlask = typeof window === 'undefined' && typeof process === 'object';
module.exports.isBrowser = typeof window === 'object' && typeof document === 'object';
module.exports.isEjecta = typeof ejecta === 'object' && typeof ejecta.include === 'function';
module.exports.isiOS = module.exports.isBrowser && typeof navigator === 'object' && /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
module.exports.isMobile = module.exports.isiOS;
}).call(this,require('_process'))
},{"_process":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/node_modules/process/browser.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Time.js":[function(require,module,exports){
var Log = require('./Log');

var Time = {
    now: 0,
    prev: 0,
    delta: 0,
    seconds: 0,
    frameNumber: 0,
    fpsFrames: 0,
    fpsTime: 0,
    fps: 0,
    fpsFrequency: 3,
    paused: false,
    verbose: false
};

Time.update = function(delta) {
  if (Time.paused) {
    return;
  }

  if (Time.prev === 0) {
    Time.prev = Date.now();
  }

  Time.now = Date.now();
  Time.delta = (delta !== undefined) ? delta : (Time.now - Time.prev) / 1000;

  //More than 1s = probably switched back from another window so we have big jump now
  if (Time.delta > 1) {
    Time.delta = 0;
  }

  Time.prev = Time.now;
  Time.seconds += Time.delta;
  Time.fpsTime += Time.delta;
  Time.frameNumber++;
  Time.fpsFrames++;

  if (Time.fpsTime > Time.fpsFrequency) {
    Time.fps = Time.fpsFrames / Time.fpsTime;
    Time.fpsTime = 0;
    Time.fpsFrames = 0;
    if (this.verbose)
      Log.message('FPS: ' + Time.fps);
  }
  return Time.seconds;

};

var startOfMeasuredTime = 0;

Time.startMeasuringTime = function() {
  startOfMeasuredTime = Date.now();
};

Time.stopMeasuringTime = function(msg) {
  var now = Date.now();
  var seconds = (now - startOfMeasuredTime) / 1000;
  if (msg) {
    console.log(msg + seconds);
  }
  return seconds;
};

Time.pause = function() {
  Time.paused = true;
};

Time.togglePause = function() {
  Time.paused = !Time.paused;
};

Time.reset = function() {
  Time.now = 0;
  Time.prev = 0;
  Time.delta = 0;
  Time.seconds = 0;
  Time.frameNumber = 0;
  Time.fpsFrames = 0;
}

module.exports = Time;
},{"./Log":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Window.js":[function(require,module,exports){
var Platform = require('./Platform');
var BrowserWindow = require('./BrowserWindow');
var Time = require('./Time');
var Log = require('./Log');
var merge = require('merge');
var plask = require('plask');

var DefaultSettings = {
  'width': 1280,
  'height': 720,
  'type': '3d',
  'vsync': true,
  'multisample': true,
  'fullscreen': false,
  'center': true,
  'highdpi': 1,
  'stencil': false,
  'premultipliedAlpha': true,
  'preserveDrawingBuffer': false
};

var Window = {
  currentWindow: null,
  create: function(obj) {
    obj.settings = obj.settings || {};
    obj.settings = merge(DefaultSettings, obj.settings);

    obj.__init = obj.init;
    obj.init = function() {
      Window.currentWindow = this;
      obj.framerate(60);
      if (obj.__init) {
        obj.__init();
      }
    }

    obj.__draw = obj.draw;
    obj.draw = function() {
      Window.currentWindow = this;
      //FIXME: this will cause Time update n times, where n is number of Window instances opened
      Time.update();
      if (obj.__draw) {
        obj.__draw();
      }
    }

    if (Platform.isPlask) {
      plask.simpleWindow(obj);
    }
    else if (Platform.isBrowser || Platform.isEjecta) {
      BrowserWindow.simpleWindow(obj);
    }
  }
};

module.exports = Window;
},{"./BrowserWindow":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/BrowserWindow.js","./Log":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Log.js","./Platform":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Platform.js","./Time":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/lib/Time.js","merge":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/node_modules/merge/merge.js","plask":"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/browserify/lib/_empty.js"}],"/Users/vorg/Workspace/vorg-pex-experiments/v3/palette/node_modules/pex-sys/node_modules/merge/merge.js":[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.2.0
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	/**
	 * Merge one or more objects 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	var Public = function(clone) {

		return merge(clone === true, false, arguments);

	}, publicName = 'merge';

	/**
	 * Merge two or more objects recursively 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	Public.recursive = function(clone) {

		return merge(clone === true, true, arguments);

	};

	/**
	 * Clone the input removing any reference
	 * @param mixed input
	 * @return mixed
	 */

	Public.clone = function(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = Public.clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = Public.clone(input[index]);

		}

		return output;

	};

	/**
	 * Merge two objects recursively
	 * @param mixed input
	 * @param mixed extend
	 * @return mixed
	 */

	function merge_recursive(base, extend) {

		if (typeOf(base) !== 'object')

			return extend;

		for (var key in extend) {

			if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {

				base[key] = merge_recursive(base[key], extend[key]);

			} else {

				base[key] = extend[key];

			}

		}

		return base;

	}

	/**
	 * Merge two or more objects
	 * @param bool clone
	 * @param bool recursive
	 * @param array argv
	 * @return object
	 */

	function merge(clone, recursive, argv) {

		var result = argv[0],
			size = argv.length;

		if (clone || typeOf(result) !== 'object')

			result = {};

		for (var index=0;index<size;++index) {

			var item = argv[index],

				type = typeOf(item);

			if (type !== 'object') continue;

			for (var key in item) {

				var sitem = clone ? Public.clone(item[key]) : item[key];

				if (recursive) {

					result[key] = merge_recursive(result[key], sitem);

				} else {

					result[key] = sitem;

				}

			}

		}

		return result;

	}

	/**
	 * Get type of variable
	 * @param mixed input
	 * @return string
	 *
	 * @see http://jsperf.com/typeofvar
	 */

	function typeOf(input) {

		return ({}).toString.call(input).slice(8, -1).toLowerCase();

	}

	if (isNode) {

		module.exports = Public;

	} else {

		window[publicName] = Public;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}]},{},["./main.js"]);
