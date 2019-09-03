const express = require('express');
const useragent = require('useragent');
let router = express.Router();

module.exports = function(app) {
        
    /**
     * Delete user(s)
     */
    router.delete('/', function (req, res, next) {
        // todo: add admin check
        app.locals.userApp.deleteAllUsers()
            .then(function(){
                res.sendStatus(200);
            })
            .catch(function(err){
                console.error(err);
                res.sendStatus(400);
            });
    });

    /**
     * Get user(s)
     */
    router.get('/', function (req, res, next) {
        app.locals.userApp.usersCollection("users").find().forEach(element => {
            console.log(element)
        });
    });

    /**
     * Login
     */
    router.post('/login', function(req, res, next){
        req.browser = useragent.parse(req.headers['user-agent']).family;

        let loginWithCredentials = async function(req){
            return app.locals.userApp.loginUser(req.body.email, req.body.password, req.ip, req.browser)
                .then(function(data){
                    res.cookie('sessionId', data.sessionId, {maxAge:new Date(2147483647000)});
                    res.status(200);
                    res.json(data.user);                 
                    return;
                })
                .catch(function(err){
                    res.status(401).send({err});
                    return;
                });
        }

        // try to get a user with a session id in a cookie
        if(req.cookies.sessionId){
            app.locals.userApp.getUserWithSessionData(req.cookies.sessionId, req.ip, req.browser)
                .then(function(userElement){
                    res.status(200);
                    res.json(userElement);
                    return;
                })
                .catch(function(err){
                    if(req.body.email && req.body.password){
                        loginWithCredentials(req);
                    }
                    else {
                        res.status(401).send({err});
                        return;
                    }
                });
        }
        else if(req.body.email && req.body.password){
            loginWithCredentials(req);
        }
        else {
            res.status(401).send("invalid credentials");
            return Promise.resolve();
        }
    });

    /**
     * Logout
     */
    router.post('/logout', function(req, res, next){
        if(req.cookies.sessionId){
            app.locals.userApp.logoutUser(req.cookies.sessionId);
            res.sendStatus(200);
        }
        res.status(401).send("invalid credentials");
    });

    /**
     * Register
     */
    router.post('/register', function(req, res, next){
        if(!req.body.email || !req.body.password){
            res.sendStatus(400);
            return;
        }
        
        //app.locals.userApp.userCollection.deleteAllUsers()
        app.locals.userApp.registerUser(req.body.email, req.body.password)
            .then(function(result){
                res.sendStatus(200);
            })
            .catch(function(err){
                res.status(400).send({err});
            });
    });

    /**
     * Reset password
     */
    router.post('/reset', function(req, res, next){
        if(!req.body.email){
            res.sendStatus(400);
        }

        app.locals.userApp.resetPassword(req.body.email)
            .then(function(result){
                res.sendStatus(200);
            })
            .catch(function(err){
                console.error(err);
                res.status(400).send({err});
            });
    });
    
    return router;
};