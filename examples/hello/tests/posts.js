var assert = require('assert');

suite('Posts', function() {
  test('insert and observe', laika(function(done, server, client) {
    server.eval(function() {
      Posts.remove({});
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

    client.eval(function() {
      Posts.insert({a: 10});
    });
  }));

  test('insert in client and observe in client too', laika(function(done, server, c1, c2) {
    var insertObject = { k: Math.random() };
    server.eval(function() {
      Posts.remove({});
      emit('done');
    }).on('done', function() {
      c1.eval(observePosts);
    })

    function observePosts() {
      Posts.find().observe({
        added: onAdded
      });

      function onAdded(doc) {
        emit('doc', doc);
      }

      emit('done');
    }

    c1.on('done', function() {
      c2.eval(insertDoc, insertObject);
    });

    function insertDoc(obj) {
      Posts.insert(obj);
    }

    c1.on('doc', function(doc) {
      assert.equal(doc.k, insertObject.k);
      done();
    });
  }));

  test('insert and observe2', laika(function(done, server, client) {
    server.eval(function() {
      Posts.remove({});
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

    client.eval(function() {
      Posts.insert({a: 10});
    });
  }));
});
