var assert = require('assert');
var path = require('path');
var fs = require('fs');
var http = require('http');
var Phantom = require('node-phantom');
var helpers = require('../lib/helpers');
var ClientConnector = require('../lib/connectors/client.js');
var Fiber = require('fibers');

var CLIENT_TEMPLATE_LOCATION = path.resolve(__dirname, '../lib/injector/templates/client.js');
var clientCode = fs.readFileSync(CLIENT_TEMPLATE_LOCATION, 'utf8');
var phantom;

suite('ClientConnector', function() {
  test('run in client and get result', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        emit('result', 10);
      });

      cc.on('result', function(val) {
        assert.equal(val, 10);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('convert undefined into null', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        emit('result', 10, undefined, 20);
      });

      cc.on('result', function(v1, v2, v3) {
        assert.equal(v1, 10);
        assert.ok(v2 === null);
        assert.equal(v3, 20);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('getting a false value', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        emit('result', false, 10);
      });

      cc.on('result', function(v1, v2) {
        assert.equal(v1, false);
        assert.equal(v2, 10);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('paramters emitting correctly', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        emit('result', 10);
      });

      cc.on('result', function(val, noSuchParam) {
        assert.equal(val, 10);
        assert.equal(noSuchParam, null);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('run in client and get result in async fashion', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        setTimeout(function() {
          emit('result', 120);
        })
      });

      cc.on('result', function(val) {
        assert.equal(val, 120);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('send args to the client and get result', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function(a, b) {
        emit('result', a + b);
      }, 100, 200);

      cc.on('result', function(val) {
        assert.equal(val, 300);
        server.close();
        cc.close();
        done();
      })
    })
  });

  test('run in client and get result with .evalSync()', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      Fiber(function() {
        cc = new ClientConnector(phantom, 'http://localhost:' + port);
        var result = cc.evalSync(function() {
          emit('return', 10);
        });

        assert.equal(result, 10);
        server.close();
        cc.close();
        done();
      }).run();
    })
  });

  test('run in client with error', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        throw new Error('dsdsd');
        emit('result', 10);
      });

      cc.on('error', function(val) {
        server.close();
        cc.close();
        done();
      })

      cc.on('result', function() {
        assert.fail("cannot get the result");
      });
    })
  });

  test('run in client with simulating error (ignore them)', function(done) {
    var port = helpers.getRandomPort();
    var server = createHttpServer(port);
    var cc;
    getPhantom(function(phantom) {
      cc = new ClientConnector(phantom, 'http://localhost:' + port);
      cc.eval(function() {
        throw new Error('simulating the effect dsdsd');
        emit('result', 10);
      });

      cc.on('error', function(val) {
        assert.fail('simulating errors should not cause any harm');
      })

      cc.on('result', function() {
        assert.fail("cannot get the result");
      });

      setTimeout(function() {
        done();
      }, 50);
    })
  });

  test('**to kill phantom js**', function() {
    phantom._phantom.kill();
  });
})

function getPhantom(callback) {
  if(phantom) {
    callback(phantom);
  } else {
    Phantom.create(afterCreated);
  }

  function afterCreated(err, ph) {
    phantom = ph;
    if(err) {
      throw err;
    } else {
      callback(phantom);
    }
  }
}

function createHttpServer(port) {
  var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<html><head><script type='text/javascript'>" + clientCode + "</script></head></html>");
  });

  server.listen(port);
  return server;
}
