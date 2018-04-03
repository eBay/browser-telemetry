# Browser-Telemetry

`browser-telemetry` module collects client(browser) side errors,logs,metrics(timing & navigation), uncaught exceptions etc and sends back to server for logging & alerting.

## Features
* Intercept console.log/error/info/warn on browser
* Intercept Uncaught Exceptions on browser
* Batch update
* Timing & Navigation metrics
* Sampling (Browser side & Server Side)
* Custom Data Provider plugins

## TBD
* Rate Limiting
* Token based API access
* CORS

## Usage

### Client Side Usage

```html
    <script src="static/logger.min.js">
    </script>
```
Minified JS **`logger.min.js`**

**Example:**
```html
<html>
    <head>
        <script src="static/logger.min.js">
        </script>

        <script>
            function logData() {
                $logger.init({ 'url': '/api/log', 'flushInterval': 1000, 'samplingRate': 50, 'sendMetrics': true});

                $logger.registerPlugin('custom', function() {
                    return {
                        'Pagename': 'HomePage'                        
                    }
                });
                $logger.log('Hello, Logging Data!!');

                //Console
                console.log('Hello, from console.log');
                console.error('Hello, from console.error');
                console.info('Hello, from console.info');

                //Client Side Uncaught Exception
                throw new Error('Uncaught Error');
            }
        </script>
    </head>
    <body onload="logData()">
            <h1>Hello World!!</h1>
    </body>

</html>
```

### Server Side Usage

```javascript
    
    let app = express();
    const path = path.resolve('browser-telemetry');
    app.use('/static', express.static(path.join(path, '../browser')));
    app.use(bodyParser.json({ type: 'application/*+json' }));
    app.use(bodyParser.json({ type: 'text/plain' }));

    //require Logger
    let loggerMiddleware = require('./');
    
    //Add Logger Middleware
    app.use(loggerMiddleware({
        path: '/api/log',
        log: function(req, res, callback) {
            let payload = req.browserPayload; 
            console.log('Metrics:', payload.metrics);   
            
            //Consoles from Client Side            
            payload.logs.forEach((event) => {
                console.log(`${event.level}: ${JSON.stringify(event.msg)}`);
            });   
            console.log('Custom Plugin Data:', payload.custom);   
            callback();
        }
    }));
```

## API
### Client Side API

* #### $logger
    On load of Javascript file, `$logger` object gets hooked up to `window` object for global access.

* #### $logger.init(object)
    For initializing logger, call this API. 
    **Input:**
    ```javascript
    {
        "url": "api/log", //Relative path
        "flushInterval": 1000, //1sec,
        "samplingRate": 10, //10%, Client Side Sampling
        "isInSampling": true, //Flag from Server Side Sampling
        "sendMetrics": true, //Flag to send metrics or not
    }
    ```

* #### $logger.registerPlugin(pluginName, callback)
    Some times you need to send your own custom data. You can send this by registering your own callback for data fetch. 

    On every flush, ALL registered plugins gets called for data fetch.

    ```javascript
        $logger.registerPlugin('custom', function() {
            return {
                'Pagename': 'HomePage'                        
            }
        });
    ```


### Server Side API

* #### Middleware
    #### require('browser-telemetry')(options)
    * **options:** 
        * **path**: Path on which logger should be mounted. This is the end where events from browser are posted.
        * **log**: A callback function which will be invoked on every event from client side.
            * **request**: Holds HTTP request object
            * **response**: Holds HTTP response object. You can set status to 200/404 based on the logic.
            * **callback**: A callback to notify task completion.

        ```javascript
            const loggerMiddleware = require('browser-telemetry');
            let app = reqiure('express');
            ...
            app.use(loggerMiddleware({
                path: 'path/to/mount',
                log: function(req, res, callback) {
                    console.log(req.browserPayload);
                }
            }));
        ```

* #### Log Hook
    As an app developer, you can intercept browser events by hooking to `log` callbacks. Simply pass your custom function while registering middleware as shown below.
    
    Browser events are populated in `browserPayload` variable in request object.

    ```javascript
        app.use(loggerMiddleware({
            path: 'path/to/mount',
            log: function(req, res, callback) {
                //req.browserPayload hold browser events/logs.
                console.log(req.browserPayload);
            }
        }));
    ```
### File Size

Main motivation for creating this module is to reduce file size. Currently, minified client side JS file size is **~2KB**.

### Kraken Style Usage

If you are using [krakenjs](https://github.com/krakenjs/kraken-js), then you can easily configure in `middleware.json` as shown below.

```javascript
    //middleware route
    "browser-telemetry": {
        "enabled": true,
        "priority": 100,
        "module": {
            "name": "browser-telemetry",
            "arguments": [{
                "path": "/api/log",
                "log": "MODULE_NAME_TO_REQUIRE"
            }]
        }
    }

```

### Ackowledgement

This module is created as an inspiration from [beaver-logger](https://github.com/krakenjs/beaver-logger). Main motivation is to reduce client side JS file size and provide minimal functionality for intercepting logs/metrics/uncaught exceptions on browser side.