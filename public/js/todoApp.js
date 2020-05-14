/**
 * Application
 */
class TodoApp {

    /**
     * Constructor
     * @return {TodoApp}
     */
    constructor(){
        // elements
        this.wrapper = document.getElementById('app');
        this.loader = document.getElementById('loader');
        this.userAppElement = document.getElementById('todoUserApp');
        // components
        this.userApp = new UserApp();
        this.todo = new Todo();
        // handlers
        this.userApp.on('login.success', (data) => {
            this.todo.initialize();
            this.displayModule('app');
            this.user.setUserData(data);
            this.user.render(data);
        });
        this.userApp.on('login.required', () => {
            this.displayModule('login');
        });
        this.userApp.on('logout', () => {
            this.logout();
        });
        return this;
    }

    /**
     * Toggle the display of the module
     * @param {boolean} state
     * @return {TodoApp}
     */
    display(state){
        Template.display(this.wrapper, state);
        return this;
    }

    /**
     * Toggle the display of the page loader
     * @param {boolean} state 
     * @return {TodoApp}
     */
    displayLoader(state){
        Template.display(this.loader, state);
        return this;
    }

    /**
     * Toggle the display of the user module
     * @param {boolean} state
     * @return {TodoApp}
     */
    displayUser(state){
        this.userApp.display(state);
        return this;
    }

    /**
     * Toggle the display of the modules
     * @param {String} module - module to show, hide the rest
     * @return {TodoApp}
     */
    displayModule(module){
        switch(module){
            case 'loader':
                this.display(false);
                this.displayUser(false);
                this.displayLoader(true);
                return;
            case 'app':
                this.displayLoader(false);
                this.displayUser(false);
                this.display(true);
                return;
            case 'login':
                this.displayLoader(false);
                this.display(false);
                this.displayUser(true);
                return;
        }
    }

    /**
     * Initialize all components
     * @return {TodoApp}
     */
    initialize(){
        // setTimeout(() => {
        //     this.login.initialize();
        // }, 10)
        return this;
    }
}