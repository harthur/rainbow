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
var rainbow = {
  onLoad : function() {
    rainbowc.prefs.addObserver("", rainbow, false);

    if(rainbowc.getFirefoxVersion() < 3.5)
      document.getElementById("rainbow-menu-analyzer").hidden = true;
    /* set attributes for applying platform-specific styling */
    var platform = rainbowc.getPlatform();
    var swatch = document.getElementById("rainbow-swatch");
    swatch.setAttribute("rainbow-platform", platform);
    var analyzer = document.getElementById("rainbow-analyzer-panel");
    analyzer.setAttribute("rainbow-platform", platform);

    var show = rainbowc.prefs.getBoolPref("context");
    rainbowc.get("rainbow-context-menu").setAttribute("hidden", !show);
    var showPreview = rainbowc.prefs.getBoolPref("context.preview");
    rainbowc.get("rainbow-context-preview").setAttribute("hidden", !showPreview);
    
    var contextMenu = rainbowc.get("contentAreaContextMenu");
    if(contextMenu)
      contextMenu.addEventListener("popupshowing", showAnalyzer, false);

    function showAnalyzer(event) {
      var isImg = (document.popupNode.localName.toLowerCase() == "img");
      rainbowc.get("rainbow-context-extract").hidden = !isImg;

      var showPreview = rainbowc.prefs.getBoolPref("context.preview");
      rainbowc.get("rainbow-context-preview").hidden = !showPreview || isImg;

      var hideBoth = !isImg && (isImg || !showPreview);
      rainbowc.get("rainbow-context-separator").hidden = hideBoth;
    }

    rainbow.addDragListeners();
    rainbow.addToolbarButton();
    
    // for picker selector
    rainbowc.registerSheet("chrome://rainbows/skin/selector.css", null, null);
  },

  addToolbarButton : function() {
    // automatically add toolbar button to toolbar on first install - from Firebug
    if (rainbowc.prefs.getBoolPref("toolbar.added"))
      return;

    rainbowc.prefs.setBoolPref("toolbar.added", true);

    // Get the current navigation bar button set and append id
    var navBar = document.getElementById("nav-bar"),
        currentSet = navBar.currentSet,
        buttonId = "rainbow-toolbarbutton",
        toolButton = document.getElementById(buttonId);

    // Append only if the button is not already there.
    var curSet = currentSet.split(",");
    if (curSet.indexOf("rainbow-toolbarbutton") == -1) {
      navBar.insertItem("rainbow-toolbarbutton");
      navBar.setAttribute("currentset", navBar.currentSet);
      document.persist("nav-bar", "currentset");
       
      top.BrowserToolboxCustomizeDone(true);
    }
  },

  onUnLoad : function() {
    rainbowc.prefs.removeObserver("", rainbow);
    rainbow.removeDragListeners();
  },

  observe : function(subject, topic, data) {
    if (topic == "nsPref:changed") {
      switch(data) {
        case "context":
          var show = !rainbowc.prefs.getBoolPref("context");
          rainbowc.get("rainbow-context-menu").setAttribute("hidden", show);
          break;        
        case "context.preview":
          var show = !rainbowc.prefs.getBoolPref("context.preview");
          rainbowc.get("rainbow-context-preview").setAttribute("hidden", show);
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

  shortcutEngaged : function(event) {
    if(event && event.button != 0)
      return;

    switch(rainbowc.prefs.getCharPref("shortcut.action")) {
      case 'inspector':
        rainbowInspector.toggleInspector();
        break;
      case 'picker':
        rainbowc.openPicker();
        break;
      case 'library':
        rainbowc.openLibrary();
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
    if(rainbowColor.isValid(color)) { // make sure this is our drag
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
    if(rainbowColor.isValid(color)) {
      if(event.target.setAttribute)
        event.target.setAttribute("rainbowfirefox", "true");
      else if(event.target.parentNode.removeAttribute)
        event.target.parentNode.setAttribute("rainbowfirefox", "true");
      event.stopPropagation();
      event.preventDefault();
    }
  },

  applyDragOver : function(event) {
    var color = event.dataTransfer.getData("text/rainbow-color");
    if(rainbowColor.isValid(color)) {
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
    window.removeEventListener("load", rainbow.addDragListeners, false);
    var container = document.getElementById("content").mPanelContainer;
    container.addEventListener("drop", rainbow.applyDrop, true);
    container.addEventListener("dragenter", rainbow.applyDragEnter, true);
    container.addEventListener("dragleave", rainbow.applyDragLeave, true);
    container.addEventListener("dragover", rainbow.applyDragOver, true);

    // for drop indicator styling of webpage content
    rainbowc.registerSheet("chrome://rainbows/skin/drag.css", null, null);
  },

  removeDragListeners : function() {
    window.removeEventListener("unload", rainbow.removeDragListeners, false);
    var container = document.getElementById("content").mPanelContainer;
    container.removeEventListener("drop", rainbow.applyDrop, true);
    container.removeEventListener("dragenter", rainbow.applyDragEnter, true);
    container.removeEventListener("dragleave", rainbow.applyDragLeave, true);
    container.removeEventListener("dragover", rainbow.applyDragOver, true);
  }
}

window.addEventListener("load", rainbow.onLoad, false);
window.addEventListener("unload", rainbow.onUnLoad, false);
