module.exports = function(req, payload) {
    process.emit('bowserPayload', JSON.stringify(payload));       
    callback();
};