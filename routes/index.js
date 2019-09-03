const path = require('path');
const express = require('express');
const router = express.Router();
const {User, UserManager} = require('../js/user');

module.exports = function(app) {
    router.get('/', function (req, res, next) {
        res.sendFile(path.join(__dirname + './../public/index.html'));
    });

    return router;
};