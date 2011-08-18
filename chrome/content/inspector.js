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

var rainbowInspector = {

  mouseEvents : ["mousedown", "mouseup", "mouseout", "mouseover"],

  toggleInspector : function() {
   if(rainbowInspector.inspectorOn)
     rainbowInspector.stopInspector();
   else
     rainbowInspector.startInspector();
  },

  startInspector : function() {
    rainbowInspector.inspectorOn = true;
   
    var prefs = rainbowc.prefs;
    var location = prefs.getCharPref("inspector.location");
    rainbowc.openPanel(rainbowc.get("rainbow-swatch"), location, 100, 100);  

    rainbowInspector.format = prefs.getCharPref("format");

    if(rainbowc.getFirefoxVersion() >= 3.6)
      rainbowInspector.canMove = true; // bug 474149
    rainbowInspector.follow = rainbowInspector.canMove && prefs.getBoolPref("inspector.followMouse");
    rainbowInspector.autoCopy = prefs.getBoolPref("inspector.autoCopy");
    rainbowInspector.hideStats = rainbowInspector.follow 
      && !rainbowInspector.autoCopy && !prefs.getBoolPref("inspector.alwaysShow");

    if(rainbowInspector.hideStats)
      rainbowInspector.shrink();
    else
      rainbowInspector.expand();
    
    rainbowInspector.startInspecting();
  },
 
  stopInspector : function() {
    this.inspectorOn = false;

    var swatch = rainbowc.get("rainbow-swatch");
    var location = rainbowInspector.getSwatchLocation();
    rainbowc.prefs.setCharPref("inspector.location", location);

    swatch.hidePopup();
    rainbowInspector.hideOnHover();

    rainbowInspector.stopInspecting();
    rainbowInspector.stopFix();
  },

  getSwatchLocation : function() {
    return "ne";
  },

  startInspecting : function() {
    rainbowInspector.addInspectionListeners();
    rainbowInspector.overrideCursor();
  },

  stopInspecting : function() {
    rainbowInspector.removeInspectionListeners();
    rainbowInspector.undoCursor();
  },

  addInspectionListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      win.addEventListener("mousemove", rainbowInspector.inspectPixel, true);
      win.addEventListener("click", rainbowInspector.pageClick, true);
      rainbowc.preventEvents(win, rainbowInspector.mouseEvents);
    }
  },

  removeInspectionListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext(); 
      try {
        win.removeEventListener("mousemove", rainbowInspector.inspectPixel, true);
        win.removeEventListener("click", rainbowInspector.pageClick, true);
        rainbowc.allowEvents(win, rainbowInspector.mouseEvents);
      } catch(e) { }
    }
  },

  addFixListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      var content = win.rainbowc.get("content").mPanelContainer;
      content.addEventListener("dblclick", rainbowInspector.resumeInspect, true);
    }
  },

  removeFixListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext(); 
      try {
        var content = win.rainbowc.get("content").mPanelContainer;
        content.removeEventListener("dblclick", rainbowInspector.resumeInspect, true);
      } catch(e) {}
    }
  },

  pageClick : function (event) {
    rainbowInspector.stopInspecting();
    
    var display = rainbowc.get("rainbow-swatch-colorval"),
        color = display.value;

    if(rainbowInspector.autoCopy) {
      if(event.button == 2) {
        // right click
        var url = event.target.ownerDocument.location.href;
        rainbowInspector.autoBookmark(url);
        display.value = "✓ " + rainbowc.getString("rainbow.saved"); 
      }
      else {
        rainbowInspector.copyColor();
        display.value = "✓ " + rainbowc.getString("rainbow.copied");
      }
      
      // save for "Open Last Color"
      rainbowc.prefs.setCharPref("lastcolor", color);
      
      var box = rainbowc.get("rainbow-colorval-box");
      box.classList.add("rainbow-highlight");
      
      // wait till they see 'color copied'
      window.setTimeout(function() {
        rainbowInspector.stopInspector();
        box.classList.remove("rainbow-highlight");
      }, 600);
    }
    else
      rainbowInspector.startFix(event);

    event.preventDefault();
    event.stopPropagation();
  },

  resumeInspect : function (event) {
    if(event && (/swatch/.test(event.target.id) || /rainbow/.test(event.target.id)))
      return;
    rainbowInspector.stopFix();
    rainbowInspector.startInspecting();
    if(event)
      rainbowInspector.inspectPixel(event); // get it started
    
    if(rainbowInspector.hideStats)
      rainbowInspector.shrink();
    else
      rainbowInspector.expand();
  },

  startFix : function (event) {
    rainbowInspector.fixed = true;
    var content = rainbowc.get("content");
    var swatch = rainbowc.get("rainbow-swatch");
    swatch.addEventListener("mouseover", rainbowInspector.showOnHover, true);
    swatch.addEventListener("mouseout", rainbowInspector.hideOnHover, true);
    swatch.url = event.target.ownerDocument.location.href; // for potential bookmarking
    swatch.focus(); // so keypress event fires to move swatch up and down

    rainbowInspector.addFixListeners();

    if(rainbowInspector.follow)
      rainbowInspector.expand();

    var button = rainbowc.get("rainbow-swatch-bookmark");
    var color = colorCommon.toHex(swatch.style.backgroundColor);

    if(rainbowc.storage.isSaved(color)) {
      button.label = rainbowc.getString("rainbow.view");
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "rainbowc.openLibrary('" + color + "');");
    }
    else {
      button.label = rainbowc.getString("rainbow.bookmark");
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "rainbowInspector.bookmarkColor();");
    }
    event.preventDefault();
    event.stopPropagation();
  },

  stopFix : function() {
    rainbowInspector.fixed = false;
    var swatch = rainbowc.get("rainbow-swatch");
    swatch.removeEventListener("mouseover", rainbowInspector.showOnHover, true);
    swatch.removeEventListener("mouseout", rainbowInspector.hideOnHover, true);

    if(rainbowInspector.follow)
      rainbowInspector.shrink();

    rainbowInspector.removeFixListeners();
    rainbowInspector.hideOnHover();
  },

  inspectPixel : function (event) {
    var win = event.target.ownerDocument.defaultView;
    var pageX = event.clientX + win.scrollX;
    var pageY = event.clientY + win.scrollY;
    var color = rainbowInspector.getPixel(win, pageX, pageY);
    rainbowInspector.changeColor(color);

    var swatch = rainbowc.get("rainbow-swatch");

    if(rainbowInspector.canMove && rainbowInspector.follow)
      swatch.moveTo(event.screenX + 5, event.screenY + 6);
    rainbowInspector.updateDisplay(event.clientX, event.clientY, win, event);

    swatch.clientX = event.clientX - 5; // can keep track in case of keypress moving
    swatch.clientY = event.clientY - 6;
    swatch.pageX = event.clientX + win.scrollX;
    swatch.pageY = event.clientY + win.scrollY;
    swatch.win = win;

    event.preventDefault();
    event.stopPropagation();
  },

  reloadPixel : function() {
    var swatch = rainbowc.get("rainbow-swatch");
    var color = rainbowInspector.getPixel(swatch.win, swatch.pageX, swatch.pageY);
    rainbowInspector.changeColor(color, true);
  },
  
  changeColor : function(color, show) {
    var swatch = rainbowc.get("rainbow-swatch");
    swatch.style.backgroundColor = color;
    swatch.color = colorCommon.toHex(color);
    
    var blackText = colorCommon.blackText(color);
    var colorval = rainbowc.get("rainbow-swatch-colorval");
    colorval.value = rainbowc.getFormattedColor(color, rainbowInspector.format);
    colorval.style.color = blackText ? 'black' : 'white';

    var stats = rainbowc.get("rainbow-swatch-stats");
    stats.style.color = blackText ? '#333333' : '#EEEEEE';
  },

  getPixel : function(win, x, y) {
    context = rainbowc.get("rainbow-inspector").getContext("2d");
    context.drawWindow(win, x, y, 1, 1, "white");
    var data = context.getImageData(0, 0, 1, 1).data;
    return "rgb(" + data[0] + "," + data[1] + "," + data[2] + ")";
  },

  moveSwatch : function(event) { // called on keyboard press if follow mouse enabled
    if(!rainbowInspector.canMove)
      return;

    var swatch = rainbowc.get("rainbow-swatch");
    var screenX = swatch.boxObject.screenX;
    var screenY = swatch.boxObject.screenY;

    switch (event.keyCode) {
      case event.DOM_VK_UP:
        screenY--;
        break;
      case event.DOM_VK_DOWN:
        screenY++;
        break;
      case event.DOM_VK_LEFT:
        screenX--;
        break;
      case event.DOM_VK_RIGHT:
        screenX++;
        break;
      default:
        break;
    }
    swatch.moveTo(screenX, screenY);
 
    var content = rainbowc.get("content");
    var browser = content.mCurrentBrowser;
    var clientX = swatch.boxObject.x - browser.boxObject.x - 1;
    var clientY = swatch.boxObject.y - browser.boxObject.y - 1;
    var win = content.contentWindow;
    var pageX = clientX + win.scrollX;
    var pageY = clientY + win.scrollY;
    // this is incorrect on pages with frames
    var color = rainbowInspector.getPixel(win, pageX, pageY);

    rainbowInspector.changeColor(color);

    var button = rainbowc.get("rainbow-swatch-bookmark");

    color = colorCommon.toHex(color);
    if(rainbowc.storage.isSaved(color)) {
      // change because mouse could be over the swatch when keying down or up
      button.label = "View Library";
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "rainbowc.openLibrary('" + color + "');");
    }
    else {
      button.label = "Bookmark";
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "rainbowInspector.bookmarkColor();");
    }

    rainbowInspector.updateDisplay(clientX, clientY, win);
  },

  switchFormat : function(event) {
    var newFormat;
    switch(rainbowInspector.format) {
      case 'plain': default:
        newFormat = 'hex';
        break;
      case 'hex':
        newFormat = 'rgb';
        break;
      case 'rgb':
        newFormat = 'per';
        break;
      case 'per':
        newFormat = 'hsl';
        break;
      case 'hsl':
        newFormat = 'plain';
        break;
    }
    rainbowc.prefs.setCharPref("format", newFormat);
    event.stopPropagation();
    
    rainbowInspector.resizeSwatch();
  },
  
  resizeSwatch : function() {
    var swatch = rainbowc.get("rainbow-swatch");
    var width = 126, height = 122;
    switch(rainbowInspector.format) {
      case 'plain':
        width = 70;
        height = 70;
        break;
      case 'hex': default:
        width = 76;
        height = 76;
        break;
      case 'rgb':
        width = 124;
        height = 118;
        break;
      case 'per': case 'hsl':
        width: 130;
        height: 124;
        break;
    }
    swatch.style.width = width + "px";
    swatch.style.height = height + "px";
  },

  formatChanged : function() {
    var format = rainbowc.prefs.getCharPref("format");
    rainbowInspector.format = format;
    var color = rainbowc.get("rainbow-swatch").style.backgroundColor;
    var colorval = rainbowc.get("rainbow-swatch-colorval");
    colorval.value = rainbowc.getFormattedColor(color, rainbowInspector.format);
  },

  updateDisplay : function(clientX, clientY, win, event) {
    var coords = rainbowc.get("rainbow-swatch-coords");
    coords.value = "x:" + clientX + " y:" + clientY;
    var swatch = rainbowc.get("rainbow-swatch");
    swatch.x = clientX;
    swatch.y = clientY;

    var nodeName = rainbowc.get("rainbow-swatch-nodeName");
    nodeName.value = rainbowInspector.getNodeName(win, event);
  },

  showDisplay : function() {
    if(!rainbowc.prefs.getBoolPref("inspector.alwaysShow")) {
      rainbowc.get("rainbow-swatch-colorval").hidden = true;
      rainbowc.get("rainbow-swatch-coords").hidden = true;
      rainbowc.get("rainbow-swatch-nodeName").hidden = true;
      return;
    }
    if(rainbowc.prefs.getBoolPref("inspector.showCoordinates"))
      rainbowc.get("rainbow-swatch-coords").hidden = false;
    else
      rainbowc.get("rainbow-swatch-coords").hidden = true;
    if(rainbowc.prefs.getBoolPref("inspector.showNodeName"))
      rainbowc.get("rainbow-swatch-nodeName").hidden = false;
    else
      rainbowc.get("rainbow-swatch-nodeName").hidden = true;
    rainbowc.get("rainbow-swatch-colorval").hidden = false;
  },

  hideDisplay : function() {
    rainbowc.get("rainbow-swatch-colorval").hidden = true;
    rainbowc.get("rainbow-swatch-coords").hidden = true;
    rainbowc.get("rainbow-swatch-nodeName").hidden = true;
  },

  shrink : function() {
    var swatch = rainbowc.get("rainbow-swatch");
    swatch.style.width = "60px";
    swatch.style.height = "60px";
    rainbowInspector.hideDisplay();
  },

  expand : function() {
    var swatch = rainbowc.get("rainbow-swatch");
    rainbowInspector.resizeSwatch();
    rainbowInspector.showDisplay();
  },

  showOnHover : function() {
    if(rainbowc.prefs.getBoolPref("inspector.showCoordinates"))
      rainbowc.get("rainbow-swatch-coords").hidden = false;
    else
      rainbowc.get("rainbow-swatch-coords").hidden = true;
    if(rainbowc.prefs.getBoolPref("inspector.showNodeName"))
      rainbowc.get("rainbow-swatch-nodeName").hidden = false;
    else
      rainbowc.get("rainbow-swatch-nodeName").hidden = true;
    rainbowc.get("rainbow-swatch-colorval").hidden = false;
    rainbowc.get("rainbow-swatch-buttons").hidden = false;
    var topButtons = rainbowc.get("rainbow-swatch-top-buttons");
    topButtons.hidden = false;
    var left;
    switch(rainbowInspector.format) {
      case 'plain':
        left = 70;
        break;
      case 'hex': default:
        left = 70;
        break;
      case 'rgb':
        left = 85;
        break;
      case 'per': case 'hsl':
        left = 90;
        break;
    }
    topButtons.left = left + "px";
  },

  hideOnHover : function(event) {
    if(event && rainbowInspector.mouseOverPanel(event)) // bug 
      return;

    // hide whatever was displayed from hovering
    if(!rainbowc.prefs.getBoolPref("inspector.alwaysShow")) {
      rainbowc.get("rainbow-swatch-coords").hidden = true;
      rainbowc.get("rainbow-swatch-nodeName").hidden = true;
      rainbowc.get("rainbow-swatch-colorval").hidden = true;
    }
    rainbowc.get("rainbow-swatch-buttons").hidden = true;
    rainbowc.get("rainbow-swatch-top-buttons").hidden = true;
  },

  getNodeName : function(win, event) {
    var swatch = rainbowc.get("rainbow-swatch");
    var nodeLabel = rainbowc.get("rainbow-swatch-nodeName");
    var element;
    if(event)
      element = event.originalTarget;
    else {
      var utils = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIDOMWindowUtils);
      try {
        element = utils.elementFromPoint(swatch.x, swatch.y, false, false);
      } catch(e) { /* we need a windowFromPoint function */ return "";}
    }
    return rainbowc.elementString(element);
  },

  swatchClick : function(event) {
    if(event.detail != 1 || event.button != 0)
      return;
    rainbowInspector.focusSwatch(event);
    rainbowInspector.reloadPixel(); // feature - allow inspecting elements with hover
    event.stopPropagation();
  },

  focusSwatch : function(event) {
    window.focus(); // yes, have to do this or else panel will not focus
    rainbowc.get("rainbow-swatch").focus();
  },

  mouseOverPanel : function(event) {
    var swatch = rainbowc.get("rainbow-swatch");
    var left = swatch.boxObject.x + 4;
    var top = swatch.boxObject.y + 4;
    var right = swatch.boxObject.x + 120;
    var bottom = swatch.boxObject.y + 122;
    var x = event.clientX;
    var y = event.clientY;
    return x > left && x < right && y > top && y < bottom;
  },

  overrideCursor : function() {
    rainbowc.registerSheet("chrome://rainbows/skin/cursor.css");
  },

  undoCursor : function() {
    rainbowc.unregisterSheet("chrome://rainbows/skin/cursor.css");
  },
  
  dragStart : function(event) {
    if(event.target.id == "rainbow-swatch-colorval") // bubble trouble
     return;

    var swatch = rainbowc.get("rainbow-swatch");
    swatch.offsetX = event.screenX - swatch.boxObject.screenX; // offset of mouse on swatch
    swatch.offsetY = event.screenY - swatch.boxObject.screenY;

    event.dataTransfer.setData('text/rainbow-color', "rainbow-swatch");
    event.dataTransfer.effectAllowed = "move";
  },

  dragEnd : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(color != 'rainbow-swatch')
      return;

    var swatch = rainbowc.get("rainbow-swatch");
    if(rainbowInspector.canMove)
      swatch.moveTo(event.screenX - swatch.offsetX, event.screenY - swatch.offsetY);
    else {
      swatch.hidePopup();
      swatch.openPopupAtScreen(event.screenX - swatch.offsetX, event.screenY - swatch.offsetY, false);
    }
    event.stopPropagation();
    event.preventDefault();
  },

  applyStart : function(event) {
    var swatch = rainbowc.get("rainbow-swatch");
    var color = swatch.style.backgroundColor;
    event.dataTransfer.setData('text/rainbow-color', color);
    event.dataTransfer.setData('text/rainbow-url', swatch.url);
    event.dataTransfer.setData('text/rainbow-source', 'inspector');
    event.dataTransfer.effectAllowed = "copy";
  },

  applyEnd : function(event) {
    event.stopPropagation();
    event.preventDefault();
  },

  onContextShowing : function() {
    var color = rainbowc.get("rainbow-swatch").color;
    var copyPlain = rainbowc.get("rainbow-context-plain");
    copyPlain.value = colorCommon.toPlain(color);
    copyPlain.label = copyPlain.value;
    var copyRgb = rainbowc.get("rainbow-context-rgb");
    copyRgb.value = colorCommon.toRgb(color);
    copyRgb.label = copyRgb.value;
    var copyHex = rainbowc.get("rainbow-context-hex");
    copyHex.value = colorCommon.toHex(color);
    copyHex.label = copyHex.value;
    var copyPer = rainbowc.get("rainbow-context-per");
    copyPer.value = colorCommon.toPercent(color);
    copyPer.label = copyPer.value;
    var copyHsl = rainbowc.get("rainbow-context-hsl");
    copyHsl.value = colorCommon.toHsl(color);
    copyHsl.label = copyHsl.value;
  },

  openColor : function() {
    var color = rainbowc.get("rainbow-swatch").style.backgroundColor;
    rainbowc.openPicker(color);
  },

  copyColor : function() {
    rainbowc.copyColor(rainbowc.get("rainbow-swatch-colorval").value);
  },

  bookmarkColor : function() {
    var swatch = rainbowc.get("rainbow-swatch");
    var button = rainbowc.get("rainbow-swatch-bookmark");
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "Window:EditColor", "all,dialog=yes,resizable=no,centerscreen",
                  {colors: [swatch.color], url: swatch.url, button: button} );
  },
  
  autoBookmark : function(url) {
    var swatch = rainbowc.get("rainbow-swatch");
    rainbowc.storage.addColor(colorCommon.toHex(swatch.color), "", url);
  }
}
