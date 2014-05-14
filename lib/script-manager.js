var proto,
    NORMAL_SCRIPTS = 4

function ScriptManager(client) {
  this._client = client
}

proto = ScriptManager.prototype

proto.readScript = function(id, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts
    opts = {}
  }

  opts = opts || {}

  this._client.request('scripts', {
    type: opts.type || NORMAL_SCRIPTS,
    ids: [id],
    includeSource: true
  }, {
    noTrainsform: true
  }, function(err, data) {
    fn(err, data.body && data.body[0].source)
  });

}


module.exports = ScriptManager
