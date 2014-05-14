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

    it('should call the callback when request successful', function() {
      var cb = sinon.stub()
      manager.readScript(123, cb)
      client.request.args[0][2](null, {})
      cb.called.should.be.true
    })
  })

  describe('when remote debugger returns the result of response', function() {

    it('should parse it to normal Script Object', function() {
      var cbMock = sinon.stub();
      var response = { type: 'scripts', body: [{ source: 'console.log("hello world");\n' }] }
      client.request.callsArgWith(2, null, response)
      manager.readScript(123, cbMock)
      cbMock.args[0][1].should.eql(response.body[0].source)
    })

  })

})
