function getLines(text, maxLength, tolerance) {
  var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
  var context = canvas.getContext("2d");

  format = formatter(function (str) {
    return context.measureText(str).width;
  });

  nodes = format['left'](text);
  breaks = linebreak(nodes, [maxLength], {tolerance: tolerance});
  var lines = [];
  var lineStart = 0;

  if(!breaks.length)
    return [nodes[0].value];
  // Iterate through the line breaks, and split the nodes at the
  for (i = 1; i < breaks.length; i += 1) {
    var point = breaks[i].position;
    var r = breaks[i].ratio;

    for (var j = lineStart; j < nodes.length; j += 1) {
      // After a line break, we skip any nodes unless they are boxes or forced breaks.
      if (nodes[j].type === 'box' || (nodes[j].type === 'penalty' && nodes[j].penalty === -linebreak.defaults.infinity)) {
        lineStart = j;
        break;
      }
    }
    lines.push(nodes.slice(lineStart, point + 1)
                 .filter(function(n){ if(n.type == "box") return true;})
                 .map(function(n) {return n.value;})
                 .join(" "));
    lineStart = point;
  }
  return lines;
}
