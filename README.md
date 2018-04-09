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

### Environment
* Minimal **Node Version:** **v8.0.0**

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

                $logger.registerPlugin('custom', function(payload) {
                    payload.custom = {
                        'Pagename': 'HomePage'                        
                    };
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
        log: function(req, payload) {
            console.log('Metrics:', payload.metrics);   
            
            //Consoles from Client Side            
            payload.logs.forEach((event) => {
                console.log(`${event.level}: ${JSON.stringify(event.msg)}`);
            });   
            console.log('Custom Plugin Data:', payload.custom);   
        }
    }));
```
### Payload Data
* **logs/errors:** ALL console logs/errors are intercepted and sent in `logs` field.
* **Uncaught Exceptions:** ALL uncaught exceptions are intercepted and sent in `logs` field as `ERROR`.
* **Metrics:** Browser load times are captured using timing & navigation API(Only in compatible browsers). 
    * **rc:** Redirect Count, number of times page is redirected before hitting current page.
    * **lt:** Load Time, load time of the page.
    * **ct:** Connect Time, time took to connect to server.
    * **rt:** Render Time, time took to render the page.
    * **navType:** Tells you how the page is accessed. `0=Navigate, 1=Reload, 2=History`

```json
{
  "metrics": {
    "navType": 0,
    "rc": 0,
    "lt": 255,
    "ct": 72,
    "rt": 147
  },
  "logs": [
    {
      "level": "LOG",
      "msg": "Hello, Logging Data!!"
    },
    {
      "level": "LOG",
      "msg": "Hello from console.log"
    },
    {
      "level": "ERROR",
      "msg": "Hello from console.error"
    },
    {
      "level": "INFO",
      "msg": "Hello from console.info"
    },
    {
      "level": "ERROR",
      "msg": "Uncaught Error: Uncaught http://localhost:8080/ 20 23 Error: Uncaught\n    at logData (http://localhost:8080/:20:23)\n    at onload (http://localhost:8080/:24:30)"
    }
  ],
  "custom": {
    "pageName": "HomePage"
  }
}
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
        "logLevels": ["info", "log", "debug", "error", "warn"] //List of enabled console methods
    }
    ```

* #### $logger.registerPlugin(pluginName, callback)
    * **callback(payload)**
    Some times you need to send your own custom data. You can attach custom data or transform data by registering your own plugin. 
    Payload object will be passed, which can be mutated in callback.

    On every flush, ALL registered plugins gets called for data transformation.

    ```javascript
        $logger.registerPlugin('custom', function(payload) {
            payload.Pagename = 'HomePage';
        });
    ```

### Server Side API

* #### Middleware
    #### require('browser-telemetry')(options)
    * **options:** 
        * **path**: Path on which logger should be mounted. This is the end where events from browser are posted.
        * **log**: A callback function which will be invoked on every event from client side.
            * **request**: Holds HTTP request object
            * **payload**: A payload which holds events from browser.

        ```javascript
            const loggerMiddleware = require('browser-telemetry');
            let app = reqiure('express');
            ...
            app.use(loggerMiddleware({
                path: 'path/to/mount',
                log: function(req, payload) {
                    console.log(payload);
                }
            }));
        ```

* #### Log Hook
    As an app developer, you can intercept browser events by hooking to `log` callbacks. Simply pass your custom function while registering middleware as shown below.
    
    Browser events are populated in **payload** param.

    ```javascript
        app.use(loggerMiddleware({
            path: 'path/to/mount',
            log: function(req, payload) {
                console.log(payload);
            }
        }));
    ```
### File Size

Main motivation for creating this module is to reduce file size. Currently, minified client side JS file size is **~2KB**.

### Example
See the working example in `example` folder.

**Running Example Server**
```shell
    node example/server.js

    //Open Browser pointing to http://localhost:8080
    //ALl Logs/Metrics will be dumped on Server side console.
```

### Ackowledgement

This module is created as an inspiration from [beaver-logger](https://github.com/krakenjs/beaver-logger). Main motivation is to reduce client side JS file size and provide minimal functionality for intercepting logs/metrics/uncaught exceptions on browser side.

### Privacy Notice

On running this module/Javascript file on browser, it collects page load metrics, console logs, error logs, unhandled exceptions etc and sends data to backend server for processing.

### License

Copyright 2018 eBay Inc.
 
Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at https://opensource.org/licenses/MIT.