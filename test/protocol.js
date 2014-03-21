
var Protocol = require('../lib/protocol')

describe('protocol', function() {

  var proto

  beforeEach(function() {
    proto = new Protocol()
  })

  it('should serilize the dummy object to a standard protocol request string', function() {
    var obj = {};

    proto.serilize(obj).should.equal(
      'Content-Length: ' +
      Buffer.byteLength('{}', 'utf8') +
      '\r\n\r\n' +
      '{}')

  })

  it('should serilize the simple proto object', function() {
    var obj = { seq: 1 }
    proto.serilize(obj).should.equal(
      'Content-Length: ' +
      Buffer.byteLength('{"seq":1}', 'utf8') +
      '\r\n\r\n' +
      '{"seq":1}'
    )
  })

  it('should generate a version request', function() {
    var seq = 1
      , obj = {
          "type"      : "request",
          "command"   : "version"
        }

    proto.version(seq).should.equal(
      'Content-Length: ' +
      Buffer.byteLength('{"seq":1,"type":"request","command":"version"}', 'utf8') +
      '\r\n\r\n' +
      '{"seq":1,"type":"request","command":"version"}'
    )
  })

  it('should generate a version request', function() {
    var seq = 2
      , obj = {
          "type"      : "request",
          "command"   : "version"
        }

    proto.version(seq).should.equal(
      'Content-Length: ' +
      Buffer.byteLength('{"seq":2,"type":"request","command":"version"}', 'utf8') +
      '\r\n\r\n' +
      '{"seq":2,"type":"request","command":"version"}'
    )
  })

})
