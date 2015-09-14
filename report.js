/**
 * Module dependencies.
 */

async = require('async');

var config = global.config;

var tomConfig = require('../../config/tom.js');

var elasticsearch = require('elasticsearch');
var esclient = elasticsearch.Client({
    host: tomConfig.elasticsearch.addr + ':' + tomConfig.elasticsearch.port
});

var batchmodel =(function () {
    "use strict";

    var getBatch, getBatchesByQuery;

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

    return {
        getBatch: getBatch,
        getBatchesByQuery: getBatchesByQuery
    };

}());

// Elasticsearch tom image model
var fypphoto = (function () {
    //Elasticsearch image model
    "use strict";

    var aggregate;

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
        aggregate: aggregate
    };
}());

function log(s) {
    var date = new Date();
    console.log(date.toDateString() + " " + date.toLocaleTimeString() + ": " + s);
}

function getDateQuery(field, startDate, endDate) {
    var dateQuery = {
        "range" : {}
    };

    if (typeof(startDate) != 'undefined' && startDate != "") {
        if (typeof(endDate) != 'undefined' && endDate != "") {
            // Both startDate and endDate are valid
            dateQuery.range[field] = {"gte" : startDate, "lte": endDate};
        } else {
            // Only startDate is valid
            dateQuery.range[field] = {"gte" : startDate};
        }

    } else {
        if (typeof(endDate) != 'undefined' && endDate != "") {
            // Only endDate is valid
            dateQuery.range[field] = {"lte": endDate};
        } else {
            // Neither startDate nor endDate are not valid
            log("getDateQuery: Neither startDate nor endDate are provided");
        }
    }

    return dateQuery;
}

function getCorrectiondateQuery(startDate, endDate) {
    return getDateQuery("timecorrected", startDate, endDate);
}


function getTagdateQuery(startDate, endDate) {
    return getDateQuery("timetagged", startDate, endDate);
}


function getAddedDateQuery(startDate, endDate) {
    return getDateQuery("timeadded", startDate, endDate);
}


function getRemovedDateQuery(startDate, endDate) {
    return getDateQuery("removedDate", startDate, endDate);
}


function getAggregate(aggregate, callback) {
    var jsonRecords = [];

    log("Elasticsearch aggregate query is " + JSON.stringify(aggregate.query));

    fypphoto.aggregate(aggregate, function(err, data) {
        if (err) {
            log("Error: '" + err + "'");
            jsonRecords.push({"error": err});
        }

        if (data) {
            jsonRecords.push(data);
        }

        callback(jsonRecords);
    });
}

exports.getTagsByUser = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var startDate = new Date(Number(req.param('start')));
    var endDate = new Date(Number(req.param('end')));

    var tagsByUserResults = [];
    var queryMustPart = getTagdateQuery(startDate, endDate);
    var tagsByUserQuery = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": [
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
        "aggs": {
            "taggedBy": {
                "terms": {
                    "field": "taggedby",
                    "size" : 0
                },
                "aggs" : {
                    "numTagged": {
                        "terms": {
                            "field": "tagged",
                            "size": 0
                        }
                    },
                    "numCorrected" : {
                        "terms" : {
                            "field" : "corrected",
                            "size": 0
                        }
                    }
                }
            }
        },
        "size": 0
    };
    tagsByUserQuery.query.filtered.filter.bool.must.push(queryMustPart);
    var tagsByUserQueryParameter = {"query": tagsByUserQuery};

    getAggregate(tagsByUserQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            tagsByUserResults.push(results);
            res.jsonp(tagsByUserResults);

        } else {
            results.taggedBy.buckets.forEach(function(doc) {
                var tagsByUserDoc = {};
                tagsByUserDoc._id = doc.key;

                tagsByUserDoc.tagged = 0;
                tagsByUserDoc.corrected = 0;
                if (doc.numTagged.buckets.length > 0) {
                    doc.numTagged.buckets.forEach(function(taggedDoc) {
                        if (taggedDoc.key == "T") {
                            tagsByUserDoc.tagged = taggedDoc.doc_count;
                        }
                    });
                }

                if (doc.numCorrected.buckets.length > 0) {
                    doc.numCorrected.buckets.forEach(function(correctedDoc) {
                        if (correctedDoc.key == "T") {
                            tagsByUserDoc.corrected = correctedDoc.doc_count;
                        }
                    });
                }

                tagsByUserResults.push(tagsByUserDoc);
                tagsByUserDoc = null;

            });
            res.jsonp(tagsByUserResults);
        }
    });
};

