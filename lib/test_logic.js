var ServerConnector = require('./connectors/server.js');
var ClientConnector = require('./connectors/client.js');
var Fiber = require('fibers');

module.exports = function(appPool, phantom) {
  return function testLogic(message, callback) {

    if(this._test) {
      this._test(message, mockTest);
    } else if(this._it) {
      this._it(message, mockTest);
    }
    
    function mockTest(done) {    
      var completed = false;
      var args = [];

      //create new server with different db and port
      var app = appPool.get();
      var appPort = app.port
      var mongoDbname = app.dbname;
      var appUrl = "http://localhost:" + appPort;

      app.ready(function(injectPort) {
        if(callback.length == 0) {
          args = [];
        } else if(callback.length == 1) {
          args = [cleanAndDone];
        } else if(callback.length == 2) {
          args = [cleanAndDone, new ServerConnector(injectPort)];
        } else {
          args = [cleanAndDone, new ServerConnector(injectPort)];
          var noClients = callback.length - 2;
          for(var lc = 0; lc<noClients; lc++) {
            args.push(new ClientConnector(phantom, appUrl));
          }
        }

        Fiber(function() {
          callback.apply(null, args);
          if(args.length == 0) {
            completeTest();
          }
        }).run();
      });

      function cleanAndDone() {
        if(!completed) {
          args.slice(1).forEach(function(connector) {
            connector.close();
          });
          completeTest();      
        }
      }

      function completeTest() {
        app.close(function() {
          completed = true;
          done();
        });
      }
    }
  }
};

