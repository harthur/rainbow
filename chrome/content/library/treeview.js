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

var treeView =
{
  rowCount: 0,
  _treebox: null,
  _filterColors: [],
  _storageService : null,
  _wholeNumbers : false,

  COL_COLOR: 0,
  COL_HEX: 1,
  COL_RED : 2,
  COL_GREEN : 3,
  COL_BLUE : 4,
  COL_HUE : 5,
  COL_SATV : 6,
  COL_VAL : 7,
  COL_SAT : 8,
  COL_LIGHT : 9,
  COL_WCONTRAST : 10,
  COL_BCONTRAST : 11,
  COL_LUM : 12,
  COL_TAGS: 13,
  COL_URL: 14,
  COL_DATE: 15,

  QueryInterface: function (aIID) {
    if (aIID.equals(Ci.nsITreeView) ||
        aIID.equals(Ci.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  setFiltered : function(newFilterColors) {
    this._filterColors = newFilterColors;

    /* invalidate */
    this._treebox.rowCountChanged(0, -this.rowCount);
    this.rowCount = newFilterColors.length;
    this._treebox.rowCountChanged(0, this.rowCount);
  },

  getFiltered : function() {
    return this._filterColors;
  },

  saveFiltered : function(newFilterColors) {
    this._filterColors = newFilterColors;
  },

  init : function() {
    this._wholeNumbers = rainbowc.prefs.getBoolPref("wholeNumbers");
  },

  colorAt : function(index) {
    return this._filterColors[index];
  },

  /* nsITreeView */
  setTree: function(aTree) { 
   this._treebox = aTree;
  },

  getCellText: function(aRow, aCol)
  {
    var color = this._filterColors[aRow];

    switch(aCol.index) {
      case this.COL_COLOR:
        return;
      case this.COL_RED:
        return rainbowColor.rgbValues(color)['red'];
      case this.COL_GREEN:
        return rainbowColor.rgbValues(color)['green'];
      case this.COL_BLUE:
        return rainbowColor.rgbValues(color)['blue'];
      case this.COL_HUE:
        return rainbowColor.hslValues(color)['hue'];
      case this.COL_SAT:
        return rainbowColor.hslValues(color, this._wholeNumbers)['sat'];
      case this.COL_LIGHT:
        return rainbowColor.hslValues(color, this._wholeNumbers)['light'];
      case this.COL_SATV:
        return rainbowColor.hsvValues(color, this._wholeNumbers)['satv'];
      case this.COL_VAL:
        return rainbowColor.hsvValues(color, this._wholeNumbers)['val'];
      case this.COL_HEX: 
        return color;
      case this.COL_WCONTRAST:
        if(this._wholeNumbers)
          return Math.round(rainbowColor.contrast(color, '#FFFFFF'));
        return Math.round(rainbowColor.contrast(color, '#FFFFFF') * 10) / 10;
      case this.COL_BCONTRAST:
         if(this._wholeNumbers)
          return Math.round(rainbowColor.contrast(color, '#000000'));
        return Math.round(rainbowColor.contrast(color, '#000000') * 10) / 10;
      case this.COL_LUM:
         if(this._wholeNumbers)
          return Math.round(rainbowColor.luminosity(color) * 10) / 10;
         return Math.round(rainbowColor.luminosity(color) * 100) / 100;
      case this.COL_TAGS:
        return rainbowc.storage.tagsOf(color);
      case this.COL_URL:
        return rainbowc.storage.urlOf(color);
      case this.COL_DATE: 
        return rainbowc.toDate(rainbowc.storage.dateOf(color));
    }
  },

  getRowProperties: function(aRow, aProperties) {},

  getCellProperties: function(aRow, aCol, aProperties) {
    if(aCol.index == this.COL_COLOR) {
      var color = this._filterColors[aRow];
      var aserv=Components.classes["@mozilla.org/atom-service;1"]
                            .getService(Components.interfaces.nsIAtomService);
      aProperties.AppendElement(aserv.getAtom("color" + color.slice(1)));
      aProperties.AppendElement(aserv.getAtom("swatch"));
    }
  },

  getColumnProperties: function(aCol, aProperties) {},
  getParentIndex: function(aRowIndex) {return -1;},
  getLevel : function() {return 0;},
  hasNextSibling: function(aRowIndex, aAfterIndex) {},
  getImageSrc: function(aRow, aCol) {},
  getProgressMode: function(aRow, aCol) {},
  getCellValue: function(aRow, aCol) {},
  isContainer: function(aIndex) {return false;},
  isContainerOpen: function(aIndex) {return false;},
  isContainerEmpty: function(aIndex) {return false;},
  isSeparator: function(aIndex) { return false;},
  isSorted: function() {return false;},
  toggleOpenState: function(aIndex) {},
  selectionChanged: function() {},
  cycleHeader: function(aCol) {},
  cycleCell: function(aRow, aCol) {},
  isEditable: function(aRow, aCol) {if (aCol.index > 0) return true;},
  isSelectable: function(aRow, aCol) {return true;},
  setCellValue: function(aRow, aCol, aValue) {},
  setCellText: function(aRow, aCol, aValue) {},
  performAction: function(aAction) {},
  performActionOnRow: function(aAction, aRow) {},
  performActionOnCell: function(aAction, aRow, aCol) {},
  canDrop: function() {return true;},
  drop : function() {}
};
