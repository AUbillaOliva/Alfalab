const jwt = require('jsonwebtoken');
const httpError = require('http-errors');

module.exports = function(req, res, next){
    const token = req.header('x-auth-token');
    if(!token) { 
        res.status(401).json(httpError.Unauthorized('No token provided, Unauthorized'));
    } else {
        try {
            const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
            req.user = decoded.user;
            next();
        } catch(err) {
            console.log(err.message);
            next(httpError.InternalServerError('Server error'));
        }
    }
}


