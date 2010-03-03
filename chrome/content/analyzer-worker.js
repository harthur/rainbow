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

importScripts('clustering2.js', 'rgb.js');

onmessage = function(event) {
  var pixels = event.data.pixels;
  var width = event.data.width;
  var height = event.data.height;

  var t1 = Date.now();
  var arr = getColors(pixels, width, height);
  var allColors = arr[0];
  var t2 = Date.now();
  var merged = mergeColors(allColors.slice(0, 540), width * height); // only merge top colors for speed
  var t3 = Date.now();
  postMessage({colors: merged, pixelTime: t2 - t1, clusterTime: t3 - t2, num: allColors.length, aliased: arr[1] / (width * height)});
};


function getColors(data, width, height) {
  var colorFrequency = {};
  var aliased = 0;
  for(var x = 1; x < width - 1; x++) {
    for(var y = 1; y < height - 1; y++) {
     // pixels on the edges of fonts are crazy, we don't want them
     if(isEdgePixel(data, width, x, y)) { aliased++;
           continue; }

     var offs = x*4 + y*4*width;
     var color = data[offs + 0] << 16 | data[offs + 1] << 8 | data[offs + 2];

     if (color in colorFrequency)
       colorFrequency[color] = colorFrequency[color] + 1; // eleminc recording trace abort
     else
       colorFrequency[color] = 1;
    }
  }
   
  colors = [];
  for(color in colorFrequency)
    colors.push({color: color, freq: colorFrequency[color]});
  colors.sort(descendingSort);
  return [colors, aliased];
}

function mergeColors(colors, numPixels) {
  /* algorithm tweak point - defining when to call two colors different */
  var dist = 9;

  merged = clustering.mergeColors(colors, dist, numPixels);
  merged.sort(descendingSort);
  return merged;
}


/* this function is called on every pixel in the webpage, needs to be optimized 
   even more */
function isEdgePixel(image, width, x, y) {
  try {
      var p = x*4 + y*4*width;
      
      var sides = 0;

      var p1 = image[p];
      var p2 = image[p + 1];
      var p3 = image[p + 2];

      var a = p - 4*width;
      var dr = image[a] - p1;
      var dg = image[a + 1] - p2;
      var db = image[a + 2] - p3;
      var isDist = dr > 10 || dr < -10 || dg > 10 || dg < -10 || db > 10 || db < -10;
      sides += (isDist ? 1 : 0);
    
      a = p + 4*width;
      var dr = image[a] - p1;
      var dg = image[a + 1] - p2;
      var db = image[a + 2] - p3;
      var isDist = dr > 10 || dr < -10 || dg > 10 || dg < -10 || db > 10 || db < -10;
      sides += (isDist ? 1 : 0);
    
      a = p - 4;
      var dr = image[a] - p1;
      var dg = image[a + 1] - p2;
      var db = image[a + 2] - p3;
      var isDist = dr > 10 || dr < -10 || dg > 10 || dg < -10 || db > 10 || db < -10;
      sides += (isDist ? 1 : 0);

      if(sides == 0)
        return false;
  
      a = p + 4;
      var dr = image[a] - p1;
      var dg = image[a + 1] - p2;
      var db = image[a + 2] - p3;
      var isDist = dr > 10 || dr < -10 || dg > 10 || dg < -10 || db > 10 || db < -10;
      sides += (isDist ? 1 : 0);

      if(sides >= 2)
        return true;
  } catch(e) {return false; /* was at the corner or of edge of website */}
}


function descendingSort(a, b){
  return b.freq - a.freq; 
}
