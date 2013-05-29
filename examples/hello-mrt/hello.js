Posts = new Meteor.Collection('posts');

if(Meteor.isServer) {
  console.log(Meteor.Cluster);
}