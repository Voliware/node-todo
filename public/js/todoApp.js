/**
 * Application
 */
class TodoApp {

    /**
     * Constructor
     */
    constructor(){
        this.wrapper = document.getElementById('app');
        this.loader = document.getElementById('loader');
        this.userAppElement = document.getElementById('todoUserApp');
        this.todoList = document.getElementById('todoList');
        this.addTodoButton = document.getElementById('todoAddButton');
        
        this.userApp = new UserApp();
        this.todoManager = new TodoTemplateManager(this.todoList);
        
        this.userApp.on('login.cookie.success', () => {
            this.getTodos();
            this.displayModule('app');
        });
        this.userApp.on('login.cookie.fail', () => {
            this.displayModule('login');
        });
        this.userApp.on('login.success', (data) => {
            this.getTodos();
            this.displayModule('app');
        });
        this.userApp.on('login.required', () => {
            this.displayModule('login');
        });
        this.userApp.on('logout', () => {
            this.displayModule('login');
        });

        this.todoManager.on('addChild', () => {
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
    }

    /**
     * Toggle the display of the app
     * @param {Boolean} state
     */
    display(state){
        Template.display(this.wrapper, state);
    }

    /**
     * Toggle the display of the page loader
     * @param {Boolean} state 
     */
    displayLoader(state){
        Template.display(this.loader, state);
    }

    /**
     * Toggle the display of the user module
     * @param {Boolean} state
     */
    displayUser(state){
        Template.display(this.userAppElement, state);
    }

    /**
     * Toggle the display of the modules
     * @param {String} module - module to show, hide the rest
     */
    displayModule(module){
        switch(module){
            case 'loader':
                this.display(false);
                this.displayUser(false);
                this.displayLoader(true);
                break;
            case 'app':
                this.displayLoader(false);
                this.displayUser(false);
                this.display(true);
                break;
            case 'login':
                this.displayLoader(false);
                this.display(false);
                this.displayUser(true);
                break;
        }
    }

    /**
     * Add a new todo
     * @return {Promise}
     */
    addTodo(){
        return Router.addTodo({})
            .then(() => {
                this.getTodos();
            });
    }
    
    /**
     * Get all todos and render them
     * @return {Promise}
     */
    getTodos(){
        return Router.getTodos()
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                this.todoManager.render(json);
            });
    }

    /**
     * Reparent a todo by reattaching a child to a different parent
     * @param {String} todoId - todo _id to move to a new parent
     * @param {String} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    reparentTodo(todoId, parentId){
        return Router.reparentTodo(todoId, parentId)
            .then(() => {
                this.todoManager.empty();
                this.getTodos();
            });
    }

    /**
     * Initialize all components
     */
    initialize(){
        this.userApp.initialize();
    }
}