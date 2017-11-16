// Copyright © 2017 Dell Inc. or its subsidiaries. All Rights Reserved.

'use strict';

describe('Dell Wsman RAID Job', function(){
    var WsmanJob;
    var uuid;
    var job;
    var sandbox = sinon.sandbox.create();
    var configuration;
    var WsmanTool;
    var validator;

    before(function(){
        helper.setupInjector([
            helper.require('/spec/mocks/logger.js'),
            helper.require('/lib/jobs/base-job.js'),
            helper.require('/lib/jobs/dell-wsman-base-job.js'),
            helper.require('/lib/jobs/dell-wsman-RAID.js'),
            helper.require('/lib/utils/job-utils/wsman-tool.js'),
        ]);
        WsmanJob = helper.injector.get('Job.Dell.Wsman.RAID');
        uuid = helper.injector.get('uuid');
        configuration = helper.injector.get('Services.Configuration');
        WsmanTool = helper.injector.get('JobUtils.WsmanTool');
        validator = helper.injector.get('validator');
    });

    var configFile = {
        "services": {
            "configuration": {
                "getComponents": "",
                "updateComponents": "",
                "configureBios": "/api/1.0/server/configuration/configureBios"
            },
            "shareFolder": {
                "address": "10.62.59.223",
                "shareName": "emc",
                "username": "admin",
                "password": "admin",
                "shareType": 2
            }
        },
        "gateway": "http://localhost:46011"
    };

    var obms = {
        "service" : "dell-wsman-obm-service",
        "config" : {
            "user" : "admin",
            "password" : "admin",
            "host" : "192.168.188.13"
        },
        "node" : "59db1dc1423ad2cc0650f8bc"
    };

    beforeEach(function(){
        job = new WsmanJob({}, {"nodeId": uuid.v4()}, uuid.v4());
        sandbox.stub(configuration, 'get');
        sandbox.stub(validator, 'isIP');
        sandbox.stub(WsmanTool.prototype, 'clientRequest');
    });

    afterEach(function(){
        sandbox.restore();
    });


    it('Should init wsman RAID job succesfully', function(){
        configuration.get.returns(configFile);
        expect(function(){
            job._initJob();
        }).to.not.throw('Dell SCP  web service is not defined in smiConfig.json.');
    });
    it('Should throw an error: Dell SCP  web service is not defined', function(){
        configuration.get.returns({});
        expect(function(){
            job._initJob();
        }).to.throw('Dell SCP  web service is not defined in smiConfig.json.');
    });

    it('Should return reponse successfully', function(){
        var response = {
            "body": '{"status":"OK"}'
        };
        var result = job._handleSyncResponse(response);
        expect(result).to.equal(response);
    });

    it('Should throw an error: Failed to do RAID operation', function(){
        var response = {
            "body": '{"status":"fail"}'
        };
        expect(function(){
            job._handleSyncResponse(response);
        }).to.throw('Failed to do RAID operations');
    });

    it('Should send RAID request succesfully', function(){
        validator.isIP.returns(true);
        job.dell = configFile;
        var response = {
            "body": {
                "response": "Request Submitted"
            }
        };
        WsmanTool.prototype.clientRequest.resolves(response);
        expect(job.doRAIDoperation(obms)).to.be.fulfilled;
    });

    it('Should throw an error: Invalid ServerIP', function(){
        validator.isIP.returns(false);
        expect(function(){
            job.doRAIDoperation(obms);
        }).to.throw('Invalid ServerIP');
    });

});
