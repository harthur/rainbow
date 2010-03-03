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

  toggleInspector : function(event) {
   if(rainbowInspector.inspectorOn)
     rainbowInspector.stopInspector();
   else
     rainbowInspector.startInspector();
  },

  startInspector : function() {
    rainbowInspector.inspectorOn = true;
   
    var prefs = rainbowc.prefs;
    var location = prefs.getCharPref("inspector.location");
    rainbowInspector.openSwatch(location);  

    rainbowInspector.format = prefs.getCharPref("format");
    rainbowInspector.follow = prefs.getBoolPref("inspector.followMouse");

    rainbowInspector.showDisplay();
    
    if(rainbowc.getFirefoxVersion() >= 3.6)
      rainbowInspector.canMove = true; // bug 474149
    
    rainbowInspector.startInspecting();
  },
 
  stopInspector : function() {
    this.inspectorOn = false;

    var swatch = document.getElementById("rainbow-swatch");
    var location = rainbowInspector.getSwatchLocation();
    rainbowc.prefs.setCharPref("inspector.location", location);

    swatch.hidePopup();
    rainbowInspector.hideOnHover();

    rainbowInspector.stopInspecting();
    rainbowInspector.stopFix();
  },

  openSwatch : function(dir) {
    var swatch = document.getElementById("rainbow-swatch");
    var browser = document.getElementById("content");
    var content = browser.mPanelContainer.boxObject;
    swatch.style.backgroundColor = "white";

    switch(dir) {
      case 'nw':
       swatch.openPopupAtScreen(content.screenX, content.screenY, false);
       break;
      case 'ne':
       var x = content.screenX + browser.contentWindow.innerWidth - 126;
       swatch.openPopupAtScreen(x, content.screenY, false);
       break;
      case 'sw':
       swatch.openPopup(document.getElementById("status-bar"), "before_start", 0, 0);
       break;
      case 'se':
       swatch.openPopup(document.getElementById("status-bar"), "before_end", 0, 0);
       break;
    }
  },

  getSwatchLocation : function() {
    var browser = document.getElementById("content");
    var content = browser.mPanelContainer;
    var bleft = content.boxObject.screenX; 
    var btop = content.boxObject.screenY;
    var bright = bleft + browser.contentWindow.innerWidth;
    var bbottom = btop + browser.contentWindow.innerHeight;

    var swatch = document.getElementById("rainbow-swatch");
    var sleft = swatch.boxObject.screenX;
    var stop = swatch.boxObject.screenY;
    var sright = sleft + swatch.boxObject.width;
    var sbottom = stop + swatch.boxObject.height;

    if(Math.abs(sleft - bleft) < 200 && Math.abs(stop - btop) < 200)
      return "nw";
    if(Math.abs(sleft - bleft) < 200 && Math.abs(sbottom - bbottom) < 200)
      return "sw";
    if(Math.abs(sright - bright) < 200 && Math.abs(stop - btop) < 200)
      return "ne";
    if(Math.abs(sright - bright) < 200 && Math.abs(sbottom - bbottom) < 200)
      return "se";
    return "nw";
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
      win.addEventListener("click", rainbowInspector.fixPixel, true);
      rainbowc.preventEvents(win, rainbowInspector.mouseEvents);
    }
  },

  removeInspectionListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext(); 
      try {
        win.removeEventListener("mousemove", rainbowInspector.inspectPixel, true);
        win.removeEventListener("click", rainbowInspector.fixPixel, true);
        rainbowc.allowEvents(win, rainbowInspector.mouseEvents);
      } catch(e) { }
    }
  },

  addFixListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      var content = win.document.getElementById("content").mPanelContainer;
      content.addEventListener("dblclick", rainbowInspector.resumeInspect, true);
    }
  },

  removeFixListeners : function() {
    var enumerator = rainbowc.wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext(); 
      try {
        var content = win.document.getElementById("content").mPanelContainer;
        content.removeEventListener("dblclick", rainbowInspector.resumeInspect, true);
      } catch(e) {}
    }
  },

  fixPixel : function (event) {
    rainbowInspector.stopInspecting();
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
  },

  startFix : function (event) {
    rainbowInspector.fixed = true;
    var content = document.getElementById("content");
    var swatch = document.getElementById("rainbow-swatch");
    swatch.addEventListener("mouseover", rainbowInspector.showOnHover, true);
    swatch.addEventListener("mouseout", rainbowInspector.hideOnHover, true);

    /* var container = content.mPanelContainer;
       container.addEventListener("mousemove", rainbowInspector.measureCoords, true); 
    if(rainbowc.prefs.getBoolPref("inspector.showDifference"))
      rainbowInspector.showDifference(); */

    rainbowInspector.addFixListeners();

    swatch.url = event.target.ownerDocument.location.href; // for potential bookmarking
    swatch.focus(); // so keypress event fires to move swatch up and down

    var button = document.getElementById("rainbow-swatch-bookmark");
    var color = colorCommon.toHex(swatch.style.backgroundColor);
    if(rainbowc.storage.isSaved(color)) {
      button.label = rainbowc.getString("rainbow.view");
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "colorPlay.openLibrary('" + color + "');");
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
    var swatch = document.getElementById("rainbow-swatch");
    swatch.removeEventListener("mouseover", rainbowInspector.showOnHover, true);
    swatch.removeEventListener("mouseout", rainbowInspector.hideOnHover, true);

    /* var container = document.getElementById("content").mPanelContainer;
       container.removeEventListener("mousemove", rainbowInspector.measureCoords, true); 
       rainbowInspector.hideMeasure();*/

    rainbowInspector.removeFixListeners();
    rainbowInspector.hideOnHover();
  },

  inspectPixel : function (event) {
    var win = event.target.ownerDocument.defaultView;
    var pageX = event.clientX + win.scrollX;
    var pageY = event.clientY + win.scrollY;
    var color = rainbowInspector.getPixel(win, pageX, pageY);
    rainbowInspector.changeColor(color);

    var swatch = document.getElementById("rainbow-swatch");
    if(rainbowInspector.canMove && rainbowInspector.follow)
      swatch.moveTo(event.screenX + 3, event.screenY + 3);
    swatch.element = event.target.nodeName;
    swatch.clientX = event.clientX - 3; // can keep track in case of keypress moving
    swatch.clientY = event.clientY - 3;
    swatch.pageX = event.clientX + win.scrollX;
    swatch.pageY = event.clientY + win.scrollY;
    swatch.win = win;

    rainbowInspector.updateDisplay(event.clientX, event.clientY, win, event);
   
    event.preventDefault();
    event.stopPropagation();
  },

  reloadPixel : function() {
    var swatch = document.getElementById("rainbow-swatch");
    var color = rainbowInspector.getPixel(swatch.win, swatch.pageX, swatch.pageY);
    rainbowInspector.changeColor(color, true);
  },
  
  changeColor : function(color, show) {
    var swatch = document.getElementById("rainbow-swatch");
    swatch.style.backgroundColor = color;
    swatch.color = colorCommon.toHex(color);
    
    var blackText = colorCommon.blackText(color);
    var colorval = document.getElementById("rainbow-swatch-colorval");
    colorval.value = rainbowc.getFormattedColor(color, rainbowInspector.format);
    colorval.style.color = blackText ? 'black' : 'white';

    var stats = document.getElementById("rainbow-swatch-stats");
    stats.style.color = blackText ? '#333333' : '#EEEEEE';
  },

  getPixel : function(win, x, y) {
    context = document.getElementById("rainbow-inspector").getContext("2d");
    context.drawWindow(win, x, y, 1, 1, "white");
    var data = context.getImageData(0, 0, 1, 1).data;
    return "rgb(" + data[0] + "," + data[1] + "," + data[2] + ")";
  },

  moveSwatch : function(event) { // called on keyboard press if follow mouse enabled
    if(!rainbowInspector.canMove)
      return;

    var swatch = document.getElementById("rainbow-swatch");
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
 
    var content = document.getElementById("content");
    var browser = content.mCurrentBrowser;
    var clientX = swatch.boxObject.x - browser.boxObject.x - 1;
    var clientY = swatch.boxObject.y - browser.boxObject.y - 1;
    var win = content.contentWindow;
    var pageX = clientX + win.scrollX;
    var pageY = clientY + win.scrollY;
    // this is incorrect on pages with frames
    var color = rainbowInspector.getPixel(win, pageX, pageY);

    rainbowInspector.changeColor(color);

    var button = document.getElementById("rainbow-swatch-bookmark");

    color = colorCommon.toHex(color);
    if(rainbowc.storage.isSaved(color)) {
      // change because mouse could be over the swatch when keying down or up
      button.label = "View Library";
      button.removeAttribute('oncommand');
      button.setAttribute("oncommand", "colorPlay.openLibrary('" + color + "');");
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
      case 'plain':
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
      default:
        newFormat = 'hex';
        break;
    }
    rainbowc.prefs.setCharPref("format", newFormat);
    event.stopPropagation();
  },

  formatChanged : function() {
    var format = rainbowc.prefs.getCharPref("format");
    rainbowInspector.format = format;
    var color = document.getElementById("rainbow-swatch").style.backgroundColor;
    var colorval = document.getElementById("rainbow-swatch-colorval");
    colorval.value = rainbowc.getFormattedColor(color, rainbowInspector.format);
  },

