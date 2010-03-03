var selector = {
  start: function() {
    var enumerator =  rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements())
      selector.addSelectionListeners(enumerator.getNext());

    // for drop indicator styling of webpage content
    rainbowc.registerSheet("chrome://rainbows/skin/selector.css", null, null);
    var button = document.getElementById("selector-button");
    button.oncommand = selector.stop;

    if(rainbowc.getPlatform() == "Mac")
      rainbowc.wm.getMostRecentWindow("navigator:browser").focus();
  },

  stop : function() {
    selector.pause();
    var sel = selector.selectedElement;
    if(sel && sel.removeAttribute)
      sel.removeAttribute("rainbowselector");
    else if (sel && sel.parentNode.removeAttribute)
      sel.parentNode.removeAttribute("rainbowselector");
    selector.selectedElement = "";
    var button = document.getElementById("selector-button");
    button.oncommand = selector.start;
    
    picker.singleDisplay();
  }, 

  pause : function() {
    var enumerator =  rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      selector.removeSelectionListeners(win);
    }
  },

  mouseoverElement : function(event) {
    if(event.target.setAttribute)
      event.target.setAttribute("rainbowselector", "true");
    else
      event.target.parentNode.setAttribute("rainbowselector", "true");

    event.preventDefault();
    event.stopPropagation();
  },

  mouseoutElement : function(event) {
    if(event.target.removeAttribute)
      event.target.removeAttribute("rainbowselector");
    else
      event.target.parentNode.removeAttribute("rainbowselector");

    event.preventDefault();
    event.stopPropagation();
  },

  selectElement : function(event) {
    selector.pause();

    var element = event.target;
    var bg = rainbowc.getBgColor(event);

    if(rainbowc.textColorAffects(element)) {
      var win = element.ownerDocument.defaultView;
      var txt = win.getComputedStyle(element, null).color;
      var font = rainbowc.getFont(element);
    }
    picker.elementDisplay(bg, txt, font);

    picker.url = element.ownerDocument.location.href;
    selector.selectedElement = element;

    window.focus(); // for Windows
    event.preventDefault();
    event.stopPropagation();
  },

  addSelectionListeners : function(win) {
    // skip main browser window, go straight to content windows
    for (var i = 0; i < win.frames.length; i++) {
      var frame = win.frames[i];
      frame.addEventListener('mouseover', selector.mouseoverElement, true);
      frame.addEventListener('mouseout', selector.mouseoutElement, true);
      frame.addEventListener('click', selector.selectElement, true);
      this.addSelectionListeners(frame);
    }
  },

  removeSelectionListeners : function(win) {
    for (var i = 0; i < win.frames.length; i++) {
      var frame = win.frames[i];
      try {
        frame.removeEventListener('mouseover', selector.mouseoverElement, true);
        frame.removeEventListener('mouseout', selector.mouseoutElement, true);
        frame.removeEventListener('click', selector.selectElement, true);
     } 
     catch(e) {}
     this.removeSelectionListeners(frame);
    }
  }
};

