javascript:(
  function() {
    var body = document.getElementsByTagName("body")[0];
    var head = document.getElementsByTagName("head")[0];
    function appendScript() {
      var scriptJQuery = document.createElement("script");
      head.appendChild(scriptJQuery);
      scriptJQuery.src = "JQUERY_JS";
      var script = document.createElement("script");
      head.appendChild(script);
      script.src = "SCRAPER_JS";
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "SCRAPER_CSS";
      head.appendChild(link);
    }
    if (body) {
      appendScript();
    }
    else {
      var oldDocumentOnReady = document.onready;
      document.onready = function(e) {
        body = document.getElementsByTagName("body")[0];
        setTimeout(appendScript, 300);
        document.onready = oldDocumentOnReady;
        if (document.onready) document.onready(e);
      }
    }
  }
)()