/*
  showDifference : function() {
    var coords = document.getElementById("rainbow-swatch-measure");
    coords.hidden = false;
  },


  hideMeasure : function() {
    var coords = document.getElementById("rainbow-swatch-measure");
    coords.hidden = true;
  },

  measureCoords : function(event) {
    var swatch = document.getElementById("rainbow-swatch");
    var dX = event.clientX - swatch.x;
    var dY = event.clientY - swatch.y;
    var coords = document.getElementById("rainbow-swatch-measure");
    coords.value = "   " + dX + "   " + dY;
  },
*/

  updateDisplay : function(clientX, clientY, win, event) {
    var coords = document.getElementById("rainbow-swatch-coords");
    coords.value = "x:" + clientX + " y:" + clientY;
    var swatch = document.getElementById("rainbow-swatch");
    swatch.x = clientX;
    swatch.y = clientY;

    var nodeName = document.getElementById("rainbow-swatch-nodeName");
    nodeName.value = rainbowInspector.getNodeName(win, event);
  },

  showDisplay : function() {
    if(!rainbowc.prefs.getBoolPref("inspector.alwaysShow")) {
      document.getElementById("rainbow-swatch-colorval").hidden = true;
      document.getElementById("rainbow-swatch-coords").hidden = true;
      document.getElementById("rainbow-swatch-nodeName").hidden = true;
      return;
    }
    if(rainbowc.prefs.getBoolPref("inspector.showCoordinates"))
      document.getElementById("rainbow-swatch-coords").hidden = false;
    else
      document.getElementById("rainbow-swatch-coords").hidden = true;
    if(rainbowc.prefs.getBoolPref("inspector.showNodeName"))
      document.getElementById("rainbow-swatch-nodeName").hidden = false;
    else
      document.getElementById("rainbow-swatch-nodeName").hidden = true;
    document.getElementById("rainbow-swatch-colorval").hidden = false;
  },

  showOnHover : function(event) {
    if(rainbowc.prefs.getBoolPref("inspector.showCoordinates"))
      document.getElementById("rainbow-swatch-coords").hidden = false;
    else
      document.getElementById("rainbow-swatch-coords").hidden = true;
    if(rainbowc.prefs.getBoolPref("inspector.showNodeName"))
      document.getElementById("rainbow-swatch-nodeName").hidden = false;
    else
      document.getElementById("rainbow-swatch-nodeName").hidden = true;
    document.getElementById("rainbow-swatch-colorval").hidden = false;
    document.getElementById("rainbow-swatch-buttons").hidden = false;
    document.getElementById("rainbow-swatch-top-buttons").hidden = false;
  },

  hideOnHover : function(event) {
    if(event && rainbowInspector.mouseOverPanel(event)) // bug 
      return;

    // hide whatever was displayed from hovering
    if(!rainbowc.prefs.getBoolPref("inspector.alwaysShow")) {
      document.getElementById("rainbow-swatch-coords").hidden = true;
      document.getElementById("rainbow-swatch-nodeName").hidden = true;
      document.getElementById("rainbow-swatch-colorval").hidden = true;
    }
    document.getElementById("rainbow-swatch-buttons").hidden = true;
    document.getElementById("rainbow-swatch-top-buttons").hidden = true;
  },

  getNodeName : function(win, event) {
    var swatch = document.getElementById("rainbow-swatch");
    var nodeLabel = document.getElementById("rainbow-swatch-nodeName");
    var nodeName;
    if(event)
      nodeName = event.originalTarget.nodeName;
    else {
      var utils = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIDOMWindowUtils);
      try {
        nodeName = utils.elementFromPoint(swatch.x, swatch.y, false, false).nodeName;
      } catch(e) { /* we need a windowFromPoint function */ return "";}
    }
    return nodeName.toLowerCase();
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
    document.getElementById("rainbow-swatch").focus();
  },

  mouseOverPanel : function(event) {
    var swatch = document.getElementById("rainbow-swatch");
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

    var swatch = document.getElementById("rainbow-swatch");
    swatch.offsetX = event.screenX - swatch.boxObject.screenX; // offset of mouse on swatch
    swatch.offsetY = event.screenY - swatch.boxObject.screenY;

    event.dataTransfer.setData('text/rainbow-color', "rainbow-swatch");
    event.dataTransfer.effectAllowed = "move";
  },

  dragEnd : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(color != 'rainbow-swatch')
      return;

    var swatch = document.getElementById("rainbow-swatch");
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
    var swatch = document.getElementById("rainbow-swatch");
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
    var color = document.getElementById("rainbow-swatch").color;
    var copyPlain = document.getElementById("rainbow-context-plain");
    var copyRgb = document.getElementById("rainbow-context-rgb");
    var copyHex = document.getElementById("rainbow-context-hex");
    var copyPer = document.getElementById("rainbow-context-per");
    var copyHsl = document.getElementById("rainbow-context-hsl");

    copyPlain.value = colorCommon.toPlain(color);
    copyPlain.label = copyPlain.value;
    copyRgb.value = colorCommon.toRgb(color);
    copyRgb.label = copyRgb.value;
    copyHex.value = colorCommon.toHex(color);
    copyHex.label = copyHex.value;
    copyPer.value = colorCommon.toPercent(color);
    copyPer.label = copyPer.value;
    copyHsl.value = colorCommon.toHsl(color);
    copyHsl.label = copyHsl.value;
  },

  openColor : function() {
    var color = document.getElementById("rainbow-swatch").style.backgroundColor;
    colorPlay.openPicker(color);
  },

  copyColor : function() {
    rainbowc.copyColor(document.getElementById("rainbow-swatch-colorval").value);
  },

  bookmarkColor : function() {
    var swatch = document.getElementById("rainbow-swatch");
    var button = document.getElementById("rainbow-swatch-bookmark");
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "Window:EditColor", "all,dialog=yes,resizable=no,centerscreen",
                  {colors: [swatch.color], url: swatch.url, button: button} );
  }
}

