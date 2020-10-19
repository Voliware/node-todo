const EventEmitter = require('events');
const Mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const Logger = require('@voliware/logger');

/**
 * Controls a mongo client, db, and collections.
 * @extends {EventEmitter}
 */
class Database extends EventEmitter {

    /**
     * Constructor
     * @param {String|Object} options
     * @param {String} options.name
     * @param {String} options.host
     * @param {String} options.port
     * @param {String[]} collections
     * @param {String} [options.username]
     * @param {String} [options.password]
     * @param {String} [options.namespace]
     * @returns {Database}
     */
    constructor(options){
        super();
        this.options = {
            name: "admin",
            host: "localhost",
            port: 27017,
            username: "",
            password: "",
            namespace: "",
            collections: [],
            useNewUrlParser: true,
            useUnifiedTopology: true
        };
        Object.extend(this.options, options);

        this.logger = new Logger(this.constructor.name, {level: "verbose"});

        this.url = (typeof url === "string") ? url : this.createUrl(this.options);
        this.client = new MongoClient(this.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        this.db = null;
        this.collections = {};
        return this;
    }

    /**
     * Create a mongodb url string with the following pattern:
     * mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
     * @param {Object} params
     * @param {String} params.username 
     * @param {String} params.password
     * @param {String} params.host
     * @param {String} params.port
     * @param {String} params.name
     * @returns this;
     */
    createUrl({username, password, host, port, name}){
        let url = "mongodb://";

        // optional username/password, both must be set
        if(typeof username === "string" && username.length){
            if(typeof password === "string" && password.length) {
                url += `${username}:${password}@`;
            }
        }
       
        url += `${host}:${port}`;

        if(typeof name === "string" && name.length){
            url += `/${name}`;
        }

        this.logger.verbose("Generated url " + url);

        return url;
    }

    /**
     * Connect to mongo.
     * Throws an error if it fails.
     * @async
     * @returns {Promise<Boolean>} True if it connects
     */
    async connect(){
        this.logger.debug(`Connecting to ${this.url}`)
        await this.client.connect();            
        if(this.client.isConnected()){
            this.logger.info(`Connected to ${this.url}`);
            return true;
        }
        else {
            throw new Error(`Failed to connect to ${this.url}`);
        }
    }

    /**
     * Get a database
     * @param {String} name 
     */
    getDatabase(name){
        return this.client.db(name);
    }

    /**
     * Create all collections 
     * @param {String[]} collections - array of collection names
     * @returns {Promise}
     */
    async createCollections(collections){
        this.collections = await this.getCollections();
        let missing = [];
        let found = false;
        for(let i = 0; i < collections.length; i++){
            let name = collections[i];
            for(let k in this.collections){
                if(name === k){
                    found = true;
                    break;
                }
            }
            if(!found){
                missing.push(name);
            }
            found = false;
        }
        for(let i = 0; i < missing.length; i++){
            await this.createCollection(missing[i]);
        }
    }

    /**
     * Get a collection stored in the cached collections list.
     * @param {String} name 
     * @returns {Object}
     */
    getCollection(name){
        return this.collections[name];
    }

    /**
     * Get all collections
     * @async
     * @returns {Promise<Object>} - collections
     */
    async getCollections(){
        let collections = {};
        this.logger.debug('Getting database collections');
        return new Promise((resolve, reject) => {
            this.db.listCollections().toArray((err, items) => {
                if(err){
                    this.logger.error('Failed to get database collections');
                    reject(err);
                    return;
                }
    
                if(!items.length){
                    this.logger.info('No collections found');
                    resolve(collections)
                    return;
                }
    
                for(let k in items){
                    let name = items[k].name;
                    collections[name] = this.db.collection(name);
                    this.logger.debug(`Found collection ${name}`)
                }
                resolve(collections)
                return;
            });
        });
    }

    /**
     * Create a collection
     * @returns {Promise}
     */
    createCollection(name){
        this.logger.debug(`Creating ${name} collection`);
        return this.db.createCollection(name)
            .then(() => {
                this.logger.info(`Created ${name} collection`);
            })
            .catch((err) => {
                this.logger.error(`Failed to create ${name} collection`);
                this.logger.error(err);
            });
    }

    /**
     * Process a filter object used for queries.
     * If the filter has an _id property, replace it with a new Mongo.ObjectID.
     * @param {Object} filter 
     * @returns {Object}
     */
    processFilter(filter={}){
        if(typeof filter._id !== "undefined"){
            filter._id = new Mongo.ObjectID(filter._id);
        }
        return filter;
    }

    /**
     * Connect to mongo using the client.
     * Get the database.
     * Get all collections.
     * @async
     * @returns {Promise<boolean>} true if it connects
     */
    async initialize(){
        await this.connect();
        this.db = this.getDatabase(this.name);        
        await this.createCollections(this.options.collections);
        return true;
    }
}

module.exports = Database;