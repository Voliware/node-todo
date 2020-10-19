/**
 * Application
 */
class TodoApp {

    /**
     * Constructor
     */
    constructor(){

        /**
         * Main HTML element.
         * @type {HTMLElement}
         */
        this.wrapper = document.getElementById('app');

        /**
         * Loading display element.
         * @type {HTMLElement}
         */
        this.loader = document.getElementById('loader');
        
        /**
         * User application element.
         * @type {HTMLElement}
         */
        this.user_app_element = document.getElementById('todo-user-app');
        
        /**
         * Todo list element.
         * @type {HTMLElement}
         */
        this.todo_list = document.getElementById('todo-list');
        
        /**
         * Add todo button.
         * @type {HTMLElement}
         */
        this.add_todo_button = document.getElementById('todo-add-button');
        
        /**
         * User app.
         * @type {UserApp}
         */
        this.user_app = new UserApp();
        
        /**
         * Todo element manager
         * @type {ElementManager}
         */
        this.todo_manager = new TodoManager(this.todo_list);
        
        this.user_app.on('login.cookie.success', () => {
            this.getTodos();
            this.displayModule('app');
        });
        this.user_app.on('login.cookie.fail', () => {
            this.displayModule('login');
        });
        this.user_app.on('login.success', (data) => {
            this.getTodos();
            this.displayModule('app');
        });
        this.user_app.on('login.required', () => {
            this.displayModule('login');
        });
        this.user_app.on('logout', () => {
            this.displayModule('login');
        });

        this.todo_manager.on('addChild', () => {
            this.getTodos();
        });
        this.todo_manager.on('delete', () => {
            this.getTodos();
        });
        this.todo_manager.on('reparent', (data) => {
            this.reparentTodo(data.todoId, data.parentId);
        });
        this.todo_manager.on('update', () => {
        });
        this.add_todo_button.addEventListener('click', () => {
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
        Template.display(this.user_app_element, state);
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
                this.todo_manager.render(json);
            });
    }

    /**
     * Reparent a todo by reattaching a child to a different parent
     * @param {String} todo_id - Todo id to move to a new parent
     * @param {String} parent_id - Parent todo id to move the todo to
     * @return {Promise}
     */
    reparentTodo(todo_id, parent_id){
        return Router.reparentTodo(todo_id, parent_id)
            .then(() => {
                this.todo_manager.empty();
                this.getTodos();
            });
    }

    /**
     * Initialize all components
     */
    initialize(){
        this.user_app.initialize();
    }
}