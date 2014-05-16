var BreakPoint = require('./breakpoint'),
    q = require('q'),
    proto

function BreakPointManager(client) {
  this.client = client
}

proto = BreakPointManager.prototype

/**
 * list all breakpoints
 */
proto.list = function() {
  var self = this,
      deferred = q.defer(),
      promise

  this.client.request('listbreakpoints', {}, deferred.makeNodeResolver())

  promise = deferred.promise.then(onData)

  function onData(resp) {
    var body = resp.body

    if (!body.breakpoints) {
      return []
    }

    var breakpoints = body.breakpoints.map(function(breakpoint) {
      return new BreakPoint(breakpoint, self.client)
    })
    return breakpoints
  }

  return promise
}

proto.clearAll = function() {
  return this.list()
            .then(function(breakpoints) {
              return q.all(
                breakpoints.map(function(breakpoint) {
                  return breakpoint.clear()
                })
              )
            })
}



module.exports = BreakPointManager
