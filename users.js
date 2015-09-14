var bcrypt   = require('bcrypt-nodejs');

var accessValues = ["create", "tag", "browse", "stats", "admin"];

var tomConfig = require('../../config/tom.js');

var elasticsearch = require('elasticsearch');
var esclient = elasticsearch.Client({
    host: tomConfig.elasticsearch.addr + ':' + tomConfig.elasticsearch.port
});

var usermodel =(function () {
    "use strict";

    var getUser, getUsersByQuery, updateUserGetModified, deleteUser;

    getUser = function (parameters, callback) {
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomUserIndex
        }, function () {
            esclient.get({
                index: tomConfig.elasticsearch.tomUserIndex,
                type: tomConfig.elasticsearch.tomUserType,
                id: parameters.id
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        });
    };

    getUsersByQuery = function (parameters, callback) {
        var from = 0,
            size = 100;

        if (parameters.from) {
            from = parameters.from;
        }
        if (parameters.size) {
            size = parameters.size;
        }
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomUserIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomUserIndex,
                type: tomConfig.elasticsearch.tomUserType,
                from: from,
                size: size,
                body: parameters.query
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.hits.hits);
                }
            });
        });
    };

    updateUserGetModified = function (parameters, callback) {
        var param = {"query": parameters.query, "size" : 1};
        getUsersByQuery(param, function (err, result) {
            if (err) {
                return callback(err);
            } else {
                // if there is no result to work with, just carry on
                if (result == undefined || result.length <= 0) {
                    return callback();
                }
                console.log("parameters.doc is: " + JSON.stringify(parameters.doc));
                esclient.update({
                    index: tomConfig.elasticsearch.tomUserIndex,
                    type: tomConfig.elasticsearch.tomUserType,
                    id: result[0]._id,
                    body: {
                        doc: parameters.doc
                    }
                }, function (err1, result1) {
                    if (err1) {
                        callback(err1);
                    } else {
                        getUsersByQuery(param, function(err2, result2) {
                            if (err2) {
                                return callback(err2);
                            } else {
                                // return the modified document
                                callback(null, result2);
                            }
                        });
                    }
                });
            }
        });
    };

    deleteUser = function (parameters, callback) {
        esclient.indices.refresh({index: tomConfig.elasticsearch.tomIndex
        }, function () {
            esclient.delete({
                index: tomConfig.elasticsearch.tomUserIndex,
                type: tomConfig.elasticsearch.tomUserType,
                id: parameters.id
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        });
    };

    return {
        getUser: getUser,
        getUsersByQuery: getUsersByQuery,
        updateUserGetModified: updateUserGetModified,
        deleteUser: deleteUser
    };

}());


exports.getList = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    exports.getUserListCallback(function(userData) {
        res.jsonp(userData);
    });
};

exports.password = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var userid = req.param('userid');
    var password = req.param('password');

    if (userid && password) {
        SetUserPassword(userid, password, function(err, numberAffected) {
            var result = updateUserHandler(userid, err, numberAffected);
            res.jsonp(result);
            log(result.msg);
        });
    } else {
        console.log("password: Userid (" + userid + ") not supplied or password (" + password + ") empty!")
    }
};

exports.delete = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var userid = req.param('userid');

    console.log("Deleting user with id '" + userid + "'");

    if (userid) {
        DeleteUser(userid, function(err, numberAffected) {
            var result = updateUserHandler(userid, err, numberAffected);
            res.jsonp(result);
            log(result.msg);
        });
    } else {
        console.log("delete: Userid (" + userid + ") not supplied!")
    }
};

exports.access = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var userid = req.param('userid');
    var access = req.param('access');
    var value = req.param('value');

    if (userid) {
        SetUserAccess(userid, access, value, function(err, numberAffected) {
            var result = updateUserHandler(userid, err, numberAffected);
            res.jsonp(result);
            log(result.msg);
        });
    } else {
        console.log("access: Userid (" + userid + ") not supplied!")
    }
};

var SetUserAccess = function(userid, access, value, callback) {

    var findQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": userid.toLowerCase()
                        }
                    }
                ]
            }
        }
    };

    var updateQuery = { "access": {} };
    updateQuery.access[access] = (value === "true") ? true : false;

    var parameters = {"query": findQuery, "doc": updateQuery, "size": 1};

    usermodel.updateUserGetModified(parameters, function(err, result){
        if (err) {
            //Error: updating a user's access
            console.log("Error: " + err + " - while updating an access of a user: " + userid);
            if (callback != null) {
                callback(err, null);
            }

        } else {
            if (callback != null) {
                callback(null, result.length);
            }
        }
    });
};

var SetUserPassword = function(userid, password, callback) {
    var findQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": userid.toLowerCase()
                        }
                    }
                ]
            }
        }
    };

    var hashPw = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

    var updateQuery = {"password": hashPw };
    var parameters = {"query" : findQuery, "doc": updateQuery, "size": 1};

    usermodel.updateUserGetModified(parameters, function(err, result){
        if (err) {
            //Error setting a password for a user
            console.log("Error: " + err + " - while setting the password of a user: " + userid);
            if (callback != null) {
                callback(err, null);
            }

        } else {
            if (callback != null) {
                callback(null, result.length);
            }
        }
    });
};

var DeleteUser = function(userid, callback) {
    var findQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": userid.toLowerCase()
                        }
                    }
                ]
            }
        }
    };
    var findParameters = {"query": findQuery, "size": 1};

    usermodel.getUsersByQuery(findParameters, function(err, result) {
        if (err) {
            // Error getting user by query
            console.log("ERROR: " + err + " while retrieving a user: " + userid);
            if (callback != null) {
                callback(err, null);
            }
        } else {
            // Retrieved a user
            result = result[0];

            usermodel.deleteUser(result._source, function(deleteErr, deleteResult) {
                if (deleteErr) {
                    //Error deleting a user doc
                    console.log("Error: " + deleteErr + " - while deleting the user: " + userid);
                    if (callback != null) {
                        callback(deleteErr, null);
                    }

                } else {
                    if (callback != null) {
                        callback(null, deleteResult.length);
                    }
                }
            });
        }
    });
};

exports.getUserListCallback = function(callback) {
    // Elasticsearch
    var resultData = [];
    var userQuery = {
        "query": {
            "match_all": {}
        },
        "sort": [
            {
                "lasttagdate": {
                    "order": "desc"
                }
            }
        ]
    };

    var queryParameter = {"query": userQuery};

    usermodel.getUsersByQuery(queryParameter, function(e, userData) {
        if (e) {
            log("Error getting list of users: " + e );
        }

        // If an access right is missing, fill it in with value=false
        if (typeof(userData) != 'undefined') {
            userData.forEach( function(doc) {
                for (var i = 0; i < accessValues.length; i++) {
                    if (doc._source.access[accessValues[i]] == null) {
                        doc._source.access[accessValues[i]] = false;
                    }
                }
                // Change from {"id" : "..."} -> {"_id": "..."}
                doc._source._id = doc._source.id;
                delete doc._source.id;
                resultData.push(doc._source);
            });
        }

        callback(resultData);
    });
};

function log(s) {
    var date = new Date();
    console.log(date.toDateString() + " " + date.toLocaleTimeString() + ": " + s);
}

var updateUserHandler = function(userid, err, numberAffected) {
    var result = {};
    if (err) {
        result = {
            status : "error",
            msg : err
        };
    } else if (numberAffected == 0) {
        result = {
            status : "error",
            msg : "No user with id '" + userid + "'!"
        };
    } else {
        result = {
            status : "ok",
            msg : "User with id '" + userid + "' updated!"
        };
    }

    return result;
};

