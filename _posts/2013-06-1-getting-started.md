---
layout: post
title: Getting Started
visible: true
---

`Laika` is a feature rich testing framework for [meteor](http://meteor.com). With laika you can simply write test with interacting with **both** server and client(s).

##Installation and Setup

* First install laika from npm

    `sudo npm install -g laika`

* Download and install [`phantomJS`](http://phantomjs.org/download.html)

* You need to start a separate `mongodb` server with following options (It makes testing much speeder)

    `mongod --smallfiles --noprealloc --nojournal`
* You can also use a [ramdisk](https://en.wikipedia.org/wiki/RAM_drive) as the mongodb data directory. It makes your tests completed in 3X faster. [See this guide](using-ram-disk.html)

##Write your first test with laika

Laika uses `tdd style` of testing for now. (we have some plans to allow other styles and reporters since we use `mocha` internally)

You need to place tests in `tests` folder in your meteor app. Files placed in the tests folder will not be included in your app.

### Our simple app
Our simple meteor application has a collection shared in both the client and server. This sample app is available on [`github`](https://github.com/arunoda/hello-laika)

    //collections.js
    Posts = new Meteor.Collection('posts');

### Let's write our first test. We'll test our collection on the server

    //tests/posts.js
    var assert = require('assert');

    suite('Posts', function() {
      test('in the server', function(done, server) {
        server.eval(function() {
          Posts.insert({title: 'hello title'});
          var docs = Posts.find().fetch();
          emit('docs', docs);
        });

        server.once('docs', function(docs) {
          assert.equal(docs.length, 1);
          done();
        });
      });
    });

* We have defined a `Posts` test suite
* Within that we've a test named 'in the server'
* note that we've created our tests with `test()` method
* Then we evaluate some code block in the server
* Result will be send via an `emit`
* Now we can listen to the event in tests
* You can think `server` as an event emitter between the server and the test

Now let's run our first. Simply apply following command

    laika

You'll see the output as below

![Firsr test result](images/getting-started/one.png)

### Lets write another test which includes both client and the server

this test also goes within the `Posts` suite

    test('using both client and the server', function(done, server, client) {
      server.eval(function() {
        Posts.find().observe({
          added: addedNewPost
        });

        function addedNewPost(post) {
          emit('post', post);
        }
      }).once('post', function(post) {
        assert.equal(post.title, 'hello title');
        done();
      });

      client.eval(function() {
        Posts.insert({title: 'hello title'});
      });
    });

* Now we are observing a collection in the server
* Client do the insert and we'll catch it on the server
* You might have seen that our `server` object support method chaining as well :)

lets see the result

![Second test result](images/getting-started/two.png)

### Lets write one last test with involving two clients

    test('using two client', function(done, server, c1, c2) {
      c1.eval(function() {
        Posts.find().observe({
          added: addedNewPost
        });

        function addedNewPost(post) {
          emit('post', post);
        }
        emit('done');
      }).once('post', function(post) {
        assert.equal(post.title, 'from c2');
        done();
      }).once('done', function() {
        c2.eval(insertPost);
      });

      function insertPost() {
        Posts.insert({title: 'from c2'});
      }
    });

* In this test we use two clients to observe changes in the Post collection
* You can create as many as clients by specifying arguments like above

So the result is

![Third test result](images/getting-started/third.png)

<a href="examples.html" style='font-size: 20px; font-weight: bold'>Checkout more examples</a>
