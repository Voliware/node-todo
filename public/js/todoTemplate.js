/**
 * Todo template
 * @extends {Template}
 */
class TodoTemplate extends Template {

    /**
     * Constructor
     * @param {Object} [options]
     */
    constructor(options = {}){
        let defaults = {
            colours: [
                'purple', 'pink', 'blue', 'green',  'yellow', 
                'orange', 'brown', 'red',  'black', 'grey', 'white'
            ],
            elements: {
                body: '.todo-body',
                form: '.todo-form',
                textInput: '[name="text"]',
                statusButton: '[name="status"]',
                addButton: '[name="add"]',
                moveButton: '[name="move"]',
                colourButton: '[name="colour"]',
                deleteButton: '[name="delete"]',
                collapseButton: '[name="collapse"]',
                collapseIcon: '[name="collapse"] i',
                children: '.todo-children',
                colourPicker: '.todo-colour-picker'
            }
        };
        super(Object.extend(defaults, options));
        
        this.attachButtonHandlers()
        this.attachDragHandlers();
        this.attachInputHandlers();
        this.focusTextInput();

        this.colourPicker = new Piklor(this.elements.colourPicker, this.options.colours, {
            open: this.elements.colourButton
        });
        this.colourPicker.colorChosen((colour) => {
            this.setBackgroundColour(colour);
            this.removeColourPickerStyle(false);
        });;
    }

