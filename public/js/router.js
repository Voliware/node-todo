/**
 * Todo router
 */
class Router {

    /**
     * Add a todo
     * @param {Todo} todo
     * @return {Promise}
     */
    static addTodo(todo){
        let body = JSON.stringify(todo);
        return fetch("/todo", {
            method: "post",
            body: body
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Delete a todo
     * @param {String} todoId - todo id
     * @return {Promise}
     */
    static deleteTodo(todoId){
        return fetch(`/todo/${todoId}`, {
            method: "delete"
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Get a todo
     * @param {String} todoId - todo id
     * @return {Promise}
     */
    static getTodo(todoId){
        return fetch(`/todo/${todoId}`)
            .catch((err) => {
                console.error(err);
            });
    }

    /**
     * Get all todos
     * @return {Promise}
     */
    static getTodos(){
        return fetch('/todo')
            .catch((err) => {
                console.error(err);
            });
    }

    /**
     * Reparent a todo by reattaching a todo to a different parent
     * @param {String} todoId - todo _id to move to a new parent
     * @param {String} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    static reparentTodo(todoId, parentId){
        let body = JSON.stringify({parentId});
        return fetch(`/todo/parent/${todoId}`, {
            method: "post",
            body: body
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Set the collapsed state
     * @param {String} todoId - todo id
     * @param {Bboolean} collapsed - true to collapse, false to uncollapse
     * @param {Boolean} [recursive=false] - true to apply same to all children
     * @return {Promise}
     */
    static setCollapsedState(todoId, collapsed, recursive = false){
        let body = JSON.stringify({collapsed, recursive});
        return fetch(`/todo/collapsed/${todoId}`, {
            method: "post",
            body: body
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Update a todo
     * @param {Todo} todo
     * @param {String} todo._id
     * @return {Promise}
     */
    static updateTodo(todo){
        let body = JSON.stringify(todo);
        return fetch(`/todo/${todo._id}`, {
            method: "put",
            body: body
        }).catch((err) => {
            console.error(err);
        });
    }
}