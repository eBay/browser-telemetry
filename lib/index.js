let express = require('express');
let _ = require('underscore');
const tryRequire = require('try-require');

const DEFAULT_CONFIG = {
    path: '/api/log',
    log: (req, eventList) => {
        eventList.forEach((event) => {
            console.log(`${event.logLevel}: ${JSON.stringify(event.message)}`);
        });        
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
            options.log(req, payload);
            res.send(200);
        } catch(error) {
            console.error(error);
            res.send(500);
        }
        
    });
    return loggerApp;
}

module.exports = loggerMiddleware;