const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    orderDesc: String,
    orderID: mongoose.Schema.Types.ObjectId,
    dateOfOrder: { type: Date, default: Date.now },
    dueDate: Date,
    deliveredDate: { type: Date, default: null },
    orderType: String,
    paymentMethod: String,
    customerPhone: String,
    payableAmount: Number, // check
    status: String,
    updates: String,
    updatedOn: { type: Date, default: null },
    additionalNotes: String,
    shopID: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    profileID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }
});

// PRE MIDDLEWARE
orderSchema.pre('save', function (next) {
    this.orderID = this._id;
    next();
});

module.exports = mongoose.model('Order', orderSchema);