exports.getCorrectionsByUser = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var startDate = new Date(Number(req.param('start')));
    var endDate = new Date(Number(req.param('end')));

    var correctionsByUserResults = [];
    var queryMustPart = getCorrectiondateQuery(startDate, endDate);
    var correctionsByUserQuery = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "corrected": true
                                }
                            }
                        ]
                    }
                }
            }
        },
        "aggs" : {
            "correctedBy" : {
                "terms" : {
                    "field" : "correctedby",
                    "size" : 0
                }
            }
        },
        "size": 0
    };
    correctionsByUserQuery.query.filtered.filter.bool.must.push(queryMustPart);
    var correctionsByUserQueryParameter = {"query" : correctionsByUserQuery};

    getAggregate(correctionsByUserQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            correctionsByUserResults.push(results);
            res.jsonp(correctionsByUserResults);

        } else {
            results.correctedBy.buckets.forEach( function(doc) {
                var correctionDoc = {};
                correctionDoc._id = doc.key;
                correctionDoc.corrected = doc.doc_count;

                correctionsByUserResults.push(correctionDoc);
                correctionDoc = null;
            });

            res.jsonp(correctionsByUserResults);
        }
    });

};

exports.getTagRateByUser = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var startDate = new Date(Number(req.param('start')));
    var endDate = new Date(Number(req.param('end')));

    var queryMustPart = getTagdateQuery(startDate, endDate);
    var tagRateByUserResults = [];

    var tagRateByUserQuery = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": [
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
            "taggedBy" : {
                "terms" : {
                    "field" : "taggedby",
                    "size" : 0
                },
                "aggs" : {
                    "mindate" : {
                        "min" : {
                            "field" : "timetagged"
                        }
                    },
                    "maxdate" : {
                        "max" : {
                            "field" : "timetagged"
                        }
                    }
                }
            }
        },
        "size": 0
    };

    tagRateByUserQuery.query.filtered.filter.bool.must.push(queryMustPart);
    var tagRateByUserQueryParameter = {"query" : tagRateByUserQuery};

    // The 0 there is the key, which sets the date to the epoch
    var minDate = new Date(0);
    var maxDate = new Date(0);

    getAggregate(tagRateByUserQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            tagRateByUserResults.push(results);
            res.jsonp(tagRateByUserResults);

        } else {
            results.taggedBy.buckets.forEach( function(doc) {
                var tagRateByUserDoc = {};
                tagRateByUserDoc._id = doc.key;
                tagRateByUserDoc.tagged = doc.doc_count;

                minDate.setUTCSeconds(doc.mindate.value);
                tagRateByUserDoc.mindate = minDate;

                maxDate.setUTCSeconds(doc.maxdate.value);
                tagRateByUserDoc.maxdate = maxDate;

                tagRateByUserResults.push(tagRateByUserDoc);
                tagRateByUserDoc = null;
            });

            res.jsonp(tagRateByUserResults);
        }
    });
};

