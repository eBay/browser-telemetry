# Usage

## Start Server

```shell
    $ git clone browser-telemetry
    $ cd browser-telemetry && npm install 
    $ node example/server.js
```

## Access Page

* Open browser and open developer tools.
* Go to [http://localhost:8080](http://localhost:8080)
* On browser console you should see some log messages, errors and uncaught exception.
* On Server side, you should see same logs, errors, uncaught exception and additional page load metrics.