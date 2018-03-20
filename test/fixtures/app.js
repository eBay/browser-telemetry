const express = require('express');
const bodyParser = require('body-parser');
const loggerMiddleware = require('../..');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json({ type: 'text/plain' }));
app.use(bodyParser.json({ type: 'text/html' }));

app.use(loggerMiddleware({
    path: '/api/log',
    log: function(req, res, callback) {
        // console.log('*********Received******', JSON.stringify(req.browserPayload));
        res.send(JSON.stringify(req.browserPayload));
        callback();
    }
}));

module.exports = app;