/**
 * Todo object
 */
class Todo {

    /**
     * Constructor
     * @return {Todo}
     */
    constructor(){
        this.created = 0;
        this.name = "";
        this.text = "";
        this._id = ""; 
        this.parent = null;
        this.children = [];
        this.userId = null;
        return this;
    }
}

module.exports = Todo;