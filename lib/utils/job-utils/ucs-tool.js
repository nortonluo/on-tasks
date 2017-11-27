// Copyright 2016-2017 Dell Inc. or its subsidiaries. All Rights Reserved.

'use strict';

var di = require('di');

module.exports = ucsToolFactory;
di.annotate(ucsToolFactory, new di.Provide('JobUtils.UcsTool'));
di.annotate(ucsToolFactory, new di.Inject(
    'Promise',
    'Assert',
    '_',
    'Logger',
    'Services.Waterline',
    'HttpTool',
    'Errors',
    'Util'
));

function ucsToolFactory(
    Promise,
    assert,
    _,
    Logger,
    waterline,
    HttpTool,
    Errors,
    util
) {
    function UcsTool() {
        this.settings = {};
    }

    var logger = Logger.initialize(ucsToolFactory);

    function UcsError(message) {
        Errors.BaseError.call(this, message);
        Error.captureStackTrace(this, UcsError);
    }
    util.inherits(UcsError, Error);
    /**
     * @function clientRequest
     * @description make request to HTTP client
     * @param path the URI path to send the request to
     * @param method the HTTP method: GET,POST,PUT,DELETE,PATCH. Default: GET
     * @param data the POST/PUT/PATCH data to write to the HTTP client
     */

    UcsTool.prototype.clientRequest = function(path, method, data) {
        var self = this;
        var setups = {};

        setups.url = {};
        setups.url.protocol = self.settings.protocol || 'http';
        setups.url.host = self.settings.host;
        setups.url.port = self.settings.port;
        setups.url.path = path || self.settings.root || '/';

        setups.method = method || 'GET';
        setups.verifySSl = self.settings.verifySSl || false;
        setups.headers = {'Content-Type': 'application/json',
                          'ucs-user': self.settings.ucsUser,
                          'ucs-password': self.settings.ucsPassword,
                          'ucs-host': self.settings.ucsHost};
        setups.recvTimeoutMs = self.settings.recvTimeoutMs;
        setups.data = data || '';

        var http = new HttpTool();

        return http.setupRequest(setups)
        .then(function(){
            return http.runRequest();
        })
        .then(function(response){
            if (response.httpStatusCode > 299) {
                logger.error('HTTP Error', response);
                throw new UcsError(response.body);
            }
            return response;
        });
    };

    return UcsTool;
}
