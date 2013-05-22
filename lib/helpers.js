exports.randomId = function randomId(noOfTexts) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < noOfTexts; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

exports.objectToArray = function objectToArray(obj) {
  var arr = [];
  for(var key in obj) {
    arr.push(obj[key]);
  }
  return arr;
};

exports.getRandomPort = function getRandomPort() {
  return Math.ceil(Math.random() * 1000) + 10000;
}