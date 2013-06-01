module.exports = {
  createUser: function(accountInfo, additionalFields) {
    if(Meteor.isClient) {
      Accounts.createUser(accountInfo, function(err) {
        emit('return', err);
      });
    } else {
      Accounts.createUser(accountInfo);
      if(additionalFields) {
        var query;
        if(accountInfo.email) {
          query = {email: accountInfo.email};
        } else if(accountInfo.username) {
          query = {username: accountInfo.username};
        }

        Meteor.users.update(query, {$set: additionalFields});
      }
      emit('return');
    }
  },

  loginUser: function(user, password) {
    Meteor.loginWithPassword(user, password, function(err) {
      emit('return', err);
    });
  },

  loggedInUser: function() {
    var user = Meteor.user();
    emit('return', user);
  },

  sessionGet: function(key) {
    var value = Session.get(key);
    emit('return', value);
  },

  sessionSet: function(key, value) {
    Session.set(key, value);
    emit('return');
  }
};