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
var library = {
  init : function() {
    treeView.init(rainbowc.storage);
    var libraryTree = document.getElementById("libraryTree");
    libraryTree.treeBoxObject.view = treeView;

    rainbowc.observers.addObserver(library.onChangeObserver, "rainbow-color-added", false);
    rainbowc.observers.addObserver(library.onChangeObserver, "rainbow-color-edited", false);
		
    library.stylesheet = rainbowc.getStyleSheetByTitle("treeColors");
    var colors = rainbowc.storage.allColors();
    library.addColorRules(colors);
    library.sortAndSet(colors);

    var contrast = document.getElementById("context-contrast");
    contrast.setAttribute("rainbow-platform", rainbowc.getPlatform());
 
    var filterBox = document.getElementById("filterBox");
    var urlHidden = document.getElementById("col-url").hidden;
    if(urlHidden)
      filterBox.emptyText = rainbowc.getString("rainbow.library.bytag");
    if(!colors.length)
      filterBox.emptyText = rainbowc.getString("rainbow.library.empty");
    else
      filterBox.focus();

    if(window.arguments && window.arguments[0]) {
      var color = window.arguments[0];
      library.selectColor(color);
      library.scrollToColor(color);
    }
  },

  selectColor : function(color) {
    var row = library.rowForColor(color);
    treeView.selection.select(row);
  },

  scrollToColor : function(color) {
    var libraryTree = document.getElementById("libraryTree");
    var row = library.rowForColor(color);
    libraryTree.treeBoxObject.scrollToRow(row);
  },

  shutdown : function() {
    rainbowc.observers.removeObserver(library.onChangeObserver, "rainbow-color-added");
    rainbowc.observers.removeObserver(library.onChangeObserver, "rainbow-color-edited");
  },

  onChangeObserver : {
    observe : function(subject, topic, data) {
      if(topic == "rainbow-color-added") {
        /* just reload the colors */
        library.addColorRules([data]);
        library.loadColors();
      }
      else if(topic == "rainbow-color-edited") {
        var row = rowForColor([data]);
        treeView.invalidateRow(row);
      }
    }
  },

  loadColors : function() {
    var filterString = document.getElementById("filterBox").value;
    var urlHidden = document.getElementById("col-url").hidden;
    var selectedColor = treeView.colorAt(treeView.selection.currentIndex);
    let colors; 
    if(!filterString) 
      colors = rainbowc.storage.allColors();
    else if(urlHidden)
      colors = rainbowc.storage.colorsMatchingTag(filterString);
    else
      colors = rainbowc.storage.colorsMatching(filterString);
    
    library.sortAndSet(colors);
    if(selectedColor) {
      library.selectColor(selectedColor);
    }
  },

  onContextShowing : function() {
    var copy = document.getElementById("context-copy");
    var edit = document.getElementById("context-edit");
    var open = document.getElementById("context-open");
    var urlopen = document.getElementById("context-url");
    var tags = document.getElementById("context-tags");
    var merge = document.getElementById("context-merge");
    var cont = document.getElementById("context-contrast");
    var dist = document.getElementById("context-distance");
    var dist94 = document.getElementById("context-distance94");
    var list = document.getElementById("context-copy-list");
 
    if(rainbowc.storage.countTags() == 0)
      tags.hidden = true;
    else
      tags.hidden = false;

    urlopen.hidden = true;
    var colors = library.getSelection();
    for(var i = 0; i < colors.length; i++) {
      if(rainbowc.storage.urlOf(colors[i])) {
        urlopen.hidden = false;
        break;
      }
    }

    if(treeView.selection.count > 1) {
      edit.hidden = true;
      copy.hidden = true;
      open.hidden = true;
      list.hidden = false;
      
      if(treeView.selection.count == 2) {
        cont.hidden = false;
        merge.hidden = false;
        dist.hidden = false;
        dist94.hidden = true; // TAKE OUT
        dist.hidden = true; // TAKE OUT

        var contrast = library.contrastSelection();
        var contLabel =  document.getElementById("context-contrast-value");
        contLabel.value = rainbowc.getString("rainbow.library.contrast", contrast);
        var meter = document.getElementById("context-contrast-meter");

        if(contrast < 4.5) {
          meter.value = rainbowc.getString("rainbow.library.low");
          meter.className = "low-contrast";
        }
        else if(contrast < 8) {
          meter.value = rainbowc.getString("rainbow.library.okay");
          meter.className = "medium-contrast";
        }
        else {
          meter.value = rainbowc.getString("rainbow.library.high");
          meter.className = "high-contrast";
        }

        dist.label = "CIE76 distance: " + library.distanceSelection();
        dist94.label = "CIE94 distance: " + library.distance94Selection();
      }
      else {
        merge.hidden = true;
        cont.hidden = true;
        dist.hidden = true;
        dist94.hidden = true;
      }

    }
    else {
      var color = treeView.colorAt(treeView.selection.currentIndex);
      edit.hidden = false;
      copy.hidden = false;
      open.hidden = false;
      cont.hidden = true;
      dist.hidden = true;
      dist94.hidden = true;
      list.hidden = true;
      merge.hidden = true;

      url = rainbowc.storage.urlOf(color);
      if(url)
        urlopen.hidden = false;
      
      var copyRgb = document.getElementById("context-copy-rgb");
      copyRgb.label = rainbowColor.toRgb(color);
      var copyHex = document.getElementById("context-copy-hex");
      copyHex.label = rainbowColor.toHex(color);
      var copyPlain = document.getElementById("context-copy-plain");
      copyPlain.label = rainbowColor.toPlain(color);
      var copyPer = document.getElementById("context-copy-per");
      copyPer.label = rainbowColor.toPercent(color);
      var copyHsl = document.getElementById("context-copy-hsl");
      copyHsl.label = rainbowColor.toHsl(color);
    }
  
  },

  tagsMenuShowing : function() {
    var taglist = document.getElementById("context-tagslist");
    var tags = rainbowc.storage.recentTags();
    while(taglist.firstChild)
      taglist.removeChild(taglist.firstChild);
    
    for(var i = 0; i < tags.length; i++) {
      var menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", tags[i]);
      menuitem.setAttribute("class", "menuitem-iconic");
      menuitem.setAttribute("image" ,"chrome://browser/skin/places/tag.png");
      menuitem.value = tags[i];
      menuitem.setAttribute("oncommand" ,"library.addTag(this.value);");
      taglist.appendChild(menuitem);
    }
  },

  addTag : function(tag) {
    treeView.selection.selectionEventsSuppressed = true;
    var colors = library.getSelection();
    for(let i = 0; i < colors.length; i++) {
      rainbowc.storage.addTags(rainbowColor.toHex(colors[i]), tag);
    }
    treeView.selection.selectionEventsSuppressed = false;
  },
    
  copySelection : function(format) {
    rainbowc.copyColors(library.getSelection(), format);
  },

  deleteSelection : function() {
    /* don't allow more selection to occur while we are deleting */
    treeView.selection.selectionEventsSuppressed = true;

    var colors = library.getSelection();
    for(let i = 0; i < colors.length; i++)
      rainbowc.storage.removeColor(rainbowColor.toHex(colors[i]));

    library.loadColors();
    treeView.selection.selectionEventsSuppressed = false;
  },

  editSelection : function(event) {
    if(event && (event.button != 0 || event.detail < 2))
      return; // not a double click
    var color = library.getSelection()[0];
    var editWindow =  window.openDialog(
                  "chrome://rainbows/content/editBookmark.xul",
                  "", "all,dialog=yes,resizable=no, centerscreen", 
                  {colors: [rainbowColor.toHex(color)]});
  },

  openSelection : function() {
    var color = library.getSelection()[0];
    rainbowc.openPicker(color);
  },

  openUrl : function() {
    var colors = library.getSelection();
    var urls = {};
    for(var i = 0; i < colors.length; i++) {
      let url = rainbowc.storage.urlOf(colors[i]);
      if(url)
        urls[url] = url;
    }
    
    var browser = rainbowc.wm.getMostRecentWindow("navigator:browser");
    for(var url in urls)
      browser.gBrowser.selectedTab = browser.gBrowser.addTab(url);
  },

  contrastSelection : function() {
    var colors = library.getSelection();
    if(rainbowc.prefs.getBoolPref("wholeNumbers"))
      return Math.round(rainbowColor.contrast(colors[0], colors[1]));
    else
      return Math.round(rainbowColor.contrast(colors[0], colors[1]) * 10)/10;
  },

  distanceSelection : function() {
    var colors = library.getSelection();
    return Math.round(rainbowColor.distanceLAB(colors[0], colors[1]) * 10)/10;
  },

  distance94Selection : function() {
    var colors = library.getSelection();
    return Math.round(rainbowColor.distanceLCH(colors[0], colors[1]) * 10)/10;
  },

  mergeSelection : function() {
    var colors = library.getSelection();
    var hybrid = rainbowColor.merge(colors[0], colors[1]);
    rainbowc.openPicker(hybrid);
  },

  getSelection : function() {
	var start = new Object();
	var end = new Object();
	var numRanges = treeView.selection.getRangeCount();
	var colors = [];
	for (let i = 0; i < numRanges; i++) {
      treeView.selection.getRangeAt(i,start,end);
      for (let j = start.value; j <= end.value; j++)
        colors.push(treeView.colorAt(j));
	}
    return colors;
  },


  openNew : function() {
    window.openDialog(
      "chrome://rainbows/content/editBookmark.xul", "",
      "all,dialog=yes,resizable=no, centerscreen", {});
  },

  sortAndSet : function(filtered) {
    var cols = document.getElementsByClassName("sortable");
    for(var i = 0; i < cols.length; i++) {
      if(cols[i].getAttribute("sortActive") == "true") {
        library.sortColumn(cols[i], filtered, true);
        return;
      }
    }
    treeView.setFiltered(filtered);
  },

  sortColumn : function(col, filtered, startup) { 
    if(!filtered)
       filtered = treeView.getFiltered();
    var count = filtered.length;     
      
    var colors = [];
    for(var i = 0; i < count; i++) {
      let color = filtered[i];
      let metric;
      switch(col.getAttribute('sortType')) {
        case 'rgb':
          metric = rainbowColor.rgbValues(color)[col.getAttribute('sortMetric')];
          break;
        case 'hsl':
          metric = rainbowColor.hslValues(color)[col.getAttribute('sortMetric')];
          break;
        case 'hsv':
          metric = rainbowColor.hsvValues(color)[col.getAttribute('sortMetric')];
          break;
        case 'contrast':
          metric = rainbowColor.contrast(color, col.getAttribute('sortMetric'));
          break;
        case 'luminosity':
          metric = rainbowColor.luminosity(color);
          break;
        case 'date':
          metric = rainbowc.storage.dateOf(color);
          break;
        case 'url':
          metric = rainbowc.storage.urlOf(color) || "";
          break;
        case 'tags':
          metric = rainbowc.storage.tagsOf(color);
          break;
        default:
          break;        
      }
      colors.push([metric, color]);
    }

    colors.sort(function(a, b) {
      return a[0] > b[0]; 
    });

    if(startup) {
      if(col.getAttribute("sortDirection") == "descending")
        colors.reverse();
    }
    else if(col.getAttribute("sortActive") == "true") {
      if(col.getAttribute("sortDirection") == "ascending") {
        col.setAttribute("sortDirection", "descending");
        colors.reverse();
      }
      else
        col.setAttribute("sortDirection", "ascending");
    }
    else {
      var cols = document.getElementsByClassName("sortable");
      for(var i = 0; i < cols.length; i++) {
        cols[i].setAttribute("sortActive", "false");
        cols[i].removeAttribute("sortDirection");
      }
      col.setAttribute("sortActive", "true");
      col.setAttribute("sortDirection", "ascending");
    }
  
    var sorted = [];
    for(var i = 0; i < count; i++)
      sorted.push(colors[i][1]);

    treeView.setFiltered(sorted);
  },

  rowForColor : function(color) {
    var color = rainbowColor.toHex(color);
    var filtered = treeView.getFiltered();
    for(var i = 0; i < filtered.length; i++)
      if(filtered[i] == color)
        return i;
    return 0;
  },

  dragStart : function(event) {
    var row = {};
    var libraryTree = document.getElementById("libraryTree");
 		libraryTree.treeBoxObject.getCellAt(event.pageX, event.pageY, row, {}, {});
    var color = treeView.colorAt(row.value);
    event.dataTransfer.setData("text/rainbow-color", color);
    event.dataTransfer.setData("text/rainbow-source", 'library');
    event.dataTransfer.setData("text/rainbow-tree-index", row.value);
  },

  dropColor : function(event) {
    var dragSource = event.dataTransfer.getData("text/rainbow-source");
    var dragText = event.dataTransfer.getData("text/plain");

    if(dragSource == "library") {
      // let them drag around rows to compare colors
      var row = {};
      var libraryTree = document.getElementById("libraryTree");
 	  	libraryTree.treeBoxObject.getCellAt(event.pageX, event.pageY, row, {}, {});
      var oldRow = event.dataTransfer.getData("text/rainbow-tree-index");
      var newRow = row.value;
      var filtered = treeView.getFiltered();
      var color = filtered[oldRow];
      filtered.splice(oldRow, 1);
      filtered.splice(newRow, 0, color);
      treeView.setFiltered(filtered);
    }
    else if(dragSource == 'picker' || dragSource == 'inspector'
       || rainbowColor.isValid(dragText)) {
      // if its from another source, bookmark the color
      var color = event.dataTransfer.getData("text/rainbow-color");
      if(!color)
        color = dragText;
      var url = event.dataTransfer.getData("text/rainbow-url");
      if(rainbowColor.isValid(color)) {
        rainbowc.storage.addColor(rainbowColor.toHex(color), "", url);
        library.selectColor(color);
        library.scrollToColor(color);
      }
    }
  },

   /* hack - maybe implement nsIContentTreeView instead? */
  addColorRules : function(colors) {
    var len = colors.length;
    for(let i = 0; i < len; i++) {
      let declaration = "{background-color: " + colors[i] + "}";
      let selector = "color" + colors[i].slice(1);
      rainbowc.addCellProperty(library.stylesheet, 
            selector, declaration);
    }
  }
}

