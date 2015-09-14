/**
 * Module dependencies.
 */

var sem = require('semaphore')(1);
var lockedMlsNumbers = [];

var FYP = {};
FYP.Batch = require('./batch');

var tomConfig = require('../../config/tom.js');

var elasticsearch = require('elasticsearch');
var esclient = elasticsearch.Client({
    host: tomConfig.elasticsearch.addr + ':' + tomConfig.elasticsearch.port
});

// Elasticsearch TOM usermodel
var usermodel =(function () {
    "use strict";

    var getUser, getUsersByQuery, updateUser;

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

    updateUser = function (parameters, callback) {
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomUserIndex
        }, function () {
            esclient.update({
                index: tomConfig.elasticsearch.tomUserIndex,
                type: tomConfig.elasticsearch.tomUserType,
                id: parameters.id,
                body: {
                    doc: parameters.doc
                }
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
        updateUser: updateUser
    };

}());

// Elasticsearch TOM imagemeta global_meta
var imagemeta = (function () {
    "use strict";

    var getImagemetasByQuery, createImagemeta, updateImagemeta;

    getImagemetasByQuery = function(parameters, callback) {
        var from = 0,
            size = 100;

        if (parameters.from) {
            from = parameters.from;
        }
        if (parameters.size) {
            size = parameters.size;
        }

        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomImagemetaIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomImagemetaIndex,
                type: tomConfig.elasticsearch.tomImagemetaType,
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

    createImagemeta = function (parameters, callback) {

        if (parameters.id) {
            esclient.create({
                index: tomConfig.elasticsearch.tomImagemetaIndex,
                type: tomConfig.elasticsearch.tomImagemetaType,
                id: parameters.id,
                body: parameters.body
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        } else {
            esclient.create({
                index: tomConfig.elasticsearch.tomImagemetaIndex,
                type: tomConfig.elasticsearch.tomImagemetaType,
                body: parameters.body
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
    };

    updateImagemeta = function(parameters, callback) {
        esclient.update({
            index: tomConfig.elasticsearch.tomImagemetaIndex,
            type: tomConfig.elasticsearch.tomImagemetaType,
            id: parameters.id,
            body: {
                doc: parameters.doc
            }
        }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    };

    return {
        getImagemetasByQuery: getImagemetasByQuery,
        createImagemeta: createImagemeta,
        updateImagemeta: updateImagemeta
    };

}());

// Elasticsearch tom image model
var fypphoto = (function () {
    //Elasticsearch image model
    "use strict";

    var getImage, getImagesByids, getImagesByQuery, bulkUpdateImages, countImages,
        updateImageGetOriginal, updateImageGetModified;

    getImage = function (parameters, callback) {
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomImageIndex
        }, function () {
            esclient.get({
                index: tomConfig.elasticsearch.tomImageIndex,
                type: tomConfig.elasticsearch.tomImageType,
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

    getImagesByids = function (parameters, callback) {
        var query = {
            "filter": {
                "terms": {
                    "_id": parameters.ids
                }
            }
        };
        if (parameters.sort) {
            query.sort = parameters.sort;
        }

        if (parameters.source) {
            query._source = parameters.source;
        }

        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomImageIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomImageIndex,
                type: tomConfig.elasticsearch.tomImageType,
                from: 0,
                size: parameters.ids.length,
                body: query
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.hits.hits);
                }
            });
        });
    };

    getImagesByQuery = function (parameters, callback) {
        var from = 0,
            size = 100;

        if (parameters.from) {
            from = parameters.from;
        }
        if (parameters.size) {
            size = parameters.size;
        }

        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomImageIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomImageIndex,
                type: tomConfig.elasticsearch.tomImageType,
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

    bulkUpdateImages = function (parameters, callback) {
        var query = {};
        query.body = [];
        parameters.images.forEach(function (image) {
                query.body.push({
                    index: {
                        _index: tomConfig.elasticsearch.tomImageIndex,
                        _type: tomConfig.elasticsearch.tomImageType,
                        _id: image._id
                    }
                });
                query.body.push({
                    doc: parameters.doc
                });
            }
        );
        esclient.bulk(query, function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    };

    countImages = function (parameters, callback) {
        var query = {"query" : parameters.query};
        getImagesByQuery(query, function(err, result) {
            if (err) {
                callback(err);
            } else {
                var count = result.length;
                callback(null, count);
            }

        });

    };

    updateImageGetOriginal = function (parameters, callback) {
        var param = {"query": parameters.query, "size" : 1};
        getImagesByQuery(param, function (err, result) {
            if (err) {
                return callback(err);
            } else {
                // if there is no result to work with, just carry on
                if (result == undefined || result.length <= 0) {
                    return callback();
                }
                esclient.update({
                    index: tomConfig.elasticsearch.tomImageIndex,
                    type: tomConfig.elasticsearch.tomImageType,
                    id: result[0]._id,
                    body: {
                        doc: parameters.doc
                    }
                }, function (err2, result2) {
                    if (err2) {
                        callback(err2);
                    } else {
                        // return the original document
                        callback(null, result);
                    }
                });
            }
        });
    };

    updateImageGetModified = function (parameters, callback) {
        var param = {"query": parameters.query, "size" : 1};
        getImagesByQuery(param, function (err, result) {
            if (err) {
                return callback(err);
            } else {
                // if there is no result to work with, just carry on
                if (result == undefined || result.length <= 0) {
                    return callback();
                }
                esclient.update({
                    index: tomConfig.elasticsearch.tomImageIndex,
                    type: tomConfig.elasticsearch.tomImageType,
                    id: result[0]._id,
                    body: {
                        doc: parameters.doc
                    }
                }, function (err1, result1) {
                    if (err1) {
                        callback(err1);
                    } else {
                        getImagesByQuery(param, function(err2, result2) {
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

    return {
        getImage: getImage,
        getImagesByids: getImagesByids,
        getImagesByQuery: getImagesByQuery,
        bulkUpdateImages: bulkUpdateImages,
        countImages : countImages,
        updateImageGetOriginal : updateImageGetOriginal,
        updateImageGetModified: updateImageGetModified
    };
}());

var http = require('http');
var https = require('https');
var correctionage = 14400;

var temp = require('temp');
var config = global.config;

var fs = require('fs')
    , path = require('path');

var numPreloadImages = 10;
var useCache = (config.cachedir != null);


function log(s) {
    var date = new Date();
    console.log(date.toDateString() + " " + date.toLocaleTimeString() + ": " + s);
}

function getMlsQuery(id) {
    if (typeof id == 'number') {
        id = "" + id;
    }

    var mlsQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mls_id": id
                        }
                    }
                ]
            }
        }
    };

    return mlsQuery;
}

function getSort() {
    //Elasticsearch sort array
    var sortBy = [
        {
            "timeadded": {
                "order": "asc",
                "missing": "_last"
            }
        },
        {
            "mls_source" : {
                "order" : "desc"
            }
        },
        {
            "mls_id": {
                "order": "asc"
            }
        }
    ];
    return sortBy;
}

exports.getTheImageById = function(id, mls_source, username, callback) {
    var query = getMlsQuery(id);
    var removeQuery = {
        "term" : {
            "removed" : false
        }
    };
    var mlsQuery = {
        "term" : {
            "mls_source" : mls_source
        }
    };
    query.filter.bool.must.push(removeQuery);
    query.filter.bool.must.push(mlsQuery);
    return getImage(query, username, callback);
};

function getNextImage(username, callback) {
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ]
            }
        }
    };
    var taggedQuery = {
        "term" : {
            "tagged" : false
        }
    };
    query.filter.bool.must.push(taggedQuery);

    var lockedQuery = {
        "bool": {
            "should": [
                {
                    "term": {
                        "locked": false
                    }
                },
                {
                    "term": {
                        "lockedby" : username
                    }
                }
            ]
        }
    };
    query.filter.bool.must.push(lockedQuery);
    return getImage(query, username, callback);
}

function getNextImageExcludingMls(excludeMlsArray, username, callback) {
    var activeQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ],
                "must_not" : []
            }
        }
    };
    var isUntagged = {
        "term" : {
            "tagged" : false
        }
    };
    var isUnlockedOrIsLockedByMe = {
        "bool": {
            "should": [
                {
                    "term" : {
                        "locked" : false
                    }
                },
                {
                    "term" : {
                        "lockedby": username
                    }
                }
            ]
        }
    };
    var isPriorityFix = {
        "term" : {
            "priorityFix" : true
        }
    };

    activeQuery.filter.bool.must.push(isPriorityFix);
    activeQuery.filter.bool.must.push(isUntagged);
    activeQuery.filter.bool.must.push(isUnlockedOrIsLockedByMe);

    // Split into two queries, indexes got extremely ineffective otherwise.
    return getImage(activeQuery, username, function(data) {
        if (data.status && data.status == 'noresults') {
            if (excludeMlsArray.length > 0) {
                for (var i = 0; i < excludeMlsArray.length; i++) {
                    var mlsId = excludeMlsArray[i][0];
                    var mlsSource = excludeMlsArray[i][1];
                    var excludeMlsIdTerm = {
                        "term" : {
                            "mlsNumber" : mlsId
                        }
                    };
                    var excludeMlsSourceTerm = {
                        "term": {
                            "mls_source": mlsSource
                        }
                    };
                    activeQuery.filter.bool.must_not.push({
                        "bool": {
                            "must": [
                                excludeMlsIdTerm,
                                excludeMlsSourceTerm
                            ]
                        }
                    });
                }

            }
            // Delete the isPriorityFix query
            activeQuery.filter.bool.must.splice(1, 1);


            getImage(activeQuery, username, callback);
        } else {
            log("getNextImageExcludingMls: Got " + data.mls_id + " which is a priority fix.");
            callback(data);
        }
    });

}

function getImage(query, username, callback) {
    // getImage by Elasticsearch
    log("User " + username + ", single query: '(" + JSON.stringify(query) + ").limit(" + numPreloadImages + ").sort(" + JSON.stringify(getSort()) + ")'");

    query.sort = getSort();
    var updateQuery = {"locked": true, "lockedby": username};
    var parameters = {"query" : query, "doc" : updateQuery};

    fypphoto.updateImageGetOriginal(parameters, function(err, data) {
        var errorResult = {};

        // No image found
        if(err || data == undefined || data.length <= 0) {
            var status = 'error';

            if (data == undefined) {
                status = "noresults";
                err = "No results";
            }

            errorResult = {
                status: status,
                msg: err
            };
            callback(errorResult);
        } else {
            data = data[0];

            if (data._source.tags === undefined ) {
                // data doc does not have tags (ie. data.tags is undefined)
                // Insert an empty object into data.tags
                data._source.tags = {
                    "corrections": [],
                    "coord" : {},
                    "attrList" : []
                };

            }

            if (data._source.locked == true && data._source.lockedby != username) {
                // Locked image
                err = "Image locked by " + data._source.lockedby + ".";
                errorResult = {
                    mls_id: data._source.mls_id,
                    mls_source: data._source.mls_source,
                    status: 'locked',
                    lockedby: data._source.lockedby,
                    msg: err
                };
                callback(errorResult);

            } else {
                // Unlocked image
                delete data._source.histogram;

                var result = JSON.parse(JSON.stringify(data._source));


                FYP.Batch.getBatch(data._source.batch, function(batchData) {
                    if (batchData != null) {
                        result.batch = batchData._source;
                    }

                    getMetaListCallback(function(metaData) {
                        if(metaData != null) {
                            result.metaList = metaData.metaList;
                        }

                        callback(result);
                    });
                });
            }
        }
    });
}

function getNextMlsNumber(excludeMlsArray, username, callback) {
    sem.take(function() {
        log("Getting next property except '" + excludeMlsArray.join(',') + "'..");
        getNextImageExcludingMls(excludeMlsArray, username, function(result) {
            if (result.status) {
                log("Got error: " + JSON.stringify(result));
                sem.leave();
                callback(result);
            } else if (result == undefined) {
                var error = {
                    status: "error",
                    msg: "Got no results when getting next image"
                };
                log("Got error: " + JSON.stringify(error));
                sem.leave();
                callback(error);
            } else {
                LockProperty(result, username, function(err, result){
                    if (err != null) {
                        result = {
                            mlsNumber: result.mlsNumber,
                            mls_source: result.mls_source,
                            status: err
                        };
                        log("Couldn't lock property '" + JSON.stringify(result) + "'! - " + err);
                    } else {
                        log("Mls number: " + result.mlsNumber + ", from MLS:" + result.mls_source + " updated " + result.updated + " images");
                    }
                    sem.leave();
                    log("User " + username + " got next image from property : '" + result.mlsNumber + "'" + ", from MLS: " + result.mls_source);
                    callback(result);
                });
            }
        });
    });
}


exports.getPropertyImages = function (data, username, access, callback) {

    var result  = {};
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mlsNumber": data.mlsNumber
                        }
                    },
                    {
                        "term": {
                            "removed": false
                        }
                    },
                    {
                        "term": {
                            "mls_source": data.mls_source
                        }
                    }
                ],
                "must_not": []
            }
        },
        "sort": [

            {
                "timeadded": {
                    "order": "asc"
                }
            },
            {
                "mls_source" : {
                    "order": "desc"
                }
            }
        ]
    };

    var isAdmin = (access['admin'] == true);

    /*
     Disabled because of performance problems.
     */
    if (!isAdmin) {
        var correctedNotExistQuery = {
            "exists": {
                "field": "corrected"
            }
        };
        query.filter.bool.must_not.push(correctedNotExistQuery);
    }

    result.property = data.mlsNumber;
    result.mls_source = data.mls_source;

    var parameter = {"query": query};

    fypphoto.getImagesByQuery(parameter, function(err, imageResult){
        var errorResult = {};
        if(err) {
            var status = 'error';

            errorResult = {
                status: status,
                msg: err
            };
            callback(errorResult);

        } else if (imageResult.length === 0) {
            var status = 'error';
            var err = "No results";

            errorResult = {
                status: status,
                msg: err
            };
            callback(errorResult);

        } else {
            result.images = [];

            FYP.Batch.getBatchNamesCallback(function(batchlist) {
                imageResult.forEach( function(doc) {
                    var imageData = JSON.parse(JSON.stringify((doc._source)));
                    delete imageData.histogram;

                    imageData.batch = {
                        _id: imageData.batch,
                        name: batchlist[imageData.batch]
                    };


                    if (imageData.tags === undefined ) {
                        // if imageData does not have a 'tags' field (ie. imageData.tags is undefined)
                        // insert an empty 'tags' into imageData.tags
                        // so that untagged images does not cause issues on client-side
                        imageData.tags = {
                            "corrections": [],
                            "coord" : {},
                            "attrList" : []
                        };
                    }

                    result.images.push(imageData);
                });

                getMetaListCallback(function(metaData) {
                    if(metaData != null) {
                        result.metaList = metaData.metaList;
                    }

                    callback(result);
                });
            });
        }
    });
};

