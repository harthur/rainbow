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
    selector.clearContent();
    rainbowc.mapWindows(selector.addSelectionListeners);
    
    var button = document.getElementById("selector-button");
    button.removeAttribute("oncommand");
    button.setAttribute("oncommand", "selector.stop()");

    if(rainbowc.getPlatform() == "Mac")
      rainbowc.wm.getMostRecentWindow("navigator:browser").focus();
  },

  stop : function() {
    selector.pause();
    selector.clearContent();

    selector.selectedElement = "";

    var button = document.getElementById("selector-button");
    button.removeAttribute("oncommand");
    button.setAttribute("oncommand", "selector.start()");
    
    picker.singleDisplay();
  }, 
 
  clearContent : function() {
    var sel = selector.selectedElement;
    if(sel && sel.removeAttribute)
      sel.removeAttribute("rainbowselector");
    else if (sel && sel.parentNode.removeAttribute)
      sel.parentNode.removeAttribute("rainbowselector"); 
  },

  pause : function() {
    rainbowc.mapWindows(selector.removeSelectionListeners);
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

  clickElement : function(event) {
    selector.pause();

    var element = event.target;
    selector.selectElement(element);

    window.focus(); // for Windows
    event.preventDefault();
    event.stopPropagation();
  },
  
  selectElement : function(element) {
    selector.selectedElement = element;    

    if(element.setAttribute)
      element.setAttribute("rainbowselector", "true");
    else
      element.parentNode.setAttribute("rainbowselector", "true");
      
    rainbowc.get("selector-element").value = rainbowc.elementString(element);
     
    var bg = rainbowc.getBgColor(element);

    if(rainbowc.textColorAffects(element)) {
      var win = element.ownerDocument.defaultView;
      var txt = win.getComputedStyle(element, null).color;
      var font = getFont(element);
    }

    picker.elementDisplay(bg, txt, font);

    picker.url = element.ownerDocument.location.href;
  },

  addSelectionListeners : function(win) {
    win.addEventListener('mouseover', selector.mouseoverElement, true);
    win.addEventListener('mouseout', selector.mouseoutElement, true);
    win.addEventListener('click', selector.clickElement, true);
  },

  removeSelectionListeners : function(win) {
    try {
      win.removeEventListener('mouseover', selector.mouseoverElement, true);
      win.removeEventListener('mouseout', selector.mouseoutElement, true);
      win.removeEventListener('click', selector.clickElement, true);
    } catch(e) {}
  }
};

