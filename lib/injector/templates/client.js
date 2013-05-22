window.calltest = function() {
  if(window.callPhantom) {
    window.callPhantom.apply(null, arguments);
  }
};