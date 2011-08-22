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

importScripts('rgb.js', 'clusterfck.js');

onmessage = function(event) {
  var pixels = event.data.pixels;
  var width = event.data.width;
  var height = event.data.height;

  var t1 = Date.now();
  var allColors = getColors(pixels, width, height);
  var t2 = Date.now();

  var colors = allColors.slice(0, 2400); // only merge top colors by frequency for speed
  var threshold = 10;

  var merged = mergeColors(colors, width * height, threshold).map(function(cluster) {
    return cluster.canonical;
  });
  merged.sort(descendingSort);

  var t3 = Date.now();
  postMessage({colors: merged, pixelTime: t2 - t1, clusterTime: t3 - t2, num: allColors.length});
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
     
     if (data[offs + 3] == 0) // transparent
       continue;
     
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
  return colors;
}

function mergeColors(colors, numPixels, threshold) {
  var items = colors.map(function(item) {
    var color = item.color;
    var freq = item.freq;
    return {
      mean: convertRGBtoLAB(color >> 16, color >> 8 & 0xff, color & 0xff),
      num: 1,
      color: color, // the canonical color of the cluster (one w/ highest freq or closest to mean)
      colors : [color],
      highFreq: freq,
      highRatio : freq / numPixels,
      highColor: color, // the individual color w/ the highest frequency in this cluster
      ratio: freq / numPixels, // ratio of page taken up by colors in this cluster
      freq: freq,
    };
  });
  
  var merged = clusterfck.hcluster(items, distance, merge, threshold);
  return merged;
}

function descendingSort(a, b){
  return b.freq - a.freq; 
}

function distance(c1, c2) {
  // don't cluster large blocks of color unless they're really similar  
  var r1 = c1.highRatio;
  var r2 = c2.highRatio;
  var f1 = c1.highFreq;
  var f2 = c2.highFreq;  
  var handicap;
  if((r1 > 0.2 && r2 > 0.2) || (f1 > 200000 && f2 > 200000))
    handicap = 5; 
  else if((r1 > 0.14 && r2 > 0.14) || (f1 > 100000 && f2 > 100000))
    handicap = 4;
  else if((r1 > 0.10 && r2 > 0.10) || (f1 > 90000 && f2 > 90000))
    handicap = 3;
  else if((r1 > 0.07 && r2 > 0.07) || (f1 > 76000 && f2 > 76000))
    handicap = 2;
  else
    handicap = 0;

  var dist = euclidean(c1.mean, c2.mean);

  return dist + handicap;
}

function euclidean(col1, col2) {
  return Math.sqrt(
      Math.pow(col2[0] - col1[0], 2)
    + Math.pow(col2[1] - col1[1], 2)
    + Math.pow(col2[2] - col1[2], 2));
}

function merge(c1, c2) {
  var rgb = c1.mean;
  var r1 = rgb[0];
  var g1 = rgb[1];
  var b1 = rgb[2];

  rgb = c2.mean;
  var r2 = rgb[0];
  var g2 = rgb[1];
  var b2 = rgb[2];

  /* algorithm tweak point - weighting the mean of the cluster */
  var num1 = c1.freq;
  var num2 = c2.freq;

  var total = num1 + num2;

  var mean = [(r1 * num1 + r2 * num2) / total , (g1 * num1 + g2 * num2) / total,
             (b1 * num1 + b2 * num2) / total];
  
  var colors = c1.colors.concat(c2.colors);
  
  // get the canonical color of the new cluster
  var color;
  var avgFreq = colors.length /(c1.freq + c2.freq);
  if((c1.highFreq > c2.highFreq) && (c1.highFreq > avgFreq*2))
    color = c1.highColor;
  else if(c2.highFreq > avgFreq*2)
    color = c2.highColor;
  else {
    // if there's no stand-out color
    var minDist = 1000, closest = 0;
    for(var i = 0; i < colors.length; i++) {
      var color = colors[i];
      var lab = convertRGBtoLAB(color >> 16, color >> 8 & 0xff, color & 0xff);
      var dist = euclidean(lab, mean);
      if(dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    color = colors[closest];
  }

  return {
    mean: mean,
    num: c1.num + c2.num,
    color: color,
    highFreq:  c1.highFreq > c2.highFreq ? c1.highFreq : c2.highFreq,
    highColor: c1.highFreq > c2.highFreq ? c1.highColor : c2.highColor,
    highRatio : c1.highFreq > c2.highFreq ? c1.highRatio : c2.highRatio,
    ratio: c1.ratio + c2.ratio,
    freq: c1.freq + c2.freq,
    colors : colors,
  };
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

