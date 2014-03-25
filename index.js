var net = require('net')
var Client = require('./lib/client')

var connection = net.connect({ port: 5858 }, function(err) {
  var client = new Client(connection);


  client.source(1, 0, 10, function(err) {
    console.log(err)
  })
});
