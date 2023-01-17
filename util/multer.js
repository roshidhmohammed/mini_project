const multer = require('multer');
const path = require('path');

const  storage = multer.diskStorage({
    destination:function(req, file, cb){
        if(file.fieldname !== 'image') {
            cb(null,'public/banners');

        } else {
            cb(null,'public/uploaded');
        }
        

    },
    filename: function(req,file,cb) {
        const name = Date.now()+'-'+Math.round(Math.random() * 1E9)
        cb(null,file.fieldname + '-' + name + path.extname(file.originalname))
    }


 });

exports.upload = multer({storage})