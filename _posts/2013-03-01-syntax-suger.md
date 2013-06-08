---
layout: post
title: Syntax Suger
visible: true
---

## Synchronous execution with .evalSync()

You've seen that `laika` uses [EventEmitter](http://www.sitepoint.com/nodejs-events-and-eventemitter/) like pattern to communicate with the evaluated code and the test. EventEmitter pattern is very useful if you want to send multiple results from the evaluated code at random events.

But if you just have only one result to be sent, and the test code is depends on it, EventEmitter pattern makes you to write unnecessary amount of code. 

Fortunately laika has a synchronous execution mode. You can simpy enable it by using `.evalSync()` instead of `.eval()`.

See following example and you'll realize :)

### Normal way of writing your test

    test('with with async style', function(done, server, client) {
      server.eval(function() {
        setTimeout(function() {
          emit('result', {a: 10});
        }, 10);
      });

      server.on('result', function(data) {
        client.eval(function(data) {
          emit('result', data.a + 10);
        }, data);
      });

      client.on('result', function(finalResult) {
        assert.equal(finalResult, 20);
        done();
      });
    });

### With .evalSync() 

    test('with .evalSync()', function(done, server, client) {
      var result = server.evalSync(function() {
        setTimeout(function() {
          emit('return', {a: 10});
        }, 10);
      });

      var finalResult = client.evalSync(function(data) {
         emit('return', data.a + 10);
      }, result);

      assert.equal(finalResult, 20);
      done();
    });

If you want to send result(and the control) back to test, you must call `emit('return', {with: 'some-data'})`. The value emited will be the return value of the `.evalSync()`. 

> Using .evalSync() does not make your tests faster or slower

### You can emit other events too

It is still possible to emit other events with `.evalSync()`, but they must be emitted after `return` event has been triggered. Otherwise those events will be ignored.

    test('emitting other events', function(done, server, client) {
      var result = server.evalSync(function() {
        setTimeout(function() {
          emit('other-result', 20);
        }, 10);
        emit('return', 10);
      });

      server.on('other-result', function(val) {
        assert.equal(result + val, 30);
        done();
      });
    });

### You can only use .evalSync() only inside the main callback

Although `.evalSync()` is a powerful feature, you can't use it everywhere. It can be only use in the main test callback. If you try to use `.evalSync()` inside a nested callback function, it throws an error. See following example.

    test('.evalSync() get failed', function(done, server, client) {
      server.eval(function() {
        setTimeout(function() {
          emit('result', 100);
        }, 10);
      });

      server.on('result', function(value) {
        var result = client.evalSync(function(val) {
          emit('return', val + 200);
        }, value);
        assert.equal(result, 300);
        done();
      });
    });

![.evalSync() failed under nested callbacks](http://i.imgur.com/olNMA2h.png)

