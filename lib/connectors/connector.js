var Future = require('fibers/future');

function Connector() {
  var future;

  this.evalSync = function evalSync() {
    var self = this;
    future = new Future();
    var result;
    var error;
    
    this.removeAllListeners('return');
    this.once('return', onReturn);

    function onReturn(_result) {
      result = _result;
      future.return();
    }

    function cleanup() {
      self.removeListener('return', onReturn);
    }

    this.eval.apply(this, arguments);
    future.wait();
    cleanup();

    return result;
  };

  this.evalSyncExpcectError = function(errorMessage) {
    var error;
    var self = this;
    
    if(typeof(errorMessage) == 'string') {
      arguments = Array.prototype.slice.call(arguments, 1);
    } else {
      errorMessage = 'Expecting an error to be thrown';
    }

    this.on('error', onError);
    var result = this.evalSync.apply(this, arguments);
    
    cleanup();
    if(error) {
      return error;
    } else {
      future = new Future();
      setTimeout(function() {
        throw new Error(errorMessage); 
      }, 0);
      future.wait();
    }

    function onError(err) {
      error = err;
      future.return();
    }

    function cleanup() {
      self.removeListener('error', onError);
    }
  };
}

module.exports = Connector;