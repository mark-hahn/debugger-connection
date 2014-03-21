
var sinon = require('sinon')
  , Ev = require('events').EventEmitter
  , Client = require('../lib/client')
  , noop = function() {}

describe('Client', function() {

  var connection
    , client
    , cb

  beforeEach(function() {
    connection = new Ev()
    connection.write = sinon.stub()
    client = new Client(connection)
    cb = sinon.stub()
  })

  describe('#version', function() {
    it('should send the request to debug server for version', function() {

      client.version(function() {})
      connection.write.calledWith(
        'Content-Length: ' +
        Buffer.byteLength('{"seq":1,"type":"request","command":"version"}', 'utf8') +
        '\r\n\r\n' +
        '{"seq":1,"type":"request","command":"version"}'
      ).should.be.true

    })

    it('should send the request to debug server for version twice', function() {

      client.version(function() {})
      client.version(function() {})

      connection.write.calledWith(
        'Content-Length: ' +
        Buffer.byteLength('{"seq":2,"type":"request","command":"version"}', 'utf8') +
        '\r\n\r\n' +
        '{"seq":2,"type":"request","command":"version"}'
      ).should.be.true

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

})
