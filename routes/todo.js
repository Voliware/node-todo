const express = require('express');
const useragent = require('useragent');
let router = express.Router();

module.exports = function(app) {

    async function getUserWithSessionData(req, res){
        if(typeof req.cookies.sessionId === "undefined"){
            res.sendStatus(401);
            return null;
        }
        
        let browser = useragent.parse(req.headers['user-agent']).family;
        return app.locals.userApp.getUserWithSessionData(req.cookies.sessionId, req.ip, browser)
            .catch(function(err){
                res.sendStatus(401);
                return null;
            });
    }

    return router;
};