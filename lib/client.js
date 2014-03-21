var Protocol = require('./protocol')

function Client(connection) {
  var protocol = new Protocol()
    , seq = 1
    , self = this

  this._fnPool = {}

  Object.defineProperty(this, 'connection', {
    get: function() {
      return connection
    }
  })

  Object.defineProperty(this, 'protocol', {
    get: function() {
      return protocol
    }
  })

  Object.defineProperty(this, 'seq', {
    get: function() {
      return seq++
    }
  })

  this.connection.on('data', ondata)

  function ondata(data) {
    data = data.toString()
    data.split('\r\n\r\n').forEach(function(block) {
      try {
        block = JSON.parse(block)
        _doResponse(self, block)
      }
      catch(e) {
        // do nothing, no requirement for the head part
      }
    })
  }
}


function _doResponse(client, data) {
  var seq = data.request_seq
    , cb = client._fnPool[seq]

  cb(null, data.body.V8Version)
}

Client.prototype.version = function(cb) {
  var seq = this.seq
  this.connection.write(this.protocol.version(seq))
  this._fnPool[seq] = cb;
}

module.exports = Client
