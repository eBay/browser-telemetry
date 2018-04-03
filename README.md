# Client Side Telemetry

Client side telemetry module collects client(browser) side errors,logs,metrics and sends back to server for logging & alerting.

## Features
* Intercept console.log/error/info/warn
* Batch update
* Timing & Navigation metrics
* Sampling
* Custom Data Provider plugins

## TBD
* Rate Limiting
* Token based API access

## Usage

### Client Side Usage
```html
<html>
    <head>
        <script src="static/logger.js">
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

### Server Side API