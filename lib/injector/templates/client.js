window.emit = function emit() {

  if(window.callPhantom) {
    // we need to remove undefined values from the argument.
    // otherwise phantom throws an error

    //in order to iterate through the arguments, we need to slice it
    arguments = Array.prototype.slice.call(arguments, 0);
    for(var key in arguments) {
      var value = arguments[key];
      if(value == undefined) {
        arguments[key] = null;
      }
    }

    window.callPhantom.apply(null, arguments);
  }
};