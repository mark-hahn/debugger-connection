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


  ['in', 'out', 'next'].forEach(function(action) {
    this.continue[action] = function(step, cb) {
      if (typeof step === 'function') {
        cb = step
        step = null
      }
      var seq = this.seq
      this.protocol.continue(seq, action, step)
    }.bind(this)
  }, this)
}


function _doResponse(client, data) {
  var seq = data.request_seq
    , cb = client._fnPool[seq]
    , handlers = {
      version: function(cb, data) {
        cb(null, data.body.V8Version)
      },
      continue: function(cb, data) {
        cb(null, data.running)
      }
    }

  if (!data.success) {
    return cb(new Error(data.message))
  }
  handlers[data.command](cb, data);
}

Client.prototype.version = function(cb) {
  var seq = this.seq
  this.connection.write(this.protocol.version(seq))
  this._fnPool[seq] = cb
}

Client.prototype.continue = function(cb) {
  var seq = this.seq
  this.protocol.continue(seq)
  this._fnPool[seq] = cb
}

Client.prototype.source = function(frame, from, to, cb) {
  var seq = this.seq
  this.connection.write(this.protocol.source(seq, frame, from, to))
  this._fnPool[seq] = cb
}

module.exports = Client
