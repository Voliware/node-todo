const Collection = require('./collection');

/**
 * Todo collection
 * @extends {Collection}
 */
class TodoCollection extends Collection {

    /**
     * Constructor
     * @return {TodoCollection}
     */
    constructor(){
        super("todo");
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
        this.logger.debug("Appending todo children");
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        let params = {
            $addToSet: {
                children: childId
            }
        };
        return this.getTodo(filter)
            .then((element) => {
                if(element){
                    if(element.parent !== childId){
                        return this.collection.updateOne(filter, params)
                    }
                    else {
                        return Promise.reject("Cannot add child, child is parent");
                    }
                }
                else {
                    return Promise.reject("Todo not found");
                }
            })
            .then((res) => {
                this.logger.info('Added todo child');
                return res;
            })
            .catch((err) => {
                this.logger.error('Failed to add a todo child');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Delete a todo based on a filter.
     * Recursively delete all children.
     * Recursively remove all attachments to parents. :'(
     * @param {Object} filter
     * @return {Promise}
     */
    async deleteTodo(filter){
        this.logger.debug("Deleting todo");
        filter = this.processFilter(filter);
        //return this.collection.deleteMany({userId:filter.userId})
       // return this.collection.deleteOne(filter)
        return this.getTodo(filter)
            .then(async (element) => {
                if(element){
                    if(element.parent){
                        await this.removeTodoChild({_id: element.parent}, element._id);
                    }
                    let childrenLength = element.children ? element.children.length : 0;
                    if(childrenLength){
                        for(let i = 0; i < childrenLength; i++){
                            let childId = element.children[i];
                            await this.deleteTodo({_id: childId});
                        }
                    }
                    else {
                        return Promise.resolve();
                    }
                }
                else {
                    return Promise.reject('Todo does not exist');
                }
            })
            .then(() => {
                return this.collection.deleteOne(filter)
            })
            .then((res) => {
                this.logger.info('Deleted todo');
                return res;
            })
            .catch((err) => {
                this.logger.error('Failed to delete todo');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Get a todo based on a filter.
     * @param {Object} filter
     * @return {Promise}
     */
    getTodo(filter){
        this.logger.debug("Getting todo");
        filter = this.processFilter(filter);
        
        return this.collection.findOne(filter)
            .then((element) => {
                if(element){
                    this.logger.debug('Got todo');
                    this.logger.debug(element);
                }
                else {
                    this.logger.debug('Did not find todo');
                }
                return element;
            })
            .catch((err) => {
                this.logger.error('Failed to get todo');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Get n todos based on a filter.
     * @param {Object} filter
     * @return {Promise}
     */
    getTodos(filter){
        this.logger.debug("Getting todos");
        filter = this.processFilter(filter);
        
        return this.collection.find(filter).toArray()
            .then((elements) => {
                if(elements){
                    this.logger.debug('Got todos');
                    this.logger.debug(elements);
                }
                else {
                    this.logger.debug('Did not find todos');
                }
                return elements;
            })
            .catch((err) => {
                this.logger.error('Failed to get todos');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Add a todo to the collection.
     * @param {Todo} todo
     * @return {Promise}
     */
    insertTodo(todo){
        this.logger.debug("Inserting todo");
        
        return this.collection.insertOne(todo)
            .then((res) => {
                if(res.insertedCount){
                    this.logger.info('Inserted todo into db');
                    if(todo.parent){
                        return this.appendTodoChildren({_id: todo.parent}, res.insertedId)
                    }
                    else {
                        return res;
                    }
                }
                else {
                    return Promise.reject('Inserted count was 0');
                }
            })
            .catch((err) => {
                this.logger.error('Failed to add todo to db');
                this.logger.error(err);
                return Promise.reject(err)
            });
    }

    /**
     * Remove an id for a child todo 
     * from a todo's children array.
     * @param {Object} filter
     * @param {String} childId 
     * @return {Promise}
     */
    removeTodoChild(filter, childId){
        this.logger.debug("Removing todo child");
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        
        let params = {
            $pull: {
                children: childId
            }
        };
        this.logger.info('Remove todo child ' + childId);
        return this.collection.updateOne(filter, params)
            .then((res) => {
                if(res.modifiedCount){
                    this.logger.info('Removed todo child');
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .catch((err) => {
                this.logger.error('Failed to remove a todo child');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Reparent a todo
     * @param {Object} filter
     * @param {String} parentId 
     * @return {Promise}
     */
    reparentTodo(filter, parentId){
        this.logger.debug("Reparenting todo");
        if(filter._id === parentId){
            return Promise.reject("Cannot parent to this");
        }
        filter = this.processFilter(filter);

        
        let _element = null;
        return this.getTodo(filter)
            .then((element) => {
                if(element){
                    _element = element;
                    if(element.parent){
                        return this.removeTodoChild({_id: element.parent}, element._id);
                    }
                    else {
                        return Promise.resolve();
                    }
                }
                else {
                    return Promise.reject("Todo not found");
                }
            })
            .then(() => {
                return this.appendTodoChildren({_id: parentId},  _element._id);
            })
            .then(() => {
                return this.updateTodo({_id: _element._id}, {parent: parentId});
            })
            .catch((err) => {
                this.logger.error('Failed to reparent a child');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Set the todo's collapsed state (used for UI).
     * @param {Object} filter
     * @param {boolean} state
     * @param {boolean} [recursive=false]
     * @return {Promise}
     */
    setTodoCollapsedState(filter, state, recursive = false){
        filter = this.processFilter(filter);
        state = state ? 1 : 0;

        
        let params = {collapsed: state};
        return this.collection.updateOne(filter, {$set: params})
            .then((res) => {
                if(res.modifiedCount){
                    this.logger.info('Set todo to collapsed to ' + state);
                    if(recursive){
                        return this.findOne(filter);
                    }
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .then((element) => {
                if(element && element.children){
                    for(let i = 0; i < element.children.length; i++){
                        let id = element.children[i];
                        return this.setTodoCollapsedState({_id:id}, state, recursive);
                    }
                }
            })
            .catch((err) => {
                this.logger.error('Failed to set todo collapsed to ' + state);
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Update a todo in the collection.
     * @param {Object} filter
     * @param {Todo} params 
     * @return {Promise}
     */
    updateTodo(filter, params){
        delete params._id;
        filter = this.processFilter(filter);
        
        return this.collection.updateOne(filter, {$set:params})
            .then((res) => {
                if(res.modifiedCount){
                    this.logger.info('Updated todo in db');
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .catch((err) => {
                this.logger.error('Failed to update todo');
                this.logger.error(err);
                return Promise.reject(err);
            });
    }
}

module.exports = TodoCollection;