/**
 * Copyright (c) 2018 eBay Inc.
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 *  
 **/

module.exports = function(req, payload) {
    console.log(`Metrics: ${payload.metrics}`);   
    
    //Console from Client Side            
    payload.logs.forEach((event) => {
        console.log(`${event.level}: ${JSON.stringify(event.msg)}`);
    });   
    console.log(`Custom Plugin Data: ${payload.custom}`);   
};