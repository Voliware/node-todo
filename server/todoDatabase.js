const Database = require('./database');

/**
 * Todo database
 * @extends {Database}
 */
class TodoDatabase extends Database {

    /**
     * Constructor
     * @param {Object} [options={}]
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
     * @param {Object} filter - query filter
     * @param {Object} [options] - query options
     * @async
     * @returns {Promise<boolean>} true if deleted
     */
    async deleteTodo(filter, options){
        this.logger.debug('Deleting todo');
        this.logger.verbose(filter);
        this.logger.verbose(options);
        filter = this.processFilter(filter);
        let todo = await this.getTodo(filter);
        if(!todo){
            return false;
        }

        if(typeof todo.parent_id === "string"){
            await this.removeTodoChild({_id: todo.parent_id}, todo._id);
        }

        if(Array.isArray(todo.children) && todo.children.length){
            for(let i = 0; i < todo.children.length; i++){
                await this.deleteTodo({_id: todo.children[i]});
            }
        }

        let result = await this.collections.todos.deleteOne(filter);
        if(result.deletedCount){
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
     * @param {Object} filter - query filter
     * @param {Object} [options] - query options
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
     * @param {Object} [filter] 
     * @param {Object} [options] 
     * @param {Number} [options.limit=50] 
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
     * @param {Object} todo
     * @param {Object} [options] 
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
            if(todo.parent_id){
                return this.appendTodoChild({_id: todo.parent_id}, result.insertedId);
            }
            return true;
        }
        else {
            this.logger.error('Failed to insert todo');
            return false;
        }
    }

    /**
     * Update a todo in the collection
     * @param {Object} filter
     * @param {Object} todo
     * @param {Object} [options]
     * @async
     * @returns {Promise<boolean>} true if updated
     */
    async updateTodo(filter, todo, options){
        delete todo._id;
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
     * Append an id for a child todo to a todo's children array.
     * @param {Object} filter 
     * @param {String} childId 
     * @async
     * @return {Promise}
     */
    async appendTodoChild(filter, childId){
        this.logger.debug("Appending todo child");
        this.logger.verbose(filter);
        this.logger.verbose(childId);
        filter = this.processFilter(filter);
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        let todo = await this.getTodo(filter);
        if(!todo){
            return false;
        }

        if(todo.parent_id === childId){
            this.logger.error("Parent cannot equal child");
            return false;
        }

        let params = {
            $addToSet: {
                children: childId
            }
        };
        return this.updateTodo(filter, params);
    }

    /**
     * Remove an id from an todo's children array
     * @param {Object} filter 
     * @param {String} childId 
     * @async
     * @return {Promise}
     */
    async removeTodoChild(filter, childId){
        this.logger.debug("Removing todo child");
        this.logger.verbose(filter);
        this.logger.verbose(childId);
        filter = this.processFilter(filter);

        let params = {
            $pull: {
                children: childId
            }
        };
        return this.updateTodo(filter, params);
    }

    /**
     * Set a todo's parent.
     * @param {Object} filter 
     * @param {String} parent_id 
     * @async
     * @return {Promise}
     */
    async setTodoParent(filter, parent_id){
        this.logger.debug("Setting todo parent");
        this.logger.verbose(filter);
        this.logger.verbose(parent_id);
        filter = this.processFilter(filter);

        let todo = await this.getTodo(filter);
        if(!todo){
            return false;
        }

        if(todo.parent_id){
            if(!await this.removeTodoChild({_id: todo.parent_id}, todo._id)){
                return false;
            }
        }

        if(!await this.appendTodoChild({_id: parent_id},  todo._id)){
            return false;
        }

        let query = {$set: {parent_id}};
        return this.updateTodo(filter, query);
    }


    /**
     * Set a todo's collapsed state.
     * @param {Object} filter 
     * @param {Boolean} collapsed
     * @param {Boolean} [recursive=false]
     * @async
     * @return {Promise}
     */
    async setTodoCollapsedState(filter, collapsed, recursive = false){
        this.logger.debug(`Setting todo collapsed state ${recursive ? "recrusively" : ""}`);
        this.logger.verbose(filter);
        filter = this.processFilter(filter);

        let query = {$set: {collapsed}};
        if(!await this.updateTodo(filter, query)){
            return false;
        }

        if(recursive){
            let todo = await this.getTodo(filter);
            if(!todo){
                return false;
            } 

            if(Array.isArray(todo.children)){
                for(let i = 0; i < todo.children.length; i++){
                    await this.setTodoCollapsedState({_id: todo.children[i]}, state);
                }
            }
        }

        return true;
    }
}

module.exports = TodoDatabase;