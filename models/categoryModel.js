const mongoose = require ('mongoose')

const categorySchema = new mongoose.Schema ({
    name: {
        type: String,
        required: true
    },
    is_available:{
        type:Number,
        default:1
    } 

})

module.exports = mongoose.model('Category', categorySchema)