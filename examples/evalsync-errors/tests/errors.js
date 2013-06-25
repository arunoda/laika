var assert = require('assert');

suite('EvalSync Error Catch', function() {
  test('catch error server', function(done, server, client) {
    try{
      server.evalSync(function() {
        throw new Error('hoiya');
        emit('return');
      }); 
      assert.fail('should throw some error');
    } catch(ex) {
      assert.ok(ex.message.match(/hoiya/));
      done();
    }
  });

  test('catch error client', function(done, server, client) {
    try{
      client.evalSync(function() {
        throw new Error('hoiya');
        emit('return');
      }); 
      assert.fail('should throw an error');
    } catch(ex) {
      assert.ok(ex.message.match(/hoiya/));
      done();
    }
  });
});