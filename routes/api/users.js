const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const httpError = require('http-errors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const UserSchema = require('../../modules/User');
const User = mongoose.model('user', UserSchema);
const RefreshToken = require('../../modules/RefreshToken');
const auth = require('../../middleware/auth');
const { signAccessToken, signRefreshToken } = require('../../helpers/jwt_helper');

/**
@route   POST api/users 
@desc    Register new users
@access  Public
*/
router.post('/', 
    [
        check('firstname', 'Firstname is required').not().isEmpty(),
        check('lastname', 'Lastname is required').not().isEmpty(),
        check('email', 'Email is required').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ], async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            firstname,
            lastname,
            email,
            password
        } = req.body;

        const userFields = {};
        if(firstname) { userFields.firstname = firstname; }
        if(lastname) { userFields.lastname = lastname; }
        if(email) { userFields.email = email; }
        if(password) { userFields.password = password; }
        
        try {
            let user = await User.findOne({ email });
            if(user) {
                return res.status(406).json({ errors: [ { msg: 'User already exists' } ]});
            } else {
                const salt = await bcrypt.genSalt(10);
                userFields.password = await bcrypt.hash(password, salt);
                user = await new User(userFields).save();

                const authToken = await signAccessToken(user.id);
                const refreshToken = await signRefreshToken(user.id);
                refreshTokenFields = {}
                if(user) {
                    refreshTokenFields.user = user.id;
                }     
                refreshTokenFields.token = refreshToken;   
                refreshTokenFields.expires = new Date(Date.now() + 7*24*60*60*1000);                    
                new RefreshToken(refreshTokenFields).save();
                res.setHeader("Refresh-Token", refreshToken);
                res.status(200).json({token: authToken});
            }
        } catch(err){
            console.log(err.message);
            res.status(500).send(httpError.InternalServerError('Server error'));
        }
    }
);

/**
@route POST api/users/tokens 
@desc Return refresh tokens of user 
@param id User id 
@access Private 
*/
router.get('/tokens/:id?', auth, async (req, res) => {
    try {
        let token = await RefreshToken.find({user: mongoose.Types.ObjectId(req.query.id)});
        if(token) {
           res.status(200).send(token);
        } else {
            res.status(404).json(httpError.NotFound('No tokens found'));
        }
    } catch(err) {
        console.error(err);
        res.status(500).json(httpError.InternalServerError('Server error'));
    }
});

/**
@route   DELETE api/users
@desc    Delete user from DB
@param id User id
@access  Private
*/
router.delete('/:id?', auth, async (req, res) => {
    try {
        let userId = req.query.id;
        let user = await User.findById(userId);    
        if(user) {
            await RefreshToken.findOneAndDelete({ user: userId });
            await User.findOneAndDelete({ _id: userId });
            res.status(200).json({ msg: `User ${user._id} deleted` });
        } else {
            res.status(404).send(httpError.NotFound('User not found'));
        }
    } catch (error) {
        console.error(error);
        res.status(500).json(httpError.InternalServerError('Server error'));
    }
});

module.exports = router;