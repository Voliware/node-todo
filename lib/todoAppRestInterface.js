const Cookies = require('cookies');
const UserAgent = require('useragent');

/**
 * REST interface for TodoApp.
 * Requires a valid ClientRequest, ServerResponse, 
 * and object of parsed request data for every API call.
 */
class TodoAppRestInterface {

    /**
     * Constructor
     * @param {TodoApp} app 
     * @returns {TodoAppRestInterface}
     */
    constructor(app){
        this.app = app;
        return this;
    }

    /**
     * Stringify an object as the 
     * data response, set the content type to
     * application/json, and set the status code to 200.
     * If the JSON cannot be stringified, the 
     * status code will be set to 500.
     * This ends the response.
     * @param {ServerResponse} response 
     * @param {object} data - any object that can be stringified to JSON
     * @param {number} [code=200]
     * @returns {ServerResponse}
     */
    sendJson(response, data, code = 200){
        try {
            let json = JSON.stringify(data);
            response.statusCode = code;
            response.setHeader('Content-Type', 'application/json');
            response.write(json);
        }
        catch (e){
            console.error(e);
            response.statusCode = 500;
        }
        response.end();
        return response;
    };

    /**
     * Send a simple status code based response.
     * This ends the response.
     * @param {ServerResponse} response 
     * @param {number} code
     * @returns {ServerResponse}
     */
    sendCode(response, code){
        response.statusCode = code;
        response.end();
        return response;
    }

    /**
     * Send an error response.
     * This ends the response.
     * @param {ServerResponse} response 
     * @param {string} error - string error
     * @param {number} [code=400]
     * @returns {ServerResponse}
     */
    sendError(response, error, code = 400){
        return this.sendJson(response, {error}, code);
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
     * @param {number} [code=200]
     * @returns {ServerResponse}
     */
    sendErrorNotLoggedIn(response){
        return this.sendError(response, "Not logged in", 403);
    }
    
    /**
     * Get the client's IP from a request.
     * https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
     * @param {ClientRequest} request
     * @returns {string}
     */
    getClientIp(request){
        return (request.headers['x-forwarded-for'] || '').split(',').pop() || 
            request.connection.remoteAddress || 
            request.socket.remoteAddress || 
            request.connection.socket.remoteAddress;
    }

    /**
     * Get the client's browser from a request.
     * @param {ClientRequest} request 
     * @returns {string}
     */
    getClientBrowser(request){
        return UserAgent.lookup(request.headers['user-agent']).family;
    }

    /**
     * Generate a mongo query filter from
     * the data in a request body.
     * This will use an "or" operator
     * so that a query may match any value.
     * @param {object} data
     * @param {string} [data.username]
     * @param {string} [data.email]
     * @param {string} [data._id]
     * @returns {object} mongo filter
     */
    generateUserFilter(data){
        let options = [
            {email: data.email}, 
            {username: data.username},
            {_id: data._id}
        ];
        return {$or: options};
    }

    /**
     * Get information about a client making the request.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @returns {{ip: string, browser: string, sessionId: string}} object with ip, browser, sessionId
     */
    getClient(request, response){
        let ip = this.getClientIp(request);
        let browser = this.getClientBrowser(request);
        let cookies = new Cookies(request, response);
        let sessionId = cookies.get('sessionId');
        return {ip, browser, sessionId, cookies};
    }

    /**
     * Get the user matching the client making the request.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @returns {Promise<object>} user object or null if not found
     */
    async getClientUser(request, response){
        let client = this.getClient(request, response);
        return this.app.loginUserWithSessionId(client.sessionId, client.ip, client.browser);
    }

    /**
     * Add a todo.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {object} data 
     * @param {object} data.body
     * @param {object} data.body.todo
     * @returns {ServerResponse}
     */
    async addTodo(request, response, data){
        if(!data.body || !data.body.todo){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let result = await this.app.addTodo(clientUser, data.body.todo);
        if(result){
            return this.sendCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to add todo");
        }
    }

    /**
     * Delete a todo.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {object} data 
     * @param {object} data.query 
     * @param {string} [data.query._id]
     * @returns {ServerResponse}
     */
    async deleteTodo(request, response, data){
        if(!data.query){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.generateTodoFilter(data.query);
        let result = await this.app.deleteTodo(clientUser, filter);
        if(result){
            return this.sendCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to delete todo");
        }
    }

    /**
     * Get a todo from the database.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {object} data.query
     * @param {string} [data.query._id]
     * @returns {ServerResponse}
     */
    async getTodo(request, response, data){
        if(!data.query){
            return this.sendErrorInvalidBody(response);
        }

        // let clientUser = await this.getClientUser(request, response);
        // if(!clientUser){
        //     return this.sendErrorNotLoggedIn(response);
        // }

        let filter = this.generateTodoFilter(data.query);
        let todo = await this.app.getTodo(clientUser, filter);
        if(todo){
            return this.sendJson(response, todo);
        }
        else{
            return this.sendError(response, "Failed to get todo");
        }
    }

    /**
     * Get a list of todos.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {object} data 
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
        let todos = await this.app.getTodos(clientUser, filter, options);
        if(todos){
            return this.sendJson(response, todos);
        }
        else{
            return this.sendError(response, "Failed to get todos");
        }
    }

    /**
     * Update a todo.
     * @param {ClientRequest} request 
     * @param {ServerResponse} response 
     * @param {object} data 
     * @param {object} data.body
     * @param {string} [data.body._id]
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

        let filter = this.generateTodoFilter(request);
        let result = await this.app.updateTodo(filter, data);
        if(result){
            return this.sendCode(response, 200);
        }
        else{
            return this.sendError(response, "Failed to update todo");
        }
    }
}

module.exports = TodoAppRestInterface;