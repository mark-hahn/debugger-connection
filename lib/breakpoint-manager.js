var BreakPoint = require('./breakpoint'),
    proto

function BreakPointManager(client) {
  this.client = client
}

proto = BreakPointManager.prototype

/**
 * list all breakpoints
 */
proto.list = function(cb) {
  var self = this

  this.client.request('listbreakpoints', {}, function(err, resp) {
    var body = resp.body
    console.log(resp.body)
    if (!body.breakpoints) {
      return cb(null, [])
    }

    var breakpoints = body.breakpoints.map(function(breakpoint) {
      return new BreakPoint(breakpoint, self.client)
    })
    cb(null, breakpoints)
  })
}

module.exports = BreakPointManager
