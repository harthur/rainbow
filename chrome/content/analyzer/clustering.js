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
  testClustering : function() {
    var colors = [{color: 'rgb(255, 255, 255)', freq: 300},
                  {color: 'rgb(253, 253, 253)', freq: 500},
                  {color: 'rgb(120, 130, 255)', freq: 700},
                  {color: 'rgb(120, 130, 40)', freq: 70},
                  {color: 'rgb(23, 30, 10)', freq: 9},
                  {color: 'rgb(250, 255, 246)', freq: 90},
                  {color: 'rgb(255, 255, 245)', freq: 100},
                  {color: 'rgb(31, 30, 12)', freq: 13},
                  {color: 'rgb(14, 20, 1)', freq: 23},]


   /* color: rgb(253, 253, 253) frequency: 990,
      color: rgb(120, 130, 255) frequency: 700,
      color: rgb(120, 130, 40) frequency: 70,
      color: rgb(31, 30, 12) frequency: 22,
      color: rgb(14, 20, 1) frequency: 23 */

    var merged = clustering.mergeColors(colors);
    var strings = merged.map(function(c) { return "mean: " + c.mean + " color: " + c.color + " frequency: " + c.freq});
    alert(strings.join(","));
  },


  mergeColors : function(colors, thresh) {
    // initialize clusters
    var clusters = [];
    for(var i = 0; i < colors.length; i++) {
      var color = colors[i].color;
      var freq = colors[i].freq;
      clusters.push({
        mean: convertRGBtoLAB(color >> 16, color >> 8 & 0xff, color & 0xff),
        num: 1,
        color: color, // the canonical color of the cluster (one w/ highest freq)
        highFreq: freq,
        freq: freq,
      });
    }

    // initialize distance matrix
    var distance = [];
    for(var i = 0; i < clusters.length; i++) {
      var lab1 = clusters[i].mean
      distance[clusters[i].color] = [];
      for(var j = 0; j < i; j++) {
        /* algorithm tweak point - defining the distance between two colors */
        var lab2 = clusters[j].mean;
        var dist = clustering.distance(lab1, lab2);
         
        distance[clusters[i].color][clusters[j].color] = dist;
        distance[clusters[j].color][clusters[i].color] = dist;
      }
    }

    // merge until clusters are stable
    mergers = clustering.similarClusters(clusters, distance, thresh);
    while(mergers) {
      var c1 = mergers[0];
      var c2 = mergers[1];
      var newCluster = clustering.mergeClusters(clusters[c1], clusters[c2]);
      clusters[c1] = newCluster;
      clusters.splice(c2, 1);

      clustering.updateDistances(clusters, distance, newCluster);

      mergers = clustering.similarClusters(clusters, distance, thresh);
    }
    return clusters;
  },

  updateDistances : function(clusters, distance, newCluster) {
    var lab1 = newCluster.mean;

    //update distance matrix
    distance[newCluster.color] = [];

    for(var i = 0; i < clusters.length; i++) {
      var lab2 = clusters[i].mean;
      var dist = clustering.distance(lab1, lab2);

      distance[newCluster.color][clusters[i].color] = dist;
      distance[clusters[i].color][newCluster.color] = dist;
    }
  },

  similarClusters : function(clusters, distance, threshold) {
    var cluster1, cluster2, minDistance = threshold;
    for(var i = 0; i < clusters.length; i++) {
      c1 = clusters[i].color;
      for(var j = 0; j < i; j++) {
          /* algorithm tweak point - defining the distance between two colors */
         var dist = distance[c1][clusters[j].color]; 

         if(dist < minDistance) {
           minDistance = dist;
           cluster1 = i;
           cluster2 = j;
         }
      }
    }
    if(minDistance < threshold)
      return [cluster1, cluster2];
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
    var num1 = c1.freq; //c1.num;
    var num2 = c2.freq; // c2.num;

    var total = num1 + num2;

    var mean = [((r1 * num1 + r2 * num2) / total) , ((g1 * num1 + g2 * num2) / total),
               ((b1 * num1 + b2 * num2) / total)];
  
    return {
      mean: mean,
      num: c1.num + c2.num,
      color: c1.highFreq > c2.highFreq ? c1.color : c2.color,
      highFreq:  c1.highFreq > c2.highFreq ? c1.highFreq : c2.highFreq,
      freq: c1.freq + c2.freq,
    };
  },

  distance : function(col1, col2) {
     return Math.sqrt(Math.pow(col2[0] - col1[0], 2) + Math.pow(col2[1] - col1[1], 2) + Math.pow(col2[2] - col1[2], 2));
  },

  distanceCIE94 : function(lch1, lch2) {
   return Math.sqrt(Math.pow(lch2[0] - lch1[0], 2) + Math.pow((lch2[1] - lch1[1])/(1 + 0.045*lch1[1]), 2) + Math.pow((lch2[2] - lch1[2])/(1 + 0.015*lch1[1]), 2));
  }
}
