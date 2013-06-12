suite('Posts', function() {
  test('simple test', function(done, server) {
    var Collection = _.partial(_collection, server);
    var Posts = Collection("Posts");

    var fix = runAllFixtures(server);

    ( Posts.find().fetch() ).should.not.be.empty;
    ( Posts.find().count() ).should.be.eql(3);

    var release = fix.Posts["1"];
    ( Posts.findOne({_id:release._id}).title ).should.be.eql( "Meteor 0.6.4 released!" );
    ( Posts.findOne({_id:release._id}).content ).should.be.eql( "Meteor 0.6.4 is the latest Meteor version." );

    server.evalSync(function(_id, content) {

      Posts.update({_id: _id}, {$set:{content: content}});
      emit('return');

    }, release._id, "Meteor 0.6.4 is no longer the latest Meteor version.");

    ( Posts.findOne({_id:release._id}).content ).should.be.eql( "Meteor 0.6.4 is no longer the latest Meteor version." );

    done();
  });
});
