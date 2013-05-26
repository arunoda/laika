var assert = require('assert');
var path = require('path');
var http = require('http');
var fs = require('fs');
var handlebars = require('handlebars');
var ServerConnector = require('../lib/connectors/server.js');
var helpers = require('../lib/helpers');
var Fiber = require('fibers');

var SERVER_TEMPLATE_LOCATION = path.resolve(__dirname, '../lib/injector/templates/server.js');

suite('ServerConnector', function() {
  test('run in server and get result', function(done) {
    var Npm = {require: require};
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template();
    
    eval(serverCode);
    setTimeout(function() {
      //port variable comes from the serverCode
      var sc = new ServerConnector(port);
      sc.eval(function() {
        emit('response', 1001)
      });

      sc.on('response', function(num) {
        assert.equal(num, 1001);
        sc.close();
        done();
      });
    }, 20);
  });

  test('run fibered code', function(done) {
    var Npm = {require: require};
    var Meteor = {setTimeout: setTimeout};
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template();
    
    eval(serverCode);
    setTimeout(function() {
      //port comes from the serverCode
      var sc = new ServerConnector(port);
      sc.eval(function() {
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
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template();
    
    eval(serverCode);
    setTimeout(function() {
      //port comes from the serverCode
      var sc = new ServerConnector(port);
      sc.eval(function(a, b) {
        emit('response', a + b)
      }, 100, 200);

      sc.on('response', function(num) {
        assert.equal(num, 300);
        sc.close();
        done();
      });
    }, 20);
  });

  test('run in server and get result with .evalSync()', function(done) {
    var Npm = {require: require};
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template();
    
    eval(serverCode);
    setTimeout(function() {
      Fibers(runInFiber).run();
    }, 20);

    function runInFiber() {
      //port variable comes from the serverCode
      var sc = new ServerConnector(port);
      var result = sc.evalSync(function() {
        emit('return', 1001)
      });
      assert.equal(result, 1001);
      sc.close();
      done();
    }
  });

});