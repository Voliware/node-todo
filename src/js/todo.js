/**
 * Todo element
 * @extends {Template}
 */
class Todo extends Template {

    /**
     * Constructor
     */
    constructor() {
        super({
            colours: [
                'purple', 'pink', 'blue', 'green',  'yellow', 
                'orange', 'brown', 'red',  'black', 'grey', 'white'
            ],
            elements: {
                body: '.todo-body',
                form: '.todo-form',
                text_input: '[name="text"]',
                status_button: '[name="status"]',
                add_button: '[name="add"]',
                move_button: '[name="move"]',
                colour_button: '[name="colour"]',
                delete_button: '[name="delete"]',
                collapse_button: '[name="collapse"]',
                collapse_icon: '[name="collapse"] i',
                children: '.todo-children',
                colour_picker: '.todo-colour-picker'
            }
        });
        
        /**
         * Database id
         * @type {String}
         */
        this._id = "";

        /**
         * Text content
         * @type {String}
         */
        this.text = "";
        
        /**
         * Parent datababase id
         * @type {String}
         */
        this.parent_id = "";
        
        /**
         * Completed status
         * @type {Boolean}
         */
        this.status = false;
        
        /**
         * Background colour
         * @type {String}
         */
        this.background_colour = "white";
        
        /**
         * Collapsed status
         * @type {Boolean}
         */
        this.collapsed = false;
        
        /**
         * Created time
         * @type {Number}
         */
        this.created = 0;
        
        /**
         * Colour picker
         * @type {Piklor}
         */
        this.colour_picker = null;
    }

    /**
     * Create the HTML
     * @returns {String}
     */
    createHtml(){
        return /*html*/`
            <div class="todo" draggable="true">
                <table class="todo-body">
                    <tbody>
                        <tr>
                            <td class="todo-status">
                                <button type="button" name="status" class="todo-status" data-render="false">
                                    <i class="fas fa-check-square"></i>
                                </button>
                            </td>
                            <td class="todo-buttons todo-button-collapse-container">
                                <div class="flex">
                                    <button type="button" name="collapse" title="Toggle Children Todos" disabled>
                                        <i class="fas fa-chevron-up"></i>
                                    </button>
                                </div>
                            </td>
                            <td class="todo-form">
                                <input class="todo-input" type="text" name="text"></textarea>
                            </td>
                            <td class="todo-buttons">
                                <div class="flex">
                                    <button type="button" name="move" title="Move">
                                        <i class="fas fa-arrows-alt"></i>
                                    </button>
                                    <button type="button" name="add" title="Add Child Todo">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button type="button" name="colour" title="Choose Colour">
                                        <i class="fas fa-palette"></i>
                                    </button>
                                    <button type="button" name="delete" title="Delete Todo">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="todo-colour-picker"></div>
                <div class="todo-children"></div>
            </div>
        `;
    }

    /**
     * Creat the piklor element. Focus the text input.
     * Attach button handlers. Attach drag handlers. Attach input handlers. 
     */
    onConnected(){
        this.createPiklor();
        this.focusTextInput();
        this.attachButtonHandlers()
        this.attachDragHandlers();
        this.attachInputHandlers();
    }

    /**
     * Create the Piklor element.
     */
    createPiklor(){
        this.colour_picker = new Piklor(this.elements.colour_picker, this.options.colours, {
            open: this.elements.colour_button
        });
        this.colour_picker.colorChosen((colour) => {
            this.setBackgroundColour(colour);
            this.removeColourPickerStyle(false);
        });
    }

