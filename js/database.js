const mongo = require('mongodb');
const Logger = require('@voliware/logger');

/**
 * Mongodb database connection.
 */
class Database {

    /**
     * Constructor
     * @param {object} [options]
     * @param {string} [options.uri="mongodb://localhost"]
     * @param {number} [options.port=27017]
     * @param {string} [options.name="db"]
     * @param {string} [options.logHandle]
     */
    constructor(options = {}){
        let defaults = {
            uri: "mongodb://localhost", 
            port: 27017, 
            name: 'db',
        };
        this.uri = options.uri || defaults.uri;
        this.port = options.port || defaults.port;
        this.name = options.name || defaults.name;
        this.url = `${this.uri}:${this.port}/${this.name}`;
        this.logHandle = options.logHandle || this.name;
        this.logger = new Logger(this.logHandle, {context: this});
        this.dbo = null;
        this.connectToMongo();
        return this;
    }

    /**
     * Connect to the mongodb.
     * This will set the this.connect to a re-callable
     * promise that others can use to get the db instance.
     * @return {Promise}
     * @private
     * @example 
     * let myconnection = this.connectToMongo()
     *     .then(function(db){
     *         let mycollection = db.collection('mycollection');
     *     });
     */
    connectToMongo(){
        let self = this;
        return this.connect = mongo.MongoClient.connect(this.url, {useNewUrlParser: true})
            .then(function(client) {
                self.dbo = client.db('db');
                self.logger.info('connected to database')
                return self.dbo;
            })
            .catch(function(err){
                self.logger.error('failed to connect to db');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }
}

/**
 * A static instance of the database controller so 
 * that multiple connections are not required.
 * @example 
 * let myconnection = Database.instance.connect()
 *     .then(function(db){
 *         let mycollection = db.collection('mycollection');
 *     });
 */
Database.instance = new Database();

/**
 * A mongodb collection (ie table).
 * Connects to a collection via Database.instance.
 */
class DatabaseCollection {

    /**
     * Constructor.
     * @param {string} name - name of the collection
     * @return {DatabaseCollection}
     */
    constructor(name){
        this.name = name;
        this.db = null;
        this.collection = null;
        this.logHandle = name + "Collection";
        this.logger = new Logger(this.logHandle, this);
        let self = this;
        Database.instance.connect.then(function(db){
            self.db = db;
            self.collection = db.collection(name);
            self.logger.info('connected');
        })
        .catch(function(err){
            self.logger.error('failed to connect');
            self.logger.error(err);
        });
        return this;
    }

    /**
     * Process a filter object used for queries.
     * If the filter has an _id property, replace
     * it with a new mongo.ObjectID.
     * @param {object} filter 
     * @return {object}
     */
    processFilter(filter){
        if(typeof filter._id !== "undefined"){
            filter._id = new mongo.ObjectID(filter._id);
        }
        return filter;
    }

    /**
     * Drop the collection
     * @return {Promise}
     */
    drop(){
        let self = this;
        return this.collection.drop()
            .then(function(){
                self.logger.info('Dropped collection');
                return
            })
            .catch(function(err){
                self.logger.error('Failed to drop collection');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Wipe the collection
     * @return {Promise}
     */
    wipe(){
        let self = this;
        return this.collection.deleteMany({})
            .then(function(){
                self.logger.info('Wiped collection');
                return
            })
            .catch(function(err){
                self.logger.error('Failed to wipe collection');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }
}

module.exports = {Database, DatabaseCollection};