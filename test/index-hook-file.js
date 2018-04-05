'use strict';
const loggerMiddleware = require('../');
const request = require('request');
const async = require('async');
const app = require('./fixtures/hook-file/app-require-log');
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
        
        process.on('bowserPayload', (bowserPayload)=> {
            payload.url = 'http://localhost:9099/';
            payload.userAgent = 'Chrome';
            assert.equal(JSON.stringify(payload), bowserPayload, 'Payload should be same');
            process.removeAllListeners(['bowserPayload']);
            done();
        });

        request.post({url: 'http://localhost:9099/api/log', headers: {'user-agent': 'Chrome', 'referer': 'http://localhost:9099/'},form: payload}, function(err, res, body) {
            assert.equal(200, res.statusCode, 'Should send 200 status code');
        });                  
    });

    it('should load JS on Browser and fire beacon', function(done) {
                
        process.on('bowserPayload', (bowserPayload)=> {
            var pload = {"logs":[{"level":"LOG","msg":"Hello, Logging Data!!"},{"level":"LOG","msg":"Hello from console.log"},{"level":"ERROR","msg":"Hello from console.error"},{"level":"INFO","msg":"Hello from console.info"}],"custom":{"pageName":"HomePage"},"userAgent":"MSIE 9"};
            assert.equal(bowserPayload, JSON.stringify(pload));
            process.removeAllListeners(['bowserPayload']);
            done();
        });

        Browser.localhost('www.test.ebay.com', 9099);
            var browser = new Browser();
            browser.userAgent = 'MSIE 9';
            browser.debug = true;
            browser.on('xhr', function (event) {
                console.log('* XHR event: ', event);
            });
            browser.on('console', function(level, message) {
                console.log(level, message);                
            });
            browser.on('error',function (err){
               console.log('* error: ', err);
            });            
            browser.visit('/', function startXhr() {
                console.log('Main page is loaded');                                  
            });                    
    });

    it('should NOT fire Telemetry JS on Browser', function(done) {
                
        process.on('bowserPayload', (bowserPayload)=> {
            assert.fail('Should NOT Sent Events to Server');            
        });

        Browser.localhost('www.test.ebay.com', 9099);
            var browser = new Browser();
            browser.userAgent = 'MSIE 9';
            browser.debug = true;
            browser.on('xhr', function (event) {
                assert.fail('Should NOT call XHR Events');  
                // console.log('* XHR event: ', event);
            });
            browser.on('console', function(level, message) {
                console.log(level, message);                
                if(message.indexOf('Is in Sample') > -1) {
                    assert.equal(message, 'Is in Sample:  false');
                    setTimeout(()=> {
                        process.removeAllListeners(['bowserPayload']);
                        done();
                    }, 1000);                    
                }                 
            });
            browser.on('error',function (err){
               console.log('* error: ', err);
            });            
            browser.visit('/samplingoff', function startXhr() {
                console.log('Main page is loaded');                                  
            });                    
    });
});