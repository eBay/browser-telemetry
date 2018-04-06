const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const loggerMiddleware = require('../..');
const app = express();

app.use('/static', express.static(path.join(__dirname,'../..','browser')))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json({ type: 'text/plain' }));
app.use(bodyParser.json({ type: 'text/html' }));

app.use(loggerMiddleware({
    path: '/api/log',
    log: function(req, payload) {
        process.emit('bowserPayload', JSON.stringify(payload));       
    }
}));

app.get('/samplingoff', (req, res)=> {    
    res.sendFile(path.join(__dirname, 'templates/sampling.html'), {
        headers: {
            'Content-Type': 'text/html'
        }
    });        
});

app.get('/loglevels', (req, res)=> {    
    res.sendFile(path.join(__dirname, 'templates/loglevels.html'), {
        headers: {
            'Content-Type': 'text/html'
        }
    });        
});

app.get('/', (req, res)=> {    
    res.sendFile(path.join(__dirname, 'templates/allfeatures.html'), {
        headers: {
            'Content-Type': 'text/html'
        }
    });    
});

module.exports = app;