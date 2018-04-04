'use strict';
const loggerMiddleware = require('../');
const request = require('request');
const async = require('async');
const app = require('./fixtures/invalid-hook/app-require-invalid-log');
const assert = require('assert');
const Browser = require('zombie');

describe(__filename, function() {
    var srv;
    before((cb)=> {
        srv = app.listen(9099, () => {
            console.log('Server started...');
            cb();
        });
    });
    
    after((cb)=> {
        srv && srv.close();
        setTimeout(cb, 2000);
    });

    it('should post metrics to server hook and invoke callback hook', function(done) {
        let payload = {"metrics":{"navType":"1","rc":"0","lt":"1115","ct":"370","rt":"1042"},
        "logs":[{"level":"LOG","msg":"Hello, $logger.log"},{"msg":"Hello,console.log"},{"level":"INFO","msg":"Hello,console.info"},{"level":"WARN","msg":"Hello,console.warn"},{"level":"DEBUG","msg":"Hello,console.debug"},{"level":"ERROR","msg":"Some Error Error: Error Object\n    at logData (http://localhost:9099/:17:45)\n    at onload (http://localhost:9099/:19:597)"},{"level":"ERROR","msg":"Uncaught SyntaxError: Unexpected token < in JSON at position 0 http://localhost:9099/ 1 1 SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at XMLHttpRequest.t.onload"}],
        "custom":{"pageName":"HomePage"}};
                       
        request.post({url: 'http://localhost:9099/api/log', headers: {'user-agent': 'Chrome', 'referer': 'http://localhost:9099/'},form: payload}, function(err, res, body) {
            payload.url = 'http://localhost:9099/';
            payload.userAgent = 'Chrome';
            assert.equal(200, res.statusCode, 'Should send 200 status code');
            done();
        });                  
    }); 
    
    it('should post metrics to server hook and invoke callback hook without metrics', function(done) {
        let payload = {"logs":[{"level":"LOG","msg":"Hello, $logger.log"},{"msg":"Hello,console.log"},{"level":"INFO","msg":"Hello,console.info"},{"level":"WARN","msg":"Hello,console.warn"},{"level":"DEBUG","msg":"Hello,console.debug"},{"level":"ERROR","msg":"Some Error Error: Error Object\n    at logData (http://localhost:9099/:17:45)\n    at onload (http://localhost:9099/:19:597)"},{"level":"ERROR","msg":"Uncaught SyntaxError: Unexpected token < in JSON at position 0 http://localhost:9099/ 1 1 SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at XMLHttpRequest.t.onload"}],
        "custom":{"pageName":"HomePage"}};
                       
        request.post({url: 'http://localhost:9099/api/log', headers: {'user-agent': 'Chrome', 'referer': 'http://localhost:9099/'},form: payload}, function(err, res, body) {
            payload.url = 'http://localhost:9099/';
            payload.userAgent = 'Chrome';
            assert.equal(200, res.statusCode, 'Should send 200 status code');
            done();
        });                  
    });
});