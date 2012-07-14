//TODO:
//- autogenerate container id

(function() {
  function log(msg) {
    if (window.console) {
      console.log(msg);
    }
  }

  var inspiration_server = "http://localhost:3000";
  var containerId = "inspiration3141592653589793";

  log("20120216.1");

  var thumbSize = 80;

  var cssReset = $('<style type="text/css"></style>');
  cssReset.text('#' + containerId + ', ' + '#' + containerId + ' * {	background: #FFFFFF; margin: 0; 	padding: 0; border: 0; 	font-size: 100%; 	font: inherit;  	vertical-align: baseline; color: black;}');
  var container = $('<div id="' + containerId + '"></div>');

  var inputPanel = $('<form style="padding:3px 3px 0 3px"></form>');
  var imgThumb = $('<img src="" width="80" height="20" style="float:left"/>');
  var imgBox = $('<input type="hidden" name="img"/>');
  var refererBox = $('<input type="hidden" style="margin:0 2px 0 0; width:10%" name="referer"/>');
  var titleBox = $('<input type="text" style="margin:0 0 0 2px; width:240px; " name="title">');
  var tagsBox = $('<input type="text" style="margin:0 2px 0 1px; width:160px" value="tags" name="tags">');
  var okBtn = $('<input type="submit" style="width:80px" value="add"/>');
  var loaderThumb = $('<img src="'+inspiration_server+'/css/ajax-loader.gif" width="16" height="16" style="border: 2px solid white; vertical-align:top;margin-right:5px"/>');
  inputPanel.append(imgThumb);
  inputPanel.append(titleBox);
  inputPanel.append(refererBox);
  inputPanel.append(tagsBox);
  inputPanel.append(okBtn);
  inputPanel.append(loaderThumb);

  container.append(inputPanel);

  var images = [];

  function addThumb(url, w, h) {
    var imgThumb = $('<div class="thumb"></div>');
    var imgThumbImage = $('<img/>');
    if (w > h) {
      imgThumbImage.attr("height", thumbSize);
      var dx = (thumbSize - w*thumbSize/h)/2;
      imgThumbImage.css("left", dx + "px");
    }
    else {
      imgThumbImage.attr("width", thumbSize);
    }
    imgThumbImage.attr("src", url);
    imgThumb.append(imgThumbImage);
    container.append(imgThumb);
    return imgThumbImage;
  }

  $("img").each(function() {
    var img = $(this);
    var w = img.width();
    var h = img.height();
    var url = img.attr("src");

    if (w < 64 || h < 64) return;

    images.push(addThumb(url, w, h));
  });

  console.log(images);

  //VIMEO
  $("div[data-thumb]").each(function() {
    var url = $(this).attr("data-thumb");
    images.push(addThumb(url, 1, 1));
  });



  $("body").prepend(cssReset);
  $("body").prepend(container);

  function xxs(url, params) {
    console.log("xxs", url, params);
    url += "?";
    for(var paramName in params) {
       url += paramName + "=" + encodeURIComponent(params[paramName]) + "&";
    }
    var script = $('<script src="'+url+'"></script>');
    $("body").append(script);
  }

  window.inspiration_callback_1234567890 = function(error) {
    if (error != undefined) {
      console.log("Sending Error: " + error);
      okBtn.css("color", "red");
    }
    else {
      console.log("Sending OK");
      okBtn.css("color", "black");
    }
    loaderThumb.fadeOut();
  };

  $(images).each(function() {
    var img = this;
    img.mousedown(function(e) {
      var src = img.attr("src");

      if (src.indexOf("http") == -1) {
        if (src.indexOf("//") == 0) {
          src = "http:" + src;
        }
        else if (src.indexOf("/") == 0) {
          src = "http://" + document.location.host + src;
        }
        else {
          var slashIndex = document.location.pathname.lastIndexOf("/");
          var path = document.location.pathname.substr(0, slashIndex + 1);
          src = "http://" + document.location.host + path + src;
        }
      }
      var title = document.title;
      var referer = document.location.href;

      imgBox.val(src);
      imgThumb.get(0).src = src;
      titleBox.val(title);
      refererBox.val(referer);
      inputPanel.fadeIn('normal', function() {
         tagsBox.focus();
      });
      e.preventDefault();
      return false;
    });
  });


  $("body").bind("keydown", function(e) {
    if (e.keyCode == 27) {
      container.remove();
    }
  });

  inputPanel.bind('submit', function(e) {
    console.log(inspiration_server);
    var submitUrl = inspiration_server + "/api/post";
    inputPanel.get(0).method = "POST";
    inputPanel.get(0).action = submitUrl;
    e.preventDefault(); // <-- important
    console.log("Sending");
    var img = imgBox.val();
    var referer = refererBox.val();
    var title = titleBox.val();
    var tags = tagsBox.val();

    loaderThumb.fadeIn();
    xxs(submitUrl, {img:img, referer:referer, title:title, tags:tags, callback:"inspiration_callback_1234567890"});
  });

  loaderThumb.hide();

})();
