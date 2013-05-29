var assert = require('assert');

suite('Posts', function() {
  ltest('insert in client and observe in client too', function(done, server, c1, c2) {
    var insertObject = { k: Math.random() };
    server.eval(function() {
      Posts.remove({});
      emit('done');
    }).once('done', function() {
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

    c1.once('done', function() {
      c2.eval(insertDoc, insertObject);
    });

    function insertDoc(obj) {
      Posts.insert(obj);
    }

    c1.once('doc', function(doc) {
      assert.equal(doc.k, insertObject.k);
      done();
    });
  });

  ltest('insert and observe2', function(done, server, client) {
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
  });

  ltest('insert in client and observe in client too using evalSync()', function(done, server, c1, c2) {
    var insertObject = { k: Math.random() };
    c1.evalSync(function() {
      Posts.find().observe({
        added: onAdded
      });

      function onAdded(doc) {
        emit('doc', doc);
      }

      emit('return');
    });

    c1.once('doc', function(doc) {
      assert.equal(doc.k, insertObject.k);
      done();
    });

    c2.eval(function(obj) {
      Posts.insert(obj);
    }, insertObject);

  });
});
