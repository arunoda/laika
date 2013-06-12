should = require('should').should;
_ = require('underscore');

_collection = function (server, collName){
  function grab (){
    return server.evalSync(function(collName) {

      emit('return', eval(collName).find().fetch());

    }, collName);
  }

  function find(expression){
    var fetch = grab();

    if( !_.isUndefined(expression) )
      fetch = _.where(fetch, expression);

    return {fetch: function(){ return fetch; }, count: function(){ return fetch.length; }};
  }

  function findOne(expression){
    return find(expression).fetch()[0];
  }

  return {
    find: find,
    findOne: findOne
  }
}
