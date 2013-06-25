var assert = require('assert');

suite('Multi Clients', function() {
  suite('localStorage', function() {
    test('upto 3 clients', function(done, server, c1, c2, c3, c4) {
      var item = c1.evalSync(function() {
        localStorage.setItem('abc', 1000);
        emit('return', localStorage.getItem('abc'));
      });
      assert.equal(item, 1000);

      var item2 = c2.evalSync(function() {
        emit('return', localStorage.getItem('abc'));
      });
      assert.equal(item2, null);

      var item3 = c3.evalSync(function() {
        emit('return', localStorage.getItem('abc'));
      });
      assert.equal(item3, null);

      var item4 = c4.evalSync(function() {
        emit('return', localStorage.getItem('abc'));
      });
      assert.equal(item4, item);
      done();
    });
  });
});