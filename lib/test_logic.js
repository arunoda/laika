var ServerConnector = require('./connectors/server.js');
var ClientConnector = require('./connectors/client.js');
var Fiber = require('fibers');
var logger = require('./logger');

module.exports = function(appPool, phantom) {
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
        var appPort = app.port
        var mongoDbname = app.dbname;
        var hostnames = ["localhost", "127.0.0.1", "0.0.0.0"];

        app.ready(function(injectPort) {
          args = [cleanAndDone, new ServerConnector(injectPort)];
          var noClients = callback.length - 2;
          var hostnameIssueWarned = false;
          for(var lc = 0; lc<noClients; lc++) {
            if(lc >= hostnames.length && !hostnameIssueWarned) {
              logger.error('  WARN: It is recommended to use 3 clients only. see more - http://goo.gl/MMX3A');
              hostnameIssueWarned = true;
            }
            var hostname = hostnames[lc] || "localhost";
            var appUrl = "http://" + hostname + ":" + appPort;
            args.push(new ClientConnector(phantom, appUrl));
          }

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

