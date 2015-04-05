var mongoose = require('mongoose');
var Order = require('./orders.js');
var customerSchema = mongoose.Schema({
    firstName:String,
    lastName:String,
    email:String,
    address1:String,
    address2:String,
    city:String,
    state:String,
    zip:String,
    salesNotes: [{
        date:Date,
        salespersonID:Number,
        notes:String
    }]
});
customerSchema.method.getOrders = function(){
    return Orders.find({customerID:this._id});
};