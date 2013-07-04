window.emit = function emit() {

  if(window.callPhantom) {
    //we need comverts arguments object into a array to be stringified in phantomjs
    arguments = Array.prototype.slice.call(arguments, 0);
    payload = JSON.stringify(arguments);

    window.callPhantom(payload);
  }
};