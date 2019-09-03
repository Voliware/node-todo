/**
 * Application
 */
class App {

    /**
     * Constructor
     * @return {App}
     */
    constructor(){
        let self = this;
        // elements
        this.wrapper = document.getElementById('app');
        this.loader = document.getElementById('loader');
        this.userElement = document.getElementById('user');
        // components
        this.user = new UserModule();
        this.login = new Login();
        this.todo = new Todo();
        // handlers
        this.login.on('login.success', function(data){
            self.todo.initialize();
            self.displayModule('app');
            self.user.setUserData(data);
            self.user.render(data);
        });
        this.login.on('login.required', function(){
            self.displayModule('login');
        });
        this.user.on('logout', function(){
            self.logout();
        });
        return this;
    }

    logout(){
        return Router.user.logout()
            .then(function(res){
                console.log(res);
            });
    }

    /**
     * Toggle the display of the module
     * @param {boolean} state
     * @return {App}
     */
    display(state){
        Template.display(this.wrapper, state);
        return this;
    }

    /**
     * Toggle the display of the page loader
     * @param {boolean} state 
     * @return {App}
     */
    displayLoader(state){
        Template.display(this.loader, state);
        return this;
    }

    /**
     * Toggle the display of the login module
     * @param {boolean} state
     * @return {App}
     */
    displayLogin(state){
        this.login.display(state);
        return this;
    }

    /**
     * Toggle the display of the modules
     * @param {string} module - module to show, hide the rest
     * @return {App}
     */
    displayModule(module){
        switch(module){
            case 'loader':
                this.display(false);
                this.displayLogin(false);
                this.displayLoader(true);
                return;
            case 'app':
                this.displayLoader(false);
                this.displayLogin(false);
                this.display(true);
                return;
            case 'login':
                this.displayLoader(false);
                this.display(false);
                this.displayLogin(true);
                return;
        }
    }

    /**
     * Initialize all components
     * @return {App}
     */
    initialize(){
        setTimeout(() => {
            this.login.initialize();
        }, 10)
        return this;
    }
}

let app = new App();
app.initialize();