function getMetaListCallback(callback) {
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "name": "global_meta"
                        }
                    }
                ]
            }
        }
    };
    var parameters = {"query": query, "size": 1};
    imagemeta.getImagemetasByQuery(parameters, function(err, metaData) {
        if (err) {
            log("Error getting global meta: " + err );
        }

        metaData = metaData[0]._source;

        // Change from {"id" : "..."} -> {"_id": "..."}
        metaData._id = metaData.id;
        delete metaData.id;
        callback(metaData);
    });
}

exports.getMetaList = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    getMetaListCallback(function(metaData) {
        res.jsonp(metaData);
    });
}

exports.getLockNextImage = function(req, res) {
    getNextImage(req.user.username, function(result) {
        //lock file
        if (!(result.status && result.status == 'noresults')) {
            LockImage(result.mls_id, req.user.username, function(err){
                if (err != null || result.mls_id == null) {
                    log("Couldn't lock image '" + JSON.stringify(result) + "'! - " + err);
                } else {
                    log("Image " + result.mls_id + " locked");
                }
            });
        }

        res.jsonp(result);
    });
};


exports.getPropertyById = function(req, res) {
    var parameters = req.param('idmls');
    var mlsIdAndMlsSource = parameters.split('-');

    var mlsIdAndSourcePair = {};
    mlsIdAndSourcePair.mlsNumber = mlsIdAndMlsSource[0];
    mlsIdAndSourcePair.mls_source = mlsIdAndMlsSource[1];

    log("Getting property by id: '" + mlsIdAndMlsSource[0] + "' from MLS: " + mlsIdAndMlsSource[1]);
    exports.getPropertyImages(mlsIdAndSourcePair, req.user.username, req.user.access, function(result) {
        res.jsonp(result);
    });
};