exports.getTagRateByTime = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var period = req.param('period');
    var startDate = new Date(Number(req.param('start')));
    var endDate = new Date(Number(req.param('end')));

    var timeTagResults = [];
    var queryMustPart = getTagdateQuery(startDate, endDate);
    var dateFormat = null;
    var timeInterval = null;

    switch (period) {
        case "hour":
            dateFormat = "date_hour";
            timeInterval = "hour";
            break;
        case "minute":
            dateFormat = "date_hour_minute";
            timeInterval = "minute";
            break;
        case "month":
            dateFormat = "year_month";
            timeInterval = "month";
            break;
        case "dayOfMonth":
            dateFormat = "year_month_day";
            timeInterval = "day";
            break;
        case "dayOfWeek":
            dateFormat = "basic_week_date";
            timeInterval = "day";
            break;
    }

    var tagRateByTimeQuery  = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": [
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
            "timeTaggedRange" : {
                "date_histogram" : {
                    "field" : "timetagged"
                },
                "aggs" : {
                    "numCorrectedImages" : {
                        "terms" : {
                            "field" : "corrected",
                            "size" : 0
                        }
                    },
                    "mindate" : {
                        "min" : {
                            "field" : "timetagged"
                        }
                    },
                    "maxdate" : {
                        "max" : {
                            "field" : "timetagged"
                        }
                    }
                }
            }
        },
        "size": 0,
        "sort": [
            {
                "timetagged": {
                    "order": "asc"
                }
            }
        ]
    };

    tagRateByTimeQuery.query.filtered.filter.bool.must.push(queryMustPart);
    tagRateByTimeQuery.aggs.timeTaggedRange.date_histogram.format = dateFormat;
    tagRateByTimeQuery.aggs.timeTaggedRange.date_histogram.interval = timeInterval;

    var tagRateByTimeQueryParameter = {"query" : tagRateByTimeQuery};

    // The 0 there is the key, which sets the date to the epoch
    var minDate = new Date(0);
    var maxDate = new Date(0);

    getAggregate(tagRateByTimeQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            timeTagResults.push(results);
            res.jsonp(timeTagResults);

        } else {
            results.timeTaggedRange.buckets.forEach (function (doc) {
                var tagByTimeDoc = {};
                tagByTimeDoc._id = doc.key_as_string;

                minDate.setUTCSeconds(doc.mindate.value);
                tagByTimeDoc.mindate = minDate;

                maxDate.setUTCSeconds(doc.maxdate.value);
                tagByTimeDoc.maxdate = maxDate;

                tagByTimeDoc.tagged = doc.doc_count;
                tagByTimeDoc.corrected = 0;
                if (doc.numCorrectedImages.buckets.length > 0) {
                    doc.numCorrectedImages.buckets.forEach( function(correctedDoc) {
                        if (correctedDoc.key == "T") {
                            tagByTimeDoc.corrected = correctedDoc.doc_count;
                        }
                    });
                }
                timeTagResults.push(tagByTimeDoc);
                tagByTimeDoc = null;

            });

            res.jsonp(timeTagResults);
        }
    });
};

exports.getMlsUpdateByType = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var startDate = new Date(Number(req.param('start')));
    var endDate = new Date(Number(req.param('end')));

    var addedPart = getAddedDateQuery(startDate, endDate);
    var removedPart = getRemovedDateQuery(startDate, endDate);

    var mlsResults = [];
    var removedData = {"_id" : "removed", "count": 0},
        addedData = {"_id" : "added", "count": 0};


    var mlsQuery = {
        "query" : {
            "filtered" : {
                "filter" : {
                    "bool" : {
                        "should" : []
                    }
                }
            }
        },
        "aggs" : {
            "numRemovedImages" : {
                "terms" : {
                    "field" : "removed",
                    "size" : 0
                }
            }
        },
        "size": 0
    };

    mlsQuery.query.filtered.filter.bool.should.push(addedPart);
    mlsQuery.query.filtered.filter.bool.should.push(removedPart);
    var mlsQueryParameter = {"query" : mlsQuery};

    getAggregate(mlsQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            mlsResults.push(results);
            res.jsonp(mlsResults);

        } else {

            results.numRemovedImages.buckets.forEach ( function(doc) {
                if (doc.key == "T") {
                    // When removed == true
                    removedData.count = doc.doc_count;

                } else {
                    // When removed == false
                    addedData.count = doc.doc_count;
                }
            });

            mlsResults.push(removedData);
            mlsResults.push(addedData);
            res.jsonp(mlsResults);
        }
    });

};

