var proto,
    NORMAL_SCRIPTS = 4

function ScriptManager(client) {
  this._client = client
}

proto = ScriptManager.prototype

proto.readScript = function(id, opts, fn) {
  opts = opts || {}
  this._client.request('scripts', {
    type: opts.type || NORMAL_SCRIPTS,
    ids: [id],
    includeSource: true
  }, fn);
}


module.exports = ScriptManager
