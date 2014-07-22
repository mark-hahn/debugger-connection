var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , net = require('net')
  , debug = require('debug')('client')
  , q = require('q')
  , Protocol = require('./protocol')
  , utils = require('./utils')
  , TIMEOUT = 1000

inherits(Client, EventEmitter)
function Client() {

  EventEmitter.call(this)

  var protocol = new Protocol()
    , seq = 1

  this._fnPool = {}

  getter(this, 'protocol', protocol)

  Object.defineProperty(this, 'seq', {
    get: function() {
      return seq++
    }
  });

  ['in', 'out', 'next'].forEach(function(action) {
    this.continue[action] = function(step, cb) {
      if (typeof step === 'function') {
        cb = step
        step = null
      }
      var seq = this.seq
      this._fnPool[seq] = cb
      this.connection.write(this.protocol.continue(seq, action, step))
    }.bind(this)
  }, this)
}

Client.create = function() {
  return new Client()
}

function getter(client, prop, value) {
  Object.defineProperty(client, prop, {
    get: function() {
      return value
    }
  })
}

function _doResponse(client, data) {
  var seq = data.request_seq
    , cb = client._fnPool[seq]
    , handlers = {
      version: function(cb, data) {
        cb.call(null, data.body.V8Version)
      },
      continue: function(cb, data) {
        cb.call(null, data.running)
      },
      default:function(cb, data) {
        cb.call(null, data)
      }
    }

  if (!data.success) {
    return cb.call(new Error(data.message))
  }

  (handlers[data.command] || handlers.default)(cb, data);
}

function _doEvent(client, data) {
  client.emit(data.event, data.body)
}

Client.prototype.connect = function(port) {
  var connection = net.connect({ port: port })
  var self = this;
  this.connection = connection
  getter(this, 'connection', connection)

  this.connection.on('connect', onconnect)
  this.connection.on('error', onerror)
  this.connection.on('data', ondata)

  return this;

  function ondata(data) {
    data = data.toString()
    data.split('\r\n\r\n').forEach(function(block) {
      try {
        block = JSON.parse(block)
        switch(block.type) {
          case 'response':
            _doResponse(self, block)
            break
          case 'event':
            _doEvent(self, block)
            break
        }
      }
      catch(e) {
        // do nothing, no requirement for the head part
      }
    })
  }

  function onconnect() {
    self._connected = true
    self.emit('connect')
  }

  function onerror(err) {
    self._connected = false
    self.emit('error', err)
  }
}

function callbackWrapper(fn, ctx) {
  var called = false;


  return {
    call: function() {
      var args = [].slice.call(arguments);
      called = true;
      return fn.apply(ctx || this, args);
    },
    isCalled: function() {
      return called;
    }
  };
}


Client.prototype.request = function(command, args, cb) {
  var seq = this.seq,
      self = this

  var serilizedData = this.protocol.serilize({
    seq: seq,
    type: 'request',
    command: command,
    arguments: args
  });

  setTimeout(function() {
    if (this._fnPool[seq].isCalled()) {
      return;
    }

    delete this._fnPool[seq]
    self.request(command, args, cb)
  }.bind(this), TIMEOUT)

  this._fnPool[seq] = callbackWrapper(cb, this)
  this.connection.write(serilizedData)
}

Client.prototype.disconnect = function() {
  var deferred = q.defer()
  this.request('disconnect', deferred.makeNodeResolver())
  return deferred.promise
}

Client.prototype.continue = function(cb) {
  var seq = this.seq
  this.connection.write(this.protocol.continue(seq))
  this._fnPool[seq] = cb
}

module.exports = Client
