const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const Logger = require('@voliware/logger')
const {UserApp} = require('./js/user');
const {TodoApp} = require('./js/todo');

const privateKey = fs.readFileSync('./ssl/privatekey.pem');
const certificate = fs.readFileSync('./ssl/certificate.pem');

const app = express();
app.locals.userApp = new UserApp();
app.locals.todoApp = new TodoApp();
https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(443);
app.logger = new Logger('App', {context: 'Express'});
app.logger.info('web server started on 443');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', require('./routes/index')(app));
app.use('/user', require('./routes/user')(app));
app.use('/todo', require('./routes/todo')(app));
app.use(express.static(path.join(__dirname, 'public')));
app.logger.info('application started');

module.exports = app;