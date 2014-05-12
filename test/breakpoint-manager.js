var BreakPointManager = require('../lib/breakpoint-manager')
var BreakPoint = require('../lib/breakpoint')
var sinon = require('sinon')
var client = require('./client-stub')

describe('Break Point', function() {

  var breakpointManager, cb;

  beforeEach(function() {
    breakpointManager = new BreakPointManager(client)
    cb = sinon.stub()
  })

  describe('when try to list break points', function() {

    beforeEach(function() {
      client.makeFakeRequest()
    })

    it('should try to consume remote debugger of all the break points', function() {
      breakpointManager.list(cb)

      client.request.called.should.be.true;
      client.shouldRequestedWithCommand('listbreakpoints')
    })

    it('should send a standard list breakpoint request', function() {
      breakpointManager.list(cb)
      client.shouldRequestedWithData({})
    })
  })

  describe('when there\'s no any breakpoints', function() {
    beforeEach(function() {
      client.respondWith({
        breakOnExceptions         : false,
        breakOnUncaughtExceptions : false
      })
    })

    it('should takes back a empty array', function() {
      breakpointManager.list(cb)

      cb.args[0][1]
        .should.be.an.Array
        .and.lengthOf(0)
    })
  })

  describe('when break point fetched from server', function() {
    beforeEach(function() {
      client.respondWith({
        breakpoints: [{
        }],
        breakOnExceptions         : false,
        breakOnUncaughtExceptions : false
      })
    })

    it('should get one of there\'s only one result from server', function() {
      breakpointManager.list(cb)

      cb.args[0][1]
        .should.be.an.Array
        .and.lengthOf(1)
    })

    it('should get the list of BreakPoint instance and have the result property', function() {
      breakpointManager.list(cb)

      var result = cb.args[0][1]

      result[0].should.be.instanceOf(BreakPoint)
    })

  })

  describe('when multiple breakpoints fetched from server', function() {
    beforeEach(function() {
      client.respondWith({
        breakpoints: [{}, {}],
        breakOnExceptions         : false,
        breakOnUncaughtExceptions : false
      })
    })

    it('should get mutiple breakpoints', function() {
      breakpointManager.list(cb)
      cb.args[0][1]
        .should.be.an.Array
        .and.lengthOf(2)
    })

  })
})
