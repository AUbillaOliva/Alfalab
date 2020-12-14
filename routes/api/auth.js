const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const { verifyRefreshToken, signAccessToken, signRefreshToken } = require('../../helpers/jwt_helper');
const UserSchema = require('../../modules/User');
const User = mongoose.model('user', UserSchema);
const RefreshToken = require('../../modules/RefreshToken');

/**
@route   GET api/auth
@desc    Return user without password
@access  Private
*/
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch(error) {
        console.log(error.message);
        res.send(500).send(httpError.InternalServerError('Server error'));
    }
});

/**
@route   POST api/auth 
@desc    Auth user & get token
@access  Public
*/
router.post('/', 
    [
        check('email', 'Email is required').isEmail(),
        check('password', 'Password is required').isLength({ min: 6 })
    ], async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            email,
            password
        } = req.body;
        
        try {
            let user = await User.findOne({ email });
            if(!user) {
                return res.status(400).send(httpError.Unauthorized('Invalid credentials, Unauthorized'));
            } else {
                const isMatch = await bcrypt.compare(password, user.password);
                if(!isMatch) {
                    return res.status(400).send(httpError.Unauthorized('Invalid credentials, Unauthorized'));
                } else {
                    const authToken = await signAccessToken(user.id);
                    const refreshToken = await signRefreshToken(user.id);
                    let refreshTokenFields = await RefreshToken.findOne({ user: user.id });
                    if(refreshTokenFields != null) {
                        refreshTokenFields.token = refreshToken;   
                        refreshTokenFields.expiredToken = authToken;
                        await RefreshToken.findOneAndUpdate({ _id: refreshTokenFields._id }, {
                            $set: refreshTokenFields,
                            new: false
                        });
                    } else {
                        refreshTokenFields = {};
                        refreshTokenFields.token = refreshToken;
                        refreshTokenFields.user = user.id;
                        refreshTokenFields.expires = Date.now() + 7*24*60*60*1000;
                        refreshTokenFields.created = Date.now();
                        new RefreshToken(refreshTokenFields).save();
                    }
                    res.setHeader("Refresh-Token", refreshToken);
                    res.status(200).json({token: authToken});
                }    
            }
        } catch(error){
            console.log(error.message);
            res.status(500).send(httpError.InternalServerError('Server error'));
        }
    }
);

/**
@route   POST api/auth/refresh
@param   token - Required
@desc    Returns a refresh token
@access  Public
*/
router.post('/refresh/:token?', async (req, res) => {
    try {
        const token = req.query.token;
        if(!token) throw httpError.BadRequest();
        else {
            const userId = await verifyRefreshToken(token);
            const accessToken = await signAccessToken(userId);
            const reftoken = await signRefreshToken(userId);            
            var refreshTokenFields = await RefreshToken.findOne({token});
            if(refreshTokenFields != null) {
                refreshTokenFields.token = reftoken;   
                refreshTokenFields.expiredToken = token;
                await RefreshToken.findOneAndUpdate({ token }, {
                    $set: refreshTokenFields,
                    new: false
                });
                res.setHeader('Refresh-Token', reftoken);
                res.status(200).json({ accessToken });
            } else res.status(404).send(httpError.NotFound('Invalid token'));
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send(httpError.InternalServerError('Server error'))
    }
});

/**
@route   POST api/auth/revoke
@param   token - Required
@desc    Revokes a refresh token
@access  Private
*/
router.post('/revoke/:token?', auth, async (req, res) => {
    try {
        let token = await RefreshToken.findOne({ token: req.query.token});
        if(token) {
            refreshTokenFields = token;
            refreshTokenFields.expiredToken = req.query.token;
            refreshTokenFields.token = undefined;
            refreshTokenFields.revoked = new Date(Date.now());
            refreshTokenFields.expires = new Date(Date.now());
            refreshTokenFields.isExpired = true;
            refreshTokenFields.isActive = false;
            await RefreshToken.findOneAndUpdate({token: req.query.token}, {
                $set: refreshTokenFields,
                new: false
            });
            res.status(200).json({msg: 'Token revoked succesfully'})
        } else {
            res.status(404).send(httpError.NotFound('Invalid token'));
        }
    } catch(error) {
        console.error(error.message);
        res.status(500).send(httpError.InternalServerError('Server error'));
    }
});

module.exports = router;