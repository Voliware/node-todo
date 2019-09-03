const Logger = require('@voliware/logger');
const {Database, DatabaseCollection} = require('./database');
const mongo = require('mongodb');
const mailer = require('./mailer');

/**
 * Todo object
 */
class Todo {

    /**
     * Constructor
     * @return {Todo}
     */
    constructor(){
        this.created = 0;
        this.name = "";
        this.text = "";
        this._id = ""; 
        this.parent = null;
        this.children = [];
        this.userId = null;
        return this;
    }

    /**
     * Set todo properties from an object of data.
     * @param {object} data 
     * @return {Todo}
     */
    setFromData(data){
        for(let k in data){
            if(this.hasOwnProperty(k)){
                this[k] = data[k];
            }
        }
        return this;
    }
}

/**
 * Todo collection
 * @extends {DatabaseCollection}
 */
class TodoCollection extends DatabaseCollection {

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
     * @param {object} filter 
     * @param {string} childId 
     * @return {Promise}
     */
    appendTodoChildren(filter, childId){
        this.logger.debug("Appending todo children");
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        let self = this;
        let params = {
            $addToSet: {
                children: childId
            }
        };
        return this.getTodo(filter)
            .then(function(element){
                if(element){
                    if(element.parent !== childId){
                        return self.collection.updateOne(filter, params)
                    }
                    else {
                        return Promise.reject("Cannot add child, child is parent");
                    }
                }
                else {
                    return Promise.reject("Todo not found");
                }
            })
            .then(function(res) {
                self.logger.info('Added todo child');
                return res;
            })
            .catch(function(err){
                self.logger.error('Failed to add a todo child');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Delete a todo based on a filter.
     * Recursively delete all children.
     * Recursively remove all attachments to parents. :'(
     * @param {object} filter
     * @return {Promise}
     */
    async deleteTodo(filter){
        this.logger.debug("Deleting todo");
        filter = this.processFilter(filter);
        let self = this;
        //return self.collection.deleteMany({userId:filter.userId})
       // return self.collection.deleteOne(filter)
        return this.getTodo(filter)
            .then(async function(element){
                if(element){
                    if(element.parent){
                        await self.removeTodoChild({_id: element.parent}, element._id);
                    }
                    let childrenLength = element.children ? element.children.length : 0;
                    if(childrenLength){
                        for(let i = 0; i < childrenLength; i++){
                            let childId = element.children[i];
                            await self.deleteTodo({_id: childId});
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
            .then(function(){
                return self.collection.deleteOne(filter)
            })
            .then(function(res){
                self.logger.info('Deleted todo');
                return res;
            })
            .catch(function(err){
                self.logger.error('Failed to delete todo');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Get a todo based on a filter.
     * @param {object} filter
     * @return {Promise}
     */
    getTodo(filter){
        this.logger.debug("Getting todo");
        filter = this.processFilter(filter);
        let self = this;
        return this.collection.findOne(filter)
            .then(function(element) {
                if(element){
                    self.logger.debug('Got todo');
                    self.logger.debug(element);
                }
                else {
                    self.logger.debug('Did not find todo');
                }
                return element;
            })
            .catch(function(err){
                self.logger.error('Failed to get todo');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Get n todos based on a filter.
     * @param {object} filter
     * @return {Promise}
     */
    getTodos(filter){
        this.logger.debug("Getting todos");
        filter = this.processFilter(filter);
        let self = this;
        return this.collection.find(filter).toArray()
            .then(function(elements) {
                if(elements){
                    self.logger.debug('Got todos');
                    self.logger.debug(elements);
                }
                else {
                    self.logger.debug('Did not find todos');
                }
                return elements;
            })
            .catch(function(err){
                self.logger.error('Failed to get todos');
                self.logger.error(err);
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
        let self = this;
        return this.collection.insertOne(todo)
            .then(function(res) {
                if(res.insertedCount){
                    self.logger.info('Inserted todo into db');
                    if(todo.parent){
                        return self.appendTodoChildren({_id: todo.parent}, res.insertedId)
                    }
                    else {
                        return res;
                    }
                }
                else {
                    return Promise.reject('Inserted count was 0');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to add todo to db');
                self.logger.error(err);
                return Promise.reject(err)
            });
    }

    /**
     * Remove an id for a child todo 
     * from a todo's children array.
     * @param {object} filter
     * @param {string} childId 
     * @return {Promise}
     */
    removeTodoChild(filter, childId){
        this.logger.debug("Removing todo child");
        if(filter._id === childId){
            return Promise.reject("Parent cannot equal child");
        }
        filter = this.processFilter(filter);

        let self = this;
        let params = {
            $pull: {
                children: childId
            }
        };
        this.logger.info('Remove todo child ' + childId);
        return this.collection.updateOne(filter, params)
            .then(function(res) {
                if(res.modifiedCount){
                    self.logger.info('Removed todo child');
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to remove a todo child');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Reparent a todo
     * @param {object} filter
     * @param {string} parentId 
     * @return {Promise}
     */
    reparentTodo(filter, parentId){
        this.logger.debug("Reparenting todo");
        if(filter._id === parentId){
            return Promise.reject("Cannot parent to self");
        }
        filter = this.processFilter(filter);

        let self = this;
        let _element = null;
        return this.getTodo(filter)
            .then(function(element){
                if(element){
                    _element = element;
                    if(element.parent){
                        return self.removeTodoChild({_id: element.parent}, element._id);
                    }
                    else {
                        return Promise.resolve();
                    }
                }
                else {
                    return Promise.reject("Todo not found");
                }
            })
            .then(function(){
                return self.appendTodoChildren({_id: parentId},  _element._id);
            })
            .then(function(){
                return self.updateTodo({_id: _element._id}, {parent: parentId});
            })
            .catch(function(err){
                self.logger.error('Failed to reparent a child');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Set the todo's collapsed state (used for UI).
     * @param {object} filter
     * @param {boolean} state
     * @param {boolean} [recursive=false]
     * @return {Promise}
     */
    setTodoCollapsedState(filter, state, recursive = false){
        filter = this.processFilter(filter);
        state = state ? 1 : 0;

        let self = this;
        let params = {collapsed: state};
        return this.collection.updateOne(filter, {$set: params})
            .then(function(res) {
                if(res.modifiedCount){
                    self.logger.info('Set todo to collapsed to ' + state);
                    if(recursive){
                        return self.findOne(filter);
                    }
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .then(function(element){
                if(element && element.children){
                    for(let i = 0; i < element.children.length; i++){
                        let id = element.children[i];
                        return self.setTodoCollapsedState({_id:id}, state, recursive);
                    }
                }
            })
            .catch(function(err){
                self.logger.error('Failed to set todo collapsed to ' + state);
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Update a todo in the collection.
     * @param {object} filter
     * @param {Todo} params 
     * @return {Promise}
     */
    updateTodo(filter, params){
        delete params._id;
        filter = this.processFilter(filter);
        let self = this;
        return this.collection.updateOne(filter, {$set:params})
            .then(function(res) {
                if(res.modifiedCount){
                    self.logger.info('Updated todo in db');
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to update todo');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }
}

/**
 * Todo manager
 */
class TodoApp {

    /**
     * Constructor
     * @return {TodoApp}
     */
    constructor(){
        this.todoCollection = new TodoCollection();
        this.logHandle = "Todo";
        this.logger = new Logger(this.logHandle, this);
        return this;
    }
    /**
     * Append an id for a child todo 
     * to a todo's children array.
     * @param {object} filter 
     * @param {string} childId 
     * @return {Promise}
     */
    appendTodoChildren(filter, childId){
        return this.todoCollection.appendTodoChildren(filter, childId);
    }

    /**
     * Delete a todo based on a filter.
     * Recursively delete all children.
     * Recursively remove all attachments to parents. :'(
     * @param {object} filter
     * @return {Promise}
     */
    async deleteTodo(filter){
        return this.todoCollection.deleteTodo(filter);
    }

    /**
     * Get a todo based on a filter.
     * @param {object} filter
     * @return {Promise}
     */
    getTodo(filter){
        return this.todoCollection.getTodo(filter);
    }

    /**
     * Get n todos based on a filter.
     * @param {object} filter
     * @return {Promise}
     */
    getTodos(filter){
        return this.todoCollection.getTodos(filter);
    }

    /**
     * Get n todos based on a filter and sorted
     * based on child/parent relationship.
     * @param {object} filter
     * @return {Promise}
     */
    getTodosNested(filter){
        return this.todoCollection.getTodosNested(filter);
    }

    /**
     * Add a todo to the collection.
     * @param {Todo} todo
     * @return {Promise}
     */
    insertTodo(todo){
        return this.todoCollection.insertTodo(todo);
    }

    /**
     * Remove an id for a child todo 
     * from a todo's children array.
     * @param {object} filter
     * @param {string} childId 
     * @return {Promise}
     */
    removeTodoChild(filter, childId){
        return this.todoCollection.removeTodoChild(filter, childId);
    }

    /**
     * Reparent a child todo
     * @param {object} filter
     * @param {string} parentId 
     * @return {Promise}
     */
    reparentTodo(filter, parentId){
        return this.todoCollection.reparentTodo(filter, parentId);
    }

    /**
     * Set the todo's collapsed state (used for UI).
     * @param {object} filter
     * @return {Promise}
     */
    setTodoCollapsedState(filter, state){
        return this.todoCollection.setTodoCollapsedState(filter, state);
    }

    /**
     * Update a todo in the collection.
     * @param {object} filter
     * @param {Todo} params 
     * @return {Promise}
     */
    updateTodo(filter, params){
        return this.todoCollection.updateTodo(filter, params);
    }
    
    /**
     * Wipe the todo collection
     * @return {Promise}
     */
    wipeTodos(){
        return this.todoCollection.wipe();
    }
}

module.exports = {Todo, TodoApp};