/**
 * This method can only unlock images locked by yourself. Others will stay locked.
 */
exports.unlockPropertyById = function(req, res) {
    var mlsIdAndSourceArray = req.param('idmls').split('-');

    var data = {};
    data.mls_id = mlsIdAndSourceArray[0];
    data.mls_source = mlsIdAndSourceArray[1];
    var username = req.user.username;

    UnlockProperty(data, username, function(err, numberAffected) {
        var result = {};
        if (err) {
            result = {
                status : "error",
                msg : err
            };
        } else if (numberAffected == 0) {
            result = {
                status : "error",
                msg : "No property with id '" + data.mlsNumber + +"', from MLS: '" + data.mls_source + "' !"
            };
        } else {
            result = {
                status : "ok",
                msg : numberAffected + " images in property '" + data.mlsNumber + "', from MLS: '"  + data.mls_source + "' unlocked!"
            };
        }
        res.jsonp(result);

        log(result.msg);
    });
};

exports.unlockImageById = function(req, res) {
    var image = req.param('id');

    UnlockImage(image, function(err, numberAffected) {
        var result = {};
        if (err) {
            result = {
                status : "error",
                msg : err
            };
        } else if (numberAffected == 0) {
            result = {
                status : "error",
                msg : "No image with id '" + image + "' from MLS: " + mls_source
            };
        } else {
            result = {
                status : "ok",
                msg : "Image '" + image + "' from MLS: '" + mls_source + "' unlocked!"
            };
        }

        res.jsonp(result);

        log(result.msg);
    });
};

