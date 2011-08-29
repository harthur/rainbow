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
  analyzeImage : function(img) {
     rainbowAnalyzer.url = img.src;
     rainbowAnalyzer.analyze(img)
  },
  
  analyzePage : function() {
     rainbowAnalyzer.url = rainbowc.get("content").contentDocument.location.href;
     rainbowAnalyzer.analyze();
  },

  analyze : function(img) {
    rainbowAnalyzer.clearPanel();

    var panel = rainbowc.get("rainbow-analyzer-panel");

    rainbowc.get("rainbow-analyzer-progress").hidden = false;
    var urlString = rainbowc.getString("rainbow.analyzer.progress", rainbowAnalyzer.url);
    rainbowc.get("rainbow-analyzer-progress-url").value = urlString;
    var progressMsg = rainbowc.getString("rainbow.analyzer.extracting");
    rainbowc.get("rainbow-analyzer-progress-msg").value = progressMsg;

    rainbowc.get("rainbow-analyzer-close").tooltipText = rainbowc.getString("rainbow.cancel");
    rainbowc.get("rainbow-analyzer-footer").hidden = true;
    
    if (img) {
      panel.openPopup(img, "after_start", -80, 10);
    }
    else {
      rainbowc.openPanel(panel, "se", 650, 150);
    }

    setTimeout(function() {
      rainbowAnalyzer.getPixels(img);  // otherwise panel won't show immediately on Win
    }, 200);
  },

  getPixels : function(img) {
    var pixels, width, height;
    if (img) {
       pixels = rainbowAnalyzer.getImagePixels(img);
       width = img.naturalWidth;
       height = img.naturalHeight;
    }
    else {
       var win = rainbowc.get("content").contentWindow,
       pixels = rainbowAnalyzer.getWindowPixels(win);
       width = win.innerWidth,
       height = win.innerHeight;
    }

    var limit = rainbowc.prefs.getIntPref("analyzer.limit"),
        msg = rainbowc.getString("rainbow.analyzer.analyzing");

    rainbowc.get("rainbow-analyzer-progress-msg").value = msg;

    // put time-consuming clustering on a worker thread
    rainbowAnalyzer.worker = new Worker("chrome://rainbows/content/analyzer/analyzer-worker.js");
    
    rainbowAnalyzer.worker.onmessage = function(event) {
      rainbowAnalyzer.colors = event.data.colors;
      rainbowAnalyzer.resetExpander();
      rainbowc.get("rainbow-analyzer-progress").hidden = true;
      rainbowc.get("rainbow-analyzer-close").tooltipText = rainbowc.getString("rainbow.close");
      rainbowAnalyzer.numShowing = Math.min(limit, rainbowAnalyzer.colors.length);
      rainbowAnalyzer.showColors(rainbowAnalyzer.colors.slice(0, limit));
      rainbowc.get("rainbow-analyzer-footer").hidden = false;
      
      var panel = rainbowc.get("rainbow-analyzer-panel");
      rainbowc.openPanel(panel, "se", 650, 150);

      /* alert("pixels: " + event.data.pixelTime + " clustering : " + event.data.clusterTime 
               + " colors: " + rainbowAnalyzer.colors.length);  */
    };

    rainbowAnalyzer.worker.onerror = function(event) {
      if (!event.data)
        return;
      var error = rainbowc.getString("rainbow.analyzer.error");
      rainbowc.get("rainbow-analyzer-progress-msg").value = error;
    };

    rainbowAnalyzer.worker.postMessage({pixels: pixels, width: width, height: height});
  },
  
  getImagePixels : function(img) {
     var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
         width = img.naturalWidth,
         height = img.naturalHeight;
     canvas.width = width;
     canvas.height = height;

     var context = canvas.getContext("2d"); 
     context.drawImage(img, 0, 0);

     return context.getImageData(0, 0, width, height).data;
  },

  getWindowPixels : function(win) {
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
    var bookmarkAll = rainbowc.get("rainbow-analyzer-bookmark");
    bookmarkAll.value = rainbowc.getString("rainbow.bookmark");
    bookmarkAll.setAttribute("onclick", "rainbowAnalyzer.bookmarkAll();");

    var container = rainbowc.get("rainbow-analyzer-container");
    
    // For Mac
    rainbowc.get("rainbow-analyzer-panel").focus();

    var row;
    var rowWidth = rainbowAnalyzer.getRowWidth(colors.length);

    for(var i = 0; i < colors.length; i++) {
      if(i % rowWidth == 0) {
        row = document.createElement("hbox");
        container.appendChild(row);
      }
     
      var color = rainbowColor.fromBits(colors[i].color);
      var freq = colors[i].freq;
      var proportion = Math.round(colors[i].ratio  * 1000) / 10;

      var swatch = document.createElement("vbox");
      swatch.className = "rainbow-swatch";
      swatch.style.backgroundColor = color;
      if(rainbowColor.luminosity(color) > 0.94) {
        if(!outline)
          swatch.style.borderLeft = "1px solid #CCCCCC";
        swatch.style.borderRight = "1px solid #CCCCCC";
        swatch.style.borderTop = "1px solid #CCCCCC";
        swatch.style.borderBottom = "1px solid #CCCCCC";
        var outline = true;
      }
      else
        var outline = false;

      var format = rainbowc.prefs.getCharPref("format");
      if(format == 'rgb')
        swatch.style.width = "130px";
      if(format == 'per' || format == 'hsl')
        swatch.style.width = "138px";

      swatch.addEventListener("dblclick", function(c) { return function() {rainbowc.openPicker(c);}}(color), true);
      
      var label = document.createElement("label");
      label.className = "rainbow-analyzer-color";
      var propLabel = document.createElement("label");
      propLabel.className = "rainbow-analyzer-prop";

      if(rainbowColor.blackText(color)) {
        propLabel.style.color = "black";
        label.style.color = "black";
      }
      else {
        propLabel.style.color = "white";
        label.style.color = "white";
      }

      var formatted = rainbowc.getFormattedColor(color);
      label.setAttribute("value", formatted);
      label.hidden = true;
      propLabel.setAttribute("value", proportion + "%");
      propLabel.hidden = true;

      var copyButton = document.createElement("button");
      copyButton.setAttribute("label", rainbowc.getString("rainbow.copy"));
      copyButton.className = "rainbow-analyzer-button";
      copyButton.hidden = true;
      copyButton.setAttribute("color", color);
      copyButton.setAttribute("oncommand", "rainbowc.copyColor(this.getAttribute('color'))");

      var bookmarkButton = document.createElement("button");
      bookmarkButton.setAttribute("color", color);
      if(rainbowc.storage.isSaved(rainbowColor.toHex(color))) {
        bookmarkButton.setAttribute("label", rainbowc.getString("rainbow.library"));
        bookmarkButton.setAttribute("oncommand", "rainbowc.openLibrary(this.getAttribute('color'));");
      }
      else {
        bookmarkButton.setAttribute("label", rainbowc.getString("rainbow.bookmark"));
        bookmarkButton.setAttribute("oncommand", "rainbowAnalyzer.bookmarkColor(this.getAttribute('color'))");
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
    var container = rainbowc.get("rainbow-analyzer-container");
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

    var expander = rainbowc.get("rainbow-analyzer-expand");
    expander.style.MozTransform = "rotate(180deg)";
    expander.removeAttribute("onclick");
    expander.setAttribute("onclick", "rainbowAnalyzer.subtractRow()");
  },

  subtractRow : function() {
    var limit = rainbowc.prefs.getIntPref("analyzer.limit");
    rainbowAnalyzer.numShowing = Math.min(limit, rainbowAnalyzer.colors.length);

    var container = rainbowc.get("rainbow-analyzer-container");
    var hboxes = container.getElementsByTagName("hbox");
    container.removeChild(hboxes[hboxes.length - 1]);  

    rainbowAnalyzer.resetExpander();
  },

  resetExpander : function() {
    var expander = rainbowc.get("rainbow-analyzer-expand");
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
    var container = rainbowc.get("rainbow-analyzer-container");
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
    var container = rainbowc.get("rainbow-analyzer-container");
    while(container.firstChild)
      container.removeChild(container.firstChild);
  },

  closePanel : function() {
    rainbowAnalyzer.clearPanel();

    var panel = rainbowc.get("rainbow-analyzer-panel");
    panel.hidePopup();
  },

  dragStart : function(event) {
    if(event.target.id == "swatch-colorval")
     return;

    var panel = rainbowc.get("rainbow-analyzer-panel");
    panel.offsetX = event.screenX - panel.boxObject.screenX; // offset of mouse on swatch
    panel.offsetY = event.screenY - panel.boxObject.screenY;

    event.dataTransfer.setData('text/rainbow-color', "analyzer");
    event.dataTransfer.effectAllowed = "move";
  },

  dragEnd : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(color != 'analyzer')
      return;

    var panel = rainbowc.get("rainbow-analyzer-panel");
    var x = event.screenX - panel.offsetX;
    var y = event.screenY - panel.offsetY;
    if(rainbowc.getFirefoxVersion() >= 3.6)
      panel.moveTo(x, y);
    else {
      panel.hidePopup();
      panel.openPopupAtScreen(x, y, false);
    }
    event.stopPropagation();
    event.preventDefault();
  },

  bookmarkColor : function(color) {
    var panel = rainbowc.get("rainbow-analyzer-panel");
    var button = rainbowc.get("rainbow-bookmark-" + color);
    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "", "all,dialog=yes,resizable=no,centerscreen",
                  {colors: [color], url: rainbowAnalyzer.url, button: button} );
  },

  getDisplayedColors : function() {
    var colors = rainbowAnalyzer.colors.slice(0, rainbowAnalyzer.numShowing);
    var colorStrings = [];
    for(var i = 0; i < colors.length; i++)
      colorStrings.push(rainbowColor.fromBits(colors[i].color));
    return colorStrings;
  },

  copyAll : function() {
    rainbowc.copyColors(rainbowAnalyzer.getDisplayedColors())
  },

  bookmarkAll : function() {
    var button = rainbowc.get("rainbow-analyzer-bookmark");
    var panel = rainbowc.get("rainbow-analyzer-panel");

    window.openDialog("chrome://rainbows/content/editBookmark.xul",
               "", "all,dialog=yes,resizable=no,centerscreen",
              {colors: rainbowAnalyzer.getDisplayedColors(), url: rainbowAnalyzer.url, button: button});
  }
}
