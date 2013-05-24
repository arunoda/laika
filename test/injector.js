var Injector = require('../lib/injector');
var helpers = require('../lib/helpers');
var assert = require('assert');
var path = require('path');
var http = require('http');
var fs = require('fs');

suite('Injector', function() {
  test('injecting for the first time', function(done) {
    var folder = path.resolve('/tmp', helpers.randomId(10));
    var injector = new Injector({
      injectPort: 7007,
      appDir: folder
    });

    injector.inject();
    var injectedServerCode = fs.readFileSync(path.resolve(folder, 'server', 'meteor-suite-server.js'), 'utf8');
    var injectedClientCode = fs.readFileSync(path.resolve(folder, 'client', 'meteor-suite-client.js'), 'utf8');
    assert.ok(injectedServerCode.match(7007));
    assert.ok(injectedClientCode.length > 0);

    injector.clean();
    done();
  });

  test('injecting for the second time', function(done) {
    var folder = path.resolve('/tmp', helpers.randomId(10));
    var injector = new Injector({
      injectPort: 7007,
      appDir: folder
    });
    injector.inject();

    var injector2 = new Injector({
      injectPort: 7008,
      notificationPort: 9292,
      appDir: folder
    });
    injector2.inject();

    var injectedServerCode = fs.readFileSync(path.resolve(folder, 'server', 'meteor-suite-server.js'), 'utf8');
    var injectedClientCode = fs.readFileSync(path.resolve(folder, 'client', 'meteor-suite-client.js'), 'utf8');
    assert.ok(injectedServerCode.match(7008));
    assert.ok(injectedClientCode.length > 0);

    injector.clean();
    injector2.clean();
    done();
  });

  test('injecting and cleaning', function(done) {
    var folder = path.resolve('/tmp', helpers.randomId(10));
    var injector = new Injector({
      injectPort: 7007,
      appDir: folder
    });
    injector.inject();
    injector.clean();

    assert.throws(function() {
      var injectedServerCode = fs.readFileSync(path.resolve(folder, 'server', 'meteor-suite-server.js'), 'utf8');
    });

    assert.throws(function() {
      var injectedClientCode = fs.readFileSync(path.resolve(folder, 'client', 'meteor-suite-client.js'), 'utf8');
    });

    done();
  });

  test('getting ready event with the notification server', function(done) {
    var injector = new Injector({
      injectPort: 8001,
      appDir: '/tmp',
      notificationPort: 8002
    });
    injector.inject();

    injector.on('ready', function() {
      injector.clean();
      done();
    });
    http.get('http://localhost:8002', function(res) {
      assert.equal(res.statusCode, 200);
    }).on('error', assert.ifError);
  });

  test('getting interrupted event with the notification server', function(done) {
    var injector = new Injector({
      injectPort: 8001,
      appDir: '/tmp',
      notificationPort: 8002
    });
    injector.inject();

    injector.on('interrupted', function() {
      injector.clean();
      done();
    });

    http.get('http://localhost:8002').on('error', assert.ifError);
    http.get('http://localhost:8002').on('error', assert.ifError);
  });
})

