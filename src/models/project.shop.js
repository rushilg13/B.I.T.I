const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shopSchema = new Schema({
    shopID: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    rating: {type: Number, default: 0},
    numOfRating: {type: Number, default: 0},
    reviews: [{ body: String, date: Date, negpos: String }],
    phone: String,
    address: String,
    password: String,
    categories: [{type: String}]
});

// PRE MIDDLEWARE
shopSchema.pre('save', function (next) {
    this.shopID = this._id;
    next();
});

module.exports = mongoose.model('Shop', shopSchema);