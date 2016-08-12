define(function (require) {
    'use strict';

    var $ = require('jquery');
    var schema = require('js-schema');

    function constructApiCall (endpoint) {
        return function (reqBody) {
            var deferred = $.Deferred();

            // Validate request schema
            var reqBodySchema = schema.fromJSON(endpoint.reqBody);
            if (!reqBodySchema(reqBody)) {
                deferred.reject({
                    msg: 'Request body does not conform to API specification',
                    method: endpoint.method,
                    route: endpoint.route,
                    reqBody: reqBody,
                    err: reqBodySchema.errors(reqBody)
                });
                return deferred.promise();
            }

            // Attempt API call
            $[endpoint.method](endpoint.route, reqBody)
                .then(
                    // Call succeeds
                    function (resBody) {
                        // Validate response schema
                        var resBodySchema = schema.fromJSON(endpoint.resBody);
                        if (!resBodySchema(resBody)) {
                            return deferred.reject({
                                msg: 'API call succeeded, but response body did not conform to specification',
                                method: endpoint.method,
                                route: endpoint.route,
                                reqBody: reqBody,
                                resBody: resBody,
                                err: resBodySchema.errors(resBody)
                            });
                        }

                        // Resolve promise with validated response
                        deferred.resolve(resBody);
                    },
                    // Call fails
                    function (err) {
                        deferred.reject({
                            msg: 'API call failed',
                            method: endpoint.method,
                            route: endpoint.route,
                            reqBody: reqBody,
                            err: err.responseJSON || err.responseText || err
                        });
                    }
                );

            // Return promise for the completion of the API call
            return deferred.promise();
        };
    }

    return function (apiSchema) {
        var apiClient = {};

        Object.keys(apiSchema).forEach(function (key) {
            apiClient[key] = constructApiCall(apiSchema[key]);
        });

        return apiClient;
    };
});
