const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const loggerMiddleware = require('../');
const logHook = require('./loghook');
const app = express();

app.use('/static', express.static(path.join(__dirname,'../','browser')))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.json({ type: 'text/plain' }));

app.use(loggerMiddleware({
    path: '/api/log',
    log: logHook
}));

app.get('/', (req, res)=> {    
    res.sendFile(path.join(__dirname, 'home.html'), {
        headers: {
            'Content-Type': 'text/html'
        }
    });    
});

app.listen(8080, () => {
    console.log('App Started on 8080');
});