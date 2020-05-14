const Logger = require('@voliware/logger');
const TodoDatabase = require('./todoDatabase');

/**
 * Todo app
 */
class TodoApp {

    /**
     * Constructor
     * @param {object} [options={}]
     * @param {object} [options.database]
     * @param {string} [options.database.host="localhost"] - mongodb host
     * @param {number} [options.database.port=27017] - mongodb port
     * @param {string} [options.database.username=""] - mongodb username
     * @param {string} [options.database.password=""] - mongodb password
     * @param {string} [options.database.namespace=""] - mongodb namespace, requires username/password
     * @return {TodoApp}
     */
    constructor(options = {}){
        this.logger = new Logger(this.constructor.name, {level: "debug"});
        this.db = new TodoDatabase(options);
        return this;
    }
    /**
     * Append an id for a child todo 
     * to a todo's children array.
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
     * @param {Object} filter
     * @return {Promise}
     */
    getTodos(filter){
        return this.db.getTodos(filter);
    }

    /**
     * Get n todos based on a filter and sorted
     * based on child/parent relationship.
     * @param {Object} filter
     * @return {Promise}
     */
    getTodosNested(filter){
        return this.db.getTodosNested(filter);
    }

    /**
     * Add a todo to the collection.
     * @param {Todo} todo
     * @return {Promise}
     */
    insertTodo(todo){
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
     * Reparent a child todo
     * @param {Object} filter
     * @param {String} parentId 
     * @return {Promise}
     */
    reparentTodo(filter, parentId){
        return this.db.reparentTodo(filter, parentId);
    }

    /**
     * Set the todo's collapsed state (used for UI).
     * @param {Object} filter
     * @return {Promise}
     */
    setTodoCollapsedState(filter, state){
        return this.db.setTodoCollapsedState(filter, state);
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