/**
 * Todo route
 */
class TodoRoute {

    /**
     * Add a todo
     * @param {Todo} todo
     * @return {Promise}
     */
    addTodo(todo){
        return request
            .post('/todo')
            .send(todo);
    }

    /**
     * Delete a todo
     * @param {string} _id - todo id
     * @return {Promise}
     */
    deleteTodo(_id){
        return request
            .delete('/todo')
            .send({_id});
    }

    /**
     * Get a todo
     * @param {string} _id - todo id
     * @return {Promise}
     */
    getTodo(_id){
        return request
            .get('/todo')
            .send({_id});
    }

    /**
     * Get all todos
     * @return {Promise}
     */
    getTodos(){
        return request
            .get('/todo')
            .send();
    }

    /**
     * Reparent a todo by reattaching a todo to a different parent
     * @param {string} todoId - todo _id to move to a new parent
     * @param {string} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    reparentTodo(todoId, parentId){
        return request
            .post('/todo/reparent')
            .send({todoId, parentId});
    }

    /**
     * Set the collapsed state
     * @param {string} _id - todo id
     * @param {boolean} state - true to collapse, false to uncollapse
     * @param {boolean} [recursive=false] - true to apply same to all children
     * @return {Promise}
     */
    setCollapsedState(_id, state, recursive = false){
        return request
            .post('/todo/collapsed')
            .send({_id, state, recursive});
    }

    /**
     * Update a todo
     * @param {Todo} todo
     * @return {Promise}
     */
    updateTodo(todo){
        return request
            .put('/todo')
            .send(todo);
    }
}

/**
 * User routes
 */
class UserRoute {

    /**
     * Get a user from an email
     * @param {string} email 
     * @return {Promise}
     */
    get(email){
        return request
            .get('/user')
            .send({email});
    }

    /**
     * Get all users
     * @return {Promise}
     */
    getAll(){
        return request
            .get('/user');
    }

    /**
     * Delete a user
     * @param {number} id 
     * @return {Promise}
     */
    delete(id){
        return request
            .delete('/user')
            .send({_id:id});
    }

    /**
     * Logout
     * @return {Promise}
     */
    logout(){
        return request
            .post('/user/logout');
    }

    /**
     * Login
     * @param {string} email 
     * @param {string} password 
     * @return {Promise}
     */
    login(email, password){
        return request
            .post('/user/login')
            .send({email, password});
    }

    /**
     * Login, relying on a sessionId in a cookie
     * @return {Promise}
     */
    loginWithTokenCookie(){
        return request
            .post('/user/login')
            .send();
    }

    /**
     * Register a new user
     * @param {string} email 
     * @param {string} password 
     * @return {Promise}
     */
    register(email, password){
        return request
            .post('/user/register')
            .send({email, password});
    }

    /**
     * Reset a user's password
     * @param {string} email 
     * @return {Promise}
     */
    reset(email){
        return request
            .post('/user/reset')
            .send({email});
    }
}

let Router = {
    todo: new TodoRoute(),
    user: new UserRoute()
};