var assert = require('assert');

suite('Another', function() {
  ltest('server only', function(done, server) {
    // done();
    server.eval(function() {
      Posts.insert({a: 100});
      Posts.insert({b: 200});
      var docs = Posts.find().fetch();
      emit('doc', docs)
    });

    server.once('doc', function(docs) {
      assert.equal(docs.length, 2);
      done();
    });
  });

  ltest('insert and observe', function(done, server, client) {
    // done();
    server.eval(function() {
      Posts.remove({});
      Posts.find().observe({
        added: notifyTest
      })

      function notifyTest(doc) {
        emit('doc', doc);
      }
    });

    server.once('doc', function(doc) {
      delete doc._id;
      assert.deepEqual(doc, {a: 10});
      done();
    });

    client.eval(function() {
      Posts.insert({a: 10});
    });

    client.once('done', done);
  });

});
