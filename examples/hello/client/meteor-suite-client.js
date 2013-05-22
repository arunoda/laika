window.emit = function() {
  if(window.callPhantom) {
    window.callPhantom.apply(null, arguments);
  }
};