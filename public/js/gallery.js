var startImageIndex = 0;
var maxImagesLimit = 500;
var thumbWidth = 300;
var columnMargin = 10;
var columnWidth = thumbWidth + columnMargin;
var columns = [];
var imagesData;

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


function selectElement(element) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(element.get(0), 1);
  //range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function makeContentEditable(element, onStart, onEnd) {
  var preventClick = false;
  var preventTimeout = 0;
  element.mousedown(function(e) {
    preventTimeout = setTimeout(function() {
      preventClick = true;
      preventTimeout = 0;
      element.attr("contenteditable", "true");
      element.addClass("contentEditable");
      onStart();
    }, 500)
  });

  element.mouseup(function(e) {
    if (preventTimeout) {
      clearTimeout(preventTimeout);
      preventTimeout = 0;
      preventClick = false;
    }
  });

 element.keydown(function(e) {
   var finishEditing = false;
   var success = false;

   if(e.keyCode == 13) { //ENTER
     finishEditing = true;
     success = true;
   }
   else if (e.keyCode == 27) { //ESCAPE
     finishEditing = true;
   }

   if (finishEditing) {
     element.attr("contenteditable", "false");
     element.removeClass("contentEditable");
     element.blur();
     onEnd(success);
   }
 });

  element.click(function(e) {
    if (preventClick) {
      e.preventDefault()
    }
  });
}

function updateImageData(params) {
  var request = "/api/update"
  request += "?";
  for(var paramName in params) {
     request += paramName + "=" + encodeURIComponent(params[paramName]) + "&";
  }

   $.get(inspiration_server + request, function(data) {
     console.log("data", data);
   });
}


// imageInfo {}
// cachedUrl: "content/"
// orignalUrl: ""
// referer: "http://haveamint.com/images/screenshots/mint-max-1680x1050.gif"
// tags: "gui,webapp"
// thumbUrl: "content/gui,webapp-4416270ffe79a39ca6ad6feb991cb92e_h.jpg"
// title: "Mint"
function addImage(imgInfo) {
  var wrapper = $('<div class="imageWrapper"></div>');

  var link = $('<a href="' + imgInfo.referer + '"></a>');
  var image = new Image();
  link.append(image);
  wrapper.append(link);

  var overlay = $('<div class="overlay"></div>');
  wrapper.append(overlay);

  //TITLE

  var titleTag = '<a href="{0}" class="titleLink"><h2>{1}</h2></a>';
  var title = $(titleTag.format(imgInfo.referer, imgInfo.title));
  overlay.append(title);

  makeContentEditable(
    title,
    function() {
      title.data("oldtitle", title.find("h2").text())
      selectElement(title.find("h2"));
    },
    function(success) {
      if (success) {
        var newTitle = title.find("h2").text();
        console.log("Saving new title...", newTitle, "for image", imgInfo.id);
        updateImageData({
          id: imgInfo.id,
          title: newTitle
        })

      }
      else {
        title.find("h2").text(title.data("oldtitle"));
      }
      title.data("oldtitle", "");
    }
  );

  //TAG LINKS

  var linksWrapper = $('<div class="linksWrapper"></div>')

  function tagsToLinks(tags) {
    var numLinks = 0;
    linksWrapper.html("");
    $(tags).each(function() {
      var tag = this;
      if (numLinks++ > 0) linksWrapper.append(", ");
      var tagLink = $('<a href="'+inspiration_server+'/tag/'+tag+'">'+tag+'</a>');
      tagLink.click(function(e) {
        if (e.shiftKey) {
          e.preventDefault();
          if (document.location.href.indexOf("/tag/") > 0) {
            document.location.href = document.location.href + "+" + tag;
          }
          else {
            document.location.href = tagLink.attr("href");
          }
        }
      })
      linksWrapper.append(tagLink);
    })
  }

  tagsToLinks(imgInfo.tags);
  overlay.append(linksWrapper);

  function cleanTagText(text) {
    return text.replace(/^\s+/, '').replace(/,/g, ' ').replace(/\s+/g, ' ');
  }

  makeContentEditable(
    linksWrapper,
    function() {
      linksWrapper.data("oldtags", linksWrapper.text());
      linksWrapper.html(cleanTagText(linksWrapper.text()));
      selectElement(linksWrapper);
    },
    function(success) {
      var tags;
      if (success) {
        tags = cleanTagText(linksWrapper.text()).split(' ');
        console.log("Saving new tags...", tags, "for image", imgInfo.id);
        updateImageData({
          id: imgInfo.id,
          tags: tags.join(",")
        })
      }
      else {
        tags = cleanTagText(linksWrapper.data("oldtags")).split(' ');
      }
      tagsToLinks(tags);

      linksWrapper.data("oldtags", "");
    }
  );

  //IMAGE

  $(image).attr("data-src", "/images/" + imgInfo.thumbUrl);

  var width = thumbWidth;
  var height = width / imgInfo.ratio;
  wrapper.css("height", height);
  var column = findColumn();
  column.div.append(wrapper);
  column.height += height;

  image.width = width;
  image.height = width / imgInfo.ratio;

}

$(document).ready(function() {
  buildColumns();

  console.log("getting from " + inspiration_server);

  var path = document.location.pathname;

  $.get(inspiration_server + "/api/get" + path, function(data) {
    console.log("got! " + data.length);
    imagesData = data;
    if (inspiration_tags) {
      $("h1").append("<span> / " + inspiration_tags + "</span>");
    }

    inspiration_tags = inspiration_tags.split("+");
    if (inspiration_tags.length == 1 && inspiration_tags[0] == "") {
      inspiration_tags = [];
    }

    var count = 0;
    for(var i=0; i<imagesData.length && count < maxImagesLimit; i++) {
      if (i < startImageIndex) continue;
      var tags = imagesData[i].tags;
      var filteredOut = false;
      for(var j=0; j<inspiration_tags.length; j++) {
        if (tags.indexOf(inspiration_tags[j]) == -1) {
          filteredOut = true;
          break;
        }
      }
      if (!filteredOut) {
        addImage(imagesData[i]);
        count++;
      }
    }

    $('.imageWrapper img').css("opacity", 0);

    $('.imageWrapper img').bind('appear', function() {
      $(this).attr("src", inspiration_server + $(this).attr("data-src"));
      var img = $(this);
      //setTimeout(function() {
        img.css("opacity", 1);
      //}, 500)
    });
    $('.imageWrapper img').bind('disappear', function() {
      //$(this).attr("src", null);
      $(this).css("opacity", 0);
    });

    $('.imageWrapper img').appear(function() {}, {one:false});
  }, "json")

  console.log("waiting...");
});
