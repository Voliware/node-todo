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

    /**
     * Delete a todo item
     */
    router.delete('/', function(req, res, next){
        getUserWithSessionData(req, res)
            .then(function(user){

                if(typeof req.body._id === "undefined"){
                    res.sendStatus(400);
                    return;
                }
        
                let filter = {
                    userId: user._id,
                    _id: req.body._id
                };
                app.locals.todoApp.deleteTodo(filter)
                    .then(function(result){
                        res.status(200);
                        res.json(result);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });


            })
            .catch(function(){

            });
    });
    
    /**
     * Get a todo item or
     * get all todo items if no id is passed
     */
    router.get('/', function(req, res, next){
        //app.locals.todoApp.wipeTodos();
        getUserWithSessionData(req, res)
            .then(function(user){

                let filter = {
                    userId: user._id
                };
        
                if(typeof req.body._id === "undefined"){
                    app.locals.todoApp.getTodos(filter)
                        .then(function(items){
                            res.status(200);
                            res.json(items);
                        })
                        .catch(function(err){
                            console.error(err);
                            res.sendStatus(400);
                        });
                    return;
                }
        
                filter._id = req.body.id;
                app.locals.todoApp.getTodo(filter)
                    .then(function(item){
                        res.status(200);
                        res.json(item);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });

            })
            .catch(function(){

            });
    });
    
    /**
     * Add a todo item
     */
    router.post('/', function(req, res, next){
        getUserWithSessionData(req, res)
            .then(function(user){

                if(typeof req.body === "undefined"){
                    res.sendStatus(400);
                    return;
                }
        
                req.body.userId = user._id;
                req.body.created = Date.now();
                app.locals.todoApp.insertTodo(req.body)
                    .then(function(item){
                        res.status(200);
                        res.json(item.result);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });

            })
            .catch(function(){

            });
    });

    /**
     * Reparent a todo item
     */
    router.post('/reparent', function(req, res, next){
        getUserWithSessionData(req, res)
            .then(function(user){

                if(typeof req.body === "undefined"){
                    res.sendStatus(400);
                    return;
                }
        
                let filter = {
                    userId: user._id,
                    _id: req.body.todoId
                };
                app.locals.todoApp.reparentTodo(filter, req.body.parentId)
                    .then(function(item){
                        res.sendStatus(200);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });

            })
            .catch(function(){

            });
    });

    /**
     * Set the collapsed stateof a todo item (for UI) 
     */
    router.post('/collapsed', function(req, res, next){
        getUserWithSessionData(req, res)
            .then(function(user){

                if(typeof req.body === "undefined"){
                    res.sendStatus(400);
                    return;
                }
        
                let filter = {
                    userId: user._id,
                    _id: req.body._id
                };
                app.locals.todoApp.setTodoCollapsedState(filter, req.body.state, req.body.recursive)
                    .then(function(item){
                        res.sendStatus(200);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });

            })
            .catch(function(){

            });
    });
    
    /**
     * Update a todo item
     */
    router.put('/', function(req, res, next){
        getUserWithSessionData(req, res)
            .then(function(user){

                req.body.userId = user._id;
                app.locals.todoApp.updateTodo({_id: req.body._id}, req.body)
                    .then(function(item){
                        res.status(200);
                        res.json(item);
                    })
                    .catch(function(err){
                        console.error(err);
                        res.sendStatus(400);
                    });

            })
            .catch(function(){

            });
    });

    return router;
};