var debug = require('debug')('client')
  , Protocol = require('./protocol')

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

  //
  ['in', 'out', 'next'].forEach(function(action) {
    this.continue[action] = function(step, cb) {
      var seq = this.seq
      this.protocol.continue(seq, action, step)
    }.bind(this)
  }, this)
}


function _doResponse(client, data) {
  var seq = data.request_seq
    , cb = client._fnPool[seq]

  if (!data.success) {
    return cb(new Error(data.message))
  }

  cb(null, data.body.V8Version)
}

Client.prototype.version = function(cb) {
  var seq = this.seq
  this.connection.write(this.protocol.version(seq))
  this._fnPool[seq] = cb;
}


Client.prototype.continue = function() {
  var seq = this.seq
  this.protocol.continue(seq)
}

Client.prototype.source = function(frame, from, to, cb) {
  var seq = this.seq
  this.connection.write(this.protocol.source(seq, frame, from, to))
  this._fnPool[seq] = cb;
}

module.exports = Client
