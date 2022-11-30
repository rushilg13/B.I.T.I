const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    profileID: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    rating: {type: Number, default: 0},
    numOfRating: {type: Number, default: 0},
    phone: String,
    address: String,
    password: String
});

// PRE MIDDLEWARE
customerSchema.pre('save', function (next) {
    this.profileID = this._id;
    next();
});

module.exports = mongoose.model('Customer', customerSchema);