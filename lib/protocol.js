
function Protocol() {

}

Protocol.prototype.serilize = function(obj) {
  var json = JSON.stringify(obj)

  return 'Content-Length: ' + Buffer.byteLength(json, 'utf8') +
         '\r\n\r\n' +
         json
}

Protocol.prototype.version = function(seq) {
  var json = { seq: seq, type: 'request', command: 'version' }
  return this.serilize(json)
}

module.exports = Protocol
