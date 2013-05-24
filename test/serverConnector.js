var assert = require('assert');
var path = require('path');
var http = require('http');
var fs = require('fs');
var handlebars = require('handlebars');
var ServerConnector = require('../lib/connectors/server.js');
var helpers = require('../lib/helpers');

var SERVER_TEMPLATE_LOCATION = path.resolve(__dirname, '../lib/injector/templates/server.js');

suite('ServerConnector', function() {
  test('run in server and get result', function(done) {
    var Npm = {require: require};
    var port = helpers.getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({injectPort: port});
    
    eval(serverCode);
    setTimeout(function() {
      var sc = new ServerConnector(port);
      sc.run(function() {
        emit('response', 100)
      });

      sc.on('response', function(num) {
        assert.equal(num, 100);
        sc.close();
        done();
      });
    }, 20);
  });

  test('run in server and get notification', function(done) {
    var Npm = {require: require};
    var port = helpers.getRandomPort();
    var notificationPort = helpers.getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({injectPort: port, notificationPort: notificationPort});
    
    var server = http.createServer(function(req, res) {
      server.close();
      done();
    });
    server.listen(notificationPort);
    eval(serverCode);
  });

  test('run fibered code', function(done) {
    var Npm = {require: require};
    var Meteor = {setTimeout: setTimeout};
    var port = helpers.getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({injectPort: port});
    
    eval(serverCode);
    setTimeout(function() {
      var sc = new ServerConnector(port);
      sc.run(function() {
        var Future = Npm.require('fibers/future');
        var f = new Future();
        var a = 10;
        Meteor.setTimeout(function() {
          a = 100;
          f.return();
        }, 3);
        f.wait();

        emit('result', a);
      });

      sc.on('result', function(num) {
        assert.equal(num, 100);
        sc.close();
        done();
      });
    }, 20);
  });

  test('send arguments to server with the function', function(done) {
    var Npm = {require: require};
    var port = helpers.getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({injectPort: port});
    
    eval(serverCode);
    setTimeout(function() {
      var sc = new ServerConnector(port);
      sc.run(function(a, b) {
        emit('response', a + b)
      }, 100, 200);

      sc.on('response', function(num) {
        assert.equal(num, 300);
        sc.close();
        done();
      });
    }, 20);
  });

});