var assert = require('assert');

suite('EvalSync Expect Error', function() {
  suite('Server:', function() {
    test('throw normal error', function(done, server, client) {
      server.evalSync(function() {
        emit('return', false);
      });

      server.evalSync(function() {
        throw new Error('normal error');
        emit('return');
      }); 

      done();
    });

    test('throw error on evalSync', function(done, server, client) {

      var error = server.evalSyncExpectError('I want some error', function() {
        throw new Error('hoiya');
        emit('return');
      });
      assert.ok(error.message.match(/hoiya/));

      done();
    });

    test('evalSync Error expected but not thrown', function(done, server, client) {

      server.evalSyncExpectError('expected but not thrown', function() {
        // throw new Error('hoiya');
        emit('return');
      });

      done();
    });
  })

  suite('Client:', function() {
    test('throw normal error', function(done, server, client) {
      client.evalSync(function() {
        emit('return', false);
      });

      client.evalSync(function() {
        throw new Error('normal error');
        emit('return');
      }); 

      done();
    });

    test('throw error on evalSync', function(done, server, client) {

      var error = client.evalSyncExpectError('I want some error', function() {
        throw new Error('hoiya');
        emit('return');
      });
      assert.ok(error.message.match(/hoiya/));

      done();
    });

    test('evalSync Error expected but not thrown', function(done, server, client) {

      server.evalSyncExpectError('expected but not thrown', function() {
        // throw new Error('hoiya');
        emit('return');
      });

      done();
    });
  })
});