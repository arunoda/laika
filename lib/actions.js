module.exports = {
  createUser: function(accountInfo, additionalFields) {
    //TODO: additionalFields only supported in the server
    Accounts.createUser(accountInfo, function(err) {
      emit('return', err);
    });
  }
};