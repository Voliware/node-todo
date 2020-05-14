const Database = require('./database');

/**
 * Todo database
 * @extends {Database}
 */
class TodoDatabase extends Database {

    /**
     * Constructor
     * @param {object} [options={}]
     * @returns {TodoDatabase}
     */
    constructor(options = {}){
        options.name = "nodetodo"; 
        options.collections = ["todos"];
        super(options);
        return this;
    } 

    /**
     * Delete a todo from the collection.
     * @param {object} filter - query filter
     * @param {object} [options] - query options
     * @async
     * @returns {Promise<boolean>} true if deleted
     */
    async deleteTodo(filter, options){
        this.logger.debug('Deleting todo');
        this.logger.verbose(filter);
        this.logger.verbose(options);
        filter = this.processFilter(filter);
        let result = await this.collections.todos.deleteOne(filter);
        if(result.n){
            this.logger.info('Deleted todo');
            return true;
        }
        else {
            this.logger.error('Failed to delete todo');
            return false;
        }
    }

    /**
     * Find a todo from the collection
     * @param {object} filter - query filter
     * @param {object} [options] - query options
     * @async
     * @returns {Promise<object>} todo document
     */
    async getTodo(filter, options){
        this.logger.debug('Getting todo');
        this.logger.verbose(filter);
        this.logger.verbose(options);
        filter = this.processFilter(filter);
        let todo = await this.collections.todos.findOne(filter, options)
        if(todo){
            this.logger.debug('Got todo');
            this.logger.verbose(todo);
        }
        else {
            this.logger.debug('Failed to find todo');
        }
        return todo;
    }

    /**
     * Get todos
     * @param {object} [filter] 
     * @param {object} [options] 
     * @param {number} [options.limit=50] 
     * @async
     * @returns {Promise<Cursor>} mongodb cursor
     */
    async getTodos(filter={}, options={limit:50}){
        this.logger.debug('Getting todos');
        this.logger.verbose(filter);
        this.logger.verbose(options);
        filter = this.processFilter(filter);
        return this.collections.todos.find(filter, options);
    }

    /**
     * Insert a todo into the collection
     * @param {object} todo
     * @param {object} [options] 
     * @async
     * @returns {Promise<boolean>} true if inserted
     */
    async insertTodo(todo, options){
        this.logger.debug('Inserting todo');
        this.logger.verbose(todo);
        this.logger.verbose(options);
        let result = await this.collections.todos.insertOne(todo, options)
        if(result.insertedCount){
            this.logger.info('Inserted todo');
            return true;
        }
        else {
            this.logger.error('Failed to insert todo');
            return false;
        }
    }

    /**
     * Update a todo in the collection
     * @param {object} filter
     * @param {object} todo
     * @param {object} [options]
     * @async
     * @returns {Promise<boolean>} true if updated
     */
    async updateTodo(filter, todo, options){
        this.logger.debug('Updating todo');
        this.logger.verbose(filter);
        this.logger.verbose(todo);
        this.logger.verbose(options);
        filter = this.processFilter(filter);
        let result = await this.collections.todos.updateOne(filter, todo, options)
        if(result.modifiedCount){
            this.logger.info('Updated todo');
            return true;
        }
        else {
            this.logger.warning('Failed to update todo');
            return false;
        }
    }

    /**
     * Drop the todo collection
     * @returns {Promise}
     */
    dropTodos(){
        this.logger.debug('Dropping todos collection');
        return this.collections.todos.drop()
            .then(() => {
                this.logger.info('Dropped todo collection');
            })
            .catch((err) => {
                this.logger.error('Failed to drop todo collection');
                this.logger.error(err);
            });
    }

    /**
     * Wipe the todo collection
     * @returns {Promise}
     */
    wipeTodos(){
        this.logger.debug('Wiping todos collection');
        return this.collections.todos.deleteMany({})
            .then(() => {
                this.logger.info('Wiped todo collection');
            })
            .catch((err) => {
                this.logger.error('Failed to wipe todo collection');
                this.logger.error(err);
            });
    }
    

    /**
     * Append an id for a child todo 
     * to a todo's children array.
     * @param {Object} filter 
     * @param {String} childId 
     * @async
     * @return {Promise}
     */
    async appendTodoChildren(filter, childId){
        this.logger.debug("Appending todo children");
        this.logger.verbose(filter);
        this.logger.verbose(childId);
        filter = this.processFilter(filter);
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        let params = {
            $addToSet: {
                children: childId
            }
        };
        let todo = await this.getTodo(filter);
        if(!todo){
            this.logger.error("Failed to get todo");
            return false;
        }

        if(element.parent === childId){
            this.logger.error("Parent cannot equal child");
            return false;
        }

        await this.collections.todos.updateOne(filter, params);
        this.logger.info('Added todo child');

        return true;
    }
}

module.exports = TodoDatabase;