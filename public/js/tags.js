var thumbWidth = 300;
var columnMargin = 10;
var columnWidth = thumbWidth + columnMargin;
var columns = [];

String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

function buildColumns() {
  var w = document.body.clientWidth;
  var numColumns = Math.floor(w/columnWidth);
  for(var i=0; i<numColumns; i++) {
    var column = {
      height: 0
    }
    column.div = $('<div class="column"></div>');
    $(document.body).append(column.div);
    columns.push(column);
  }
}

function findColumn() {
  var min = 99999999;
  var mini = 0;
  for(var i=0; i<columns.length; i++) {
    if (columns[i].height < min) {
      min = columns[i].height;
      mini = i;
    }
  }

  return columns[mini];
}

function addSet(tag, i) {
  var set = $("<div class='set'></div>");
  var title = $("<h2 style='margin-top:0.5em; margin-bottom:0.25em;'><a href='{0}/tag/{1}'>#{1}#</a> [{2}]</h2>".format(inspiration_server, tag.name, tag.count));

  set.append(title);

  setTimeout(function() {
    $.get(inspiration_server + "/api/latest?tag=" + escape(tag.name), function(images) {
      $(images).each(function(i) {
        var style = "";
        if (i > 0) {
          style = "width='" + thumbWidth/4 + "px'" + " " + "height='" + thumbWidth/4 + "px'";
          //return;
        }
        else {
          style = "width='" + thumbWidth + "px'" + " " + "height='" + thumbWidth*0.75 + "px'";
        }
        var img = $("<img src='{0}' {1}/>".format(inspiration_server + "/images/" + this.thumb_url, style));
        set.append(img);
      })
    }, "json");
  }, i*10);


  var column = findColumn();
  column.div.append(set);
  column.height += 10;
}

$(document).ready(function() {
  buildColumns();

  console.log("getting from " + inspiration_server);

  $.get(inspiration_server + "/api/tags", function(tags) {
    for(var i=0; i<tags.length; i++) {
      //if (tags[i].count < 10) {
      //  break;
      //}

      addSet(tags[i], i);
    }
  }, "json")

  console.log("waiting...");
});
