const mongoose =require('mongoose')

const productSchema = new mongoose.Schema ({

    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:Array
    },
    stock:{
        type:Number
    },
    is_available: {
        type: Number,
        default:1
    }
})

module.exports = mongoose.model('Product',productSchema)