exports.getLockNextProperty = function(req, res) {
    var excludeMlsArray = [];
    excludeMlsArray = excludeMlsArray.concat(lockedMlsNumbers);
    log("LOCKED is now: " + JSON.stringify(lockedMlsNumbers) + ", excluded is now: " + JSON.stringify(excludeMlsArray));

    if (req.param('notidmls')) {
        var notidArray = req.param('notidmls').split(',');
        log("notidArray: " + notidArray.join(','));
        notidArray.forEach(function(pair) {
            var lockedMlsNumberAndMlsSource = pair.split('-');
            excludeMlsArray.push(lockedMlsNumberAndMlsSource);
        });
    }

    var username = req.user.username;
    var access = req.user.access;

    log("lockedMlsNumbers: " + lockedMlsNumbers.join(','));
    log("Getting images for next property, except '" + excludeMlsArray.join(',') + "'");

    getNextMlsNumber(excludeMlsArray, username, function(data) {
        if (data.mlsNumber && data.mlsNumber.status) {
            res.jsonp(data);

        } else {
            var lockedMlsNumberAndMlsSource = [];
            lockedMlsNumberAndMlsSource.push(data.mlsNumber);
            lockedMlsNumberAndMlsSource.push(data.mls_source);
            lockedMlsNumbers.push(lockedMlsNumberAndMlsSource);

            log("LOCKED PROPERTY " + data.mlsNumber + " to user " + username);

            exports.getPropertyImages(data, username, access, function(resultImages) {
                if (!resultImages.status) {
                    res.jsonp(resultImages);

                    for (var i = 0; i < lockedMlsNumbers.length; i++) {
                        if (lockedMlsNumbers[i][0] == data.mlsNumber && lockedMlsNumbers[i][1] == data.mls_source) {
                            lockedMlsNumbers.splice(i, 1);
                        }
                    }
                    log("UNLOCKING PROPERTY " + data.mlsNumber + ", from MLS: " + data.mls_source);
                } else {
                    res.jsonp(resultImages);
                }
            });
        }
    });
};

exports.getImageById = function(req, res) {
    var id = req.param('id');
    var mls_source = req.param('mls');
    exports.getTheImageById(id, mls_source, req.user.username, function(result) {
        res.jsonp(result);
    });
};

var LockImage = function(imageId, username, callback) {
    var query = getMlsQuery(imageId);
    var updateQuery = {
        "locked" : true,
        "lockedby" : username,
        "timelocked" : getDateTime()
    };

    var parameters = {"query" : query, "doc" : updateQuery};

    fypphoto.updateImageGetModified(parameters, function(err, result) {
        callback(err, result);
    });
};

var LockProperty = function(data, username, callback) {
    //Elasticsearch
    var findQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mlsNumber": data.mlsNumber
                        }
                    },
                    {
                        "term": {
                            "locked": false
                        }
                    },
                    {
                        "term": {
                            "mls_source" : data.mls_source
                        }
                    }
                ]
            }
        }
    };


    var parameters = {"query" : findQuery};
    log("Locking property query: " + JSON.stringify(findQuery));
    fypphoto.getImagesByQuery(parameters, function(err, resultDocs) {
        var result = {};
        if (err || resultDocs == undefined || resultDocs.length <= 0) {
            err = "No images were locked!";
            result = {"mlsNumber": data.mlsNumber, "updated": 0, "mls_source": data.mls_source};
            callback(err, result);
        } else {
            var updateQuery = {"locked": true, "lockedby": username, "timelocked": getDateTime()};
            var param = {"doc": updateQuery, "images" : resultDocs};
            fypphoto.bulkUpdateImages(param, function(err2, resp2){
                result = {"mlsNumber": data.mlsNumber, "updated": resultDocs.length, "mls_source": data.mls_source};
                if (err != null) {
                    log("err in bulkUpdateImages: \n" + err);
                }
                callback(null, result);
            });
        }
    });

};

var UnlockProperty = function(data, username, callback) {

    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mlsNumber": data.mlsNumber
                        }
                    },
                    {
                        "term": {
                            "mls_source": data.mls_source
                        }
                    }
                ]
            }
        }
    };
    var updateQuery = {"locked": false, "timeunlocked": getDateTime()};
    var param = {"query": query, "doc": updateQuery};
    var lockedby = {
        "term" : {
            "lockedby" : username
        }
    };

    if (username) {
        query.filter.bool.must.push(lockedby);
    }

    fypphoto.getImagesByQuery(param, function (err, resultDocs) {
        if (err || resultDocs == undefined || resultDocs.length <= 0) {
            if (callback != null) {
                callback(err);
            }
        } else {
            param.images = resultDocs;
            fypphoto.bulkUpdateImages(param, function (err1, result1) {
                if (callback != null) {
                    callback(null, resultDocs.length);
                }
            });
        }
    });
};

var UnlockImage = function(imageData, callback) {
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mls_id": imageData.mls_id
                        }
                    },
                    {
                        "term": {
                            "mls_source": imageData.mls_source
                        }
                    }
                ]
            }
        }
    };
    var updateQuery = {"locked": false, "timeunlocked": getDateTime()};
    var param = {"query": query, "doc": updateQuery, "size": 1};
    fypphoto.getImagesByQuery(param, function(err, resultImage) {
        if (err || resultImage === undefined || resultImage.length < 0) {
            if (callback != null) {
                callback(err, 0);
            }
        } else {
            fypphoto.updateImageGetModified(param, function(err1, updatedQueryResult) {
                if (err1 || updatedQueryResult === undefined || updatedQueryResult.length < 0) {
                    if (callback != null) {
                        callback(err1, 0);
                    }
                } else {
                    if (callback != null) {
                        callback(null, updatedQueryResult.length);
                    }
                }
            });
        }
    });
};

