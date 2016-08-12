var express = require('express');
var schema = require('js-schema');

module.exports = function (apiSchema, handlers) {
    if (!apiSchema) {
        throw new Error('API specification must be provided.');
    }

    if (!handlers) {
        throw new Error('Object of API handler functions must be provided.');
    }

    var router = express.Router();

    Object.keys(apiSchema).forEach(function (key) {
        var endpoint = apiSchema[key];

        // Ensure a handler function is provided
        if (typeof handlers[key] != 'function') {
            throw new Error('API handler function must be provided for endpoint "' + key + '".');
        }

        // Register the endpoint with the router
        router[endpoint.method](endpoint.route, function (req, res, next) {
            // Validate request schema
            var reqBodySchema = schema.fromJSON(endpoint.reqBody);
            if (!reqBodySchema(req.body)) {
                // Log the validation failure, if a logger is available
                if (req.log && req.log.warn) {
                    req.log.warn(
                        {
                            err: reqBodySchema.errors(req.body),
                            reqBody: JSON.stringify(req.body)
                        },
                        'Request does not conform to API specification'
                    );
                }

                // Return a "422 Unprocessable Entity" response
                return res.status(422).send({
                    msg: 'Request does not conform to API specification',
                    method: endpoint.method,
                    route: endpoint.route,
                    reqBody: req.body,
                    err: reqBodySchema.errors(req.body)
                });
            }

            // Pass the validated request on to the provided handler
            handlers[key](req, res, next);
        });
    });

    return router;
};