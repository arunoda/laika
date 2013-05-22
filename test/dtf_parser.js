var assert = require('assert');
var DftParser = require('../lib/dtf_parser');

suite('DftParser', function() {
  test('single data', function(done) {
    var dp = new DftParser();
    dp.on('data', function(data) {
      assert.equal(data, 'hello');
      done();
    });
    dp.parse('hello#DTF#');
  });

  test('multipleData data', function() {
    var dp = new DftParser();
    var received = [];
    dp.on('data', function(data) {
      received.push(data);
    });
    dp.parse('one#DTF#two#DTF#three#DTF#');
    assert.deepEqual(received, ['one', 'two', 'three']);
  });

  test('remainder check', function() {
    var dp = new DftParser();
    var received = [];
    dp.on('data', function(data) {
      received.push(data);
    });
    dp.parse('one#DTF#two#DTF#thr');
    assert.deepEqual(received, ['one', 'two']);
    assert.equal(dp.remainder, 'thr');

    dp.parse('ee#DTF#');
    assert.deepEqual(received, ['one', 'two', 'three']);
  });
});