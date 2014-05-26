var ServerConnector = require('./connectors/server.js');
var ClientConnector = require('./connectors/client.js');
var Fiber = require('fibers');
var logger = require('./logger');

var setupApp = function (app, phantom, listOfOptions, callback) {
  var appPort = app.port;
  var hostnames = ["localhost", "127.0.0.1", "0.0.0.0"];
  app.ready(function(injectPort) {
    var args = [new ServerConnector(injectPort)];
    var noClients = listOfOptions.length;
    var hostnameIssueWarned = false;
    for (var lc = 0; lc < noClients; lc++) {
      if (lc >= hostnames.length && !hostnameIssueWarned) {
        logger.error('  WARN: It is recommended to use 3 clients only. see more - http://goo.gl/MMX3A');
        hostnameIssueWarned = true;
      }
      var hostname = hostnames[lc] || "localhost";
      // check and fix options
      var clientOptions = listOfOptions[lc];
      if (typeof clientOptions === 'string') {
        clientOptions = { appUrl: clientOptions };
      } else if (typeof clientOptions !== 'object') {
        clientOptions = {};
      }
      clientOptions.appUrl = "http://" + hostname + ":" + appPort + (clientOptions.appUrl || "");
      //-----------------------------------------------------------------------------------------
      args.push(new ClientConnector(phantom, clientOptions));
    }
    callback.apply(null, args);
  });
};

module.exports.setupApp = setupApp;

module.exports.testLogic = function(appPool, phantom) {
  return function testLogic(message, callback) {

    if(this._test) {
      this._test(message, mockTest);
    } else if(this._it) {
      this._it(message, mockTest);
    }
    
    function mockTest(done) { 
      logger.laika('start running test');
      var completed = false;
      var args = [];
      var app;

      if(callback.length == 0) {
        callback();
        completeTest();
      } else if(callback.length == 1) {
        callback(cleanAndDone);
      } else {
        //create new server with different db and port
        app = appPool.get();
        var emptyOptions = new Array(callback.length - 2);
        setupApp(app, phantom, emptyOptions, function () {
          args = Array.prototype.slice.apply(arguments); // copy argumetns
          args.unshift(cleanAndDone);
          Fiber(function() {
            logger.laika('running test');
            callback.apply(null, args);
          }).run();
        });
      }

      function cleanAndDone() {
        if(!completed) {
          args.slice(1).forEach(function(connector) {
            connector.close();
          });
          completeTest();
        }
      }

      function completeTest() {
        logger.laika('test completed');
        if(app) {
          app.close(completed);
        } else {
          completed();
        }

        function completed() {
          logger.laika('closing app');
          completed = true;
          done();
        }
      }
    }
  }
};

