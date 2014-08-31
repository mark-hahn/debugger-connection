var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , net = require('net')
  , q = require('q')
  , Protocol = require('./protocol')
  , TIMEOUT = 500
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
  EventEmitter.call(this);

  var protocol = new Protocol()
    , seq = 1
    , self = this;

  this._fnPool = {};
  this._queue = [];
  this.runner = runner;
  this.protocol = protocol;

  this.seq = function() {
    return seq++;
  };

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
    , cb = connection._fnPool[seq].cb
    , handler = function(cb, data) {
        return cb(null, data);
      }

  connection._fnPool[seq].done = true;

  if (!data.success) {
    return cb(new Error(data.message))
  }

  request.seqHistory.forEach(function(seq) {
    delete connection._fnPool[seq];
  });

  delete connection._currentRequest;
  handler(cb, data);
  next(connection);
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

  self._connectTimes = self._connectTimes || 0;

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
    self._connectTimes = 0;
    self._connected = true;
    self.emit('change');
    self._fnPool = {};
    deferred.resolve(self);
  }

  function onerror(err) {
    self._connected = false;
    self.socket = null;
    self._connectTimes += 1;

    if (self._connectTimes === 10) {
      self.emit('error', err);
    }

    setTimeout(function() {
      self.connect(port);
    }, 500);
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
connection.request = function(command, args, cb) {
  _pushRequestToQueue(this, command, args, cb);
};

function next(connection) {

  if (!connection.socket) {
    throw new Error('Connection is not established');
  }

  if (!connection._queue.length) {
    return;
  }

  if (!connection._currentRequest) {
    connection._currentRequest = connection._queue.shift();
    request = connection._currentRequest;
    connection._fnPool[connection._currentRequest.seq] = connection._currentRequest;
    connection.socket.write(connection._currentRequest.data);

    function checkIsDone(request) {
      return function() {
        if (!request.done) {
          request.data = connection.protocol.serilize({
            seq: connection.seq(),
            type: 'request',
            command: request.command,
            arguments: request.arguments
          });

          request.seqHistory.push(request.seq);

          connection._currentRequest = request;
          connection.socket.write(connection._currentRequest.data);
          if (request.seqHistory.length === 10) {
            // cleanup
            delete connection._currentRequest;
            request.seqHistory.forEach(function(seq) {
              delete connection._fnPool[seq];
            });
            next(connection);
            return request.cb(new Error('Request timeout for request:' + request.command));
          }
        }
        setTimeout(checkIsDone(request), TIMEOUT);
      };
    }

    setTimeout(checkIsDone(connection._currentRequest), TIMEOUT);
  }
}

function _pushRequestToQueue(connection, command, args, cb) {
  var seq = connection.seq(),
      self = connection;

  if (!self.socket) {
    return;
  }

  var serilizedData = self.protocol.serilize({
    seq: seq,
    type: 'request',
    command: command,
    arguments: args
  });

  self._queue.push({
    connection: connection,
    command: command,
    args: args,
    callback: cb,
    data: serilizedData,
    seqHistory: [seq],
    done: false
  });

  next(self);
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
    self.socket = null;
    self._connected = false;
    self.emit('change');
  });

  return deferred.promise
}


module.exports = Connection;
