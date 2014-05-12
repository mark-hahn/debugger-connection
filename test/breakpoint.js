var BreakPoint = require('./breakpoint'),
    client = require('./client-stub')

describe('BreakPoint', function() {

  beforeEach(function() {
    client.respondWith({
      breakpoints: [{
        type: 'scriptId',
        scriptId: 100,
        number: 10,
        line: 100,
        column: 20,
        groupId: 12,
        hitCount: 0,
        active: true,
        ignoreCount: 1,
        actualLocations: 234
      }],
      breakOnExceptions         : false,
      breakOnUncaughtExceptions : false
    })
  })

})
