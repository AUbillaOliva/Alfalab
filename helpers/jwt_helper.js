const jwt = require('jsonwebtoken');
const httpError = require('http-errors');

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = { user: { userId } };
            const secret = process.env.AUTH_TOKEN_SECRET;
            const options = { expiresIn: '1h' };
            jwt.sign(payload, secret, options, (err, token) => {
                if(err) {
                    console.error(err.message);
                    reject(httpError.InternalServerError('Server error'));
                    return;
                }
                else resolve(token);
            });
        });
    },
    verifyAccessToken: (req, res, next) => {
        if(!req.header('x-auth-token')) return next(httpError.Unauthorized('No token provided, Unauthorized'));
        else {
            const token = req.header('x-auth-token');
            jwt.verify(token, process.env.AUTH_TOKEN_SECRET, (err, payload) => {
                if(err) return next(httpError.Unauthorized( err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message));
                else {
                    req.payload = payload;
                    next();
                }
            });
        }
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = { user: { id: userId } };
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const options = { expiresIn: '1y' };
            jwt.sign(payload, secret, options, (err, token) => {
                if(err) {
                    console.error(err.message);
                    reject(httpError.InternalServerError('Server error'));
                    return;
                } else resolve(token);
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            const secret = process.env.REFRESH_TOKEN_SECRET;
            jwt.verify(refreshToken, secret, (err, payload) => {
                if(err) return reject(httpError.Unauthorized(err.message));
                else {
                    const userId = payload;
                    resolve(userId);
                }
            });
        });
    }
}