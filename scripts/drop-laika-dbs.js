// this is a mongo shell script

var dbs = db.getMongo().getDBNames()
dbs.forEach(function(dbName) {
  var isLaikaDb = dbName.match(/^laika-/);
  if(isLaikaDb) {
    var database = db.getMongo().getDB(dbName);
    database.dropDatabase();
  }
});
