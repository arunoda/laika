// Fixtures:
var registry = {};

addFixtures = function (collection, data){
  registry[collection] = data;
}

runFixtures = function(server, collection){
  return server.evalSync(function(collection, data) {

    _.each(data, function(doc){
      eval(collection).insert( doc );
    });

    var fetch = eval(collection).find().fetch();
    fetch = _.object(_.pluck(fetch, '_id'), fetch);

    emit('return', fetch);

  }, collection, registry[collection]);
}

runAllFixtures = function(server){
  var database = {};
  _.each(registry, function(data, collection){
    database[collection] = runFixtures(server, collection);
  });
  console.log("`runAllFixtures` executed");

  return database;
}