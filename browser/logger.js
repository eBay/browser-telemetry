/**
 * Copyright (c) 2018 eBay Inc.
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 *
 **/

/**
  * v1.1.7
 **/

/**
 * Default configuration
**/
var _DEFAULTS = {
    'url': '/api/log',
    'flushInterval': 0,
    'isInSampling': true,
    'samplingRate': 100,
    'collectMetrics': true,
    'logLevels': ['log', 'info', 'warn', 'debug', 'error'],
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
    this.maxAttempts = _DEFAULTS.maxAttempts;
}

/**
 * Init API for intializing the class with paramaters.
**/
Logger.prototype.init = function(options) {
    options = options || _DEFAULTS;
    this.url = options.url || this.url;
    this.logLevels = options.logLevels || this.logLevels;

    // Use flushInterval flag to determind flush time laps, set 0 to flush on pageHide
    this.flushInterval = options.flushInterval !== undefined ? options.flushInterval : this.flushInterval;
    // Use collectMetrics flag to collect perf metrics
    this.collectMetrics = options.collectMetrics !== undefined ? options.collectMetrics : this.collectMetrics;
    // Use Sampling Flag provide in init() or calculate Sampling factor based on Sampling Rate
    this.isInSampling = options.isInSampling !== undefined ? options.isInSampling : sample(options.samplingRate);
    // Use Critical Flag to overrides Sampling Flag - applicable only for critical errors
    this.isSendCritical = options.isSendCritical !== undefined ? options.isSendCritical : false;
    // limit the number of setInterval calls, set -1 to prevent restriction
    this.maxAttempts = options.maxAttempts !== undefined ? options.maxAttempts : this.maxAttempts;
    var _this = this;

    // Setup timer & flush ONLY when falls into Sampling or Critical enabled
    if (_this.isInSampling || _this.isSendCritical) {
        var loglevels = ['log', 'info', 'warn', 'debug', 'error'];

        loglevels.forEach(function(level) {
            var _fn = console[level];
            console[level] = function() {
                var args = Array.prototype.slice.call(arguments);
                _this[level](args);
                _fn.apply(console, args);
            };
        });

        if (_this.flushInterval) {
            _this.interval = setInterval(function() {
                _this.flush();
            }, _this.flushInterval);
        } else {
            window.addEventListener('onpagehide' in window ? 'pagehide' : 'beforeunload', function() {
                _this.flush();
            }, false);
        }
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
    if (window.performance) {
        var perf = window.performance,
            perfData = perf.timing,
            navData = perf.navigation;
            perf.metrics = {
                'navType': navData.type, // 0=Navigate, 1=Reload, 2=History
                'rc': navData.redirectCount,
                'lt': perfData.loadEventEnd - perfData.navigationStart, // PageLoadTime
                'ct': perfData.responseEnd - perfData.requestStart, // connectTime
                'rt': perfData.domComplete - perfData.domLoading // renderTime
            };
        return perf.metrics;
    }
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
    if (this.logLevels.indexOf(type.toLowerCase()) > -1) {
        var desc = 'Non critical',
            obj = typeof args[0] === 'object' ? args[0] : this.getObj(args[0]);
        if (obj && obj.type === 'critical') {
            desc = obj.desc;
            delete obj.desc;
            args = JSON.stringify(obj);
            type = 'CRITICAL';
        } else {
            args = (args.length > 0 && [].join.call(args, ' ')) || '';
        }
        if (this.isInSampling || (this.isSendCritical && type === 'CRITICAL')) {
            this.buffer.push({
                level: type,
                msg: args,
                desc: desc
            });
        }
    }
};

/**
 * Get error Object
**/
Logger.prototype.getObj = function(obj) {
    try {
        return JSON.parse(obj);
    } catch (e) {}
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
            'logs': _this.buffer,
            'isBeaconAPI': false
        },
        url = _this.url + (_this.url.indexOf('?') === -1 ? '?' : '&') + 'desc=' + encodeURI(_this.buffer.map(function(a) {return a.desc;}));

    if (_this.collectMetrics) {
        payload.metrics = _this.metrics();
    }

    Object.keys(_this.plugins).forEach(function(property) {
        _this.plugins[property](payload);
    });

    if (navigator && navigator.sendBeacon) {
        payload.isBeaconAPI = true;
        var status = navigator.sendBeacon(url, JSON.stringify(payload));
        if (status) {
            _this.clearBuffer(bufSize);
        }
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true); // third parameter indicates sync xhr
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.onreadystatechange = function() {// Call a function when the state changes.
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Request finished. Do processing here.
                _this.clearBuffer(bufSize);
            }
        };
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
