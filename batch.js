var tomConfig = require('../../config/tom.js');

var elasticsearch = require('elasticsearch');
var esclient = elasticsearch.Client({
    host: tomConfig.elasticsearch.addr + ':' + tomConfig.elasticsearch.port
});

var batchmodel =(function () {
    "use strict";

    var getBatch, getBatchesByQuery, updateBatchGetModified;

    getBatch = function (parameters, callback) {
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomBatchIndex
        }, function () {
            esclient.get({
                index: tomConfig.elasticsearch.tomBatchIndex,
                type: tomConfig.elasticsearch.tomBatchType,
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

    getBatchesByQuery = function (parameters, callback) {
        var from = 0,
            size = 100;

        if (parameters.from) {
            from = parameters.from;
        }
        if (parameters.size) {
            size = parameters.size;
        }
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomBatchIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomBatchIndex,
                type: tomConfig.elasticsearch.tomBatchType,
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

    updateBatchGetModified = function (parameters, callback) {
        var param = {"query": parameters.query, "size" : 1};
        getBatchesByQuery(param, function (err, result) {
            if (err) {
                return callback(err);
            } else {
                // if there is no result to work with, just carry on
                if (result == undefined || result.length <= 0) {
                    return callback();
                }
                esclient.update({
                    index: tomConfig.elasticsearch.tomBatchIndex,
                    type: tomConfig.elasticsearch.tomBatchType,
                    id: result[0]._id,
                    body: {
                        doc: parameters.doc
                    }
                }, function (err1, result1) {
                    if (err1) {
                        callback(err1);
                    } else {
                        getBatchesByQuery(param, function(err2, result2) {
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
        getBatch: getBatch,
        getBatchesByQuery: getBatchesByQuery,
        updateBatchGetModified: updateBatchGetModified
    };

}());

// Elasticsearch tom image model
var fypphoto = (function () {
    //Elasticsearch image model
    "use strict";

    var getImage, getImagesByids, getImagesByQuery, bulkUpdateImages,
        updateImageGetOriginal, updateImageGetModified, aggregate;

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

    aggregate = function(parameters, callback) {
        esclient.indices.refresh({
            index: tomConfig.elasticsearch.tomImageIndex
        }, function () {
            esclient.search({
                index: tomConfig.elasticsearch.tomImageIndex,
                type: tomConfig.elasticsearch.tomImageType,
                body: parameters.query
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.aggregations);
                }
            });
        });
    };

    return {
        getImage: getImage,
        getImagesByids: getImagesByids,
        getImagesByQuery: getImagesByQuery,
        bulkUpdateImages: bulkUpdateImages,
        updateImageGetOriginal : updateImageGetOriginal,
        updateImageGetModified: updateImageGetModified,
        aggregate: aggregate
    };
}());

exports.getBatchList = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    exports.getBatchListCallback(function(batchData) {
        res.jsonp(batchData);
    });
};

exports.getBatchInfoList = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var skip = req.param('skip');
    var limit = req.param('limit');

    exports.getBatchInfoListCallback(function(batchInfoData) {
        res.jsonp(batchInfoData);
    }, skip, limit);
};

exports.approveBatch = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var batch = req.param('id');
    var username = req.user.username

    SetApproveBatch(batch, true, username, function(err, numberAffected) {
        var result = updateBatchHandler(batch, err, numberAffected);
        res.jsonp(result);
        log(result.msg);
    });

    updateBatchStats(batch);
};

exports.unApproveBatch = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var batch = req.param('id');
    var username = req.user.username;

    SetApproveBatch(batch, false, username, function(err, numberAffected) {
        var result = updateBatchHandler(batch, err, numberAffected);
        res.jsonp(result);
        log(result.msg);
    });
};

exports.saveBatchComment = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var data = req.body;
    var username = req.user.username;

    SetBatchComment(data.batch, data.comment, username, function(err, numberAffected) {
        var result = updateBatchHandler(data.batch, err, numberAffected);
        res.jsonp(result);
        log(result.msg);
    });

};

exports.getBatchStats = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var batch = req.param('id');

    getBatchAttributeStats(batch, function(data) {
        log("Got stats for " + batch + ": " + JSON.stringify(data));
        res.jsonp(data);
    });

};

function updateBatchStats(batch) {
    getBatchAttributeStats(batch, function(data) {
        getBatchTotals(batch, function(totals) {
            var batchFindQuery = {
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "id": batch
                                }
                            }
                        ]
                    }
                }
            };
            var batchUpdateQuery = {"stats": data, "total": totals};
            var batchParameters = {"query": batchFindQuery, "doc": batchUpdateQuery};

            log("Updating stats for " + batch + ": " + JSON.stringify(batchUpdateQuery));

            batchmodel.updateBatchGetModified(batchParameters, function (batcherr, batchresult){
                console.log("Updated batch '" + batch + "' with stats!");
                if (batcherr) {
                    console.log("BATCH STATS UPDATE ERROR: " + batcherr + ", RESULT: " + batchresult);
                }

            });
        });
    });
}

