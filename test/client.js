
var sinon = require('sinon')
  , rewire = require('rewire')
  , Ev = require('events').EventEmitter
  , Client = rewire('../lib/client')
  , noop = function() {}

describe('Client', function() {

  var connection
    , client
    , cb
    , port = 5858
    , connectionStub

  beforeEach(function() {
    connection = new Ev()
    connection.write = sinon.stub()
    connectionStub = sinon.stub()
    connectionStub.returns(connection)
    Client.__set__('net', {
      connect: connectionStub
    })
    client = new Client(port)
    cb = sinon.stub()
  })

  describe('when using client as a normal function', function() {
    it('should create a new client instance', function() {
      var client = Client(port)
      client.should.be.instanceOf(Client)
    })
  })

  describe('when client created', function() {

    it('should connect to the port I wanted', function() {
      connectionStub.calledWith({ port: 5858 }).should.be.true
    })

    it('should emit connect event when client is already access to debugger', function() {
      client.on('connect', cb)
      client.connection.emit('connect')
      cb.called.should.be.true
    })

    it('should emit error when connection have error', function() {
      client.on('error', cb)
      client.connection.emit('error', 'this is an error')
      cb.calledWith('this is an error').should.be.true
    })
  })

  describe('#version', function() {
    it('should send the request to debug server for version', function() {

      sinon.stub(client.protocol, 'version')
      client.version(function() {})
      client.protocol.version.calledWith(1).should.be.true
      connection.write.called.should.be.true
    })

    it('should send the request to debug server for version twice', function() {
      sinon.stub(client.protocol, 'version')
      client.version(function() {})
      client.version(function() {})

      client.protocol.version.calledWith(2).should.be.true
      connection.write.called.should.be.true
    })

    it('should be able to retrieve the version and call the callback', function() {

      client.version(cb)
      connection.emit('data', new Buffer('{"seq":134,"request_seq":1,"type":"response","command":"version","success":true,"body":{"V8Version":"1.3.19 (candidate)"},"refs":[],"running":false}', 'utf8'))
      cb.calledWith(null, '1.3.19 (candidate)').should.be.true

    })

    it('should be able to retrieve the correct version and call the callback', function() {

      client.version(cb)
      connection.emit('data', new Buffer('{"seq":134,"request_seq":1,"type":"response","command":"version","success":true,"body":{"V8Version":"correct"},"refs":[],"running":false}', 'utf8'))
      cb.calledWith(null, 'correct').should.be.true

    })

    it('should retrieve the correct version when response includes the header', function() {

      client.version(cb)
      connection.emit('data', new Buffer(
        'Type: connect' +
        'V8-Version: 3.19.13' +
        'Protocol-Version: 1' +
        'Embedding-Host: node v0.11.3' +
        'Content-Length: 0' + '\r\n\r\n' +
        'Content-Length: 135' + '\r\n\r\n' +
        '{"seq":12,"request_seq":1,"type":"response","command":"version","success":true,"body":{"V8Version":"3.19.13"},"refs":[],"running":true}'
      ))
      cb.calledWith(null, '3.19.13').should.be.true

    })
  })

  describe('#continue', function() {

    var protocol;

    beforeEach(function() {
      protocol = client.protocol
      sinon.stub(protocol, 'continue')
    })

    afterEach(function() {
      protocol.continue.restore()
    })

    it('should send a normal continue request to debugger', function() {
      client.continue()
      protocol.continue.called.should.be.true
    })

    it('should send a out continue request with step to debugger', function() {
      client.continue.out(10)
      protocol.continue.calledWith(1, 'out', 10).should.be.true
    })

    it('should send a next continue request to debugger', function() {
      client.continue.next()
      protocol.continue.calledWith(1, 'next').should.be.true
    })

    it('should provide the success result to handler', function() {
      client.continue(cb)
      connection.emit('data',
        JSON.stringify({
          seq         : 1,
          type        : 'response',
          request_seq : 1,
          command     : 'continue',
          running     : true,
          success     : true
        })
      )

      cb.called.should.be.true
    })

    it('should send the in next step without step', function() {
      client.continue.next(cb)
      protocol.continue.calledWith(1, 'next').should.be.true
    })
  })

  describe('#break event', function() {
    it('should publish a break event data came', function() {
      client.on('break', cb)
      connection.emit('data', '{"seq":1,"type":"event","event":"break"}')
      cb.called.should.be.true
    })
  })

  // TODO finish others then start with this
  describe('#source', function() {

    var protoStr = '{request_seq": 1}'
      , sourceStub

    beforeEach(function() {
      sourceStub = sinon.stub(client.protocol, 'source')
      sourceStub.returns(protoStr)
    })

    it('should get the source protocol once', function() {

      client.source(1, 10, 20, function() {})
      client.protocol.source.calledWith(1, 1, 10, 20).should.be.true

    })

    it('should get the source protocol twice', function() {

      client.source(20, 10, 100, function() {})
      client.source(400, 10, 10000, function() {})
      client.protocol.source.calledWith(2, 400, 10, 10000).should.be.true

    })

    it('should send the source protocol string to debugger', function() {

      client.source(function() {})
      connection.write.calledWith(protoStr).should.be.true

    })

    it('should pass error to callback when no source', function(done) {

      client.source(10, 10, 10, function(err) {
        err.should.be.an.Error
        done()
      })

      connection.emit('data', new Buffer(
        '{"seq":6,"request_seq":1,"type":"response","command":"source","success":false,"message":"No source","running":true}',
        'utf8'
      ))
    })

  })


})
