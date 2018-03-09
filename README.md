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

                $logger.registerPlugin('ebay', function() {
                    return {
                        'rlogid': 't6klaook%60b0%3D%3C%3Dosuojbnkmcc4%3B(73766%3F7-161da07d39a-0x602',
                        'pageName': 'DefaultPage'
                    }
                });
                $logger.log('Hello, Logging Data!!');
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
    let Logger = require('./');

    let logger = new Logger({
        path:  '/api/log',
        log: function(req, payload) {
            console.log('Inside Override', payload.metrics, payload.url, payload.ebay.rlogid, payload.ebay.pageName);
            let eventList = payload.logs;                

            eventList.forEach((event) => {
                console.log(`Override:: ${event.level}: ${JSON.stringify(event.msg)}`);
            }); 
        }
    });

    let app = express();

    app.use(bodyParser.json({ type: 'application/*+json' }));
    app.use(bodyParser.json({ type: 'text/plain' }));

    app.use(logger.middleware());
```

## API
### Client Side API

### Server Side API