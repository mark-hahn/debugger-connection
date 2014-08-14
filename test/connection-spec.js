var sinon = require('sinon')
  , rewire = require('rewire')
  , q = require('q')
  , _ = require('lodash')
  , Ev = require('events').EventEmitter
  , client = rewire('../lib/connection')
  , noop = function() {}


function timeout(msec) {
  return q.Promise(function(resolve) {
    setTimeout(function() {
      resolve(true);
    }, msec);
  })
}

describe('client', function() {

  var connection
    , cb
    , port = 5858
    , connectionStub
    , TIMEOUT
    , net = client.__get__('net');

  beforeEach(function setup() {
    connection = new Ev();

    connection.write = sinon.stub();

    sinon.stub(net, 'connect').returns(connection);
  });

  afterEach(function tearDown() {
    net.connect.restore();
    client.connection = null;
    client._connected = false;
  });

  it('should be able to connect to port', function() {
    client.connect(5858);
    net.connect.calledWith({ port: 5858 }).should.be.true;
  });

  it('should be able return the connection when connected', function() {
    var promise = client
      .connect(5858)
      .then(function(c) {
        c.should.equal(client)
      });

    connection.emit('connect');
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

    connection.emit('connect')

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
        connection.write.args[0][0].should.match(/command/);
        connection.write.args[0][0].should.match(/{}/);
      });

    connection.emit('connect');

    return promise;
  });

  it('should be able to try many times when no result', function() {

    client.__set__('TIMEOUT', 10);

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
        connection.write.callCount.should.greaterThan(1)
      });

    connection.emit('connect');
    return promise;
  });
});
