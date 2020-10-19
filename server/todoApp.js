const Logger = require('@voliware/logger');
const TodoDatabase = require('./todoDatabase');

/**
 * Todo app
 */
class TodoApp {

    /**
     * Constructor
     * @param {Object} [options={}]
     * @param {Object} [options.database]
     * @param {String} [options.database.host="localhost"] - mongodb host
     * @param {Number} [options.database.port=27017] - mongodb port
     * @param {String} [options.database.username=""] - mongodb username
     * @param {String} [options.database.password=""] - mongodb password
     * @param {String} [options.database.namespace=""] - mongodb namespace, requires username/password
     * @return {TodoApp}
     */
    constructor(options = {}){
        this.logger = new Logger(this.constructor.name, {level: "verbose"});
        this.db = new TodoDatabase(options);
        return this;
    }

    /**
     * Append an id for a child todo to a todo's children array.
     * @param {Object} filter 
     * @param {String} childId 
     * @return {Promise}
     */
    appendTodoChildren(filter, childId){
        return this.db.appendTodoChildren(filter, childId);
    }

    /**
     * Delete a todo based on a filter.
     * Recursively delete all children.
     * Recursively remove all attachments to parents. :'(
     * @param {Object} filter
     * @return {Promise}
     */
    async deleteTodo(filter){
        return this.db.deleteTodo(filter);
    }

    /**
     * Get a todo based on a filter.
     * @param {Object} filter
     * @return {Promise}
     */
    getTodo(filter){
        return this.db.getTodo(filter);
    }

    /**
     * Get n todos based on a filter.
     * @param {Object} [filter]
     * @param {Object} [options]
     * @param {Number} [options.limit=100]
     * @return {Promise}
     */
    async getTodos(filter={}, options={limit:100}){
        let cursor = await this.db.getTodos(filter, options);
        return new Promise((resolve, reject) => {
            cursor.toArray((error, result) => {
                if(error){
                    reject(error)
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Add a todo to the collection.
     * @param {Todo} todo
     * @return {Promise}
     */
    addTodo(todo){
        return this.db.insertTodo(todo);
    }

    /**
     * Remove an id for a child todo 
     * from a todo's children array.
     * @param {Object} filter
     * @param {String} childId 
     * @return {Promise}
     */
    removeTodoChild(filter, childId){
        return this.db.removeTodoChild(filter, childId);
    }

    /**
     * Set a todo's parent
     * @param {Object} filter
     * @param {String} parentId 
     * @return {Promise}
     */
    setTodoParent(filter, parentId){
        return this.db.setTodoParent(filter, parentId);
    }

    /**
     * Set the todo's collapsed state (used for UI).
     * @param {Object} filter
     * @param {Boolean} collapsed
     * @param {Boolean} [recursive=false]
     * @return {Promise}
     */
    setTodoCollapsedState(filter, collapsed, recursive = false){
        return this.db.setTodoCollapsedState(filter, collapsed, recursive = false);
    }

    /**
     * Update a todo in the collection.
     * @param {Object} filter
     * @param {Todo} params 
     * @return {Promise}
     */
    updateTodo(filter, params){
        return this.db.updateTodo(filter, params);
    }
    
    /**
     * Wipe the todo collection
     * @return {Promise}
     */
    wipeTodos(){
        return this.db.wipe();
    }

    /**
     * Initialize the app.
     * Initialize the db.
     * @returns {Promise}
     */
    initialize(){
        return this.db.initialize()
            .catch((error) => {
                this.logger.error(error.toString());
            });
    }
}

module.exports = TodoApp;