    /**
     * Attach the drag and drop handlers.
     */
    attachDragHandlers(){
        this.on('dragstart', (event) => {
            event.stopPropagation();
            event.dataTransfer.setData("text", this.getId());
        });
        // Have to manually handle this for some reason
        this.on('dragover', (event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        // Event attached to move_button instead of this, because all
        // child elements of the todo element will fire dragleave 
        this.elements.move_button.addEventListener('dragenter', (event) => {
            event.stopPropagation();
            this.enableDragOverStyle(true);
        });
        this.elements.move_button.addEventListener('dragleave', (event) => {
            event.stopPropagation();
            this.enableDragOverStyle(false);
        });
        // Drop is fired when an element is dropped on to this one
        this.on('drop', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.enableDragOverStyle(false);
            let draggingId = event.dataTransfer.getData("text");
            // Prevent reparenting to this, own child, and own parent
            if (this.getId() !== draggingId && 
                !this.isChild(draggingId) && 
                !this.isParent(draggingId))
            {
                // todo: prevent parenting to child of child
                this.emit('reparent', {
                    todoId: draggingId,
                    parentId: this.getId()
                });
            }
        });
    }

    /**
     * Attach button handlers.
     */
    attachButtonHandlers(){
        this.elements.add_button.addEventListener('click', () => {
            this.addChildTodo();
        });
        this.elements.delete_button.addEventListener('click', () => {
            this.delete();
        });
        this.elements.colour_button.addEventListener('click', () => {
            // this.displayColourPickerStyle();
        });
        this.elements.collapse_button.addEventListener('click', () => {
            this.toggleCollapse();
        });
        this.elements.status_button.addEventListener('click', () => {
            this.toggleStatus();
        });
    }

    /**
     * Attach input handlers.
     * When the input is clicked, set the Todo as active.
     * When the user stops typing for 500 ms, update the Todo on the backend.
     */
    attachInputHandlers(){
        this.elements.text_input.addEventListener('click', (event) => {
            event.stopPropagation();
            this.setActive();
        });
        
        // If the user has stopped typing for 500ms, update the todo
        let text_debounce = null;
        this.elements.text_input.addEventListener('keydown', (event) => {
            // Ignore tab shift, ctrl, alt, pause, caps lock, meta, context
            if([9, 16, 17, 18, 19, 20, 91, 93].includes(event.keyCode)){
                return;
            }
            clearTimeout(text_debounce);
            text_debounce = setTimeout(() => {
                this.update();
            }, 500);
        });
    }

    /**
     * Focus the text input
     */
    focusTextInput(){
        this.elements.text_input.focus();
    }

    /**
     * Add a child todo to this todo.
     * Emits the "addChild" event.
     * @return {Promise}
     */
    addChildTodo(){
        return Router.addTodo({parent_id: this.getId()})
            .then(() => {
                this.emit('addChild');
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Cache data.
     * Set collapsed to 0 if undefined.
     * @param {Object} data 
     * @return {Object}
     */
    cacheData(data){
        if(typeof data.collapsed === "undefined"){
            data.collapsed = 0;
        }
        return super.cacheData(data);
    }

    /**
     * Delete the todo.
     * Emits a "delete" event.
     * Removes the element from the DOM.
     * @return {Promise}
     */
    delete(){
        return Router.deleteTodo(this.getId())
            .then(() => {
                this.emit('delete');
                this.remove();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Get the id of the todo.
     * This is the same _id in the database.
     * It will be set when the todo is rendered from a render() call.
     * @return {Null|String}
     */
    getId(){
        return this.cachedData._id || null;
    }

    /**
     * Get the parent id of the todo.
     * @return {Null|String}
     */
    getParentId(){
        return this.cachedData.parentId || null;
    }

    /**
     * Get the text inside the todo text input
     * @return {String}
     */
    getText(){
        return this.elements.text_input.value;
    }

    /**
     * Get the todo status
     * @return {Number}
     */
    getStatus(){
        return this.cachedData.status;
    }

    /**
     * Get whether a todo id is within the array of children todo ids for this todo.
     * @param {String} todoId 
     * @return {boolean} - true if the todo is a child of this todo
     */
    isChild(todoId){
        if(!this.cachedData.children){
            return false;
        }
        return this.cachedData.children.indexOf(todoId) > -1;
    }

    /**
     * Get whether a todo id is the parent of this todo
     * @param {String} todoId 
     * @return {boolean} - True if the todo is a parent of this todo
     */
    isParent(todoId){
        return this.cachedData.parentId === todoId;
    }

    /**
     * Render the todo element.
     * @param {Object} data
     * @param {String} data.parent_id
     * @param {Number} data.background_colour
     * @param {Number} data.collapsed
     * @param {Object[]} data.children
     * @param {Number} data.status
     * @param {String} data.text
     */
    render({
        parent_id = "",
        background_colour = "white",
        collapsed = 0,
        children = [],
        status = Todo.status.incomplete,
        text = ""
    })
    {
        super.render(arguments[0]);
        
        this.elements.text_input.value = text;
        this.renderStatus(status);
        this.renderCollapse(collapsed);
        this.renderBackgroundColour(background_colour);
        this.enableCollapsedButton(children.length);

        if(parent_id !== ""){
            this.classList.add('todo-child');
        }
    }

    /**
     * Render the todo as active.
     * Remove the inactive class and add the active class.
     */
    renderActive(){
        this.replaceClass('inactive', 'active');
    }

    /**
     * Render the todo as inactive.
     * Remove the active class and add the inactive class.
     */
    renderInactive(){
        this.replaceClass('active', 'inactive');
    }

    /**
     * Render the background colour.
     * @param {String} background_colour
     */
    renderBackgroundColour(background_colour){
        this.elements.body.style.backgroundColor = background_colour;
    }

    /**
     * Render the collapsed button
     * @param {boolean} state 
     */
    enableCollapsedButton(state){
        this.elements.collapse_button.disabled = !state;
    }

    /**
     * Render the state of the children todo container
     * @param {boolean} state 
     */
    renderCollapse(state){
        this.elements.children.style.display = state ? "none" : "block";
        this.renderCollapsedIcon(state);
    }

    /**
     * Render the the collapsed icon.
     * @param {boolean} state - true to have icon as arrow up, false down
     */
    renderCollapsedIcon(state){
        if(state){
            this.elements.collapse_icon.classList.remove('fa-chevron-up');
            this.elements.collapse_icon.classList.add('fa-chevron-down');
        }
        else {
            this.elements.collapse_icon.classList.remove('fa-chevron-down');
            this.elements.collapse_icon.classList.add('fa-chevron-up');
        }
    }

    /**
     * Render the status button.
     * @param {Number} status 
     */
    renderStatus(status){
        if(status === Todo.status.incomplete){
            this.elements.body.classList.remove("complete");
            this.elements.text_input.classList.remove("complete");
            this.elements.status_button.classList.remove("complete");
        }
        else if(status === Todo.status.complete){
            this.elements.body.classList.add("complete");
            this.elements.text_input.classList.add("complete");
            this.elements.status_button.classList.add("complete");
        }
    }

    /**
     * Render the text input
     * @param {String} value 
     */
    renderText(value){
        this.elements.text_input.value = value;
    }

    /**
     * Remove the 'colour-picker-open' class
     * from the body.
     */
    removeColourPickerStyle(){
        this.elements.body.classList.remove('colour-picker-open');
    }

    /**
     * Set as the active todo element
     */
    setActive(){
        this.renderInactive();
    }

    /**
     * Set as an inactive todo element
     */
    setInactive(){
        this.renderActive();
    }

    /**
     * Set the background colour
     * @param {String} background_colour 
     * @return {Promise}
     */
    setBackgroundColour(background_colour){
        this.renderBackgroundColour(background_colour);
        let data = {_id: this.getId(), background_colour: background_colour};
        return Router.updateTodo(data)
            .then(() => {

            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Set the collapsed state
     * @param {boolean} collapsed 
     * @param {boolean} recursive 
     * @return {Promise}
     */
    setCollapsedState(collapsed, recursive){
        return Router.setCollapsedState(this.getId(), collapsed, recursive)
            .then(() => {

            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Set the status.
     * Sets the cached data and makes a backend call.
     * @return {Promise}
     */
    setStatus(status){
        this.cachedData.status = status;
        let params = {
            _id: this.getId(),
            status: status
        };
        return Router.updateTodo(params)
            .then(() => {
                this.renderStatus(status);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * Set the text input
     * @param {String} value 
     */
    setText(value){
        this.renderText(value);
    }

    /**
     * Toggle the display state of the child todos to the opposite of what it is
     * @param {boolean} [recursive=false] 
     * @return {Promise}
     */
    toggleCollapse(recursive = false){
        this.cachedData.collapsed = this.cachedData.collapsed ? 0 : 1;
        this.renderCollapse(this.cachedData.collapsed);
        return this.setCollapsedState(this.cachedData.collapsed, recursive);
    }

    /**
     * Toggle the "colour-picker-open" class on the .todo-body element. 
     * Removes the bottom borders.
     */
    toggleColourPickerStyle(){
        this.elements.body.classList.toggle('colour-picker-open');
    }

    /**
     * Toggle the "todo-drag-over" class on the .todo-body element. 
     * Adds a border.
     * @param {boolean} enable - True to add style, false to remove
     */
    enableDragOverStyle(state){
        if(state){
            this.elements.body.classList.add('todo-drag-over');
        }
        else {
            this.elements.body.classList.remove('todo-drag-over');
        }
    }

    /**
     * Toggle the status to the opposite value.
     * Sets the cached data and makes a backend call.
     * @return {Promise}
     */
    toggleStatus(){
        this.cachedData.status = this.cachedData.status ? 0 : 1;
        return this.setStatus(this.cachedData.status);
    }

    /**
     * Update the todo based on the text in the text input
     * @return {Promise}
     */
    update(){
        let data = {
            _id: this.getId(),
            text: this.getText()
        };
        return Router.updateTodo(data)
            .then(() => {
                this.emit('update');
            })
            .catch((error) => {
                console.error(error);
            });
    }
}
Todo.status = {
    incomplete: 0,
    complete: 1
};
customElements.define('todo-todo', Todo);