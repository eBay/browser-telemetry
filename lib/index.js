let express = require('express');
let _ = require('underscore');
const tryRequire = require('try-require');

const DEFAULT_CONFIG = {
    path: '/api/log',
    log: (req, res, callback) => {
        let payload = req.browserPayload;
        payload.forEach((event) => {
            console.log(`${event.logLevel}: ${JSON.stringify(event.message)}`);
        });  
        callback();      
    }
};

function loggerMiddleware(options={}) { 
    _.defaults(options, DEFAULT_CONFIG);

    if(typeof options.log === 'string') {
        options.log = tryRequire(options.log) || DEFAULT_CONFIG.log;
    }

    let loggerApp = express();   
        
    loggerApp.post(options.path, (req, res, next)=> {
        try {
            let payload = req.body;
            payload.url = req.headers['referer'];
            payload.userAgent = req.headers['user-agent'];
            req.browserPayload = payload;

            options.log(req, res, (err) => {
                if(!res.headersSent) {
                    if(err) {
                        res.send(500);
                    } else {
                        res.send(200);
                    }
                }                
            });            
            
        } catch(error) {
            console.error(error);
            res.send(500);
        }
        
    });
    return loggerApp;
}

module.exports = loggerMiddleware;