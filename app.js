// const fs = require('fs');
// const https = require('https');
// const express = require('express');
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const Logger = require('@voliware/logger')
// const {UserApp} = require('./js/user');
// const {TodoApp} = require('./js/todo');

// const privateKey = fs.readFileSync('./ssl/privatekey.pem');
// const certificate = fs.readFileSync('./ssl/certificate.pem');

// const app = express();
// app.locals.userApp = new UserApp();
// app.locals.todoApp = new TodoApp();
// https.createServer({
//     key: privateKey,
//     cert: certificate
// }, app).listen(443);
// app.logger = new Logger('App', {context: 'Express'});
// app.logger.info('web server started on 443');
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use('/', require('./routes/index')(app));
// app.use('/user', require('./routes/user')(app));
// app.use('/todo', require('./routes/todo')(app));
// app.use(express.static(path.join(__dirname, 'public')));
// app.logger.info('application started');

// module.exports = app;

const Path = require('path');
const NodeServer = require('@voliware/node-server');

class App {
    constructor(){
        this.httpServer = new NodeServer.HttpServer({
            publicPath: Path.join(__dirname, 'public')
        });
        this.httpServer.addRoute('GET', '/todo', function(request, response){

        });
        this.httpServer.start();
        
        return this;
    }

    async getUserWithSessionData(request, response){
        if(typeof request.cookies.sessionId === "undefined"){
            response.sendStatus(401);
            return null;
        }
        
        let browser = useragent.parse(request.headers['user-agent']).family;
        return app.locals.userApp.getUserWithSessionData(request.cookies.sessionId, request.ip, browser)
            .catch(function(err){
                response.sendStatus(401);
                return null;
            });
    }
}

let app = new App();