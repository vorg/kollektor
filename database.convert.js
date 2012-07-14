var fs = require('fs');

//fs.readFile(__dirname + '/content/pictures.json', 'utf-8', function(err, data) {
//  console.log(JSON.parse(data));
//});

fs.readFile(__dirname + '/content/pictures.csv', 'utf-8', function(err, data) {
  var images = [];
  var lines = data.trim().split('\n');
  var columns = lines.shift().split('|');
  var numColumns = columns.length;
  var response = "";
  lines.forEach(function(line) {
    var attributes = line.split('|');
    var image = {};
    attributes.forEach(function(value, i) {
      image[columns[i]] = value;
    });
    image.tags = image.tags.split(',');
    images.push(image);
      //var item = "";
      //attributes.forEach(function(value, i) {
      //  item += columns[i] + ' : ' + value + "<br/>"; 
      //})
      //response += item + '<br/><br/>\n';
  })  
  fs.writeFile(__dirname + '/content/pictures.json', JSON.stringify(images), function(err, bla) {
  })
})
