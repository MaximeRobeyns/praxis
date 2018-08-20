importScripts('numbers.js');

self.addEvenetListener('message', function(event){
  solutions(event.data.target, event.data.numbers, function(expr){
    self.postMessage(expr.toString());
  });
  self.postMessage(null);
  self.close();
}, false);
