const express = require('express');
const admin_route = express();

const User = require("../models/userModel");
const Product = require("../models/productModel");
const Orders =require("../models/ordersModel");
const Offer = require("../models/offerModel")
const Address=  require('../models/addressModel')

const adminMiddleware = require('../middleware/adminAuth')

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));


// const path = require("path");

admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

const path = require("path");
const multer = require('../util/multer');


// let Storage = multer.diskStorage({
//     destination:function(req, file, cb){
//         cb(null,path.join(__dirname,'../public/images'));

//     },
//     filename:function(req,file,cb) {
//         const name = Date.now()+'-'+file.originalname
//         cb(null,name)
//     }


//  });

// let Storage = multer.diskStorage({
//     destination: "../public/userImages/",
//     filename: (req,file, cb) =>{
//         cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
//     }
// })

//  let upload = multer({storage:Storage});
const adminController = require("../controllers/adminController");

// const upload = multer({storage:storage});

admin_route.get('/', adminController.loadLogin);

admin_route.post('/', adminController.verifyLogin);



admin_route.get('/home',adminController.LoadDashboard);

admin_route.get('/logout', adminController.logout);

admin_route.get('/dashboard', adminController.adminDashboard);

admin_route.get('/block-user', adminController.blockUser);

admin_route.get('/unblock-user', adminController.unBlockUser);

admin_route.get('/view-products', adminController.viewproducts);


admin_route.get('/add-product', adminController.addproduct);
// admin_route.post('/add-product',multer.upload.array('upload_file').adminController.insertProduct)

 

admin_route.post('/add-product',multer.upload.array('uploaded_file'),adminController.insertProduct);



admin_route.get('/view-product', adminController.viewproducts)

admin_route.get('/product-block', adminController.productBlock);
admin_route.get('/product-unblock', adminController.productUnblock);

admin_route.get('/admin-category', adminController.viewCategory);
admin_route.get('/add-category', adminController.addCategory);
admin_route.post('/add-category',adminController.insertCategory)


admin_route.get('/admin-category-block', adminController.categoryBlock);
admin_route.get('/admin-category-unblock',adminController.categoryUnblock);

admin_route.get('/admin-offer',adminController.adminLoadOffer);
admin_route.post('/admin-offer',adminController.adminAddOffer);


admin_route.get('/adminOrder',adminController.adminViewOrder);
admin_route.get('/adminCancelOrder',adminController.adminCancelOrder);
admin_route.get('/adminConfirmOrder',adminController.adminConfirmOrder);
admin_route.get('/adminDeliveredOrder',adminController.adminDelieveredOrder);
admin_route.get('/adminOrderView', adminController.adminOrderDetails);

admin_route.get('/editcategory', adminController.editCategory)
admin_route.post('/edit-category/:id', adminController.updateCategory)


admin_route.get('/loadBanners',adminController.getBanners)
admin_route.post('/loadBanners',multer.upload.array('bannerImage',2),adminController.addBanner)
admin_route.get('/currentBanner',adminController.currentBanner)


admin_route.get("/exportUsers",adminController.usersDownload);

admin_route.get('*', function(req,res){

    

    res.redirect('/admin');
})



module.exports = admin_route;