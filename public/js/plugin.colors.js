var inspirationPlugins = inspirationPlugins || [];

(function() {
    function run(imgInfo, img, linksWrapper) {
      var url = '/images/' + imgInfo.thumbUrl;
      var hash = url + '_2';

      console.log('palette', url)

      function addColors(colors) {
        var imgWrapper = linksWrapper.parent().parent().find('a').eq(0);
        console.log(imgWrapper)
        var img = imgWrapper.find('img').get(0);
        if (!img) return;
        imgWrapper.css('height', parseInt(imgWrapper.css('height')) + 5);
        var totalPx = colors.reduce(function(sum, color) { return sum + color[1]}, 0);
        //totalPx -= 5 * colors.length;
        colors.forEach(function(color) {
          var w = img.width;
          var h = Math.floor(img.height * color[1] / totalPx);
          var colorLink = $('<div style="width:'+w+'px;height:'+h+'px; float: left;background:' + color[0] + '"></div>');
          imgWrapper.prepend(colorLink);
        })
        imgWrapper.find('img').eq(0).remove();
      }

      if (!localStorage[hash]) {
        Palette.fromImage(url, function(err, colors) {
          var htmlColors = colors.map(function(c) { return [c.color.getHex(), c.numPoints] });
          localStorage[hash] = JSON.stringify(htmlColors);
          addColors(htmlColors);
        })
      }
      else {
        addColors(JSON.parse(localStorage[hash]));
      }
      //console.log('Colors RUNNING!', imgInfo.title);
    }

    var colorsPlugin = {
      name : 'colors',
      run : run
    };
    inspirationPlugins.push(colorsPlugin);
})();