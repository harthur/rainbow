var inspector = {
  mouseEvents : ["click", "mousedown", "mouseup", "mouseout", "mouseover"],

  start: function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      win.addEventListener('click', inspector.inspectElement, true);
      rainbowc.preventEvents(win, inspector.mouseEvents);
    }

    rainbowc.registerSheet("chrome://rainbows/skin/crosshairs.css");

    // for Mac
    rainbowc.wm.getMostRecentWindow("navigator:browser").focus();
  },

  stop : function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      win.removeEventListener('click', inspector.inspectElement, true);
      rainbowc.allowEvents(win, inspector.mouseEvents);
    }
    rainbowc.unregisterSheet("chrome://rainbows/skin/crosshairs.css");
  }, 

  inspectElement : function(event) {
    inspector.stop();
   
    var color = rainbowc.getPixel(event);
    picker.visitColor(color, true, false);
    picker.inspectColor(color);
    picker.url = event.target.ownerDocument.location.href;

    window.focus(); // for Windows
    event.preventDefault();
    event.stopPropagation();
  }
};
