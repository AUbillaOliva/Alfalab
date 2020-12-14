const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    token: {
        type: String,
        required: true 
    },
    expires: {
        type: Date,
        required: false
    },
    created: {
        type: Date,
        default: Date.now(),
        required: true
    },
    revoked: {
        type: Date,
        required: false
    },
    expiredToken: {
        type: String,
        required: false
    }
},
{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

schema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

schema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', schema);