module.exports = function(req, res, callback) {
    res.send(JSON.stringify(req.browserPayload)); 
    process.emit('bowserPayload', JSON.stringify(req.browserPayload));       
    callback();
};