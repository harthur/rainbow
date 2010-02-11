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

var clustering = {

  mergeColors : function(colors, thresh, numPixels) {
    // initialize clusters
    var clusters = [];
    for(var i = 0; i < colors.length; i++) {
      var color = colors[i].color;
      var freq = colors[i].freq;
      clusters[i] = {
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
    } 
    var distance = [];
    clustering.initializeDistances(clusters, distance);

    /* progressively merge everything under higher and higher thresholds 
       - faster than merging one pair per pass */
    for(var i = 0.01; i < thresh; i += 0.02)
      clustering.mergeThreshold(clusters, distance, i);
   
    return clusters;
  },

  mergeThreshold : function(clusters, distance, threshold) {
    var merged = true;
    while(merged) {
      merged = false;
      // merge all cluster pairs that are under the threshold as we scan
      for(var i = 0; i < clusters.length; i++) {
        var c1 = clusters[i];

        for(var j = 0; j < i; j++) {

           var c2 = clusters[j];
           var dist = distance[c1.color][c2.color];
           if(dist < threshold) {
             var newCluster = clustering.mergeClusters(c1, c2);
             clusters[j] = newCluster;
             clusters.splice(i, 1);
             c1 = clusters[i];
             c2 = newCluster;
             clustering.updateDistances(clusters, distance, newCluster);
             merged = true;

             if(!c1) // we merged the last cluster
               break;
          }
        }
      }
    }
  },

  initializeDistances : function(clusters, distance) {
     for(var i = 0; i < clusters.length; i++) {
       var c1 = clusters[i];
       var lab1 = c1.mean;
       distance[c1.color] = [];

      for(var j = 0; j < i; j++) {
        var c2 = clusters[j];
        var dist = clustering.distance(lab1, c2.mean);
        dist += clustering.getDistanceHandicap(c1, c2);

        distance[c1.color][c2.color] = dist;
        distance[c2.color][c1.color] = dist;
      }
    }
  },

  updateDistances : function(clusters, distance, newCluster) {
    var lab1 = newCluster.mean;
    distance[newCluster.color] = [];

    for(var i = 0; i < clusters.length; i++) {
      var c2 = clusters[i];
      var dist = clustering.distance(lab1, c2.mean);
      dist += clustering.getDistanceHandicap(newCluster, c2);
      
      distance[c2.color][newCluster.color] = dist;
      distance[newCluster.color][c2.color] = dist;
    }
  },

  getDistanceHandicap : function(c1, c2) {
     var r1 = c1.highRatio;
     var r2 = c2.highRatio;
     var f1 = c1.highFreq;
     var f2 = c2.highFreq;
     
     // don't cluster large blocks of color unless they're really similar
     if((r1 > 0.2 && r2 > 0.2) || (f1 > 200000 && f2 > 200000))
        return 5; 
     else if((r1 > 0.14 && r2 > 0.14) || (f1 > 100000 && f2 > 100000))
        return 4;
     else if((r1 > 0.10 && r2 > 0.10) || (f1 > 90000 && f2 > 90000))
        return 3;
     else if((r1 > 0.07 && r2 > 0.07) || (f1 > 76000 && f2 > 76000))
        return 2;
     return 0;
  },

  mergeClusters : function(c1, c2) {
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
        var dist = clustering.distance(lab, mean);
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
  },

  distance : function(col1, col2) {
    return Math.sqrt(Math.pow(col2[0] - col1[0], 2) + Math.pow(col2[1] - col1[1], 2) + Math.pow(col2[2] - col1[2], 2));
  },

  distanceCIE94 : function(lch1, lch2) {
    return Math.sqrt(Math.pow(lch2[0] - lch1[0], 2) + Math.pow((lch2[1] - lch1[1])/(1 + 0.045*lch1[1]), 2) + Math.pow((lch2[2] - lch1[2])/(1 + 0.015*lch1[1]), 2));
  }
}
