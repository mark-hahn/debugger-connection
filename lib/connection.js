var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , net = require('net')
  , q = require('q')
  , Protocol = require('./protocol')
  , TIMEOUT = 1000
  , RETRY_TIMES = 10

/**
 *  @author kiddkai kiddkai@gmail.com
 *
 *  @class Connection
 *
 *  debugger connection connection for atom debugger
 */
inherits(Connection, EventEmitter)
function Connection(runner) {
  EventEmitter.call(this)

  var protocol = new Protocol()
    , seq = 1
    , self = this;

  this._fnPool = {}
  this.runner = runner;
  this.protocol = protocol;

  Object.defineProperty(this, 'seq', {
    get: function() {
      return seq++
    }
  });

  this.runner.on('change', function() {
    seq = 0;
    self.connect(self.runner.port);
  });

  this.runner.on('error', function() {
    self.socket = null;
    self._connected = false;
  });
}

function _doResponse(connection, data) {
  var seq = data.request_seq
    , cb = connection._fnPool[seq]
    , handler = function(cb, data) {
        return cb.call(null, data)
      }

  if (!data.success) {
    return cb.call(new Error(data.message))
  }

  return handler(cb, data);
}

function _doEvent(connection, data) {
  connection.emit(data.event, data.body)
}


var connection = Connection.prototype;


/**
 * Connect to the specific debugger in the `port`
 *
 * If the connection of port is already being established, then it
 * will just return the connection directly
 *
 * ### Examples:
 *
 *  ```js
 *    connection.connect(port).then(...)
 *  ```
 *
 * @param {Number} port to connect to debug server
 *
 * @return {Promise} promise object, call `then` callback when success
 */
connection.connect = function(port) {
  var socket
    , self = this
    , deferred;

  if (this._connected && this.port === port) {
    return q(this.socket);
  }

  socket = net.connect({ port: port })
  this.port = port;
  self.socket = socket;
  deferred = q.defer();

  self.socket.on('connect', onconnect);
  self.socket.on('error', onerror);
  self.socket.on('data', ondata);

  function onconnect() {
    self._connected = true;
    self.emit('change');
    self._fnPool = {};
    deferred.resolve(self);
  }

  function onerror(err) {
    self._connected = false
    self.socket = null;
    self.emit('error', err)
  }

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

  return deferred.promise;
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

/**
 * Send the request to debugger server
 *
 * Example:
 *
 *   ```js
 *     socket.request('breakpoint', {
 *       arg1: 1,
 *       arg2: 2
 *     }, function(err, originalResponse) {
 *       // do sth
 *     });
 *   ```
 *
 * @param {String} command
 * @param {Object} request data to server
 * @param {Function} callback with param (err, result)
 */
connection.request = function(command, args, cb, times) {
  var seq = this.seq,
      self = this

  times = times || 0

  if (times === 10) {
    return cb(new Error('No response'));
  }

  if (!this.socket) {
    return;
  }

  var serilizedData = this.protocol.serilize({
    seq: seq,
    type: 'request',
    command: command,
    arguments: args
  });

  setTimeout(function() {
    if (this._fnPool[seq] && this._fnPool[seq].isCalled()) {
      return;
    }

    delete this._fnPool[seq]
    self.request(command, args, cb, ++times)
  }.bind(this), TIMEOUT)

  this._fnPool[seq] = callbackWrapper(cb, this)
  this.socket.write(serilizedData)
}

/**
 * Disconnect the socket
 *
 * Example:
 *
 * ```js
 * connection
 * .disconnect().then(function() {
 * 	 // sth
 * })
 * ```
 *
 */
connection.disconnect = function() {
  var deferred = q.defer()
    , self = this;

  this.request('disconnect', {}, deferred.makeNodeResolver());

  deferred.promise.then(function() {
    self._connected = false;
  });

  return deferred.promise
}


module.exports = Connection;
