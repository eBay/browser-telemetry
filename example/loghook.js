module.exports = function(req, res, callback) {
    let payload = req.browserPayload; 
    console.log('Metrics:', payload.metrics);   
    
    //Console from Client Side            
    payload.logs.forEach((event) => {
        console.log(`${event.level}: ${JSON.stringify(event.msg)}`);
    });   
    console.log('Custom Plugin Data:', payload.custom);   
    callback();
};