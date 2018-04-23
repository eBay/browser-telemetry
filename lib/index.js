/**
 * Copyright (c) 2018 eBay Inc.
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 *  
 **/

let express = require('express');
let _ = require('underscore');
const tryRequire = require('try-require');

/**
 * Default Config on server side.
**/
const DEFAULT_CONFIG = {
    path: '/api/log',
    log: (req, payload) => {
        if(payload.metrics) {
            console.log(`Metrics: ${payload.metrics}`); 
        }        
        payload.logs.forEach((event) => {
            console.log(`${event.level}: ${JSON.stringify(event.msg)}`);
        }); 
    }
};

/**
 * Express Middleware for hooking URL and receiving client payload.
 * Calls Custom hook registered in middleware.
**/
function loggerMiddleware(options={}) {     
    _.defaults(options, DEFAULT_CONFIG);

    if(typeof options.log === 'string') {
        let logFile = options.log;
        options.log = tryRequire(options.log);
        if(!options.log) {
            console.error(`Unable to load the file ${logFile}, setting default callback.`);
            options.log = DEFAULT_CONFIG.log;
        }
    }

    let loggerApp = express();   
        
    loggerApp.post(options.path, (req, res, next)=> {
        try {
            let payload = req.body;
            payload.url = req.headers['referer'];
            payload.userAgent = req.headers['user-agent'];

            options.log(req, payload);
            res.status(200).end();

        } catch(error) {
            console.error(error);
            res.status(500).end();
        }
        
    });
    return loggerApp;
}

module.exports = loggerMiddleware;