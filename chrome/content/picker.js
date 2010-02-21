/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Rainbow.
 *
 * The Initial Developer of the Original Code is
 * Heather Arthur.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */
var picker = {
  backStack : [],

  forwardStack : [],

  highlightClass : "highlight",

  init : function() {
    picker.wholeNumbers = rainbowc.prefs.getBoolPref("wholeNumbers");
    var mode = rainbowc.prefs.getCharPref("picker.mode");
    var color;
    if(window.arguments)
      color = window.arguments[0];
    if(!color) // otherwise get their last-viewed color
      color = rainbowc.prefs.getCharPref("picker.color");
    picker.format = rainbowc.prefs.getCharPref("format");

    if(rainbowc.prefs.getBoolPref("picker.hsl"))
      document.getElementById("hsl-row").hidden = false;
    else
      document.getElementById("hsl-row").hidden = true;

    picker.displayElem = document.getElementById("display-color-1");

    picker.selectColor(color, true);
    picker.changeMode(mode);
 
    /* for platform-specific styles */
    var platform = rainbowc.getPlatform();
    var rwin = document.getElementById("rainbow-picker-window");
    rwin.setAttribute("rainbow-platform", platform);

    setTimeout(picker.switchDark, 200); // wait for theme to apply, doesn't at onload
  },

  selectRadio : function(mode) {
     switch(mode) {
      case 'sat':
        document.getElementById("radio-h").setAttribute("selected", false);
        document.getElementById("radio-s").setAttribute("selected", true);
        document.getElementById("radio-v").setAttribute("selected", false);
        break;
      case 'val':
        document.getElementById("radio-h").setAttribute("selected", false);
        document.getElementById("radio-s").setAttribute("selected", false);
        document.getElementById("radio-v").setAttribute("selected", true);
        break;
      case 'hue': default:
        document.getElementById("radio-h").setAttribute("selected", true);
        document.getElementById("radio-s").setAttribute("selected", false);
        document.getElementById("radio-v").setAttribute("selected", false);
        break;
    }
  },

  switchDark : function() {
    var container = document.getElementById("container");
    var bg = rainbowc.getWindowPixel(window, container.boxObject.x, container.boxObject.y);
   
    if(colorCommon.luminosity(bg) > .5)
      return; // it's light enough

    /* for the dark themes */
    var barsel = document.getElementById("bar-sel");
    barsel.src = "chrome://rainbows/skin/arrows-white.png";

    var selector = document.getElementById("selector-icon");
    selector.style.border = " white dashed 1px";

    var inspector = document.getElementById("inspector-button");
    inspector.style.listStyleImage = "url('chrome://rainbows/skin/plus-white.png')";

    picker.highlightClass = "highlight-light";
  },

  unload : function() {
    if(picker.color)
      rainbowc.prefs.setCharPref("picker.color", picker.color);
    if(picker.mode)
      rainbowc.prefs.setCharPref("picker.mode", picker.mode);

    if(selector.selectedElement)
      selector.stop();
    inspector.stop();
  },

  visitColor : function(color, changeString, fromInput) {
    var back = document.getElementById("back-button");
    var forward = document.getElementById("forward-button");

    var stack = picker.backStack;
    if(!stack.length || stack[stack.length - 1] != picker.color) { 
      // don't visit same color twice in a row
      stack.push(picker.color);
      back.disabled = false;
      picker.forwardStack = [];
      forward.disabled = true;
    }

    picker.selectColor(color, changeString, fromInput);
    picker.url = "";
  },

  back : function() { // perhaps we could just invoke ctl-z on textbox
    var back = document.getElementById("back-button");
    var forward = document.getElementById("forward-button");

    if(back.disabled) // rapid clicking race condition
     return;

    picker.forwardStack.push(picker.color);
    forward.disabled = false;
    var newColor = picker.backStack.pop();
    if(picker.backStack.length == 0)
      back.disabled = true;
    
    picker.selectColor(newColor, true);
    picker.inspectColor(newColor);
  },

  forward: function() {
    var back = document.getElementById("back-button");
    var forward = document.getElementById("forward-button");

    if(forward.disabled)
      return;

    picker.backStack.push(picker.color);
    back.disabled = false;
    var newColor = picker.forwardStack.pop();
    if(picker.forwardStack.length == 0)
      forward.disabled = true;
 
    picker.selectColor(newColor, true);
    picker.inspectColor(newColor);
  },

  changeMode : function(mode) {
    var topGradient = document.getElementById("top-gradient");
    var bottomGradient = document.getElementById("bottom-gradient");
    var bar = document.getElementById("bar");
    var topBar = document.getElementById("top-bar");

    switch(mode) {
      case 'hue':
        bottomGradient.src = "chrome://rainbows/skin/hue-top.png";
        topGradient.style.opacity = "0";
        bar.src="chrome://rainbows/skin/hue-bar.png";
        topBar.style.opacity = "0";
        picker.mode = 'hue';
        break;
      case 'sat':
        bottomGradient.src = "chrome://rainbows/skin/sat-bottom.png";
        topGradient.src = "chrome://rainbows/skin/sat-top.png";
        bar.src="chrome://rainbows/skin/sat-bar.png";
        picker.mode = 'sat';
        break;
      case 'val':
        bottomGradient.src = "chrome://rainbows/skin/val-bottom.png";
        topGradient.src = "chrome://rainbows/skin/val-top.png";
        bar.src = "chrome://rainbows/skin/val-bar.png";
        topBar.style.opacity = "0";
        picker.mode = 'val';
        break;
      default:
        break;      
    }
    picker.selectRadio(mode);
    picker.inspectColor(picker.color);
  },

  inspectColor : function(color) {
    if(!colorCommon.isValid(color))
      return;

    /* just update the position on the gradient and sidebar */
    var vals = colorCommon.hsvValues(color);
    var hue = Math.round(vals['hue'] / 360 * 255);
    var sat = Math.round(vals['satv'] / 100 * 255);
    var val = Math.round(vals['val'] / 100 * 255);
    
    switch(picker.mode) {
      case 'hue':
        picker.inspectGrad(sat, 255 - val);
        picker.inspectBar(255 - hue);
        break;
      case 'sat':
        picker.inspectGrad(hue, 255 - val);
        picker.inspectBar(255 - sat);
        break;
      case 'val':
        picker.inspectGrad(hue, 255 - sat);
        picker.inspectBar(255 - val);
        break;
      default:
        break;
    }
  },

  selectColor : function(color, changeString, fromInput) {
    if(!colorCommon.isValid(color))
      return;

    /* just update the displayed color values */
    var wholeNumbers = picker.wholeNumbers && !fromInput;
    var hexVal = colorCommon.toHex(color);
    var rgbVals = colorCommon.rgbValues(color);
    var hslVals = colorCommon.hslValues(color, wholeNumbers);
    var hsvVals = colorCommon.hsvValues(color, wholeNumbers);
    var alpha = colorCommon.alphaValue(color);
    
    if(picker.displayElem.id == "display-text")
      picker.displayElem.style.color = hexVal;
    else
      picker.displayElem.style.backgroundColor = hexVal;
    document.getElementById("r").value = rgbVals['red'];
    document.getElementById("g").value = rgbVals['green'];
    document.getElementById("b").value = rgbVals['blue'];
    document.getElementById("hv").value = hsvVals['hue'];
    document.getElementById("sv").value = hsvVals['satv'];
    document.getElementById("v").value = hsvVals['val'];
    document.getElementById("h").value = hslVals['hue'];
    document.getElementById("s").value = hslVals['sat'];
    document.getElementById("l").value = hslVals['light'];
    document.getElementById("a").value = alpha;

    if(changeString)
      picker.changeString(color, wholeNumbers);

    var button = document.getElementById("bookmark-button");
    if(rainbowc.storage.isSaved(colorCommon.toHex(color))) {
      button.label = rainbowc.getString("rainbow.view");
      button.removeAttribute("oncommand"); // firefox bug 
      button.setAttribute("oncommand", "picker.openLibrary();");
    }
    else {
      button.label = rainbowc.getString("rainbow.bookmark");
      button.removeAttribute("oncommand");
      button.setAttribute("oncommand", "picker.bookmark();");
    }
    picker.color = hexVal;

    if(selector.selectedElement) {
      if(picker.displayElem.id == "display-text")
        selector.selectedElement.style.color = hexVal + "";
      else
        selector.selectedElement.style.backgroundColor = hexVal + "";
   
      picker.displayContrast();
    }
  },

  displayContrast : function() {
    var c1 = document.getElementById("display-text").style.color;
    if(!colorCommon.isValid(c1)) {
      document.getElementById("contrast").value = "   ";
      return;
    }
    var c2 = document.getElementById("display-color-1").style.backgroundColor;
    var contrast = Math.round(colorCommon.contrast(c1, c2));
    cstring = rainbowc.getString("rainbow.picker.contrast", contrast);
    document.getElementById("contrast").value = cstring;
  },

  changeString : function(color) {
    var string = document.getElementById("display-string");
    string.value = rainbowCommon.getFormattedColor(color);
  },

  stringChanged : function() {
    var color = document.getElementById("display-string").value;
    picker.visitColor(color, false, true);
    picker.inspectColor(color);
  },

  changeFormat : function(format) {
    rainbowc.prefs.setCharPref("format", format);
    picker.format = format;
    picker.changeString(picker.color);
  },

  fieldChanged : function(field, fromInput) {
    var color;
    switch(field) {
      case 'r': case 'g': case 'b':
        var r = document.getElementById("r").value;
        var g = document.getElementById("g").value;
        var b = document.getElementById("b").value;
        color = colorCommon.rgbString(r, g, b);
        break;
      case 'h': case 's': case 'l':
        var h = document.getElementById("h").value;
        var s = document.getElementById("s").value;
        var l = document.getElementById("l").value;
        color = colorCommon.hslString(h, s, l);
        break;
      case 'hv': case 'sv': case 'v':
        var h = document.getElementById("hv").value;
        var s = document.getElementById("sv").value;
        var v = document.getElementById("v").value;
        color = colorCommon.hsvString(h, s, v);
        break;
      default:
        break;
    }

    if(fromInput)
      picker.visitColor(color, true, fromInput);
    else
      picker.selectColor(color, true, fromInput);
    picker.inspectColor(color);
  },

  keyPressed : function(event, field) {
    var maximum = parseInt(field.getAttribute("maximum"));
    var val = Math.round(field.value * 10) / 10;
    var newval;

    if(event.keyCode == event.DOM_VK_UP) {
      if(picker.wholeNumbers || field.hasAttribute("integer"))
       newval = Math.round(Math.floor(val) + 1);
      else
       newval = Math.round((val + .2) * 10) / 10; //so we don't get trailing 0s
     
      if(newval > maximum)
       newval = 0;
    } 
    else if(event.keyCode == event.DOM_VK_DOWN) {
      if(picker.wholeNumbers || field.hasAttribute("integer"))
        newval = Math.round(Math.ceil(val) - 1);
      else
        newval = Math.round((val - .2) * 10) / 10;
      if(newval < 0)
        newval = maximum;
    }
    else
      return;

    field.value = newval;
    field.inputField.select();
    picker.fieldChanged(field.id, false);
  },

  fieldChange : function(field) {
    var maximum = parseInt(field.getAttribute("maximum"));
    var newval = field.value;

    if(newval > maximum)
      newval = maximum;
    else if(newval < 0)
      newval = 0;
    else if(field.hasAttribute("integer"))
      newval = Math.round(newval);

    field.value = newval;
    picker.fieldChanged(field.id, true);
  },

  selectField : function(field) {
    document.getElementById(field).inputField.select();
    if(field == 'hv')
      picker.changeMode('hue');
    else if(field == 'sv')
      picker.changeMode('sat');
    else if(field == 'v')
      picker.changeMode('val');
  },

  gradientClick : function (event) {
    var xOffset = picker.getXOffset(event.clientX);
    var yOffset = picker.getYOffset(event.clientY);

    picker.inspectGrad(xOffset, yOffset);
    var newColor = picker.getInspectedColor();
    picker.visitColor(newColor, true);
  },

  inspectGrad : function(x, y) {
    var pixsel = document.getElementById("pix-sel");
    pixsel.style.left = x - pixsel.width / 2 + 1 + "px";
    pixsel.style.top = y - pixsel.width / 2 + 1 + "px";

    var color = picker.getInspectedColor();
    pixsel.src = colorCommon.blackText(color) ? "chrome://rainbows/skin/box_thin.png"
                                              : "chrome://rainbows/skin/box_thin_white.png"; 

    var vals = colorCommon.hsvValues(color);
    switch(picker.mode) {
      case 'sat':
        var barColor = colorCommon.hsvString(vals['hue'], '100', vals['val']);
        document.getElementById("bar").style.backgroundColor = 
                colorCommon.toHex(colorCommon.hsvString(vals['hue'], '100', '100'));
        document.getElementById("top-bar").style.opacity = 1 - vals['val'] / 100;
        break;
      case 'val':
        var barColor = colorCommon.hsvString(vals['hue'], vals['satv'], '100');
        document.getElementById("bar").style.backgroundColor = colorCommon.toHex(barColor);
        break;
      default:
        break;
    }
  },

  barClick : function (event) {
    var zOffset = picker.getZOffset(event.clientY);
    picker.inspectBar(zOffset);
    var newColor = picker.getInspectedColor();
    picker.visitColor(newColor, true);
  },
  
  inspectBar : function(z) {
    var barsel = document.getElementById("bar-sel");
    barsel.style.top = z - barsel.height / 2 + 1 + "px";
     
    switch(picker.mode) {
      case 'hue':
        var hue = Math.round((255 - z) / 255 * 360);
        document.getElementById("bottom-gradient").style.backgroundColor 
                  = colorCommon.hslString(hue,100,50);
        picker.hue = hue;
        break;
      case 'sat':
        var sat = Math.round((255 - z)/255 * 1000)/10;
        document.getElementById("top-gradient").style.opacity = 1 - sat/100;
        picker.sat = sat;
        break;
      case 'val':
        var val = Math.round((255 - z)/255 * 1000)/10;
        document.getElementById("top-gradient").style.opacity = 1 - val/100;
        picker.val = val;
        break;
      default:
        break;
    }
  },

  getInspectedColor : function() {    
    var h, s, v;
    var pixsel = document.getElementById("pix-sel");
    var pixParent = document.getElementById("gradient-display");
    var x = pixsel.getBoundingClientRect().left - pixParent.boxObject.x 
            + pixsel.width / 2 + 1;
    var y = pixsel.getBoundingClientRect().top - pixParent.boxObject.y 
            + pixsel.height / 2 + 1;

    var barsel = document.getElementById("bar-sel");
    var barParent = document.getElementById("bar-display");
    var z = barsel.getBoundingClientRect().top - barParent.boxObject.y
            + barsel.height / 2 + 1;

    switch(picker.mode) {
      case 'hue':
        h = Math.round((255 - z) / 255 * 360); // crazy hard coding
        s = Math.round(x / 255 * 1000) / 10;
        v = Math.round((255 - y) / 255 * 1000) / 10;
        break;
      case 'sat':
        h = Math.round(x / 255 * 360);
        s = Math.round((255 - z) / 255 * 1000) / 10;
        v = Math.round((255 - y) / 255 * 1000) / 10;
        break;
      case 'val':
        h = Math.round(x / 255 * 360);
        s = Math.round((255 - y) / 255 * 1000) / 10;
        v = Math.round((255 - z) / 255 * 1000) / 10;
        break;
      default:
        throw 'Rainbow: no mode set in picker';
        break;
    }
    var h = Math.min(360, Math.max(0, h));
    var s = Math.min(100, Math.max(0, s));
    var v = Math.min(100, Math.max(0, v));
    return colorCommon.hsvString(h, s, v);
  },

  selectDisplay : function(display, event) {
    picker.displayElem.className = "";
    picker.displayElem = display;
    display.className = picker.highlightClass;
    
    if(picker.displayElem.id == "display-text") {
      var color = display.style.color;
      var bg = document.getElementById("display-color-1").style.backgroundColor;
      if(!colorCommon.blackText(bg))
        display.className = "highlight-light";
      else
        display.className = "highlight";
    }
    else
      var color = display.style.backgroundColor;
    picker.visitColor(color, true, false);
    picker.inspectColor(color);

    if(event)
      event.stopPropagation();
  },

  elementDisplay : function(color1, color2) {
    var d1 = document.getElementById("display-color-1");
    var d2 = document.getElementById("display-color-2");
    var text = document.getElementById("display-text");

    d2.hidden = true;
    d1.style.backgroundColor = color1;      
    if(color2) {
      text.style.color = color2;
      text.hidden = false;
    }
    else
      text.style.color = "";

    picker.displayElem = d1;
    picker.selectDisplay(d1);

    picker.displayContrast();
  },

  comparisonDisplay : function(color1, color2) {
    var d1 = document.getElementById("display-color-1");
    var d2 = document.getElementById("display-color-2");

    if(color1 && color2) {
      d1.style.backgroundColor = color1;
      d2.style.backgroundColor = color2;
    }
    else
      d2.style.backgroundColor = d1.style.backgroundColor;

    d2.hidden = false;
    picker.displayElem = d1;
    picker.selectDisplay(d1);

    d1.ondblclick = picker.singleDisplay;
    d2.ondblclick = picker.singleDisplay;
  },

  singleDisplay : function() {
    var d1 = document.getElementById("display-color-1");
    var d2 = document.getElementById("display-color-2");
    var text = document.getElementById("display-text");

    if(picker.displayElem.id == "display-text")
      d1.style.backgroundColor = picker.displayElem.style.color;
    else
      d1.style.backgroundColor = picker.displayElem.style.backgroundColor;

    picker.selectDisplay(d1);
    d1.className = "highlight"; // show grey for dark and light themes
    d2.hidden = true;
    text.hidden = true;

    d1.ondblclick = picker.comparisonDisplay;
    d2.ondblclick = picker.comparisonDisplay;

    document.getElementById("contrast").value = "";
  },

  cloneDisplay : function(event) {
    var display = event.target;
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(colorCommon.isValid(color)) {
      display.style.backgroundColor = color;
      if(picker.displayElem == display) {
        picker.visitColor(color, true, false);
        picker.inspectColor(color);
      }
    }
  },
  
  copy : function() {
    rainbowCommon.copyColor(picker.color);
  },

  bookmark : function() {
    var button = document.getElementById("bookmark-button");
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "Window:EditColor", "all,dialog=yes,resizable=no, centerscreen",
                  {colors: [picker.color], button: button, url: picker.url} );
  },

  openLibrary : function() {
    var library = rainbowc.wm.getMostRecentWindow('rainbow:library')
               || window.openDialog('chrome://rainbows/content/library.xul',
                  'rainbow:library', 'chrome,all,dialog=yes', picker.color); 
    library.focus();
  },
 
  getXOffset : function(clientX) {
    var parent = document.getElementById("gradient-display");
    return clientX - parent.boxObject.x - 1;
  },
  
  getYOffset : function(clientY) {
    var parent = document.getElementById("gradient-display");
    return clientY - parent.boxObject.y - 2; // get the visual feedback of click right
  },

  getZOffset : function(clientY) {
    var parent = document.getElementById("bar-display");
    return clientY - parent.boxObject.y - 2;
  },

  dragStart : function(event) {
    event.dataTransfer.setData("text/rainbow-color", event.target.style.backgroundColor);
    event.dataTransfer.setData("text/rainbow-source", "picker");
  },
};


var inspector = {
  mouseEvents : ["click", "mousedown", "mouseup", "mouseout", "mouseover"],

  start: function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      win.addEventListener('click', inspector.inspectElement, true);
      rainbowCommon.preventEvents(win, inspector.mouseEvents);
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
      rainbowCommon.allowEvents(win, inspector.mouseEvents);
    }
    rainbowc.unregisterSheet("chrome://rainbows/skin/crosshairs.css");
  }, 

  inspectElement : function(event) {
    inspector.stop();
   
    var color = rainbowCommon.getPixel(event);
    picker.visitColor(color, true, false);
    picker.inspectColor(color);
    picker.url = event.target.ownerDocument.location.href;

    window.focus(); // for Windows
    event.preventDefault();
    event.stopPropagation();
  }
};


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
    var bg = rainbowc.getBgColor(element);

    if(rainbowc.textColorAffects(element)) {
      var win = element.ownerDocument.defaultView;
      var txt = win.getComputedStyle(element, null).color;
    }
    picker.elementDisplay(bg, txt);

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

