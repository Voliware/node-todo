const Path = require('path');
const NodeServer = require('@voliware/node-server')
const NodeUser = require('@voliware/node-user');
const TodoApp = require('./lib/todoApp');
const TodoAppRestInterface = require('./lib/todoAppRestInterface');

const app = new TodoApp();
const http_server = new NodeServer.HttpServer({
    name: "TodoServer",
    port: 80,
    public_path: Path.join(__dirname, "public")
});
const api = new TodoAppRestInterface(app, http_server);
const user_app = new NodeUser.UserApp();
const user_rest_api = new NodeUser.UserAppRestInterface(user_app, http_server);
user_app.initialize();
app.initialize();
http_server.start();