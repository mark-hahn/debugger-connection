
var sinon = require('sinon')
  , rewire = require('rewire')
  , Ev = require('events').EventEmitter
  , Client = rewire('../lib/connection')
  , noop = function() {}

describe('Client', function() {

  var connection
    , client
    , cb
    , port = 5858
    , connectionStub
    , TIMEOUT

  beforeEach(function() {
    connection = new Ev()
    connection.write = sinon.stub()
    connectionStub = sinon.stub()
    connectionStub.returns(connection)
    Client.__set__('net', {
      connect: connectionStub
    })

    TIMEOUT = Client.__get__('TIMEOUT')

    client = Client.create().connect(5858)

    cb = sinon.stub()
  })

  describe('when using client as a normal function', function() {
    it('should create a new client instance', function() {
      var client = Client.create().connect(port);
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

  describe('#request', function() {

    beforeEach(function() {
      sinon.stub(client.protocol, 'serilize').returns('{}')
      Client.__set__('TIMEOUT', 10)
    })

    afterEach(function() {
      Client.__set__('TIMEOUT', TIMEOUT)
    })

    it('should try to send a serialized request', function() {
      var dataToSendStub = {}
      client.request('command', {}, function() {})
      client.protocol.serilize.args[0][0].arguments.should.eql(dataToSendStub)
    })

    it('should send the serilized data to socket', function() {
      client.request('command', {}, function() {})
      connection.write.args[0][0].should.equal('{}');
    })

    it('should call the callback when have response', function() {
      var callbackMock = sinon.stub()
      client.request('command', {}, callbackMock)

      connection.emit('data', new Buffer(JSON.stringify({
        seq: 123,
        request_seq: 1,
        command: 'scripts',
        type: 'response',
        success: true
      })))

      callbackMock.called.should.be.true
    })

    it('should send the request again when it\'s after 1 second without response', function(done) {
      var callbackMock = sinon.stub()
      client.request('command', {}, callbackMock)

      setTimeout(function() {
        connection.emit('data', new Buffer(JSON.stringify({
          seq: 123,
          request_seq: 1,
          command: 'scripts',
          type: 'response',
          success: true
        })))

        client.connection.write.callCount.should.equal(2);
        done();
      }, 15);
    });


    it('should send the request 10 times if it doesn\'t have any response all these times', function(done) {
      this.timeout(200)

      client.request('command', {}, function() {})
      setTimeout(function() {
        client.connection.write.callCount.should.equal(10);
        done();
      }, 150);

    })

  })

  describe('#break event', function() {
    it('should publish a break event data came', function() {
      client.on('break', cb)
      connection.emit('data', '{"seq":1,"type":"event","event":"break"}')
      cb.called.should.be.true
    })
  })
})
