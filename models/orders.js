var mongoose = require('mongoose');
var orderSchema = mongoose.Schema({
    orderNumber: Number,
    date: Date,
    status: Boolean,
    url:String
});
var Order = mongoose.model('Order', orderSchema);
module.exports = Order;