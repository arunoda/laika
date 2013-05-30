var util = require('util');
var EventEmitter = require('events').EventEmitter;
var helpers = require('../helpers');
var Future = require('fibers/future');

function ClientConnector(phantom, appUrl) {
  appUrl = appUrl || "http://localhost:3000";  
  var self = this;
  self.appUrl = appUrl;
  var errorFired = false;
  var pageOpenedCallbackFired = false;

  //load the phantom page
  var pageOpened = false;
  var page;
  phantom.createPage(function(err, p) {
    if(err) {
      throw err;
    } else {
      page = p;
      page.open(appUrl, afterOpened);
    }
  });

  function afterOpened(err, status) {
    if(!pageOpenedCallbackFired) {
      pageOpenedCallbackFired = true;
      if(err) {
        throw err;
      } else if(status != 'success') {
        // throw new Error('unsuccessful status: ' + status);
      } else {
        pageOpened = true;
        page.onCallback = onCallback;
        page.onError = onError;
        self.emit('pageOpened');
      }
    }
  }

  function onCallback(result) {
    if(typeof(result) == 'string') {
      result = [result];
    }
    //empty to undefined
    var nulledResult = [];
    result.forEach(function(param) {
      if(param == "") {
        nulledResult.push(null);
      } else {
        nulledResult.push(param);
      }
    });

    self.emit.apply(self, nulledResult);
  };

  function onError(message) {
    if(!errorFired) {
      var errorMessage = ' [Error on Client] ' + message[0];
      var error =  new Error(errorMessage);
      error.stack = errorMessage;
      errorFired = true;
      self.emit('error', error);
    }
  }

  this.eval = function eval(clientCode) {
    var parentArguments = arguments;
    var args = [];
    for(var key in arguments) {
      if(key != '0') {
        args.push(arguments[key]);
      }
    }

    if(pageOpened) {
      args.unshift(clientCode, function() {});
      page.evaluate.apply(page, args);
    } else {
      self.on('pageOpened', function() {
        self.eval.apply(self, parentArguments);
      });
    }
    return this;
  };

  this.evalSync = function evalSync() {
    var future = new Future();
    var result;
    
    this.on('return', function(_result) {
      result = _result;
      future.return();
    });
    this.eval.apply(this, arguments);
    future.wait();
    return result;
  };

  this.close = function close() {
    this.removeAllListeners('pageOpened');
    if(page) {
      page.onCallback = null;
      page.onError = null;
      page.close();
    }
  };
}

util.inherits(ClientConnector, EventEmitter);

module.exports = ClientConnector;