function RegisterTagCount(data, username, callback) {
    var userQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "username": username.toLowerCase()
                        }
                    }
                ]
            }
        }
    };

    var param = {"query": userQuery, "size": 1};
    usermodel.getUsersByQuery(param, function(error, result) {
        if (error) {
            if (callback != null) {
                callback(error, null);
            }
        } else {
            var tagCounts = result[0]._source.tagcount + 1;
            var userId = result[0]._id;
            var userUpdateQuery = {lasttagdate: getDateTime(), tagcount: tagCounts};
            var parameters = {"doc": userUpdateQuery, "id": userId};
            usermodel.updateUser(parameters, function(error1, result1) {
                if (error1) {
                    if (callback != null) {
                        callback(error1, null);
                    }
                } else {
                    if (callback != null) {
                        callback(null, result1);
                    }
                }
            });
        }
    });
}

var getDateTime = function () {
    var now = new Date();
    return (now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "T" + now.getHours() + ":" +
    ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes()))  + ":" + ((now.getSeconds() < 10) ? ("0" + now
        .getSeconds()) : (now.getSeconds())) + "." + now.getMilliseconds() + "Z");
};

function saveImageTag(data, username, cb) {
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "mls_id": data.mls_id
                        }
                    },
                    {
                        "term": {
                            "mls_source": data.mls_source
                        }
                    }
                ]
            }
        }
    };
    var param = {"query" : query, "size": 1};

    fypphoto.getImagesByQuery(param, function(err, result) {

        // change from [{"field1" : "value1"}] -> {"field1" : "value1"}
        result = result[0]._source;

        if (!result.locked || result.lockedby == username) {
            var hasOrigTags = false;
            if (typeof(result.origtags) != 'undefined' && result.origtags.attrList.length > 0) {
                hasOrigTags = true;
            }
            var timeTagAge = result.timetagged ? (new Date() - result.timetagged) / 1000.0 : null;

            if (config.correctionage != undefined) {
                correctionage = config.correctionage;
                log("Set correction age to: " + correctionage);
            }

            log(result.mls_id + ": Image has tags: " + result.tagged + " and was tagged " + timeTagAge + " seconds ago. Limit: " + correctionage);

            if (result.tagged && typeof(result.tags) != 'undefined' && result.tags.attrList.length > 0 &&
                timeTagAge != null && timeTagAge > correctionage) {
                log(result.mls_id + ": Tag is old! This is a correction.");
                if (hasOrigTags) {
                    log("Image '" + result.mls_id + "' already corrected once. Keeping origtags.");
                } else {
                    log("Image '" + result.mls_id + "' already has tags. This is a correction!");
                    result.origtags.attrList = result.tags.attrList;
                }
                result.corrected = true;
                result.correctedby = username;
                result.timecorrected = getDateTime();
                result.tags = data.tags;
                result.priorityFix = false;
            } else {
                log("Image '" + result.mls_id + "' tagged for the first time.");
                result.timetagged = getDateTime();
                result.tagged = true;
                result.taggedby = username;
                result.tags = data.tags;
                result.priorityFix = false;
            }

//            log("Saving image tagging: " + JSON.stringify(result));
            log("Saving image tagging for image " + result.mls_id + " from mls_source: " + result.mls_source);
            // Save as quick as possible to set tagged flag.
            var saveImageQuery = {
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "mls_id": result.mls_id
                                }
                            },
                            {
                                "term": {
                                    "mls_source" : result.mls_source
                                }
                            }
                        ]
                    }
                }
            };
            var updateImageParameters = {"query": saveImageQuery, "doc": result};

            fypphoto.updateImageGetModified(updateImageParameters, function(err, savedImageTag) {
                if (err) {
                    if (cb != null) {
                        cb(err, null);
                    }
                } else {
                    if (cb != null) {
                        cb(null, savedImageTag[0]._source);
                    }
                }
            });

        } else {
            cb("User " + username + " lost image lock! Image is locked by: " + result.lockedby, result);
        }
    });
}

exports.saveImageTagging = function(req, res) {
    var data = req.body;

    // In older versions, post data was wrapped in a json element since, for strange reason, the numbers otherwise gets converted to strings.
    if (req.body.json != undefined) {
        data = JSON.parse(req.body.json);
    }

    var result = {
        status: null,
        msg: null
    };

    if (!data.mls_id) {
        log("Client tried to save image tag for non-image: " + JSON.stringify(data));
        result.status = "error";
        result.msg = "Client tried to save image tag for non-image: " + JSON.stringify(data);

        res.send(result);
    } else {
        var postProcessAfterSaveImage = function(err) {
            //move image
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if(err) {
                result.status = "error";
                result.msg = err;
            } else {
                result.status = "success";
            }

            res.send(result);
        };

        saveImageTag(data, req.user.username, function(err, savedImageTag) {
            if (!savedImageTag.tagged) {
                throw new Error("Tag flag not set! - " + savedImageTag.mls_id);
            }

            if (err) {
                log("Error saving image tag: " + err);
                result.status = "error";
                result.msg = err;

                res.send(result);
            }
            else {
                log("Unlocking image: " + data.mls_id + " from mls_source: " + data.mls_source);

                RegisterTagCount(savedImageTag, req.user.username);
                UnlockImage(data, function(err, numberAffected)
                {
                    if (err) {
                        log("Error unlocking image " + savedImageTag.mls_id + ": " + err);
                        postProcessAfterSaveImage(err);
                    } else if (numberAffected == 0) {
                        log("No images unlocked! " + savedImageTag.mls_id);
                        postProcessAfterSaveImage("No images unlocked!");
                    }
                    else{
                        //move to the next image
                        postProcessAfterSaveImage(err);
                    }
                })
            }
        });
    }
};

exports.saveImageMeta = function(req, res) {
    // ElasticSearch
    var data = req.body;
    var result = {
        status: null,
        msg: null
    };

    log("saveImageMeta: " + JSON.stringify(data));

    var postProcessAfterSaveImageMeta = function(err) {
        //move image
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if(err) {
            result.status = "error";
            result.msg = err;
        } else {
            result.status = "success";
        }

        res.send(result);
    };

    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "name": "global_meta"
                        }
                    }
                ]
            }
        }
    };
    var global_meta = {
        "name" : "global_meta",
        "metaList" : data.metaList
    };
    var param = {"query" : query, "size": 1};

    imagemeta.getImagemetasByQuery(param, function(err, result) {

        if (typeof result === 'undefined' || result.length <= 0) {
            // No matching doc. Therefore create a new imagemeta doc
            var parameter = {"body" : global_meta};
            imagemeta.createImagemeta(parameter, function(err2) {
                postProcessAfterSaveImageMeta(err2);
            });

        } else {
            // There is a matching doc. Update it accordingly based on updateQuery
            var updateQuery = {"metaList": data.metaList};
            var createParameters = {"id" : result[0]._source.id, "doc" : updateQuery};
            imagemeta.updateImagemeta(createParameters, function(err3, result3) {
                postProcessAfterSaveImageMeta(err3);
            });
        }
    });
};

