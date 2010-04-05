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

    rainbowc.get("selector-element").value = rainbowc.elementString(event.target);

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
      var font = getFont(element);
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

