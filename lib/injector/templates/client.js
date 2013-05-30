// we need to remove undefined values from the argument.
// there is a bug in the code commented below.
// this was the only trick left for us
window.emit = function emit(_0, _1, _2, _3, _4, _5, _6, _7, _8, _9) {

  for(var lc=0; lc<10; lc++) {
    eval('_' + lc +' = _' + lc + ' == undefined? null: _' + lc);
  }

  if(window.callPhantom) {
    window.callPhantom(_0, _1, _2, _3, _4, _5, _6, _7, _8, _9);
    //following does not simply works

    // var args = [];
    // for(var key in arguments) {
    //   console.log('inside key: ', key);
    //   var value = arguments[key];
    //   if(value == undefined) {
    //     arguments[key] = null;
    //   }
    //   args.push(value)
    // }

    // console.log('args', JSON.stringify(arguments));
    // window.callPhantom.apply(null, arguments);
  }
};