exports.getImagesByFilter = function(req, res) {
    var json = req.body;
    var start = json.first;
    var limit = json.limit;

    var query = getQueryFromJson(json);
    query.sort = getSort();

    var jsonRecords = [];

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (start == null || limit == null) {
        var errorResult = {
            status: 'error',
            msg: "POST data incomplete. Need at least 'first' and 'limit' elements!"
        };

        res.jsonp(errorResult);
    } else {
        var parameters = {"query": query, "from": start, "size": limit};
        var filterQueryStart = new Date();

        fypphoto.getImagesByQuery(parameters, function (err, data) {
            var filterQueryEnd = new Date();
            log("Filter query: '" + JSON.stringify(parameters.query) + "' - " + (filterQueryEnd - filterQueryStart) + "ms");

            if (data != undefined && data.length > 0) {
                data.forEach(function (doc) {
                    if (useCache) {
                        // Client will generate the cached url
                        doc._source.url = undefined;
                    }
                    if (doc._source.tags != undefined) {
                        jsonRecords.push(doc._source);
                    }
                });
            }

            if (err) {
                jsonRecords.push({error: err});
            }

            res.jsonp(jsonRecords);
        });
    }
};

exports.getFilterItemCount = function(req, res) {
    var query = getQueryFromJson(req.body);
    var progressDate = undefined;
    var lastupdateDate = undefined;
    var batch = req.body.batch;
    var totalQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ]
            }
        }
    };
    var lockedQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "locked": true
                        }
                    },
                    {
                        "term": {
                            "tagged": false
                        }
                    },
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ]
            }
        }
    };

    if (batch != undefined) {
        totalQuery.filter.bool.must.push({
            "term" : {
                "batch" : batch
            }
        });
    }

    var lockedQueryParameters = {
        "query" : lockedQuery
    };
    var totalQueryParameters = {
        "query" : totalQuery
    };

    if (req.body.progressdate != undefined) {
        progressDate = new Date(Number(req.body.progressdate)).toISOString();
    }
    if (req.body.lastupdate != undefined) {
        lastupdateDate = new Date(Number(req.body.lastupdate)).toISOString();
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Count total number of images for this view

    var countStart = new Date();
    var parameters = {
        "query" : query
    };

    fypphoto.countImages(lockedQueryParameters, function (lockederr, lockedcount) {
        var totalStart = new Date();
        log("Locked count query: '" + JSON.stringify(lockedQuery) + "' - " + (totalStart - countStart) + "ms");

        fypphoto.countImages(totalQueryParameters, function (totalerr, totalcount) {
            var queryStart = new Date();
            log("Total count query: '" + JSON.stringify(totalQuery) + "' - " + (queryStart - totalStart) + "ms");

            fypphoto.countImages(parameters, function (err, count) {
                log("Count query: '" + JSON.stringify(query) + "' - from " + progressDate + " - " + (new Date() - queryStart) + "ms");

                var result = {};

                result.count = count;
                result.total = totalcount;
                result.locked = lockedcount;
                result.updated = [];
                if (batch != undefined) {
                    result.batch = batch;
                }

                if (progressDate != undefined) {
                    result.progressdate = progressDate;

                    // Count total number of images since startprogress date

                    var progressQuery = getQueryFromJson(req.body, progressDate);
                    var progressQueryParameters = {
                        "query" : progressQuery
                    };

                    fypphoto.countImages(progressQueryParameters, function (err, count1) {
                        result.countsince = count1;

                        log("Progress query: " + JSON.stringify(progressQuery) + ", with date: '" + progressDate + "'");

                        // Find images updated since last item fetch on client side (max 100)
                        if (lastupdateDate != undefined) {
                            var lastupdateQuery = getQueryFromJson(req.body, lastupdateDate);
                            lastupdateQuery.sort.push({
                                "timetagged" : {
                                    "order" : "desc"
                                }
                            });
                            lastupdateQuery.sort.push({
                                "mls_source" : {
                                    "order" : "desc"
                                }
                            });
                            var lastupdateQueryParameters = {
                                "query" : lastupdateQuery, "size" : 100
                            };
                            log("Lastupdate query: " + JSON.stringify(lastupdateQuery) + ", with date: '" + lastupdateDate + "'");
                            fypphoto.getImagesByQuery(lastupdateQueryParameters, function (err, data) {
                                var dataArray = [];

                                if (data != undefined) {
                                    data.forEach( function(doc) {
                                        dataArray.push(doc._source);
                                    });
                                    result.updated = dataArray;
                                }
                                res.jsonp(result);
                            });
                        } else {
                            res.jsonp(result);
                        }
                    });
                } else {
                    res.jsonp(result);
                }
            });
        });
    });
};

exports.getUntaggedImages = function(req, res) {
    var skip = req.param('skip');
    var limit = req.param('limit');
    var filter = req.param('filter');

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "removed": false
                        }
                    },
                    {
                        "term": {
                            "tagged": false
                        }
                    }
                ]
            }
        }
    };
    var isLocked = {
        "term": {
            "locked": true
        }
    };

    var filterParts = filter ? filter.split(',') : [];

    if (filterParts.indexOf('locked') >= 0) {
        query.filter.bool.must.push(isLocked);
    }

    log("Untagged query: '(" + JSON.stringify(query) + ").skip(" + skip + ").limit(" + limit + ").sort(" + JSON.stringify(getSort()) + ")'");

    query.sort = getSort();
    var parameters = {"query": query, "from": skip, "size": limit};

    fypphoto.getImagesByQuery(parameters, function (err, data) {

        var jsonRecords = [];

        if (data != undefined && data.length > 0) {
            data.forEach( function(doc) {
                //if (useCache) {
                //    // Client will generate the cache url
                //    doc._source.url = undefined;
                //}

                if (doc._source.tagged == false && typeof(doc._source.tags) === 'undefined') {
                    jsonRecords.push(doc._source);
                }
            });
        }

        res.jsonp(jsonRecords);

    });
};


