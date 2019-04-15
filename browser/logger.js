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
    'isInSampling': true,
    'samplingRate': 100,
    'collectMetrics': true,
    'logLevels': ['log', 'info', 'warn','debug','error'],
    'maxAttempts': 50
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
    // limit the number of setInterval calls, set -1 to prevent restriction
    this.maxAttempts = options.maxAttempts !== undefined ? options.maxAttempts : this.maxAttempts;
}

/**
 * Init API for intializing the class with paramaters.
**/
Logger.prototype.init = function(options) {
    options = options || _DEFAULTS;
    this.url = options.url || this.url;
    this.flushInterval = options.flushInterval || this.flushInterval; // In ms
    this.logLevels = options.logLevels || this.logLevels;

    this.collectMetrics = options.collectMetrics !== undefined ? options.collectMetrics : this.collectMetrics;

    // Use Sampling Flag provide in init() or calculate Sampling factor based on Sampling Rate
    this.isInSampling = options.isInSampling !== undefined ? options.isInSampling : sample(options.samplingRate);
    // Use Critical Flag to overrides Sampling Flag - applicable only for critical errors
    this.isSendCritical = options.isSendCritical !== undefined ? options.isSendCritical : false;
    var _this = this;

    // Setup timer & flush ONLY when falls into Sampling or Critical enabled
    if (_this.isInSampling || _this.isSendCritical) {
        var loglevels = ['log', 'info', 'warn','debug','error'];

        loglevels.forEach(function(level) {
                var _fn = console[level];
                console[level] = function() {
                    var args = Array.prototype.slice.call(arguments);
                    _this[level](args);
                    _fn.apply(console, args);
                }
        });

        _this.interval = setInterval(function() {
            if (_this.buffer.length > 0) {
                _this.flush();
            }
        }, options.flushInterval);
    }
};

/**
 * API for registering custom functions.
**/
Logger.prototype.registerPlugin = function(property, customFunction) {
    this.plugins[property] = customFunction;
};

/**
 * Collects metrics using navigation API
**/
Logger.prototype.metrics = function() {
    if (!window.performance) {
        return;
    }

    var perf = window.performance,
        perfData = perf.timing,
        navData = perf.navigation,
        metrics = {
            'navType': navData.type, // 0=Navigate, 1=Reload, 2=History
            'rc': navData.redirectCount,
            'lt': perfData.loadEventEnd - perfData.navigationStart, // PageLoadTime
            'ct': perfData.responseEnd - perfData.requestStart, // connectTime
            'rt': perfData.domComplete - perfData.domLoading // renderTime
        };
    return metrics;
};

Logger.prototype.log = function() {
    this.addToQ('LOG', arguments);
};

Logger.prototype.info = function() {
    this.addToQ('INFO', arguments);
};

Logger.prototype.debug = function() {
    this.addToQ('DEBUG', arguments);
};

Logger.prototype.warn = function() {
    this.addToQ('WARN', arguments);
};

Logger.prototype.error = function() {
    var args = [];
    Array.prototype.slice.call(arguments[0]).forEach(function(elem) {

        if (typeof elem === 'object' && elem && elem.stack) {
            args.push(elem.stack);
        } else {
            args.push(elem);
        }
    });

    this.addToQ('ERROR', args);
};

/**
 * Clears Buffer
**/
Logger.prototype.clearBuffer = function(clearFromIndex) {
    this.buffer = this.buffer.slice(clearFromIndex);
};

/**
 * Adds message and type to Queue
**/
Logger.prototype.addToQ = function(type, args) {
    if (this.logLevels.indexOf(type) > -1 || this.logLevels.indexOf(type.toLowerCase()) > -1) {
        var message = (args.length > 0 && [].join.call(args, ' ')) || '';
        if (this.isInSampling || (this.isSendCritical && message.indexOf('"type":"critical"') > -1)) {
            this.buffer.push({
                level: type,
                msg: message
            });
        }
    }
};

/**
 * Flushes data from buffer
**/
Logger.prototype.flush = function() {
    var _this = this;

    if (_this.buffer.length < 1) {
        return;
    }
    if (_this.maxAttempts > 0) {
        _this.maxAttempts = _this.maxAttempts - 1;
        if (_this.maxAttempts === 0) {
            clearInterval(_this.interval);
        }
    }

    var bufSize = _this.buffer.length,
        payload = {
            'metrics': _this.metrics(),
            'logs': _this.buffer,
            'isBeaconAPI': false
        };

    Object.keys(_this.plugins).forEach(function(property) {
        _this.plugins[property](payload);
    });

    if (navigator && navigator.sendBeacon) {
        payload.isBeaconAPI = true;
        var status = navigator.sendBeacon(_this.url, JSON.stringify(payload));
        if (status) {
            _this.clearBuffer(bufSize);
        }
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.url, true); // third parameter indicates sync xhr
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onreadystatechange = function() {// Call a function when the state changes.
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Request finished. Do processing here.
                _this.clearBuffer(bufSize);
            }
        }
        xhr.send(JSON.stringify(payload));
    }
};

/**
 * Client side Sampling API
**/
function sample(samplingRate) {
    return Math.random() * 100 < samplingRate;
}

function intialize() {
    var logger = new Logger();
    if (window) {
        window.$logger = logger;

        var _onerror = window.onerror;
        // Handle Uncaught Errors
        window.onerror = function() {
            var args = Array.prototype.slice.call(arguments);
            logger.error(args);
            if (_onerror) {
                return _onerror.apply(window, args);
            }
            return false;
        };
    }
}

intialize();
