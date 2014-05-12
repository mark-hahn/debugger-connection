var Client = module.exports = require('./lib/client')

Client.ScriptManager = require('./lib/script-manager')
Client.BreakPointManager = require('./lib/breakpoint-manager')

var c = Client(5858)

c.on('connect', function() {

  var manager = new Client.BreakPointManager(c)

  manager.list(function(err, brks) {
    console.log(brks)
  })

  c.continue()

  c.on('break', function() {
    c.continue.out(function() {
      manager.list(function(err, brks) {
        console.log(brks)
      })
    })
  })

})
