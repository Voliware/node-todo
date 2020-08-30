/**
 * REST interface for TodoApp.
 * Requires a valid ClientRequest, ServerResponse, 
 * and object of parsed request data for every API call.
 */
class TodoAppRestInterface {

    /**
     * Constructor
     * @param {TodoApp} app 
     * @param {NodeServer.HttpServer} http_server
     * @returns {TodoAppRestInterface}
     */
    constructor(app, http_server){
        this.app = app;
        this.http_server = http_server;
        this.attachHttpServerHandlers(this.http_server);
        return this;
    }
    /**
     * Attach route handlers to the http server.
     * @param {NodeServer.HttpServer} http_server 
     */
    attachHttpServerHandlers(http_server){
        http_server.addRoute("GET", "/todo", (request, response, data) => {
            this.getTodos(request, response, data);
        });
        http_server.addRoute("GET", "/todo/:_id", (request, response, data) => {
            this.getTodo(request, response, data);
        });
        http_server.addRoute("DELETE", "/todo/:_id", (request, response, data) => {
            this.deleteTodo(request, response, data);
        });
        http_server.addRoute("POST", "/todo", (request, response, data) => {
            this.addTodo(request, response, data);
        });
        http_server.addRoute("PUT", "/todo/:_id", (request, response, data) => {
            this.updateTodo(request, response, data);
        });
        http_server.addRoute("POST", "/todo/parent/:_id", (request, response, data) => {
            this.setTodoParent(request, response, data);
        });
        http_server.addRoute("POST", "/todo/collapsed/:_id", (request, response, data) => {
            this.setTodoCollapsedState(request, response, data);
        });
    }
    
    /**
     * Send an error response.
     * This ends the response.
     * @param {ServerResponse} response 
     * @param {String} error - string error
     * @param {number} [code=400]
     * @returns {ServerResponse}
     */
    sendError(response, error, code = 400){
        return this.http_server.sendJson(response, {error}, code);
    };

    /**
     * Send an error response indicating that
     * passed body data is invalid.
     * This ends the response.
     * @param {ServerResponse} response 
     * @returns {ServerResponse}
     */
    sendErrorInvalidBody(response){
        return this.sendError(response, "Invalid body");
    }

    /**
     * Send an error response indicating that
     * the user must be logged in.
     * This ends the response.
     * @param {ServerResponse} response 
     * @returns {ServerResponse}
     */
    sendErrorNotLoggedIn(response){
        return this.sendError(response, "Not logged in", 403);
    }

    /**
     * Sanitize incoming data meant to set a todo object.
     * This prevents any unwanted data from making its way
     * into the database. This returns a plain object and
     * not a Todo object.
     * @param {Object} data 
     * @return {Object}
     */
    sanitizeTodoData(data){
        let todo = {};
        if(typeof data.text === "string"){
            todo.text = data.text;
        }
        if(typeof data.status === "number"){
            todo.status = data.status;
        }
        if(typeof data.parentId === "string"){
            todo.parentId = data.parentId;
        }
        if(typeof data.collapsed === "number"){
            todo.collapsed = data.collapsed;
        }
        if(typeof data.backgroundColor === "string"){
            todo.backgroundColor = data.backgroundColor;
        }
        if(Array.isArray(data.children)){
            todo.children = data.children;
        }
        return todo;
    }

    /**
     * Sanitize incoming data meant to find a todo object in the db.
     * @param {Object} data 
     * @return {Object}
     */
    sanitizeFilter(data){
        let filter = {};
        if(typeof data._id === "string"){
            filter._id = data._id
        }
        return filter;
    }

    /**
     * Get the user matching the client making the request.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @returns {Promise<object>} user object or null if not found
     */
    async getClientUser(request, response){
        let client = this.http_server.getClient(request, response);
        return this.app.loginUserWithSessionId(client.sessionId, client.ip, client.browser);
    }

    /**
     * Add a todo. Can be blank.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} [data] 
     * @param {Object} [data.body]
     * @returns {ServerResponse}
     */
    async addTodo(request, response, data){
        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let result = await this.app.addTodo(data.body);
        if(result){
            return this.http_server.sendStatusCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to add todo");
        }
    }

    /**
     * Delete a todo.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data 
     * @param {Object} data.query 
     * @param {String} [data.params._id]
     * @returns {ServerResponse}
     */
    async deleteTodo(request, response, data){
        if(!data.params._id){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.sanitizeFilter(data.params);
        let result = await this.app.deleteTodo(filter);
        if(result){
            return this.http_server.sendStatusCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to delete todo");
        }
    }

    /**
     * Get a todo from the database.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data.params
     * @param {String} [data.params._id]
     * @returns {ServerResponse}
     */
    async getTodo(request, response, data){
        if(!data.params._id){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.sanitizeFilter(data.params);
        let todo = await this.app.getTodo(filter);
        if(todo){
            return this.http_server.sendJson(response, todo);
        }
        else{
            return this.sendError(response, "Failed to get todo");
        }
    }

    /**
     * Get a list of todos.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data 
     * @returns {ServerResponse}
     */
    async getTodos(request, response, data){
        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }
        
        // todo: deal with filter and options
        let filter = {};
        let options = {};
        let todos = await this.app.getTodos(filter, options);
        if(todos){
            return this.http_server.sendJson(response, todos);
        }
        else{
            return this.sendError(response, "Failed to get todos");
        }
    }

    /**
     * Update a todo.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data 
     * @param {Object} data.params - filter data
     * @param {String} data.params._id - filter id
     * @param {Object} data.body - update data
     * @returns {ServerResponse}
     */
    async updateTodo(request, response, data){
        if(!data.body){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.sanitizeFilter(data.params);
        let todo = this.sanitizeTodoData(data.body);
        let query = {$set: todo};
        let result = await this.app.updateTodo(filter, query);
        if(result){
            return this.http_server.sendStatusCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to update todo");
        }
    }

    /**
     * Set a todo's parent
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data 
     * @param {Object} data.params - filter data
     * @param {String} data.params._id - filter id
     * @param {Object} data.body - update data
     * @param {String} data.body.parentId
     * @returns {ServerResponse}
     */
    async setTodoParent(request, response, data){
        if(!data.body.parentId || !data.params._id){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.sanitizeFilter(data.params);
        let result = await this.app.setTodoParent(filter, data.body.parentId);
        if(result){
            return this.http_server.sendStatusCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to set todo parent");
        }
    }

    /**
     * Set a todo's collapsed state (used for UI).
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {Object} data 
     * @param {Object} data.params - filter data
     * @param {String} data.params._id - filter id
     * @param {Object} data.body - update data
     * @param {Boolean} data.body.collapsed
     * @param {Boolean} [data.body.recursive]
     * @returns {ServerResponse}
     */
    async setTodoCollapsedState(request, response, data){
        if(!data.params._id){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.sanitizeFilter(data.params);
        let result = await this.app.setTodoCollapsedState(filter, data.body.collapsed, data.body.recursive);
        if(result){
            return this.http_server.sendStatusCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to set todo parent");
        }
    }
}

module.exports = TodoAppRestInterface;