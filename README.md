Debugger Connection
===================

This repo was called "v8-debug-protocol", but since I split all the functional to a very simple vertical structure. This repo will only keeps the connection functional.

Usage
===================

### Connect to port

```js
connection
  .connect(5858)
  .then(function(connection) {

  });
```


### Events

`break`

```js

connection.on('break', function(originalBreakpoint) {

})

```
