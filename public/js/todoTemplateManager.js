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
        wrapper.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        wrapper.addEventListener('drop', (event) => {
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
        template.on('addChild', () => {
            this.emit('addChild');
        });
        template.on('delete', () => {
            this.emit('delete');
        });
        template.on('reparent', (data) => {
            this.emit('reparent', data);
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
         * @param {String} _id 
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