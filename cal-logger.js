const cal = require('cal');
const qs = require('querystring');

function calLogger(req, payload) {        
        cal.createEvent('browser', 'metrics', 0, qs.stringify(payload.metrics)).complete();

        let pageInfo = {
            'rlogid': payload.ebay && payload.ebay.rlogid || '',
            'pageName': payload.ebay && payload.ebay.pageName || '',
        };
        cal.createEvent('browser', 'PageInfo', 0, qs.stringify(pageInfo)).complete();

        let eventList = payload.logs || [];                
        eventList.forEach((event) => {
            cal.createEvent('browser', event.level || 'INFO', 0, event.msg).complete();            
        }); 
}

module.exports = calLogger;