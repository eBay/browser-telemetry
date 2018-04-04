module.exports = function(req, res, callback) { 
    if(req.query.throwerror) {
        throw new Error('Some Error');
    } else {
        callback(new Error('Callback error'));
    }            
};