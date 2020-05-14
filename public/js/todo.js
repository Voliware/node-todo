/**
 * Todo module
 * @extends {EventSystem}
 */
class Todo extends EventSystem {

    /**
     * Constructor
     * @return {Todo}
     */
    constructor(){
        super();
        this.wrapper = document.getElementById('todo');
        this.todoList = document.getElementById('todoList');
        this.addTodoButton = document.getElementById('todoAddButton');
        this.todoManager = new TodoTemplateManager(this.todoList);
        this.todoManager.on('addChild', () => {
            console.log('hi')
            this.getTodos();
        });
        this.todoManager.on('delete', () => {
            this.getTodos();
        });
        this.todoManager.on('reparent', (data) => {
            this.reparentTodo(data.todoId, data.parentId);
        });
        this.todoManager.on('update', () => {
        });
        this.addTodoButton.addEventListener('click', () => {
            this.addTodo();
        });
        return this;
    }

    /**
     * Toggle the visibility of the module
     * @return {Todo}
     */
    display(state){
        Template.display(this.wrapper, state);
        return this;
    }

    /**
     * Add a new todo
     * @return {Promise}
     */
    addTodo(data){
        return Router.todo.addTodo(data)
            .then(() => {
                this.getTodos();
            })
            .catch((error) => {
                console.error(error);
            });
    }
    
    /**
     * Get all todos and render them
     * @return {Promise}
     */
    getTodos(){
        return Router.todo.getTodos()
            .then(function(data){
                this.todoManager.render(data.body);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Reparent a todo by reattaching a child to a different parent
     * @param {String} todoId - todo _id to move to a new parent
     * @param {String} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    reparentTodo(todoId, parentId){
        return Router.todo.reparentTodo(todoId, parentId)
            .then(() => {
                this.todoManager.empty();
                this.getTodos();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Initialize the module
     * @return {Promise}
     */
    initialize(){
        return this.getTodos();
    }
}