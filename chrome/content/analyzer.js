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
var rainbowAnalyzer = {
  analyzePage : function(merge) {
    rainbowAnalyzer.clearPanel();

    var panel = document.getElementById("rainbow-analyzer-panel");
    var content = document.getElementById("content");
    panel.url = content.contentDocument.location.href;

    var progress = document.getElementById("rainbow-analyzer-progress");
    progress.hidden = false;
    var progressUrl = document.getElementById("rainbow-analyzer-progress-url");
    progressUrl.value = rainbowc.getString("rainbow.analyzer.progress", panel.url);
    var progressMsg = document.getElementById("rainbow-analyzer-progress-msg");
    progressMsg.value = rainbowc.getString("rainbow.analyzer.extracting");

    var close = document.getElementById("rainbow-analyzer-close");
    close.tooltipText = rainbowc.getString("rainbow.cancel");

    var footer = document.getElementById("rainbow-analyzer-footer");
    footer.hidden = true;

    var statusbar = document.getElementById("status-bar");
    panel.openPopup(statusbar, "before_start", 0, 0);
    setTimeout("rainbowAnalyzer.getPixels()", 200); // otherwise panel won't show immediately
  },

  getPixels : function() {
    var limit = rainbowc.prefs.getIntPref("analyzer.limit");
    var progress = document.getElementById("rainbow-analyzer-progress");
    
    var close = document.getElementById("rainbow-analyzer-close");
    var footer = document.getElementById("rainbow-analyzer-footer");
    var win = document.getElementById("content").contentWindow;
    var pixels = rainbowAnalyzer.getPixelArray(win);
    var msg = document.getElementById("rainbow-analyzer-progress-msg");
    msg.value = rainbowc.getString("rainbow.analyzer.analyzing");

    if(rainbowAnalyzer.worker)
      rainbowAnalyzer.worker.terminate(); // cancel any previous worker

    // put time-consuming clustering on a worker thread
    rainbowAnalyzer.worker = new Worker("chrome://rainbows/content/analyzer-worker.js");
    
    rainbowAnalyzer.worker.onmessage = function(event){
      rainbowAnalyzer.colors = event.data.colors;
      rainbowAnalyzer.resetExpander();
      progress.hidden = true;
      close.tooltipText = rainbowc.getString("rainbow.close");
      rainbowAnalyzer.numShowing = Math.min(limit, rainbowAnalyzer.colors.length);
      rainbowAnalyzer.showColors(rainbowAnalyzer.colors.slice(0, limit));
      footer.hidden = false;
      
      // TAKE OUT
      // alert("pixels: " + event.data.pixelTime + " clustering : " + event.data.clusterTime); 
      //rainbowAnalyzer.worker.terminate(); // crashy crashy
    };

    rainbowAnalyzer.worker.onerror = function(error) {
      var progressMsg = document.getElementById("rainbow-analyzer-progress-msg");
      progressMsg.value = rainbowc.getString("rainbow.analyzer.error");
    };

    rainbowAnalyzer.worker.postMessage({pixels: pixels, width: win.innerWidth, height: win.innerHeight});
  },

  getPixelArray : function(win) {
    var contentWidth = win.innerWidth;
    var contentHeight = win.innerHeight;

    var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    canvas.width = contentWidth;
    canvas.height = contentHeight;
    
    var context = canvas.getContext("2d"); 
    context.drawWindow(win, win.scrollX, win.scrollY, contentWidth , contentHeight, "white");

    return context.getImageData(0, 0, contentWidth, contentHeight).data;
  },

  showColors : function(colors) {
    var format = rainbowc.prefs.getCharPref("format");
    var bookmark = document.getElementById("rainbow-analyzer-bookmark");
    bookmark.value = rainbowc.getString("rainbow.bookmark");
    bookmark.setAttribute("onclick", "rainbowAnalyzer.bookmarkAll();");

    var container = document.getElementById("rainbow-analyzer-container");
    
    // For Mac
    document.getElementById("rainbow-analyzer-panel").focus();

    var row;
    var rowWidth = rainbowAnalyzer.getRowWidth(colors.length);

    for(var i = 0; i < colors.length; i++) {
      if(i % rowWidth == 0) {
        row = document.createElement("hbox");
        container.appendChild(row);
      }
     
      var color = colorCommon.fromBits(colors[i].color);
      var freq = colors[i].freq;
      var proportion = Math.round(colors[i].ratio  * 1000) / 10;

      var swatch = document.createElement("vbox");
      swatch.className = "rainbow-swatch";
      swatch.style.backgroundColor = color;
      if(colorCommon.luminosity(color) > 0.94) {
        if(!outline)
          swatch.style.borderLeft = "1px solid #CCCCCC";
        swatch.style.borderRight = "1px solid #CCCCCC";
        swatch.style.borderTop = "1px solid #CCCCCC";
        swatch.style.borderBottom = "1px solid #CCCCCC";
        var outline = true;
      }
      else
        var outline = false;

      if(format == 'rgb')
        swatch.style.width = "130px";
      if(format == 'per' || format == 'hsl')
        swatch.style.width = "138px";

      swatch.addEventListener("dblclick", function(c) { return function() {colorPlay.openPicker(c);}}(color), true);
      
      var label = document.createElement("label");
      label.className = "rainbow-analyzer-color";
      var propLabel = document.createElement("label");
      propLabel.className = "rainbow-analyzer-prop";

      if(colorCommon.blackText(color)) {
        propLabel.style.color = "black";
        label.style.color = "black";
      }
      else {
        propLabel.style.color = "white";
        label.style.color = "white";
      }

      var formatted = rainbowCommon.getFormattedColor(color);
      label.setAttribute("value", formatted);
      label.hidden = true;
      propLabel.setAttribute("value", proportion + "%");
      propLabel.hidden = true;

      var copyButton = document.createElement("button");
      copyButton.setAttribute("label", rainbowc.getString("rainbow.copy"));
      copyButton.className = "rainbow-analyzer-button";
      copyButton.hidden = true;
      copyButton.setAttribute("oncommand", "rainbowc.copyColor('" + color + "')");

      var bookmarkButton = document.createElement("button");
      if(rainbowc.storage.isSaved(colorCommon.toHex(color))) {
        bookmarkButton.setAttribute("label", rainbowc.getString("rainbow.library"));
        bookmarkButton.setAttribute("oncommand", "colorPlay.openLibrary('" + color + "');");
      }
      else {
        bookmarkButton.setAttribute("label", rainbowc.getString("rainbow.bookmark"));
        bookmarkButton.setAttribute("oncommand", "rainbowAnalyzer.bookmarkColor('" + color + "')");
      }
 
      bookmarkButton.className = "rainbow-analyzer-button";
      bookmarkButton.hidden = true;
      bookmarkButton.id = "rainbow-bookmark-" + color;


      swatch.addEventListener("mouseover", rainbowAnalyzer.showButtons, true);
      swatch.addEventListener("mouseout", rainbowAnalyzer.hideButtons, true);
      swatch.appendChild(label);
      swatch.appendChild(propLabel);
      swatch.appendChild(copyButton);
      swatch.appendChild(bookmarkButton);
      row.appendChild(swatch);
    }
  },

  cancel : function() {
    rainbowAnalyzer.worker.terminate();
    rainbowAnalyzer.closePanel();
  },

  setLimit : function(limit) {
    rainbowc.prefs.setIntPref("analyzer.limit", limit);
    var container = document.getElementById("rainbow-analyzer-container");
    while(container.firstChild)
     container.removeChild(container.firstChild);
    rainbowAnalyzer.showColors(rainbowAnalyzer.colors.slice(0, limit)); // reshow the saved colors
    rainbowAnalyzer.numShowing = limit;
    rainbowAnalyzer.resetExpander();
  },

  addRow : function() {
    var limit = rainbowc.prefs.getIntPref("analyzer.limit");
    var rowWidth = rainbowAnalyzer.getRowWidth(limit);
    rainbowAnalyzer.numShowing = Math.min(limit + rowWidth, rainbowAnalyzer.colors.length);
    rainbowAnalyzer.showColors(rainbowAnalyzer.colors.slice(limit, rainbowAnalyzer.numShowing));

    var expander = document.getElementById("rainbow-analyzer-expand");
    expander.style.MozTransform = "rotate(180deg)";
    expander.removeAttribute("onclick");
    expander.setAttribute("onclick", "rainbowAnalyzer.subtractRow()");
  },

  subtractRow : function() {
    var limit = rainbowc.prefs.getIntPref("analyzer.limit");
    rainbowAnalyzer.numShowing = Math.min(limit, rainbowAnalyzer.colors.length);

    var container = document.getElementById("rainbow-analyzer-container");
    var hboxes = container.getElementsByTagName("hbox");
    container.removeChild(hboxes[hboxes.length - 1]);  

    rainbowAnalyzer.resetExpander();
  },

  resetExpander : function() {
    var expander = document.getElementById("rainbow-analyzer-expand");
    var limit = rainbowc.prefs.getIntPref("analyzer.limit");

    if(rainbowAnalyzer.colors.length <= limit)
      expander.hidden = true;
    else
      expander.hidden = false;

    expander.style.MozTransform = "";
    expander.removeAttribute("onclick");
    expander.setAttribute("onclick", "rainbowAnalyzer.addRow()");
  },

  getRowWidth : function(num) {
    if(num <= 7)
      return num;
    else if (num % 7 == 0)
      return 7;
    else if (num % 6 == 0)
      return 6;
    else if (num % 5 == 0)
      return 5;
    else if (num % 4 == 0)
      return 4;
    else
      return 6;
  },

  showButtons : function(event) {
    if(event.target.nodeName != 'vbox')
      return;
    
    var swatch = event.target;
    var buttons = swatch.getElementsByTagName("button");
    buttons[0].hidden = false;
    buttons[1].hidden = false;

    var labels = swatch.getElementsByTagName("label");
    labels[0].hidden = false;
    labels[1].hidden = false;
  

    // we have to do this due to mouseout bubbling madness
    var container = document.getElementById("rainbow-analyzer-container");
    var swatches = container.getElementsByClassName("rainbow-swatch");
    for(var i = 0; i < swatches.length; i++) {
      if(swatches[i] != swatch) {
        buttons = swatches[i].getElementsByTagName("button");
        buttons[0].hidden = true;
        buttons[1].hidden = true;
        labels = swatches[i].getElementsByTagName("label");
        labels[0].hidden = true;
        labels[1].hidden = true;
      }
   }
  },

  hideButtons : function(event) {
    if(event.target.nodeName != 'vbox')
      return;

    if(rainbowAnalyzer.mouseOverPanel(event))
      return;
      
    var swatch = event.target;
    var buttons = swatch.getElementsByTagName("button");
    buttons[0].hidden = true;
    buttons[1].hidden = true;
    var labels = swatch.getElementsByTagName("label");
    labels[0].hidden = true;
    labels[1].hidden = true;
  },

  mouseOverPanel : function(event) {
    var swatch = event.target;
    var left = swatch.boxObject.x;
    var top = swatch.boxObject.y;
    var right = swatch.boxObject.x + 100;
    var bottom = swatch.boxObject.y + 100;
    var x = event.clientX;
    var y = event.clientY;
    return x > left && x < right && y > top && y < bottom;
  },

  clearPanel : function() {
    var container = document.getElementById("rainbow-analyzer-container");
    while(container.firstChild)
      container.removeChild(container.firstChild);
  },

  closePanel : function() {
    rainbowAnalyzer.clearPanel();

    var panel = document.getElementById("rainbow-analyzer-panel");
    panel.hidePopup();
  },

  dragStart : function(event) {
    if(event.target.id == "swatch-colorval")
     return;

    var panel = document.getElementById("rainbow-analyzer-panel");
    panel.offsetX = event.screenX - panel.boxObject.screenX; // offset of mouse on swatch
    panel.offsetY = event.screenY - panel.boxObject.screenY;

    event.dataTransfer.setData('text/rainbow-color', "analyzer");
    event.dataTransfer.effectAllowed = "move";
  },

  dragEnd : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(color != 'analyzer')
      return;

    var panel = document.getElementById("rainbow-analyzer-panel");
    if(rainbowCommon.getFirefoxVersion() >= 3.6)
      panel.moveTo(event.screenX - panel.offsetX, event.screenY - panel.offsetY);
    else {
      panel.hidePopup();
      panel.openPopupAtScreen(event.screenX - panel.offsetX, event.screenY - panel.offsetY, false);
    }
    event.stopPropagation();
    event.preventDefault();
  },

  bookmarkColor : function(color) {
    var panel = document.getElementById("rainbow-analyzer-panel");
    var button = document.getElementById("rainbow-bookmark-" + color);
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "", "all,dialog=yes,resizable=no,centerscreen",
                  {colors: [color], url: panel.url, button: button} );
  },

  getDisplayedColors : function() {
    var colors = rainbowAnalyzer.colors.slice(0, rainbowAnalyzer.numShowing);
   
    var colorStrings = [];
    for(var i = 0; i < colors.length; i++)
      colorStrings.push(colorCommon.fromBits(colors[i].color));
    return colorStrings;
  },

  copyAll : function() {
    rainbowc.copyColors(rainbowAnalyzer.getDisplayedColors())
  },

  bookmarkAll : function() {
    var button = document.getElementById("rainbow-analyzer-bookmark");
    var panel = document.getElementById("rainbow-analyzer-panel");

    window.openDialog("chrome://rainbows/content/editBookmark.xul",
               "", "all,dialog=yes,resizable=no,centerscreen",
              {colors: rainbowAnalyzer.getDisplayedColors(), url: panel.url, button: button});
  },

  descendingSort : function(a, b) {
    return b.freq - a.freq; 
  },

}
