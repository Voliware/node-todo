/**
 * Todo element manager
 * @extends {ElementManager}
 */
class TodoManager extends ElementManager {

    /**
     * Constructor
     * @param {HTMLElement} wrapper 
     */
    constructor(wrapper){
        let template = document.createElement('todo-todo');
        super(wrapper, template);
        wrapper.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        wrapper.addEventListener('drop', (event) => {
            let dragging_id = event.dataTransfer.getData("text");
            console.log(dragging_id);
        });
    }

    /**
     * Attach handlers to created Todos. Propogate events upwards.
     * @param {HTMLElement} todo 
     */
    attachElementHandlers(todo){
        todo.on('addChild', () => {
            this.emit('addChild');
        });
        todo.on('delete', () => {
            this.emit('delete');
        });
        todo.on('reparent', (data) => {
            this.emit('reparent', data);
        });
    }

    /**
     * Append the Todo element after its parent, or at the end if there is no parent.
     * @param {HTMLelement} element 
     */
    appendElement(element){
        if(element.cachedData.parent_id){
            let parent = this.elements.get(element.cachedData.parent_id);
            if(parent){
                element.appendTo(parent.elements.children);
                return;
            }
        }

        super.appendElement(element);
    }

    /**
     * Warning: complete override for ElementManager.renderElement().
     * Find a better way to solve the issue in the comment.
     * Render an element found in the element collection.
     * If the element does not exist, create it.
     * @param {Number|String} id - Element and data identifier
     * @param {Object} data - Object of data
     * @param {Number} index - The numerical index of the element
     */
    renderElement(id, data, index){
        let isNew =  false;
        let element = this.elements.get(id);
        if(!element){
            isNew = true;
            element = this.cloneTemplate();
        }
           
        if(element){
            // Issue: overwritten this.appendElement needs cached data
            element.cachedData = Object.extend({}, data);
            this.appendElement(element);  

            if(element instanceof Template){
                element.render(data);
            }
            else {
                Template.render(element, data);
            }  
            if(isNew){
                this.elements.set(id, element); 
            }
        }        
    }

    /**
     * Render the Todo elements. Process the data into an ordered map.
     * @param {Object[]} data 
     */
    render(data){
        data = this.sortDataToOrderedMap(data);
        super.render(data);
    }

    /**
     * Sort the data into a map. The map will be ordered by parent/child relationships.
     * @param {Object[]} data - array of unsorted todo objects
     * @return {Map}
     */
    sortDataToOrderedMap(data){

        /**
         * Find a todo within an array of todo objects. If found, return it and remove it from the array.
         * @param {String} _id 
         * @param {Object[]} data_array 
         * @return {null|object}
         */
        function findTodo(_id, data_array){
            for (let i = 0; i < data_array.length; i++) {
                let todo = data_array[i];
                if(todo._id === _id){
                    //dataArray.splice(i, 1);
                    return todo;
                }
            }
            return null;
        }

        /**
         * Recursively append the children of a todo object to its parent.
         * @param {String[]} children 
         * @param {Object[]} data_array 
         * @param {Map} map 
         */
        function appendChildren(children, data_array, map){
            for (let i = 0; i < children.length; i++) {
                let todo = findTodo(children[i], data_array);
                if(todo){
                    map.set(todo._id, todo);
                }
            };
        }

        let map = new Map();
        for (let i = 0; i < data.length; i++) {
            let todo = data[i];
            if(!todo.parent_id || todo.parent_id === ""){
                if(!map.get(todo._id)){
                    map.set(todo._id, todo);
                }
            }
            if(Array.isArray(todo.children) && todo.children.length){
                appendChildren(todo.children, data, map);
            }
        }

        return map;
    }
}