function getBatchName(theDate) {
    var d = new Date(theDate);
    var name = ((d.getUTCFullYear() - 2000) + "").lpad("0", 2);
    name += ((d.getUTCMonth() + 1) + "").lpad("0", 2);
    name += (d.getUTCDate() + "").lpad("0", 2);
    name += "-";
    name += (d.getUTCHours() + "").lpad("0", 2);
    name += (d.getUTCMinutes() + "").lpad("0", 2);

    return name;
}

exports.getBatch = function(batch, callback) {
    var query = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": batch
                        }
                    }
                ]
            }
        }
    };
    var parameters = {"query" : query, "size" : 1};
    batchmodel.getBatchesByQuery(parameters, function(err, batchData) {
        if (err) {
            log("Error getting batch '" + batch + "': " + err);
        }
        if (batchData == null) {
            callback(batch);
        } else {
            // Change the name of the field "id" to "_id"
            batchData[0]._source._id = batchData[0]._source.id;
            delete batchData[0]._source.id;
            callback(batchData);
        }
    });
};

function getBatchAttributeStats(batchid, callback) {
    var aggregateQuery = {
        "query": {
            "filtered": {
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
                                    "tagged": true
                                }
                            }
                        ]
                    }
                }
            }
        },
        "aggs" : {
            "tagsAttrList" : {
                "nested" : {
                    "path" : "tags.attrList"
                },
                "aggs" : {
                    "roomType" : {
                        "terms" : {
                            "field" : "tags.attrList.name",
                            "size" : 0
                        },
                        "aggs" : {
                            "roomValue" : {
                                "terms" : {
                                    "field" : "tags.attrList.value",
                                    "size" : 0
                                },
                                "aggs" : {
                                    "numCorrected" : {
                                        "reverse_nested" : {},
                                        "aggs" : {
                                            "NumCorrected" : {
                                                "terms" : {
                                                    "field" : "corrected",
                                                    "size" : 0
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "sort": [
            {
                "batch": {
                    "order": "asc"
                }
            }
        ],
        "size": 0
    };

    var batch = exports.getBatch(batchid, function(batch) {
        var batchName = getBatchName(batch.createdate);
        log("Executing aggregate for batch '" + batchName + "'");

        getAggregate(aggregateQuery, function(results) {
            results = results[0];
            var result = [];
            if (!results.hasOwnProperty("error")) {
                if (results.tagsAttrList.roomType.buckets.length > 0) {
                    results.tagsAttrList.roomType.buckets.forEach( function(doc) {
                        if (doc.key != "displayphoto" && doc.key != null && doc.key != "" && doc.roomValue.buckets.length > 0) {
                            doc.roomValue.buckets.forEach( function (nestedDoc) {
                                var item = {
                                    type: doc.key,
                                    name: nestedDoc.key,
                                    total: nestedDoc.doc_count,
                                    corrected: 0
                                };
                                if (nestedDoc.numCorrected.NumCorrected.buckets.length > 0) {
                                    nestedDoc.numCorrected.NumCorrected.buckets.forEach( function (correctedDoc) {
                                        if (correctedDoc.key != 'undefined' && correctedDoc.hasOwnProperty("key") && correctedDoc.key == "T") {
                                            item.corrected = correctedDoc.doc_count;
                                        }
                                    })
                                }
                                result.push(item);
                            })
                        }
                    });
                }
            }

            callback(result);
        });
    });
}

function getBatchTotals(batchid, callback) {
    var query = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "batch": batchid
                                }
                            }
                        ]
                    }
                }
            }
        },
        "aggs": {
            "numImages": {
                "terms": {
                    "field": "batch",
                    "size": 0
                },
                "aggs": {
                    "numCorrectedImages": {
                        "terms": {
                            "field": "corrected",
                            "size": 0
                        }
                    },
                    "startDate": {
                        "min" : {
                            "field" : "timetagged"
                        }
                    },
                    "endDate" : {
                        "max" : {
                            "field" : "timetagged"
                        }
                    },
                    "taggers" : {
                        "terms" : {
                            "field" : "taggedby"
                        }
                    }
                }
            }
        },
        "size": 0
    };
    var parameters = {"query" : query};
    var resultData = {};

    // The 0 there is the key, which sets the date to the epoch
    var startDate = new Date(0);
    var endDate = new Date(0);
    var batchTotalResults = [];
    getAggregate(parameters, function (results) {

        results = results[0];
        if (results.hasOwnProperty("error")) {
            batchTotalResults.push(results);
            callback(batchTotalResults);

        } else {
            if (results.numImages.buckets.length > 0) {
                results = results.numImages.buckets[0];
                resultData.total = results.doc_count;
                resultData.corrected = 0;
                results.numCorrectedImages.buckets.forEach (function (doc) {
                    if (doc.key == "T") {
                        resultData.corrected = doc.doc_count;
                    }
                });
                startDate.setUTCSeconds(results.startDate.value);
                resultData.start = startDate;

                endDate.setUTCSeconds(results.endDate.value);
                resultData.end = endDate;
                console.log
                if (results.taggers.buckets.length > 0) {
                    resultData.taggers = results.taggers.buckets[0].key;
                } else {
                    resultData.taggers = null;
                }
            }
            callback(resultData);

        }
    });
}

var SetApproveBatch = function(batchId, state, username, callback) {
    var batchFindQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": batchId
                        }
                    }
                ]
            }
        }
    };
    var batchUpdateQuery = {"approved": state};

    if (state) {
        batchUpdateQuery.approvedate = new Date();
    }
    var parameters = {"query" : batchFindQuery, "size" : 1, "doc": batchUpdateQuery};

    batchmodel.updateBatchGetModified(parameters, function(batcherr, batchresult){
        if (batcherr) {
            console.log("BATCH UPDATE ERROR: " + batcherr + ", RESULT: " + batchresult);
        }

        if (state) {

            var imgFindQuery = {
                "query": {
                    "filtered": {
                        "filter": {
                            "bool": {
                                "must_not": [
                                    {
                                        "exists": {
                                            "field": "timeapproved"
                                        }
                                    }
                                ],
                                "must": [
                                    {
                                        "term": {
                                            "batch": batchId
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            };

            var imgUpdateQuery = {"timeapproved": getDateTime(), "approvedby": username};

            var imageQueryParameter = {"query": imgFindQuery};
            var imageUpdateParameters = {"doc": imgUpdateQuery};

            fypphoto.getImagesByQuery(imageQueryParameter, function(err, imgResults) {
                if (err) {
                    // Error : getting images
                    console.log("IMAGE UPDATE ERROR: " + err + ", RESULT: 0 update");

                } else {
                    imageUpdateParameters.images = imgResults;
                    fypphoto.bulkUpdateImages(imageUpdateParameters, function(updateErr, updateResults) {
                        if (callback != null) {
                            callback(null, batchresult.length);
                        }
                    });
                }
            });

        } else {
            console.log("Batch '" + batchId + "' was unapproved, but images left untouched");
            callback();
        }
    });
};

var SetBatchComment = function(batch, comment, username, callback) {
    var findQuery = {
        "filter": {
            "bool": {
                "must": [
                    {
                        "term": {
                            "id": batch
                        }
                    }
                ]
            }
        }
    };
    var updateQuery = {"comments": comment };
    var batchParameters = {"query": findQuery, "doc": updateQuery};

    batchmodel.updateBatchGetModified(batchParameters, function (err, result) {
        if (callback != null) {
            console.log("ERROR: " + err + ", RESULT: " + result);
            callback(err, result.length);
        }
    });
};

var updateBatchHandler = function(batch, err, numberAffected) {
    var result = {};
    if (err) {
        result = {
            status : "error",
            msg : err
        };
    } else if (numberAffected == 0) {
        result = {
            status : "error",
            msg : "No batch with id '" + batch + "'!"
        };
    } else {
        result = {
            status : "ok",
            msg : "Batch '" + batch + "' updated!"
        };
    }

    return result;
};

exports.getBatchListCallback = function(callback) {
    var query = {
        "query": {
            "match_all": {}
        },
        "sort": [
            {
                "createdate": {
                    "order": "desc"
                }
            }
        ]
    };
    var parameters = {"query" : query};

    batchmodel.getBatchesByQuery(parameters, function(err, result) {
        if (err) {
            log("Error getting list of batches: " + err);
        }

        var batchData = [];
        if (result != undefined) {
            result.forEach(function (doc) {

                // Change the name of the field "id" to "_id"
                doc._source._id = doc._source.id;
                delete doc._source.id;
                batchData.push(doc._source);
            });
        }
        callback(batchData);
    });
};

exports.getBatchNamesCallback = function(callback) {
    var query = {
        "query": {
            "match_all": {}
        },
        "sort": [
            {
                "createdate": {
                    "order": "desc"
                }
            }
        ]
    };
    var parameters = {"query" : query};
    batchmodel.getBatchesByQuery(parameters, function(err, batchData) {
        if (err) {
            log("Error getting batches: " + err );
        }
        var names = {};
        if (batchData != undefined) {
            batchData.forEach(function(doc) {
                // Change name of the field "id" to "_id"
                doc._source._id = doc._source.id;
                delete doc._source.id;

                names[doc._source._id] = getBatchName(doc._source.createdate);
            });
        }
        callback(names);
    });
};

exports.getBatchInfoListCallback = function(callback, skip, limit) {
    var sortedData = [];

    var start = new Date();
    exports.getBatchListCallback(function(batchList) {
        var total = batchList.length;
        if (skip && limit) {
            batchList = batchList.splice(skip, limit);
        }

        var batchIds = [];
        for(var i = 0; i < batchList.length; i++) {
            batchIds.push(batchList[i]._id);
        }

        var end = new Date();

        var numImageQuery = {
            "query": {
                "filtered": {
                    "filter": {
                        "bool": {
                            "must": [
                                {
                                    "term": {
                                        "removed": false
                                    }
                                },
                                {
                                    "terms": {
                                        "batch": batchIds
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            "aggs": {
                "numImages": {
                    "terms": {
                        "field": "batch",
                        "size": 0
                    },
                    "aggs": {
                        "numTaggedImages": {
                            "terms": {
                                "field": "tagged",
                                "size": 0
                            }
                        }
                    }
                }
            },
            "size": 0
        };

        var numImageParameters = {"query": numImageQuery};
        var batchData = [];
        var batchResult = {};

        console.log(batchList.length + " batches took: " + (end-start) + " ms.");

        fypphoto.aggregate(numImageParameters, function(err, result) {
            if (err) {
                log("Error: " + err + " - while aggregating query: " + JSON.stringify(numImageQuery));
            } else {
                result = result.numImages.buckets;
                result.forEach (function (doc) {
                    batchResult._id = doc.key;
                    batchResult.numimages = doc.doc_count;
                    batchResult.numtagged = 0;
                    doc.numTaggedImages.buckets.forEach (function(nestedDoc) {
                        if (nestedDoc.key === "T") {
                            batchResult.numtagged = nestedDoc.doc_count;
                        }
                    });
                    batchData.push(batchResult);
                    batchResult = {};
                });

                console.log("Got " + batchData.length + " batches");
                for(var i = 0; i < batchData.length; i++) {
                    var batchInfo = batchData[i];

                    for(var j = 0; j < batchList.length; j++) {
                        if (("" + batchList[j]._id) == ("" + batchInfo._id)) {
                            var theBatch = JSON.parse(JSON.stringify(batchList[j]));

                            var newData = batchData[i];

                            newData.createdate = new Date(theBatch.createdate);
                            newData.approved = theBatch.approved;
                            newData.approvedate = theBatch.approvedate;
                            newData.comments = theBatch.comments;
                            newData.status = theBatch.status;

                            sortedData.push(newData);

                            batchList.splice(j, 1);
                        }
                    }

                    if (err) {
                        log("Error getting batch info: " + err );
                    }
                }

                for(var i = 0; i < batchList.length; i++) {
                    batchList[i].stats = null;

                    var newItem = batchList[i];

                    sortedData.push(newItem);
                }

                sortedData.sort(function(a, b) {
                    return b.createdate - a.createdate;
                });

                var end2 = new Date();
                console.log("Aggregate took: " + (end2 - end) + " ms.");

                callback({total: total, batches: sortedData});
            }
        });
    });
};

function log(s) {
    var date = new Date();
    console.log(date.toDateString() + " " + date.toLocaleTimeString() + ": " + s);
}

function getAggregate(aggregate, callback) {
    var jsonRecords = [];

    log("Elasticsearch getAggregate query is: " + JSON.stringify(aggregate.query));

    fypphoto.aggregate(aggregate, function(err, data) {
        if (err) {
            log("Error: '" + err + "'");
            jsonRecords.push({error:err});
        }

        if (data) {
            jsonRecords.push(data);
            //jsonRecords = data.numImages.buckets;
        }

        callback(jsonRecords);
    });
}

var getDateTime = function () {
    var now = new Date();
    return ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
        + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now
        .getSeconds()) : (now.getSeconds())));
};
