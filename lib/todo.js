/**
 * Todo object
 */
class Todo {

    /**
     * Constructor
     */
    constructor(){
        this._id = "";
        this.text = "";
        this.parentId = "";
        this.status = false;
        this.backgroundColor = "white";
        this.collapsed = false;
        this.created = 0;
        this.children = [];
    }
}

module.exports = Todo;