const NodeServer = require('@voliware/node-server')
const Path = require('path');
const TodoApp = require('./lib/todoApp');
const TodoAppRestInterface = require('./lib/todoAppRestInterface');

const app = new TodoApp();
const api = new TodoAppRestInterface(app);
app.initialize();
const httpServer = new NodeServer.HttpServer({
    name: "TodoServer",
    port: 80,
    publicPath: Path.join(__dirname, "public")
});

httpServer.addRoute("GET", "/todo/:id", function(request, response, data){
    api.getTodo(request, response, data);
});
httpServer.addRoute("DELETE", "/todo/:id", function(request, response, data){
    api.deleteTodo(request, response, data);
});
httpServer.addRoute("GET", "/todos", function(request, response, data){
    api.getTodos(request, response, data);
});
httpServer.addRoute("POST", "/todo/add", function(request, response, data){
    api.addTodo(request, response, data);
});
httpServer.addRoute("PUT", "/todo/update", function(request, response, data){
    api.updateTodo(request, response, data);
});
httpServer.start();