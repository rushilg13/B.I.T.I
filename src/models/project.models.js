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
    categories: [{type: String}]
});

// PRE MIDDLEWARE
shopSchema.pre('save', function (next) {
    this.shopID = this._id;
    next();
});

module.exports = mongoose.model('Shop', shopSchema);

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


const orderSchema = new Schema({
    orderID: mongoose.Schema.Types.ObjectId,
    dateOfOrder: Date,
    dueDate: Date,
    deliveredDate: {type: Date, default: null},
    orderType: String,
    paymentMethod: String,
    payableAmount: Number,
    status: String,
    updates: String,
    updatedOn: {type: Date, default: null},
    additionalNotes: String,
    shopID: { type: mongoose.Schema.Types.ObjectId, ref:"Shop"},
    profileID: { type: mongoose.Schema.Types.ObjectId, ref:"Customer"}
});

// PRE MIDDLEWARE
orderSchema.pre('save', function (next) {
    this.orderID = this._id;
    next();
});

module.exports = mongoose.model('Order', orderSchema);