var sinon = require('sinon')
  , rewire = require('rewire')
  , q = require('q')
  , _ = require('lodash')
  , Ev = require('events').EventEmitter
  , Connection = rewire('../lib/connection')
  , noop = function() {}
  , client = new Connection(new Ev());


function timeout(msec) {
  return q.Promise(function(resolve) {
    setTimeout(function() {
      resolve(true);
    }, msec);
  })
}

describe('Connection', function() {

  var socket
    , cb
    , port = 5858
    , connectionStub
    , TIMEOUT
    , net = Connection.__get__('net');

  beforeEach(function setup() {
    socket = new Ev();

    socket.write = sinon.stub();

    sinon.stub(net, 'connect').returns(socket);
  });

  afterEach(function tearDown() {
    net.connect.restore();
    client.socket = null;
    client._connected = false;
  });

  it('should be able to connect to port', function() {
    client.connect(5858);
    net.connect.calledWith({ port: 5858 }).should.be.true;
  });

  it('should be able return the socket when connected', function() {
    var promise = client
      .connect(5858)
      .then(function(c) {
        c.should.equal(client)
      });

    socket.emit('connect');
    return promise;
  });

  it('should be able to disconnect with the server', function() {

    sinon.stub(client, 'request').callsArgWith(2, null, true);

    var promise = client
      .connect(5858)
      .then(function(client) {
        return client.disconnect();
      })
      .then(function() {
        client.request.called.should.be.true;
        client.request.calledWith('disconnect', {}).should.be.true;
        client.request.restore();
      });

    socket.emit('connect')

    return promise;
  });

  it('should be able to send the request to the server', function() {

    var promise = client
      .connect(5858)
      .then(function() {
        client.request('command', {}, function() {});
        _.forEach(client._fnPool, function(fn) {
          fn.call();
        });
        socket.write.args[0][0].should.match(/command/);
        socket.write.args[0][0].should.match(/{}/);
      });

    socket.emit('connect');

    return promise;
  });

  it('should be able to try many times when no result', function() {

    Connection.__set__('TIMEOUT', 10);

    var promise = client
      .connect(5858)
      .then(function() {
        client.request('command', {}, function() {});
        return timeout(50);
      })
      .then(function() {
        _.forEach(client._fnPool, function(fn) {
          fn.call();
        });
        socket.write.callCount.should.greaterThan(1)
      });

    socket.emit('connect');
    return promise;
  });

  it('should not connect again when using same port and connected', function() {

    var promise = client
      .connect(5858)
      .then(function() {
        return client.connect(5858);
      })
      .then(function() {
        net.connect.callCount.should.equal(1);
      })

    socket.emit('connect');

    return promise;
  });
});