exports.download = function(url, dest, tries, cb, errorcb) {

    var gotResponse = false;

    var responseHandler = function(response) {
        var contentLength = response.headers['content-length'];
        var readBytes = 0;
        gotResponse = true;

        var file = fs.createWriteStream(dest, { flags: 'wx' });

        if (response.statusCode == 200) {
            response.on('data', function (chunk) {
                readBytes += chunk.length;
                file.write(chunk);

                if (readBytes == contentLength) {
                    file.end();
                }
            });

            file.on('finish', function() {
                file.close();
                var stat = fs.statSync(dest);
                if (stat.size != contentLength) {
                    log("Error! File write was not complete for '" + dest + "'. Wrote " + stat.size + "/" + contentLength + " bytes");
                }
                cb(response, url);
            });
        } else {
            log("Get image " + url + " returned status " + response.statusCode);
            request.abort();
            if (errorcb != null) {
                errorcb(response, url);
            }
        }

        request.end();
    };

    var request = null;

    if (url.substring(0, 8) == 'https://') {
        request = https.request(url, responseHandler);
    } else if (url.substring(0, 7) == 'http://') {
        request = http.request(url, responseHandler);
    } else {
        throw new Error("Broken URL - " + url);
    }

    request.on('error', function (error) {
        if (errorcb != null) {
            errorcb(error, url);
        }
    });

    request.on('socket', function (socket) {
        socket.setTimeout(config.http_options.timeout);
        socket.on('timeout', function() {
            log("Socket timeout occurred!");
            request.abort();
            if (!gotResponse) {
                if (tries < config.http_options.retries) {
                    log("sendImage.download: Fetch failed for '" + url + "'. Retry " + tries + "/" + config.http_options.retries);
                    exports.download(url, dest, tries + 1, cb);
                } else {
                    log("sendImage.download: No more retries! Giving up.");
                    request.abort();
                    request.end();
                    if (errorcb != null) {
                        errorcb({message: "Error getting image after " + config.http_options.retries + " retries!"}, url);
                    }
                }
            }
        });
        socket.on('error', function(error) {
            if (errorcb != null) {
                log("Socket error occurred: " + error);
                errorcb(error, url);
            }
        });
        socket.on('close', function(had_error) {
            if (errorcb != null && had_error) {
                log("Socket close occurred with error");
                errorcb({message: "Socket closed"}, url);
            }
        });
    });

    request.end();
};

function adler32(data) {
    var MOD_ADLER = 65521;
    var a = 1, b = 0;

    var len = data.length;

    for (var i = 0; i < len; i++) {
        a += data[i];
        b += a;
    }

    a %= MOD_ADLER;
    b %= MOD_ADLER;

    return (b << 16) | a;
}

function writeImg(dest, res) {
    var stat = fs.statSync(dest);
    var img = fs.readFileSync(dest);

    var lastModDateStr = stat.mtime.toGMTString();

    if (!res.headersSent) {
        res.header('Last-Modified', lastModDateStr);
        res.header('Cache-control', 'public, max-age=86400');
        res.header('Pragma', 'public');
        res.header('Etag', '"' + adler32(img) + '"');

        res.header('Content-Length', stat.size);
        res.writeHead(res.statusCode, {'Content-Type': 'image/jpeg' });
        res.end(img, 'binary');
    }
}

function writeImgBase64(dest, res) {
    var stat = fs.statSync(dest);
    var data = fs.readFileSync(dest);

    var lastModDateStr = stat.mtime.toGMTString();

    if (!res.headersSent) {
        res.header('Last-Modified', lastModDateStr);
        res.header('Cache-control', 'public, max-age=86400');
        res.header('Pragma', 'public');
        res.header('Etag', '"' + adler32(data) + '"');

        if (res.statusCode == 200) {
            var str = data.toString('base64');
            res.header('Content-Length', str.length);
            res.writeHead(res.statusCode, {'Content-Type': 'text/plain' });
            res.end(str);
        } else {
            res.header('Content-Length', data.length);
            res.writeHead(res.statusCode, {'Content-Type': 'text/plain' });
            res.end(data);
        }
    } else {
        log("Not sending image! Headers already sent = broken image. Status code=" + res.statusCode);
    }
}

function getCacheFilename(mlsid) {
    if (config.cachedir) {
        return config.cachedir + mlsid + ".jpg";
    } else {
        return "./" + mlsid + ".jpg";
    }
}

exports.sendImageBase64 = function(req, res){
    getImageData(req.params.image, res, function(dest, res) {
        writeImgBase64(dest, res);

        if (useCache) {
            var end = new Date().getTime();
            log("Cached image to '" + dest + "'");
        } else {
            try {
                fs.unlink(dest);
            } catch (e) {
                log("Couldn't delete temp cache file '" + dest + "' - " + e);
            }
        }
    });
};

exports.sendImage = function(req, res){
    var mls_source = req.param('mls');
    getImageData(req.params.image, mls_source, res, function(dest) {
        writeImg(dest, res);

        if (useCache) {
            var end = new Date().getTime();
            log("Cached image to '" + dest + "'");
        } else {
            fs.unlink(dest);
        }
    });
};

