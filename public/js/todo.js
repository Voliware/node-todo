/**
 * Todo template
 * @extends {Template}
 */
class TodoTemplate extends Template {

    /**
     * Constructor
     * @param {object} [options]
     * @return {TodoTemplate}
     */
    constructor(options = {}){
        let defaults = {
            colours: ['purple', 'pink', 'blue', 'green',  'yellow', 
            'orange', 'brown', 'red',  'black', 'grey', 'white'],
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
        this.colourPicker = null;
        return this;
    }

    /**
     * Callback when dom is attached.
     * Attach all DOM handlers.
     * Create the colour picker, as it relies
     * on the dom to be captured via findElements()
     * in super.connectedCallback();
     * Focus the text input.
     */
    connectedCallback(){
        super.connectedCallback();
        this.attachButtonHandlers()
        this.attachDragHandlers();
        this.attachInputHandlers();
        this.createColourPicker();
        this.focusTextInput();
    }

    /**
     * Create the colour picker.
     * @return {TodoTemplate}
     */
    createColourPicker(){
        let self = this;
        this.colourPicker = new Piklor(this.elements.colourPicker, this.options.colours, {
            open: this.elements.colourButton
        });
        this.colourPicker.colorChosen(function(colour){
            self.setBackgroundColour(colour);
            self.removeColourPickerStyle(false);
        });

        return this;
    }

    /**
     * Attach the drag and drop handlers.
     * @return {TodoTemplate}
     */
    attachDragHandlers(){
        let self = this;
        this.on('dragstart', function(event){
            event.stopPropagation();
            event.dataTransfer.setData("text", self.getId());
        });
        // have to manually handle this for some reason
        this.on('dragover', function(event){
            event.stopPropagation();
            event.preventDefault();
        });
        // event attached to moveButton instead of this, because all
        // child elements of the todo element will fire dragleave 
        this.elements.moveButton.addEventListener('dragenter', function(event){
            event.stopPropagation();
            self.enableDragOverStyle(true);
        });
        this.elements.moveButton.addEventListener('dragleave', function(event){
            event.stopPropagation();
            self.enableDragOverStyle(false);
        });
        // drop is fired when an element is dropped on to this one
        this.on('drop', function(event){
            event.stopPropagation();
            event.preventDefault();
            self.enableDragOverStyle(false);
            let draggingId = event.dataTransfer.getData("text");
            // prevent reparenting to self, own child, and own parent
            if (self.getId() !== draggingId && 
                !self.isChild(draggingId) && 
                !self.isParent(draggingId))
            {
                // todo: prevent parenting to child of child
                self.emit('reparent', {
                    todoId: draggingId,
                    parentId: self.getId()
                });
            }
        });

        return this;
    }

    /**
     * Attach button handlers.
     * @return {TodoTemplate}
     */
    attachButtonHandlers(){
        let self = this;
        this.elements.addButton.addEventListener('click', function(){
            self.addChildTodo();
        });
        this.elements.deleteButton.addEventListener('click', function(){
            self.delete();
        });
        this.elements.colourButton.addEventListener('click', function(){
            // self.displayColourPickerStyle();
        });
        this.elements.collapseButton.addEventListener('click', function(){
            self.toggleCollapse();
        });
        this.elements.statusButton.addEventListener('click', function(){
            self.toggleStatus();
        });

        return this;
    }

    /**
     * Attach input handlers.
     * When the input is clicked, set the Todo as active.
     * When the user stops typing for 500 ms,
     * update the Todo on the backend.
     * @return {TodoTemplate}
     */
    attachInputHandlers(){
        let self = this;
        this.elements.textInput.addEventListener('click', function(event){
            event.stopPropagation();
            self.setActive();
        });
        
        // if the user has stopped typing for 500ms, update the todo
        let textDebounce = null;
        this.elements.textInput.addEventListener('keydown', function(event){
            // ignore tab shift, ctrl, alt, pause, caps lock, meta, context
            if([9, 16, 17, 18, 19, 20, 91, 93].includes(event.keyCode)){
                return;
            }
            clearTimeout(textDebounce);
            textDebounce = setTimeout(function(){
                self.update();
            }, 500);
        });

        return this;
    }

    /**
     * Focus the text input
     * @return {TodoTemplate}
     */
    focusTextInput(){
        this.elements.textInput.focus();
        return this;
    }

    /**
     * Add a child todo to this todo.
     * Emits the "addChild" event.
     * @return {Promise}
     */
    addChildTodo(){
        let self = this;
        return Router.todo.addTodo({parent: this.getId()})
            .then(function(){
                self.emit('addChild');
            })
            .catch(function(error){
                console.error(error);
            });
    }

    /**
     * Cache data.
     * Set collapsed to 0 if undefined.
     * @param {object} data 
     * @return {object}
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
        let self = this;
        return Router.todo.deleteTodo(this.getId())
            .then(function(){
                self.emit('delete');
                self.remove();
            })
            .catch(function(error){
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
        return this.cachedData.parent || null;
    }

    /**
     * Get the text inside the todo text input
     * @return {string}
     */
    getText(){
        return this.elements.textInput.value;
    }

    /**
     * Get the todo status
     * @return {number}
     */
    getStatus(){
        return this.cachedData.status;
    }

    /**
     * Get whether a todo id is within the array
     * of children todo ids for this todo.
     * @param {string} todoId 
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
     * @param {string} todoId 
     * @return {boolean} - true if the todo is a parent of this todo
     */
    isParent(todoId){
        return this.cachedData.parent === todoId;
    }

    /**
     * Render the todo template.
     * Set the text input value.
     * If the todo has a parent, add a left margin.
     * @param {object} data
     * @param {string} data.text
     * @return {TodoTemplate}
     */
    render(data){
        super.render(data);
        this.elements.textInput.value = data.text;
        this.renderStatus(data.status);
        this.renderCollapse(data.collapsed);
        this.renderBackgroundColour(data.backgroundColor);
        if(data.parent){
            this.classList.add('todo-child');
        }
        if(Array.isArray(data.children) && data.children.length){
            this.setCollapsedButton(true);
        }
        if(data.toggleCollapse === true){
            this.toggleCollapse(true);
        }
        return this;
    }

    /**
     * Render the todo as active.
     * Remove the inactive class and add the active class.
     * @return {TodoTemplate}
     */
    renderActive(){
        this.replaceClass('inactive', 'active');
        return this;
    }

    /**
     * Render the todo as inactive.
     * Remove the active class and add the inactive class.
     * @return {TodoTemplate}
     */
    renderInactive(){
        this.replaceClass('active', 'inactive');
        return this;
    }

    /**
     * Render the background colour.
     * @param {string} backgroundColor
     * @return {TodoTemplate}
     */
    renderBackgroundColour(backgroundColor){
        this.elements.body.style.backgroundColor = backgroundColor;
        return this;
    }

    /**
     * Render the collapsed button
     * @param {boolean} state 
     * @return {TodoTemplate}
     */
    renderCollapsedButton(state){
        this.elements.collapseButton.disabled = !state;
        return this;
    }

    /**
     * Render the state of the children todo container
     * @param {boolean} state 
     * @return {TodoTemplate}
     */
    renderCollapse(state){
        Template.display(this.elements.children, !state);
        this.setCollapsedIcon(!state);
        return this;
    }

    /**
     * Render the the collapsed icon.
     * @param {boolean} state - true to have icon as arrow up, false down
     * @return {TodoTemplate}
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
        return this;
    }

    /**
     * Render the status button.
     * @param {number} status 
     * @return {TodoTemplate}
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
        return this;
    }

    /**
     * Render the text input
     * @param {string} value 
     * @return {TodoTemplate}
     */
    renderText(value){
        this.elements.textInput.value = value;
        return this;
    }

    /**
     * Remove the 'colour-picker-open' class
     * from the body.
     * @return {TodoTemplate}
     */
    removeColourPickerStyle(){
        this.elements.body.classList.remove('colour-picker-open');
        return this;
    }

    /**
     * Set as the active todo element
     * @return {TodoTemplate}
     */
    setActive(){
        this.renderInactive();
        return this;
    }

    /**
     * Set as an inactive todo element
     * @return {TodoTemplate}
     */
    setInactive(){
        this.renderActive();
        return this;
    }

    /**
     * Set the background colour
     * @param {string} backgroundColor 
     * @return {TodoTemplate}
     */
    setBackgroundColour(backgroundColor){
        this.renderBackgroundColour(backgroundColor);
        let data = {_id: this.getId(), backgroundColor};
        return Router.todo.updateTodo(data)
            .then(function(){

            })
            .catch(function(err){
                console.log(err);
            });
    }

    /**
     * Set the collapsed state
     * @param {boolean} state 
     * @param {boolean} recursive 
     * @return {Promise}
     */
    setCollapsedState(state, recursive){
        return Router.todo.setCollapsedState(this.getId(), state, recursive)
            .then(function(){

            })
            .catch(function(err){
                console.error(err);
            });
    }

    /**
     * Set the enabled/disabled state of the collapseButton.
     * Also set the icon to up/down.
     * @param {boolean} state - true to enable, false to disable
     * @return {TodoTemplate}
     */
    setCollapsedButton(state){
        this.renderCollapsedButton(state);
        return this;
    }

    /**
     * Set the collapseButton's icon between up and down arrow
     * @param {boolean} state - true to show arrow up, false to show arrow down
     * @return {TodoTemplate}
     */
    setCollapsedIcon(state){
        this.renderCollapsedIcon(state);
        return this;
    }

    /**
     * Set the status.
     * Sets the cached data and makes a backend call.
     * @return {Promise}
     */
    setStatus(status){
        this.cachedData.status = status;
        let self = this;
        let params = {
            _id: this.getId(),
            status: status
        };
        return Router.todo.updateTodo(params)
            .then(function(){
                self.renderStatus(status);
            })
            .catch(function(error){
                console.error(error);
            });
    }

    /**
     * Set the text input
     * @param {string} value 
     * @return {TodoTemplate}
     */
    setText(value){
        this.renderText(value);
        return this;
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
     * @return {TodoTemplate}
     */
    toggleColourPickerStyle(){
        this.elements.body.classList.toggle('colour-picker-open');
        return this;
    }

    /**
     * Toggle the "todo-drag-over" class on the 
     * .todo-body element. Adds a border.
     * @param {boolean} enable - true to add style, false to remove
     * @return {TodoTemplate}
     */
    enableDragOverStyle(state){
        if(state){
            this.elements.body.classList.add('todo-drag-over');
        }
        else {
            this.elements.body.classList.remove('todo-drag-over');
        }
        return this;
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
        let self = this;
        let data = {
            _id: this.getId(),
            text: this.getText()
        };
        return Router.todo.updateTodo(data)
            .then(function(){
                self.emit('update');
            })
            .catch(function(error){
                console.error(error);
            });
    }
}
TodoTemplate.status = {
    incomplete:0,
    complete:1
};
customElements.define('template-todo', TodoTemplate);

/**
 * Todo template manager
 * @extends {ElementManager}
 */
class TodoTemplateManager extends ElementManager {

    /**
     * Constructor
     * @param {HTMLElement} wrapper 
     * @return {TodoTemplateManager}
     */
    constructor(wrapper){
        let template = document.getElementById('todoTemplate');
        super(wrapper, template);
        wrapper.addEventListener('dragover', function(event){
            event.preventDefault();
            event.stopPropagation();
        });
        wrapper.addEventListener('drop', function(event){
            let draggingId = event.dataTransfer.getData("text");
            console.log(draggingId);
        });
        return this;
    }

    /**
     * Attach handlers to created TodoTemplates.
     * Propogate events upwards.
     * @param {Template} template 
     * @return {TodoTemplateManager}
     */
    attachElementHandlers(template){
        let self = this;
        template.on('addChild', function(){
            self.emit('addChild');
        });
        template.on('delete', function(){
            self.emit('delete');
        });
        template.on('reparent', function(data){
            self.emit('reparent', data);
        });
        return this;
    }

    /**
     * Append the template after its parent,
     * or at the end if there is no parent.
     * @param {Template} template 
     * @return {TodoTemplateManager}
     */
    appendElement(template){
        if(template.cachedData.parent){
            let parent = this.elements.get(template.cachedData.parent);
            if(parent){
                template.appendTo(parent.elements.children);
                return this;
            }
        }

        return super.appendElement(template);
    }

    /**
     * Render the templates.
     * Process the data into an ordered map.
     * @param {object[]} data 
     * @return {TodoTemplateManager}
     */
    render(data){
        data = this.sortDataToOrderedMap(data);
        return super.render(data);
    }

    /**
     * Sort the data into a map.
     * The map will be ordered by 
     * parent/child relationships.
     * @param {object[]} data 
     * @return {Map}
     */
    sortDataToOrderedMap(data){

        /**
         * Find a todo within an array of todo objects.
         * If found, return it and remove it from the array.
         * @param {string} _id 
         * @param {object[]} dataArray 
         * @return {null|object}
         */
        function findTodo(_id, dataArray){
            for (let i = 0; i < dataArray.length; i++) {
                let todo = dataArray[i];
                if(todo._id === _id){
                    //dataArray.splice(i, 1);
                    return todo;
                }
            }
            return null;
        }

        /**
         * Recursively append the children 
         * of a todo object to its parent.
         * @param {string[]} childrenIds 
         * @param {object[]} dataArray 
         * @param {Map} map 
         */
        function appendChildren(childrenIds, dataArray, map){
            for (let i = 0; i < childrenIds.length; i++) {
                let _id = childrenIds[i];
                let todo = findTodo(_id, dataArray);
                if(todo){
                    map.set(todo._id, todo);
                }
            };
        }

        let map = new Map();
        for (let i = 0; i < data.length; i++) {
            let todo = data[i];
            if(!todo.parent || todo.parent === ""){
                if(!map.get(todo._id)){
                    map.set(todo._id, todo);
                }
            }
            if(todo.children && todo.children.length){
                appendChildren(todo.children, data, map);
            }
        }

        return map;
    }
}

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
        let self = this;
        this.wrapper = document.getElementById('todo');
        this.todoList = document.getElementById('todoList');
        this.addTodoButton = document.getElementById('todoAddButton');
        this.todoManager = new TodoTemplateManager(this.todoList);
        this.todoManager.on('addChild', function(){
            console.log('hi')
            self.getTodos();
        });
        this.todoManager.on('delete', function(){
            self.getTodos();
        });
        this.todoManager.on('reparent', function(data){
            self.reparentTodo(data.todoId, data.parentId);
        });
        this.todoManager.on('update', function(){
        });
        this.addTodoButton.addEventListener('click', function(){
            self.addTodo();
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
        let self = this;
        return Router.todo.addTodo(data)
            .then(function(){
                self.getTodos();
            })
            .catch(function(error){
                console.error(error);
            });
    }
    
    /**
     * Get all todos and render them
     * @return {Promise}
     */
    getTodos(){
        let self = this;
        return Router.todo.getTodos()
            .then(function(data){
                self.todoManager.render(data.body);
            })
            .catch(function(error){
                console.error(error);
            });
    }

    /**
     * Reparent a todo by reattaching a child to a different parent
     * @param {string} todoId - todo _id to move to a new parent
     * @param {string} parentId - parent todo _id to move the todo to
     * @return {Promise}
     */
    reparentTodo(todoId, parentId){
        let self = this;
        return Router.todo.reparentTodo(todoId, parentId)
            .then(function(){
                self.todoManager.empty();
                self.getTodos();
            })
            .catch(function(error){
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