module.exports = function(req, callback) { 
    if(req.query.throwerror) {
        throw new Error('Some Error');
    } else {
        callback(new Error('Callback error'));
    }            
};