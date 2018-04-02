let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');

let logger = require('./');

let loggerOptions = {
    path:  '/api/log',
    log: function(req, payload) {
        console.log('Inside Override', payload.metrics, payload.url, payload.ebay.rlogid, payload.ebay.pageName);
        let eventList = payload.logs;                

        eventList.forEach((event) => {
            console.log(`Override:: ${event.level}: ${JSON.stringify(event.msg)}`);
        }); 
    }
};

let app = express();

app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json({ type: 'text/plain' }));

// app.use('/browserstatic', express.static(path.join(require.resolve('browser-telemetry'), '..','browser')));
app.use('/static', express.static('browser'))
console.log('******',path.join(require.resolve('browser-telemetry'), '..','browser'));
app.use(logger(loggerOptions));

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'home.html'), {
        headers: {
            'Content-Type': 'text/html'
        }
    });
});

app.listen(8080);