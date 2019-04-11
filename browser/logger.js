/**
 * Copyright (c) 2018 eBay Inc.
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 *
 **/

/**
 * Default configuration
**/
var _DEFAULTS = {
    'url': '/api/log',
    'flushInterval': 1000,
    isInSampling: true,
    samplingRate: 100,
    collectMetrics: true,
    logLevels: ['log', 'info', 'warn','debug','error']
};

/**
 * Logger Class which exposes API for intercepting log, errors & collects metrics
**/
function Logger() {
    this.buffer = [];
    this.plugins = {};

    this.url = _DEFAULTS.url;
    this.flushInterval = _DEFAULTS.flushInterval;
    this.collectMetrics = _DEFAULTS.collectMetrics;
    this.logLevels = _DEFAULTS.logLevels;
}

/**
 * Init API for intializing the class with paramaters.
**/
Logger.prototype.init = function(options) {
    options = options || _DEFAULTS;
    this.url = options.url || this.url;
    this.flushInterval = options.flushInterval || this.flushInterval; //In ms
    this.logLevels = options.logLevels || this.logLevels;

    this.collectMetrics = options.collectMetrics !== undefined ? options.collectMetrics : this.collectMetrics;

    //Use Sampling Flag provide in init() or calculate Sampling factor based on Sampling Rate
    var isInSampling = options.isInSampling !== undefined ? options.isInSampling : sample(options.samplingRate);
    console.log('Is in Sample: ', isInSampling);
    var _this = this;

    //Setup timer & flush ONLY if this is in Sampling
    if(isInSampling) {
        var loglevels = ['log', 'info', 'warn','debug','error'];

        loglevels.forEach(function(level) {
                var _fn = console[level];
                console[level] = function() {
                    var args = Array.prototype.slice.call(arguments);
                    _this[level](args);
                    _fn.apply(console, args);
                }
        });

        setInterval(function() {
            if(_this.buffer.length > 0) {
                _this.flush();
            }
        }, options.flushInterval);
    }
}

/**
 * API for registering custom functions.
**/
Logger.prototype.registerPlugin = function(property, customFunction) {
    this.plugins[property] = customFunction;
}

/**
 * Collects metrics using navigation API
**/
Logger.prototype.metrics = function() {
    if(!(window && window.performance)) {
        return;
    }

    var perf = window.performance;
    var perfData = perf.timing;
    var navData = perf.navigation;
    var metrics = {
        'navType': navData.type, // 0=Navigate, 1=Reload, 2=History
        'rc': navData.redirectCount,
        'lt': perfData.loadEventEnd - perfData.navigationStart, //PageLoadTime
        'ct': perfData.responseEnd - perfData.requestStart, //connectTime
        'rt': perfData.domComplete - perfData.domLoading //renderTime
    };
    return metrics;
}

Logger.prototype.log = function() {
    this.addToQ('LOG', arguments);
}

Logger.prototype.info = function() {
    this.addToQ('INFO', arguments);
}

Logger.prototype.debug = function() {
    this.addToQ('DEBUG', arguments);
}

Logger.prototype.warn = function() {
    this.addToQ('WARN', arguments);
}

Logger.prototype.error = function() {
    var args = [];
    Array.prototype.slice.call(arguments[0]).forEach(function(elem) {

        if(typeof elem === 'object' && elem.stack) {
            args.push(elem.stack);
        } else {
            args.push(elem);
        }
    });

    this.addToQ('ERROR', args);
}

/**
 * Clears Buffer
**/
Logger.prototype.clearBuffer = function(clearFromIndex) {
    this.buffer = this.buffer.slice(clearFromIndex);
}

/**
 * Adds message and type to Queue
**/
Logger.prototype.addToQ = function(type, args) {
    if(this.logLevels.indexOf(type) > -1 || this.logLevels.indexOf(type.toLowerCase()) > -1) {
        var message = (args.length > 0 && [].join.call(args, ' ')) || '';
        this.buffer.push({level: type, msg: message});
    }
}

/**
 * Flushes data from buffer
**/
Logger.prototype.flush = function() {
    var _this = this;

    if(_this.buffer.length < 1) {
        return;
    }
    var bufSize = _this.buffer.length;
    var payload = {
        'metrics': _this.metrics(),
        'logs': _this.buffer

    };

    Object.keys(_this.plugins).forEach(function(property) {
        _this.plugins[property](payload);
    });

    if(navigator && navigator.sendBeacon) {
        var status = navigator.sendBeacon(_this.url, JSON.stringify(payload));
        if(status) {
            _this.clearBuffer(bufSize);
        }
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.url, true); // third parameter indicates sync xhr
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onreadystatechange = function() {//Call a function when the state changes.
            if(xhr.readyState == 4 && xhr.status == 200) {
                // Request finished. Do processing here.
                _this.clearBuffer(bufSize);
            }
        }
        xhr.send(JSON.stringify(payload));
    }
}

/**
 * Client side Sampling API
**/
function sample(samplingRate) {
    if(Math.random() * 100 < samplingRate) {
        return true;
    } else {
        return false;
    }
}

function intialize() {
    var logger = new Logger();
    if(window) {
        window.$logger = logger;

        var _onerror = window.onerror;
        //Handle Uncaught Errors
        window.onerror = function() {
            var args = Array.prototype.slice.call(arguments);
            logger.error(args);
            if(_onerror) {
                return _onerror.apply(window, args);
            } else {
                return false;
            }
        };
    }
}

intialize();
