var rewire = require('rewire'),
    sinon = require('sinon'),
    ScriptManager = rewire('../lib/script-manager')



describe('ScriptManager', function() {

  var manager,
      client

  beforeEach(function() {
    client = {}
    client.request = sinon.stub()
    manager = new ScriptManager(client)
  })

  describe('when try to get the script of a file', function() {
    it('should try to get the script file of the file name', function() {
      manager.readScript(123)
      client.request.called.should.be.true
    })

    it('should try to get the script file with script command', function() {
      manager.readScript(123)
      client.request.args[0][0].should.equal('scripts')
    })

    it('should try to get the script file with script options ', function() {
      manager.readScript(123)
      client.request.args[0][1].should.eql({
        type: 4,
        includeSource: true,
        ids: [123]
      })
    })
  })

})