exports.getAllImagesByType = function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    var allImagesResults = [];
    var allRemovedData = {"_id": true, "tagged": 0, "total": 0},
        allActiveData = {"_id": false, "tagged": 0, "total": 0};

    var allImagesQuery = {
        "query": {
            "filtered": {
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            }
        },
        "aggs": {
            "numRemoved": {
                "terms": {
                    "field": "removed",
                    "size": 0
                },
                "aggs" : {
                    "numTaggedImages" : {
                        "terms" : {
                            "field" : "tagged",
                            "size" : 0
                        }
                    }
                }
            }
        },
        "size": 0
    };
    var allImagesQueryParameter = {"query" : allImagesQuery};

    getAggregate(allImagesQueryParameter, function(results) {
        results = results[0];
        if (results.hasOwnProperty("error")) {
            allImagesResults.push(results);
            res.jsonp(allImagesResults);

        } else {
            // Reformat the results before passing them to client-side
            results.numRemoved.buckets.forEach ( function(doc) {
                if (doc.key == "F") {
                    // When removed == false
                    allActiveData.total = doc.doc_count;
                    doc.numTaggedImages.buckets.forEach ( function(activeDoc) {
                        if (activeDoc.key == "T") {
                            allActiveData.tagged = activeDoc.doc_count;
                        }
                    });

                } else {
                    // When removed == true
                    allRemovedData.total = doc.doc_count;
                    doc.numTaggedImages.buckets.forEach ( function(removedDoc) {
                        if (removedDoc.key == "T") {
                            allRemovedData.tagged = removedDoc.doc_count;
                        }
                    });

                }
            });
            allImagesResults.push(allRemovedData);
            allImagesResults.push(allActiveData);
            res.jsonp(allImagesResults);
        }
    });
};

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
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

function getBatchListCallback(callback, limit) {
    if (limit) {
        // size of the elasticsearch result
        options.limit = limit;
    }

    var batchQuery = {
        "query": {
            "match_all": {}
        },
        "sort": [
            {
                "createdate": {
                    "order": "desc",
                    "missing": "_last"
                }
            }
        ]
    };
    var batchParameters = {"query": batchQuery, "size": limit};
    batchmodel.getBatchesByQuery(batchParameters, function(e, batchData) {
        if (e) {
            log("Error getting global meta: " + e );
        }
        callback(batchData);
    });
}

exports.getBatchTotal = function(req, res) {
    var attribute = req.param('attribute');

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    getBatchListCallback(function(batchlist) {
        var result = [];

        batchlist.forEach( function(doc) {
            if (doc._source.approved) {
                if (typeof(doc._source.total) != 'undefined' && typeof(doc._source.total.total) != 'undefined' &&
                doc._source.total.total) {
                    result.push({
                        batch: doc._source.id,
                        createdate: doc._source.createdate,
                        approvedate: doc._source.approvedate,
                        total: doc._source.total});
                }
            }
        });

        res.jsonp(result);
    });
};

/*
 * Returns a json array of batches.
 * Every batch contains an array of combination of attributes.
 * Every attribute contains the tag count and correction count for that attribute combination.
 */
exports.getAttributeByBatch = function(req, res) {
    var attribute = req.param('attribute');
    var limit = parseInt(req.param('limit'));

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    getBatchListCallback(function(batchlist) {
        var result = {};
        var count = 0;

        batchlist.forEach( function(doc) {
            if (doc._source.approved && (!limit || count < limit)) {
                var batchName = getBatchName(doc._source.createdate);
                log("Got batch: " + doc + " = " + batchName);
                var resultAttr = [];
                var stats = doc._source.stats;

                if (typeof(stats) != 'undefined') {
                    stats.forEach ( function(statDoc) {
                        if (statDoc.type == attribute) {
                            resultAttr.push(statDoc);
                        }
                    });
                }

                result[batchName] = resultAttr;
                count++;
            }
        });

        res.jsonp(result);
    });
};