Components.utils.import("resource://gre/modules/ctypes.jsm");

function add(a, b) {
  var file = getFile("chrome://rainbows/content/test.so");
  var libc = ctypes.open(file); 

  var addc = libc.declare("add", /* function name */
                           ctypes.default_abi, /* call ABI */
                           ctypes.int32_t, /* return type */
                           ctypes.int32_t, /* argument type */
                           ctypes.int32_t);
  return addc(a, b);
}


function getFile(chromeURL) {
  // convert the chrome URL into a file URL
  var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1']
           .getService(Components.interfaces.nsIChromeRegistry);
  var io = Components.classes['@mozilla.org/network/io-service;1']
           .getService(Components.interfaces.nsIIOService);
  var uri = io.newURI(decodeURI(chromeURL), 'UTF-8', null);
  var fileURL = cr.convertChromeURL(uri);
  // get the nsILocalFile for the file
  var file = fileURL.QueryInterface(Components.interfaces.nsIFileURL).file;
  return file;
}


