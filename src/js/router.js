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
     * @param {String} todo_id - todo id
     * @return {Promise}
     */
    static deleteTodo(todo_id){
        return fetch(`/todo/${todo_id}`, {
            method: "delete"
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Get a todo
     * @param {String} todo_id - todo id
     * @return {Promise}
     */
    static getTodo(todo_id){
        return fetch(`/todo/${todo_id}`)
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
     * @param {String} todo_id - todo _id to move to a new parent
     * @param {String} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    static reparentTodo(todo_id, parentId){
        let body = JSON.stringify({parentId});
        return fetch(`/todo/parent/${todo_id}`, {
            method: "post",
            body: body
        }).catch((err) => {
            console.error(err);
        });
    }

    /**
     * Set the collapsed state
     * @param {String} todo_id - todo id
     * @param {Bboolean} collapsed - true to collapse, false to uncollapse
     * @param {Boolean} [recursive=false] - true to apply same to all children
     * @return {Promise}
     */
    static setCollapsedState(todo_id, collapsed, recursive = false){
        let body = JSON.stringify({collapsed, recursive});
        return fetch(`/todo/collapsed/${todo_id}`, {
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