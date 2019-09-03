const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Logger = require('@voliware/logger');
const {DatabaseCollection} = require('./database');
const mailer = require('./mailer');

const USER_LOGGER = new Logger('User', {level:Logger.level.debug});

/**
 * User session
 */
class UserSession {

    /**
     * Constructor
     * @return {UserDocument}
     */
    constructor(){
        this.browser = "";
        this.id = "";
        this.ip = "";
        return this;
    }
    
    /**
     * Generate a random session id.
     * @return {Promise}
     */
    static async generateSessionId(){
        USER_LOGGER.debug('Generating session id');
        return new Promise(function(resolve, reject){
            crypto.randomBytes(32, function(err, buffer){
                let sessionId = buffer.toString('hex');
                USER_LOGGER.debug(`Generated session id ${sessionId}`);
                resolve(sessionId);
            });
        });
    }
}

/**
 * User document
 */
class UserDocument {

    /**
     * Constructor
     * @return {UserDocument}
     */
    constructor(){
        this.email = "";
        this.browser = "";
        this.friends = [];
        this.ip = "";      
        this.level = UserDocument.level.user;  
        this.lastLoginDate = 0;
        this.registerDate = 0;
        this.sessions = [];
        return this;
    }

    /**
     * Create a hash of a password
     * @param {string} password
     * @return {Promise}
     */
    static hashPassword(password){
        return bcrypt.hash(password, 10)
            .then(function(hash) {
                return hash;
            })
            .catch(function(err){
                USER_LOGGER.error("Failed to hash password");
                return Promise.reject(err)
            });
    }
    
    /**
     * Validate a password against a hash
     * @param {string} password
     * @param {string} hash
     * @return {Promise}
     */
    static validatePassword(password, hash){
        return bcrypt.compare(password, hash)
            .then(function(isValid){
                if(isValid){
                    USER_LOGGER.debug("Password is valid");
                }
                else {
                    USER_LOGGER.debug("Password is invalid");
                }
                return isValid;
            })
            .catch(function(err){
                USER_LOGGER.error("Failed comparing hash password");
                return Promise.reject(err);
            });
    }
}
UserDocument.level = {
    admin: 0,
    user: 1,
    string: [
        "Admin",
        "User"
    ]
};

/**
 * User collection
 * @extends {DatabaseCollection}
 */
class UserCollection extends DatabaseCollection {

    /**
     * Constructor
     * @return {UserCollection}
     */
    constructor(){
        super("user");
        return this;
    }

