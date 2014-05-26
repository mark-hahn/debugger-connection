var BreakPoint = require('./breakpoint'),
    Script = require('./script'),
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
      var data = {}

      data.script = new Script(breakpoint.type === 'scriptId' ? {
        id: breakpoint.script_id
      } : {
        name: breakpoint.script_name
      })

      data.number = breakpoint.number
      data.line = breakpoint.line
      data.ignoreCount = breakpoint.ignoreCount
      data.hitCount = breakpoint.hit_count
      data.enabled = breakpoint.active


      return new BreakPoint(data, self.client)
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

proto.createBreakpoint = function(scriptName, breakLine, condition) {
  var deferred = q.defer(),
      primise

  this.client.request('setbreakpoint', {
    type: 'script',
    target: scriptName,
    line: breakLine,
    column: 0,
    enabled: true,
    condition: condition,
    ignoreCount: 0
  }, deferred.makeNodeResolver())

  function createBreakPoint(resp) {
    var brk = resp.body

    return new BreakPoint({
      script: new Script({name: scriptName}),
      line: breakLine,
      condition: condition,
      number: brk.breakpoint,
      enabled: true
    })
  }

  promise = deferred.promise.then(createBreakPoint)

  return promise;
}


module.exports = BreakPointManager
