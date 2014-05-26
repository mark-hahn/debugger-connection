var _ = require('lodash'),
    q = require('q'),
    proto

/**
 *  type: 'script' || 'function'
 *  number: 'breakpoint number'
 *  enabled: 'same as active'
 *  condition: ''
 *  ignoreCount: ignoreCount
 *  line: num
 *  hit_count: num
 *
 */

function BreakPoint(data, client) {
  this.client = client
  
  _.extend(this, data)
}

proto = BreakPoint.prototype

proto.clear = function() {
  var deferred = q.defer()

  this.client.request('clearbreakpoint', {
    breakpoint: this.number
  }, deferred.makeNodeResolver())

  return deferred.promise
}

module.exports = BreakPoint