    /**
     * Delete a user from the collection.
     * @param {object} filter 
     * @return {Promise}
     */
    deleteUser(filter){
        this.logger.debug('Deleting user with filter');
        this.logger.debug(filter);

        filter = this.processFilter(filter);
        let self = this;
        return this.collection.deleteOne(filter)
            .then(function(result){
                if(result.n){
                    self.logger.info('Deleted user');
                }
                else {
                    self.logger.debug('Did not delete any users');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to delete user');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Delete all users from the collection
     * @return {Promise}
     */
    deleteAllUsers(){
        this.logger.debug('Deleting all users');

        let self = this;
        return this.collection.drop()
            .then(function(){
                self.logger.info('Deleted all users');
            })
            .catch(function(err){
                self.logger.error('Failed to delete all users (no table)');
                self.logger.error(err);
                return Promise.resolve();
            });
    }

    /**
     * Find a user from the collection
     * @param {object} filter - query filter
     * @return {Promise}
     */
    getUser(filter){
        this.logger.debug('Getting user with filter');
        this.logger.debug(filter);

        filter = this.processFilter(filter);
        let self = this;
        return this.collection.findOne(filter)
            .then(function(element) {
                if(element){
                    self.logger.debug('Got user');
                    self.logger.debug(element);
                }
                else {
                    self.logger.debug('Did not find user');
                }
                return element;
            })
            .catch(function(err){
                self.logger.error('Failed to query user');
                self.logger.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Insert a user into the collection
     * @param {object} user
     * @param {string} user.email
     * @param {string} user.passwordHash
     * @param {string[]} [user.friends]
     * @param {number} [user.level]
     * @param {number} [user.lastLoginDate]
     * @param {number} [user.registerDate]
     * @return {Promise}
     */
    insertUser(user){
        this.logger.debug('Inserting user with data');
        this.logger.debug(user);

        let self = this;
        return this.collection.insertOne(user)
            .then(function(res) {
                if(res.insertedCount){
                    self.logger.info('Inserted user into db');
                    return res;
                }
                else {
                    return Promise.reject('Inserted count was 0');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to insert user into db');
                self.logger.error(err);
                return Promise.reject(err)
            });
    }

    /**
     * Update a user in the collection
     * @param {object} filter
     * @param {object} user
     * @param {string} [user.email]
     * @param {string} [user.passwordHash]
     * @param {string[]} [user.friends]
     * @param {number} [user.level]
     * @param {number} [user.lastLoginDate]
     * @param {number} [user.registerDate]
     * @return {Promise}
     */
    updateUser(filter, user){
        this.logger.debug('Inserting user with data');
        this.logger.debug(user);

        let self = this;
        filter = this.processFilter(filter);
        return this.collection.updateOne(filter, user)
            .then(function(res) {
                if(res.modifiedCount){
                    self.logger.info('Updated user in db');
                    return res;
                }
                else {
                    return Promise.reject('Modified count was 0');
                }
            })
            .catch(function(err){
                self.logger.error('Failed to update user in db');
                self.logger.error(err);
                return Promise.reject(err)
            });
    }
}

/**
 * App for all user related things.
 */
class UserApp {
    
    /**
     * Constructor
     * @return {UserApp}
     */
    constructor(){
        this.userCollection = new UserCollection();
        this.logger = new Logger("UserApp", this);
        return this;
    }

    /**
     * Login a user.
     * Find the user based on email.
     * Validate the supplied password.
     * Log them in if the password is valid.
     * Add a new session to their session list.
     * @param {string} email 
     * @param {string} password - plaintext password
     * @param {string} ip
     * @param {string} browser 
     * @return {Promise}
     */
    loginUser(email, password, ip, browser){
        this.logger.debug("Logging in user with data");
        this.logger.debug(`email:${email}, password:***, ip:${ip}, browser:${browser}`);

        let self = this;
        let _userElement = null;
        let _sessionId = null;
        return this.userCollection.getUser({email})
            .then(function(element){
                if(element){
                    _userElement = element;
                    return UserDocument.validatePassword(password, element.password);
                }
                else {
                    return Promise.reject(UserApp.error.loginFail);
                }
            })
            .then(function(isValid){
                if(isValid){
                    return UserSession.generateSessionId();
                }
                else {
                    return Promise.reject(UserApp.error.loginFail);
                }
            })
            .then(function(sessionId){
                _sessionId = sessionId;
                // remove any old sessions
                let filter = {_id: _userElement._id};
                let params = {
                    $pull: {
                        sessions: {ip, browser}
                    }
                };
                return self.userCollection.updateUser(filter, params)
                    .catch(function(err){
                        // it's fine if it did not remove a session
                        return Promise.resolve();
                    })
            })
            .then(function(){
                // add session data
                let filter = {_id: _userElement._id};
                let sessionData = {
                    $addToSet: {
                        sessions: {sessionId: _sessionId, ip, browser}
                    }
                }
                return self.userCollection.updateUser(filter, sessionData);
            })
            .then(function(){
                // hashed, but.. no
                delete _userElement.password;
                return {user: _userElement, sessionId: _sessionId};
            })
            .catch(function(err){
                self.logger.error(`Failed to login user ${email}`);
                self.logger.error(err);
                return Promise.reject(err)
            });
    }

    /**
     * Get a user with session data.
     * The sessionId, ip, and browser must match at
     * least one object the sessions array of a user document.
     * @param {object} sessionId 
     * @param {string} ip 
     * @param {string} browser 
     * @return {Promise}
     */
    getUserWithSessionData(sessionId, ip, browser){
        let self = this;
        let filter = {
            sessions: {
                $elemMatch: {sessionId, ip, browser}
            }
        }
        return this.userCollection.getUser(filter)
            .then(function(element){
                if(element){
                    // hashed, but.. no
                    delete element.password;
                    return element;
                }
                else {
                    return Promise.reject("User not found with supplied session data");
                }
            })
            .catch(function(err){
                self.logger.error('Failed to get user with session data');
                return Promise.reject("Please login with credentials")
            });
    }

    /**
     * Logout a user based on their session id.
     * Remove the session from the collection.
     * @param {string} sessionId
     * @return {Promise}
     */
    logoutUser(sessionId){
        let filter = {
            sessions: {
                $elemMatch: {sessionId}
            }
        };
        let params = {
            $pull: {
                sessions: {sessionId}
            }
        };
        return this.userCollection.updateUser(filter, params)
            .then(function(){
                self.logger.info('Logged out user');
            })
            .catch(function(err){
                self.logger.error('Failed to logout user');
                return Promise.reject(err);
            })
    }

    /**
     * Register a user.
     * Performs a check for email uniqueness.
     * Hashes the incoming password.
     * Inserts the user into the collection.
     * @param {string} email
     * @param {string} password
     * @return {Promise}
     */
    registerUser(email, password){
        let self = this;
        return this.userCollection.getUser({email})
            .then(function(element){
                if(!element){
                    return UserDocument.hashPassword(password);
                }
                else {
                    self.logger.debug(`User ${email} already exists`);
                    return Promise.reject(UserApp.error.userExists);
                }
            })        
            .then(function(hash){
                return self.userCollection.insertUser({
                    email: email,
                    password: hash,
                    registerDate: Date.now(),
                    level: UserDocument.level.user
                });
            })
            .then(function(result){
                // result.ops[0]
                self.logger.info(`Registered user ${email}`);
            })
            .catch(function(err){
                self.logger.error(`Failed to register user ${email}`);
                self.logger.error(err);
                return Promise.reject(err)
            });
    }

    /**
     * Reset a password.
     * Find the user based on the email.
     * Generate a password code.
     * Insert the password code into the collection.
     * Send the password reset email.
     * @param {string} email 
     * @return {Promise}
     */
    resetPassword(email){
        let self = this;
        let user = null;
        return this.getUser({email})
            .then(function(_user){
                if(!_user){
                    return Promise.reject(UserApp.error.userNotFound);
                }

                user = _user;
                let code = self.generateRandomHex();
                if(!code){
                    return Promise.reject(UserApp.error.resetPasswordFail);
                }

                return self.insertResetPasswordCode(user, code);
            })
            .then(function(data){
                return self.sendResetPasswordEmail(user, data.code);
            })
            .catch(function(err){
                self.logger.error(`Failed to reset password for user ${email}`);
                return Promise.reject(err)
            });
    }

    /**
     * Send an email to a user with the reset password link.
     * @param {User} user 
     * @param {string} code 
     * @return {Promise}
     */
    sendResetPasswordEmail(user, code){
        let mail = {
            from: "Todo",
            to: user.email,
            subject: "Password Reset Request",
            text: "You've requested to reset your password. " +
                  "Please click this link to reset it. " +
                  "http://http://localhost:3000/reset?code= " + code,
            //html: ""
        }
        
        return mailer.sendMail(mail);
    }
}
UserApp.error = {
    userExists: "A user with this email already exists",
    userNotFound: "The user was not found",
    loginFail: "The email or password is incorrect",
    resetPasswordFail: "Failed to reset password"
};

module.exports = {UserApp};