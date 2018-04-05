module.exports = function(req, callback) {
    //res.send(JSON.stringify(req.browserPayload)); 
    process.emit('bowserPayload', JSON.stringify(req.browserPayload));       
    callback();
};