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
    if(!color || !colorCommon.isValid(color)) // otherwise get their last-viewed color
      color = rainbowc.prefs.getCharPref("picker.color");
    picker.format = rainbowc.prefs.getCharPref("format");

    if(rainbowc.prefs.getBoolPref("picker.hsl"))
      rainbowc.get("hsl-row").hidden = false;
    else
      rainbowc.get("hsl-row").hidden = true;

    picker.displayElem = rainbowc.get("display-color-1");

    picker.selectColor(color, true);
    picker.changeMode(mode);
 
    /* for platform-specific styles */
    var platform = rainbowc.getPlatform();
    var rwin = rainbowc.get("rainbow-picker-window");
    rwin.setAttribute("rainbow-platform", platform);

    setTimeout(picker.switchDark, 200); // wait for theme to apply, doesn't at onload
  },

  selectRadio : function(mode) {
     switch(mode) {
      case 'sat':
        rainbowc.get("radio-h").setAttribute("selected", false);
        rainbowc.get("radio-s").setAttribute("selected", true);
        rainbowc.get("radio-v").setAttribute("selected", false);
        break;
      case 'val':
        rainbowc.get("radio-h").setAttribute("selected", false);
        rainbowc.get("radio-s").setAttribute("selected", false);
        rainbowc.get("radio-v").setAttribute("selected", true);
        break;
      case 'hue': default:
        rainbowc.get("radio-h").setAttribute("selected", true);
        rainbowc.get("radio-s").setAttribute("selected", false);
        rainbowc.get("radio-v").setAttribute("selected", false);
        break;
    }
  },

  switchDark : function() {
    var container = rainbowc.get("container");
    var bg = rainbowc.getWindowPixel(window, container.boxObject.x, container.boxObject.y);
   
    if(colorCommon.luminosity(bg) > .5)
      return; // it's light enough

    /* for the dark themes */
    var barsel = rainbowc.get("bar-sel");
    barsel.src = "chrome://rainbows/skin/arrows-white.png";

    var selector = rainbowc.get("selector-icon");
    selector.style.border = " white dashed 1px";

    var inspector = rainbowc.get("inspector-button");
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
    var back = rainbowc.get("back-button");
    var forward = rainbowc.get("forward-button");

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

  back : function() {
    var back = rainbowc.get("back-button");
    var forward = rainbowc.get("forward-button");

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
    var back = rainbowc.get("back-button");
    var forward = rainbowc.get("forward-button");

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
    var topGradient = rainbowc.get("top-gradient");
    var bottomGradient = rainbowc.get("bottom-gradient");
    var bar = rainbowc.get("bar");
    var topBar = rainbowc.get("top-bar");

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
    rainbowc.get("r").value = rgbVals['red'];
    rainbowc.get("g").value = rgbVals['green'];
    rainbowc.get("b").value = rgbVals['blue'];
    rainbowc.get("hv").value = hsvVals['hue'];
    rainbowc.get("sv").value = hsvVals['satv'];
    rainbowc.get("v").value = hsvVals['val'];
    rainbowc.get("h").value = hslVals['hue'];
    rainbowc.get("s").value = hslVals['sat'];
    rainbowc.get("l").value = hslVals['light'];
    rainbowc.get("a").value = alpha;

    if(changeString)
      picker.changeString(color, wholeNumbers);

    picker.color = hexVal;

    var button = rainbowc.get("bookmark-button");
    if(rainbowc.storage.isSaved(colorCommon.toHex(color))) {
      button.label = rainbowc.getString("rainbow.view");
      button.removeAttribute("oncommand"); // firefox bug
      button.setAttribute("oncommand", "rainbowc.openLibrary('" + picker.color + "');");
    }
    else {
      button.label = rainbowc.getString("rainbow.bookmark");
      button.removeAttribute("oncommand");
      button.setAttribute("oncommand", "picker.bookmark();");
    }

    if(selector.selectedElement) {
      if(picker.displayElem.id == "display-text")
        selector.selectedElement.style.color = hexVal + "";
      else {
        selector.selectedElement.style.background = hexVal + "";
        if(colorCommon.blackText(hexVal))
          rainbowc.get("display-element").style.color = "black";
        else
          rainbowc.get("display-element").style.color = "white";          
      }
      picker.displayContrast();
    }
  },

  displayContrast : function() {
    var c1 = rainbowc.get("display-text").style.color;
    if(!colorCommon.isValid(c1)) {
      rainbowc.get("contrast").value = "   ";
      return;
    }
    var c2 = rainbowc.get("display-color-1").style.backgroundColor;
    var contrast = Math.round(colorCommon.contrast(c1, c2));
    cstring = rainbowc.getString("rainbow.picker.contrast", contrast);
    rainbowc.get("contrast").value = cstring;
  },

  changeString : function(color) {
    var string = rainbowc.get("display-string");
    string.value = rainbowc.getFormattedColor(color);
  },

  stringChanged : function() {
    var color = rainbowc.get("display-string").value;
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
        var r = rainbowc.get("r").value;
        var g = rainbowc.get("g").value;
        var b = rainbowc.get("b").value;
        color = colorCommon.rgbString(r, g, b);
        break;
      case 'h': case 's': case 'l':
        var h = rainbowc.get("h").value;
        var s = rainbowc.get("s").value;
        var l = rainbowc.get("l").value;
        color = colorCommon.hslString(h, s, l);
        break;
      case 'hv': case 'sv': case 'v':
        var h = rainbowc.get("hv").value;
        var s = rainbowc.get("sv").value;
        var v = rainbowc.get("v").value;
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
    rainbowc.get(field).inputField.select();
    if(field == 'hv')
      picker.changeMode('hue');
    else if(field == 'sv')
      picker.changeMode('sat');
    else if(field == 'v')
      picker.changeMode('val');
  },

  gradientClick : function (event) {
    var parent = rainbowc.get("gradient-display");
    var x = event.clientX - parent.boxObject.x;
    var y = event.clientY - parent.boxObject.y; // get the visual feedback of click right

    picker.inspectGrad(x, y);
    var newColor = picker.getInspectedColor();
    picker.visitColor(newColor, true);
  },

  inspectGrad : function(x, y) {
    var pixsel = rainbowc.get("pix-sel");
    pixsel.style.left = x - pixsel.width / 2 + 1 + "px";
    pixsel.style.top = y - pixsel.width / 2 + 1 + "px";

    var color = picker.getInspectedColor();
    pixsel.src = colorCommon.blackText(color) ? "chrome://rainbows/skin/box_thin.png"
                                              : "chrome://rainbows/skin/box_thin_white.png"; 

    var vals = colorCommon.hsvValues(color);
    switch(picker.mode) {
      case 'sat':
        var barColor = colorCommon.hsvString(vals['hue'], '100', vals['val']);
        rainbowc.get("bar").style.backgroundColor = 
                colorCommon.toHex(colorCommon.hsvString(vals['hue'], '100', '100'));
        rainbowc.get("top-bar").style.opacity = 1 - vals['val'] / 100;
        break;
      case 'val':
        var barColor = colorCommon.hsvString(vals['hue'], vals['satv'], '100');
        rainbowc.get("bar").style.backgroundColor = colorCommon.toHex(barColor);
        break;
      default:
        break;
    }
  },

  barClick : function (event) {
    var parent = rainbowc.get("bar-display");
    var y = event.clientY - parent.boxObject.y;
    picker.inspectBar(y);
    var newColor = picker.getInspectedColor();
    picker.visitColor(newColor, true);
  },
  
  inspectBar : function(z) {
    var barsel = rainbowc.get("bar-sel");
    barsel.style.top = z - barsel.height / 2 + 1 + "px";
     
    switch(picker.mode) {
      case 'hue':
        var hue = Math.round((255 - z) / 255 * 360);
        rainbowc.get("bottom-gradient").style.backgroundColor 
                  = colorCommon.hslString(hue,100,50);
        picker.hue = hue;
        break;
      case 'sat':
        var sat = Math.round((255 - z)/255 * 1000)/10;
        rainbowc.get("top-gradient").style.opacity = 1 - sat/100;
        picker.sat = sat;
        break;
      case 'val':
        var val = Math.round((255 - z)/255 * 1000)/10;
        rainbowc.get("top-gradient").style.opacity = 1 - val/100;
        picker.val = val;
        break;
      default:
        break;
    }
  },

  getInspectedColor : function() {    
    var h, s, v;
    var pixsel = rainbowc.get("pix-sel");
    var pixParent = rainbowc.get("gradient-display");
    var x = pixsel.getBoundingClientRect().left - pixParent.boxObject.x 
            + pixsel.width / 2;
    var y = pixsel.getBoundingClientRect().top - pixParent.boxObject.y 
            + pixsel.height / 2;

    var barsel = rainbowc.get("bar-sel");
    var barParent = rainbowc.get("bar-display");
    var z = barsel.getBoundingClientRect().top - barParent.boxObject.y
            + barsel.height / 2;

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
      var bg = rainbowc.get("display-color-1").style.backgroundColor;
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

  elementDisplay : function(bg, txt, font, elementString) {
    var d1 = rainbowc.get("display-color-1");
    var d2 = rainbowc.get("display-color-2");
    var fontDisplay = rainbowc.get("display-text");
    var elemDisplay = rainbowc.get("display-element");

    d2.hidden = true;
    d1.style.backgroundColor = bg;      
    if(txt) {
      fontDisplay.style.color = txt;
      fontDisplay.hidden = false;
      while(fontDisplay.firstChild)
        fontDisplay.removeChild(fontDisplay.firstChild);
      var lines = getLines(font, 100);
      for(var i = 0; i < lines.length; i++) {
        var label = document.createElement("label");
        label.setAttribute("value", lines[i]);
        fontDisplay.appendChild(label);
      }
    }
    else
      fontDisplay.style.color = "";

    elemDisplay.hidden = false;
    elemDisplay.value = elementString;
    if(colorCommon.blackText(bg))
      elemDisplay.style.color = "black";
    else
      elemDisplay.style.color = "white";      

    picker.displayElem = d1;
    picker.selectDisplay(d1);

    picker.displayContrast();
  },

  comparisonDisplay : function(color1, color2) {
    var d1 = rainbowc.get("display-color-1");
    var d2 = rainbowc.get("display-color-2");

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
    var d1 = rainbowc.get("display-color-1");
    var d2 = rainbowc.get("display-color-2");
    var fontDisplay = rainbowc.get("display-text");
    var elemDisplay = rainbowc.get("display-element");

    if(picker.displayElem.id == "display-text")
      d1.style.backgroundColor = picker.displayElem.style.color;
    else
      d1.style.backgroundColor = picker.displayElem.style.backgroundColor;

    picker.selectDisplay(d1);
    d1.className = "highlight"; // show grey for dark and light themes
    d2.hidden = true;
    fontDisplay.hidden = true;
    elemDisplay.hidden = true;

    d1.ondblclick = picker.comparisonDisplay;
    d2.ondblclick = picker.comparisonDisplay;

    rainbowc.get("contrast").value = "";
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
    rainbowc.copyColor(picker.color);
  },

  bookmark : function() {
    var button = rainbowc.get("bookmark-button");
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "Window:EditColor", "all,dialog=yes,resizable=no, centerscreen",
                  {colors: [picker.color], button: button, url: picker.url} );
  },

  dragStart : function(event) {
    event.dataTransfer.setData("text/rainbow-color", event.target.style.backgroundColor);
    event.dataTransfer.setData("text/rainbow-source", "picker");
  },
};



