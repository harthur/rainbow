var easelFirebug = {

  popupShowing : function() {
    firebugPickerTarget = document.popupNode;
    var target = document.popupNode;
    if(target.nodeName == "SPAN")
      var color = target.firstChild.data;
    else if(target.nodeName == "INPUT")
      var color = target.value;

    if(!colorCommon.isValid(color))
      return;

    easelFirebug.color = color;
    easelFirebug.target = target;

    var newitem = document.createElement("menuitem");
    var menu = document.getElementById("fbContextMenu");
  
    if(0 && target.nodeName == "INPUT") { // take out
      // this is a temporary case until we find a way to edit
      var openItem = document.createElement("menuitem");
      openItem.setAttribute("label" , "Open in color picker");
      openItem.setAttribute("oncommand", "easelFirebug.openColorpicker();");
      menu.appendChild(openItem);
    }

    var bookmarkItem = document.createElement("menuitem");
    bookmarkItem.setAttribute("label" , "Bookmark color in Rainbow");
    bookmarkItem.setAttribute("oncommand", "easelFirebug.bookmarkColor();");
    menu.appendChild(bookmarkItem);
  },

  openColorpicker : function() {
    var target = easelFirebug.target;
    if(target.nodeName == "SPAN") {
      // color won't update on content unless we are editing
      var parent = target.parentNode.parentNode.parentNode;
      Firebug.Editor.startEditing(target);
      target = parent.getElementsByTagName("input")[0];
    }
    var picker = document.getElementById("easel-picker");
    picker.openPopup(target, "before_start", 40, -40, false);
    easelPicker.init(easelFirebug.color, target);
  },


  bookmarkColor : function() {
    var url;
    if(FirebugContext) {
      var win = FirebugContext.window;
      url = win.location.href;
    }

    window.openDialog("chrome://rainbows/content/editBookmark.xul",
                  "Window:EditColor", "all,dialog=yes,resizable=no,centerscreen",
                  {colors: [easelFirebug.color], url: url} );
  },

  fireEvent : function(element, event) {
    document.createEvent('MouseEvents');
    evt.initEvent(event, true, false); // event type,bubbling,cancelable
    element.dispatchEvent(evt);
  },

addEaselListener : function() {
  document.getElementById("fbContextMenu").addEventListener("popupshowing", function() {easelFirebug.popupShowing(); }, false);
} 

}

window.addEventListener("load", function() {easelFirebug.addEaselListener();}, false);

