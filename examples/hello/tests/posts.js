var assert = require('assert');

suite('Posts', function() {
  test('insert and observe', laika(function(done, server, client) {
    server.run(function() {
      Posts.find().observe({
        added: notifyTest
      })

      function notifyTest(doc) {
        emit('doc', doc);
      }
    });

    server.on('doc', function(doc) {
      delete doc._id;
      assert.deepEqual(doc, {a: 10});
      done();
    });

    client.run(function() {
      Posts.insert({a: 10});
    });
  }));

  test('insert in client and observe in client too', laika(function(done, server, c1, c2) {
    
    c1.run(function() {
      Posts.find().observe({
        added: onAdded
      });

      function onAdded(doc) {
        emit('doc', doc);
      }

      emit('done');
    });

    c1.on('done', function() {
      c2.run(function() {
        Posts.insert({k: 567});
      });
    });

    c1.on('doc', function(doc) {
      if(doc.k == 567) {
        done();
      }
    });
  }));
});