function getImageData(filename, mls_source, res, callback) {
    var fs = require('fs');
    var dest = "";

    if (useCache) {
        dest = getCacheFilename(filename);
    } else {
        dest = temp.path({suffix: '.jpg'});
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (useCache && fs.existsSync(dest)) {
        callback(dest, res);
    } else {

        var query = getMlsQuery(filename);
        var mlsSourceQuery = {
            "term" : {
                "mls_source": mls_source
            }
        };
        query.filter.bool.must.push(mlsSourceQuery);

        var parameters = {"query": query, "size": 1};

        // get image url
        fypphoto.getImagesByQuery(parameters, function(err, image){
            if(err || image === undefined || image.length <= 0 ) {
                var errorResult = {
                    status: 'error',
                    msg: "Error finding image - " + err
                };
                res.jsonp(errorResult);
            }
            else
            {
                // change from [{"field1": "value1"}] -> {"field1": "value1"}
                image = image[0]._source;

                var url = image.url;

                if (!image.url || image.url == '') {
                    log("Image '" + image.mls_id + "' had no url element. Reverting to mls_url=" + image.mls_url);
                    url = image.mls_url;
                }

                //get image from the mls image server
                exports.download(url, dest, 1, function(response) {
                    callback(dest, res);
                }, function(error) {
                    log("Error fetching image '" + dest + "' - " + error.statusCode);
                    if (error.statusCode) {
                        res.writeHead(error.statusCode, {'Content-Type': 'text/plain' });
                    } else {
                        res.writeHead(500, {'Content-Type': 'text/plain' });
                        if (error.message) {
                            res.write(image.url + " - " + error.message);
                        }
                    }
                    res.end();
                });
            }
        });
    }
}

exports.getCountTagged = function(req, res){

    var result  = {};

    var hasTag = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "tagged": true
                        }
                    },
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ]
            }
        }
    };
    var hasTagParameters = {
        "query" : hasTag
    };
    var hasNoTag = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "tagged": false
                        }
                    },
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ]
            }
        }
    };
    var hasNoTagParameters = {
        "query" : hasNoTag
    };

    fypphoto.countImages(hasTagParameters, function(err, totalTagged){
        fypphoto.countImages(hasNoTagParameters, function(err, totalRemaining){
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');


            if(err) {
                result.status = "error";
                result.msg = err;
            } else {
                result.totalTagged = totalTagged;
                result.totalRemaining = totalRemaining;
            }
            res.send(result);
        });
    });
};


function getQueryFromJson(json, progressdate) {
    var filters = json.filter;
    var behaviour = json.behaviour;
    var startdate = json.startdate;
    var enddate = json.enddate;
    var filterUser = json.user;
    var filterBatch = json.batch;
    var filterCorrected = json.filterCorrected;
    var filterLocked = json.filterLocked;
    var query = {
        "filter" : {
            "bool" : {
                "must" : [
                    {
                        "term": {
                            "removed": false
                        }
                    }
                ],
                "should" : []
            }
        },
        "sort" : []
    };

    if (filterCorrected != undefined && filterCorrected != "") {
        query.filter.bool.must.push({
            "term": {
                "corrected": true
            }
        });
    }

    if (filterLocked != undefined && filterLocked != "") {
        query.filter.bool.must.push({
            "term": {
                "locked": true
            }
        });
    }

    if (behaviour == 'AND') {
        if (startdate != undefined && startdate != "") {
            if (progressdate != undefined && progressdate != "") {
                if (progressdate.getTime() > startdate) {
                    query.filter.bool.must.push({
                        "range": {
                            "timetagged": {
                                "gte": progressdate.getTime()
                            }
                        }
                    });
                } else {
                    query.filter.bool.must.push({
                        "range": {
                            "timetagged": {
                                "gte": startdate
                            }
                        }
                    });
                }
            } else {
                query.filter.bool.must.push({
                    "range": {
                        "timetagged": {
                            "gte": startdate
                        }
                    }
                });
            }
        }

        if (enddate != undefined && enddate != "") {
            query.filter.bool.must.push({
                "range": {
                    "timetagged": {
                        "lte" : enddate
                    }
                }
            });
        }
    }

    if (filterUser != undefined && filterUser != "") {
        query.filter.bool.must.push({
            "term": {
                "taggedby": filterUser
            }
        });
    }

    if (filterBatch != undefined && filterBatch != "") {
        query.filter.bool.must.push({
            "term": {
                "batch": filterBatch
            }
        });
    }

    if (filters != undefined && filters != "") {
        var subQuery = {
            "bool" : {
                "should" : []
            }
        };
        for(var j = 0; j < filters.length; j++) {
            var filter = filters[j];

            for(var key in filter) {
                if (filter[key] == '') {
                    subQuery.bool.should.push({
                        "bool": {
                            "must": [
                                {
                                    "nested" : {
                                        "path" : "tags.attrList",
                                        "query" : {
                                            "bool" : {
                                                "must_not" : [
                                                    {
                                                        "term" : {"tags.attrList.name" : key.toLowerCase()}
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                {
                                    "term" : {"tagged" : true}
                                }
                            ]
                        }
                    });

                    subQuery.bool.should.push({
                        "nested" : {
                            "path" : "tags.attrList",
                            "query" : {
                                "bool" : {
                                    "must" : [
                                        {
                                            "term" : {"tags.attrList.name" : key.toLowerCase()}
                                        },
                                        {
                                            "filtered" : {
                                                "filter" : {
                                                    "missing" : {
                                                        "field" : "tags.attrList.value"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    });

                } else {
                    if (filter[key].charAt(0) == '!') {
                        var nestedQuery = {
                            "nested" : {
                                "path" : "tags.attrList",
                                "query" : {
                                    "bool" : {
                                        "must" : [
                                            {
                                                "term" : {"tags.attrList.name" : key.toLowerCase()}
                                            }
                                        ],
                                        "must_not" : [
                                            {
                                                "term" : {"tags.attrList.value" : filter[key].slice(1).toLowerCase()}
                                            }
                                        ]
                                    }
                                }
                            }
                        };
                        query.filter.bool.must.push(nestedQuery);

                    } else {

                        var nestedQuery = {
                            "nested" : {
                                "path" : "tags.attrList",
                                "query" : {
                                    "bool" : {
                                        "must" : [
                                            {
                                                "term" : {"tags.attrList.name" : key.toLowerCase()}
                                            },
                                            {
                                                "term" : {"tags.attrList.value" : filter[key].toLowerCase()}
                                            }
                                        ]
                                    }
                                }
                            }
                        };
                        query.filter.bool.must.push(nestedQuery);

                    }

                }

            }
        }

        if (behaviour == 'AND') {
            query.filter.bool.must.push(subQuery);
        } else {
            query.filter.bool.should.push(subQuery);
        }

    } else {
        query.filter.bool.must.push({
            "term": {
                "tagged": true
            }
        });
    }

    return query;
}
