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
                  || window.openDialog("chrome://rainbows/content/library/library.xul",
                       "rainbow:library", "chrome,all,dialog=yes", color);
    library.focus();
  },

  openPicker : function(color) {
     window.openDialog("chrome://rainbows/content/picker/picker.xul",
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