    /**
     * Attach the drag and drop handlers.
     */
    attachDragHandlers(){
        this.on('dragstart', (event) => {
            event.stopPropagation();
            event.dataTransfer.setData("text", this.getId());
        });
        // have to manually handle this for some reason
        this.on('dragover', (event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        // event attached to moveButton instead of this, because all
        // child elements of the todo element will fire dragleave 
        this.elements.moveButton.addEventListener('dragenter', (event) => {
            event.stopPropagation();
            this.enableDragOverStyle(true);
        });
        this.elements.moveButton.addEventListener('dragleave', (event) => {
            event.stopPropagation();
            this.enableDragOverStyle(false);
        });
        // drop is fired when an element is dropped on to this one
        this.on('drop', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.enableDragOverStyle(false);
            let draggingId = event.dataTransfer.getData("text");
            // prevent reparenting to this, own child, and own parent
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
        this.elements.addButton.addEventListener('click', () => {
            this.addChildTodo();
        });
        this.elements.deleteButton.addEventListener('click', () => {
            this.delete();
        });
        this.elements.colourButton.addEventListener('click', () => {
            // this.displayColourPickerStyle();
        });
        this.elements.collapseButton.addEventListener('click', () => {
            this.toggleCollapse();
        });
        this.elements.statusButton.addEventListener('click', () => {
            this.toggleStatus();
        });
    }

    /**
     * Attach input handlers.
     * When the input is clicked, set the Todo as active.
     * When the user stops typing for 500 ms,
     * update the Todo on the backend.
     */
    attachInputHandlers(){
        this.elements.textInput.addEventListener('click', (event) => {
            event.stopPropagation();
            this.setActive();
        });
        
        // if the user has stopped typing for 500ms, update the todo
        let textDebounce = null;
        this.elements.textInput.addEventListener('keydown', (event) => {
            // ignore tab shift, ctrl, alt, pause, caps lock, meta, context
            if([9, 16, 17, 18, 19, 20, 91, 93].includes(event.keyCode)){
                return;
            }
            clearTimeout(textDebounce);
            textDebounce = setTimeout(() => {
                this.update();
            }, 500);
        });
    }

    /**
     * Focus the text input
     */
    focusTextInput(){
        this.elements.textInput.focus();
    }

    /**
     * Add a child todo to this todo.
     * Emits the "addChild" event.
     * @return {Promise}
     */
    addChildTodo(){
        return Router.addTodo({parentId: this.getId()})
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
     * It will be set when the todo is rendered
     * from a render() call.
     * @return {null|string}
     */
    getId(){
        return this.cachedData._id || null;
    }

    /**
     * Get the parent id of the todo.
     * @return {null|string}
     */
    getParentId(){
        return this.cachedData.parentId || null;
    }

    /**
     * Get the text inside the todo text input
     * @return {String}
     */
    getText(){
        return this.elements.textInput.value;
    }

    /**
     * Get the todo status
     * @return {Number}
     */
    getStatus(){
        return this.cachedData.status;
    }

    /**
     * Get whether a todo id is within the array
     * of children todo ids for this todo.
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
     * @return {boolean} - true if the todo is a parent of this todo
     */
    isParent(todoId){
        return this.cachedData.parentId === todoId;
    }

    /**
     * Render the todo template.
     * @param {Object} data
     * @param {String} data.parentId
     * @param {Number} data.backgroundColor
     * @param {Number} data.collapsed
     * @param {Object[]} data.children
     * @param {Number} data.status
     * @param {String} data.text
     */
    render({
        parentId = "",
        backgroundColor = "white",
        collapsed = 0,
        children = [],
        status = TodoTemplate.status.incomplete,
        text = ""
    })
    {
        super.render(arguments[0]);
        
        this.elements.textInput.value = text;
        this.renderStatus(status);
        this.renderCollapse(collapsed);
        this.renderBackgroundColour(backgroundColor);
        this.enableCollapsedButton(children.length);

        if(parentId !== ""){
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
     * @param {String} backgroundColor
     */
    renderBackgroundColour(backgroundColor){
        this.elements.body.style.backgroundColor = backgroundColor;
    }

    /**
     * Render the collapsed button
     * @param {boolean} state 
     */
    renderCollapsedButton(state){
        this.elements.collapseButton.disabled = !state;
    }

    /**
     * Render the state of the children todo container
     * @param {boolean} state 
     */
    renderCollapse(state){
        Template.display(this.elements.children, !state);
        this.setCollapsedIcon(!state);
    }

    /**
     * Render the the collapsed icon.
     * @param {boolean} state - true to have icon as arrow up, false down
     */
    renderCollapsedIcon(state){
        if(state){
            Template.addClass(this.elements.collapseIcon,'fa-chevron-up');
            Template.removeClass(this.elements.collapseIcon, 'fa-chevron-down');
        }
        else {
            Template.removeClass(this.elements.collapseIcon, 'fa-chevron-up');
            Template.addClass(this.elements.collapseIcon, 'fa-chevron-down');
        }
    }

    /**
     * Render the status button.
     * @param {Number} status 
     */
    renderStatus(status){
        if(status === TodoTemplate.status.incomplete){
            this.elements.body.classList.remove("complete");
            this.elements.textInput.classList.remove("complete");
            this.elements.statusButton.classList.remove("complete");
        }
        else if(status === TodoTemplate.status.complete){
            this.elements.body.classList.add("complete");
            this.elements.textInput.classList.add("complete");
            this.elements.statusButton.classList.add("complete");
        }
    }

    /**
     * Render the text input
     * @param {String} value 
     */
    renderText(value){
        this.elements.textInput.value = value;
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
     * @param {String} backgroundColor 
     * @return {Promise}
     */
    setBackgroundColour(backgroundColor){
        this.renderBackgroundColour(backgroundColor);
        let data = {_id: this.getId(), backgroundColor};
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
     * Set the enabled/disabled state of the collapseButton.
     * Also set the icon to up/down.
     * @param {boolean} state - true to enable, false to disable
     */
    enableCollapsedButton(state){
        this.renderCollapsedButton(state);
    }

    /**
     * Set the collapseButton's icon between up and down arrow
     * @param {boolean} state - true to show arrow up, false to show arrow down
     */
    setCollapsedIcon(state){
        this.renderCollapsedIcon(state);
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
     * Toggle the display state of the child todos
     * to the opposite of what it is
     * @param {boolean} [recursive=false] 
     * @return {Promise}
     */
    toggleCollapse(recursive = false){
        this.cachedData.collapsed = this.cachedData.collapsed ? 0 : 1;
        this.renderCollapse(this.cachedData.collapsed);
        return this.setCollapsedState(this.cachedData.collapsed, recursive);
    }

    /**
     * Toggle the "colour-picker-open" class on the 
     * .todo-body element. Removes the bottom borders.
     */
    toggleColourPickerStyle(){
        this.elements.body.classList.toggle('colour-picker-open');
    }

    /**
     * Toggle the "todo-drag-over" class on the 
     * .todo-body element. Adds a border.
     * @param {boolean} enable - true to add style, false to remove
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
TodoTemplate.status = {
    incomplete: 0,
    complete: 1
};
customElements.define('template-todo', TodoTemplate);