var colorPlay = {
  onLoad : function() {
    rainbowc.prefs.addObserver("", colorPlay, false);

    if(rainbowc.getFirefoxVersion() < 3.5)
      document.getElementById("rainbow-menu-analyzer").hidden = true;

    /* set attributes for applying platform-specific styling */
    var platform = rainbowc.getPlatform();
    var swatch = document.getElementById("rainbow-swatch");
    swatch.setAttribute("rainbow-platform", platform);
    var analyzer = document.getElementById("rainbow-analyzer-panel");
    analyzer.setAttribute("rainbow-platform", platform);

    var icon = document.getElementById("rainbow-statusbar");
    icon.setAttribute("hidden", !rainbowc.prefs.getBoolPref("statusbar.show"));

    var show = !rainbowc.prefs.getBoolPref("context");
    document.getElementById("rainbow-context-menu").setAttribute("hidden", show);
    document.getElementById("rainbow-context-separator").setAttribute("hidden", show);

    colorPlay.addDragListeners();
  },

  onUnLoad : function() {
    rainbowc.prefs.removeObserver("", colorPlay);
    colorPlay.removeDragListeners();
  },

  observe : function(subject, topic, data) {
    if (topic == "nsPref:changed") {
      switch(data) {
        case "statusbar.show":
          var icon = document.getElementById("rainbow-statusbar");
          icon.setAttribute("hidden", !rainbowc.prefs.getBoolPref("statusbar.show"));
          break;
        case "context":
          var show = !rainbowc.prefs.getBoolPref("context");
          document.getElementById("rainbow-context-menu").setAttribute("hidden", show);
          document.getElementById("rainbow-context-separator").setAttribute("hidden", show);
          break;
        case "format":
          rainbowInspector.formatChanged();
          break;
        case "inspector.alwaysShow":
          rainbowInspector.showDisplay();
          break;
        default:
          break;
      }
    }
  },

  openLibrary : function(color) {
    var library = rainbowc.wm.getMostRecentWindow("rainbow:library")
                  || window.openDialog("chrome://rainbows/content/library.xul",
                       "rainbow:library", "chrome,all,dialog=yes", color);
    library.focus();
  },

  openPicker : function(color) {
     window.openDialog("chrome://rainbows/content/picker.xul",
                      "", "chrome,all,dialog=yes", color);
  },

  statusBarClicked : function() {
    switch(rainbowc.prefs.getCharPref("statusbar.action")) {
      case 'inspector':
        rainbowInspector.toggleInspector();
        break;
      case 'picker':
        colorPlay.openPicker();
        break;
      case 'library':
        colorPlay.openLibrary();
        break;
     case 'analyzer':
        rainbowAnalyzer.analyzePage();
        break;
      default:
        rainbowInspector.toggleInspector();
        break;
    }
  },

  applyDrop : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(colorCommon.isValid(color)) { // make sure this is our drag
      event.target.style.background = color;
      if(event.target.removeAttribute)
        event.target.removeAttribute("rainbowfirefox");
      else if(event.target.parentNode.removeAttribute)
        event.target.parentNode.removeAttribute("rainbowfirefox");
      event.stopPropagation();
      event.preventDefault();
    }
  },

  applyDragEnter : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(colorCommon.isValid(color)) {
      if(event.target.setAttribute)
        event.target.setAttribute("rainbowfirefox", "true");
      else if(event.target.parentNode.removeAttribute)
        event.target.parentNode.setAttribute("rainbowfirefox", "true");
      event.stopPropagation();
      event.preventDefault();
    }
  },

  applyDragLeave : function(event) {
    if(event.dataTransfer == null) {
      // sometimes this happens
      if(event.target.removeAttribute)
        event.target.removeAttribute("rainbowfirefox");
      return;
    }
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(color) {
      if(event.target.removeAttribute)
        event.target.removeAttribute("rainbowfirefox");
      else
        event.target.parentNode.removeAttribute("rainbowfirefox");
      event.stopPropagation();
      event.preventDefault();
    }
  },

  addDragListeners : function() {
    window.removeEventListener("load", colorPlay.addDragListeners, false);
    var container = document.getElementById("content").mPanelContainer;
    container.addEventListener("drop", colorPlay.applyDrop, true);
    container.addEventListener("dragenter", colorPlay.applyDragEnter, true);
    container.addEventListener("dragleave", colorPlay.applyDragLeave, true);

    // for drop indicator styling of webpage content
    rainbowc.registerSheet("chrome://rainbows/skin/drag.css", null, null);
  },

  removeDragListeners : function() {
    window.removeEventListener("unload", colorPlay.removeDragListeners, false);
    var container = document.getElementById("content").mPanelContainer;
    container.removeEventListener("drop", colorPlay.applyDrop, true);
    container.removeEventListener("dragenter", colorPlay.applyDragEnter, true);
    container.removeEventListener("dragleave", colorPlay.applyDragLeave, true);
  }
}

window.addEventListener("load", colorPlay.onLoad, false);
window.addEventListener("unload", colorPlay.onUnLoad, false);
