const Product = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Offer = require("../models/offerModel");
const bcrypt = require('bcrypt');
const multer = require('multer');
const excelJs = require("exceljs");
const Banner = require('../models/bannerModel');
const Orders = require("../models/ordersModel");
const admin_route = require("../routes/adminRoute");
const { OrderedBulkOperation } = require("mongodb");


// let isAdminLoggedin
// isAdminLoggedin = false
// let adminSession = false || {}


const { ObjectId } = require("mongodb");

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

let orderType= 'all';





const loadLogin = async(req,res) =>{
    try {
         res.render('login');    
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req,res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if(userData){  
           const passwordMatch = await bcrypt.compare(password,userData.password);
           if(passwordMatch){
            if(userData.is_admin == 0 ) { 
                res.render('login', {message: "email and password is incorrect"});
            }
            else {
                adminSession = req.session
                isAdminLoggedin = true
                adminSession.adminId = userData._id
                res.redirect("/admin/home");    
            }
           }
           else {  
            res.render('login', {messsage: 'email and password is incorrect'});
           }
        }
        else {  
            res.render('login', {message: "email and password is incorrect"});
        }

    } catch (error) {
        console.log(error.message);
        
    }
}

// const LoadDashboard = async(req,res) =>{

//     try {
//         const userData = await User.find({is_admin:0})
//         res.render('home', {admin:userData});

//     } catch (error) {
//         console.log(error.message);
        
//     }
// }

const LoadDashboard = async (req, res) => {
    try {
      console.log("admin");
      adminSession = req.session;
      adminSession.adminId
      
      

    //    if (adminSession.adminId) {
        const productData = await Product.find();
        const userData = await User.find({ is_admin: 0 });
        const categoryData = await Category.find();
  
        const categoryArray = [];
        const orderCount = [];
        for (let key of categoryData) {
          categoryArray.push(key.name);
          orderCount.push(0);
        }
        const completeOrder = [];
        const orderData = await Orders.find();
        const orderItems = orderData.map((item) => item.products.item);
        let productIds = [];
        orderItems.forEach((orderItem) => {
          orderItem.forEach((item) => {
            productIds.push(item.productId.toString());
          });
        });
  
        const s = [...new Set(productIds)];
        const uniqueProductObjs = s.map((id) => {
          return { id: ObjectId(id), qty: 0 };
        });
        orderItems.forEach((orderItem) => {
          orderItem.forEach((item) => {
            uniqueProductObjs.forEach((idObj) => {
              if (item.productId.toString() === idObj.id.toString()) {
                idObj.qty += item.qty;
              }
            });
          });
        });
  
        for (let key of orderData) {
          const append = await key.populate("products.item.productId");
          completeOrder.push(append);
        }
  
        completeOrder.forEach((order) => {
          order.products.item.forEach((it) => {
            uniqueProductObjs.forEach((obj) => {
              if (it.productId._id.toString() === obj.id.toString()) {
                uniqueProductObjs.forEach((ss) => {
                  if (ss.id.toString() !== it.productId._id.toString()) {
                    obj.name = it.productId.name;
                  }
                });
              }
            });
          });
        });
        const salesCount = [];
        const productName = productData.map((product) => product.name);
        for (let i = 0; i < productName.length; i++) {
          for (let j = 0; j < uniqueProductObjs.length; j++) {
            if (productName[i] === uniqueProductObjs[j].name) {
              salesCount.push(uniqueProductObjs[j].qty);
            } else {
              salesCount.push(0);
            }
          }
        }
  
        console.log(salesCount);
        console.log(productName);
        for (let i = 0; i < completeOrder.length; i++) {
          for (let j = 0; j < completeOrder[i].products.item.length; j++) {
            const categoryData = completeOrder[i].products.item[j].productId.category;
            const isExisting = categoryArray.findIndex((category) => {
              return category === categoryData;
            });
            orderCount[isExisting]++;
            console.log(categoryData);
            console.log(orderCount);
          }
        }
  
        if (productName && salesCount) {
          res.render("home", {
            products: productData,
            users: userData,
            category: categoryArray,
            count: orderCount,
            pname: productName,
            pcount: salesCount,
          });
        }
        // } else {
        //     res.redirect('/admin/login')
        // }
      
    } catch (error) {
      console.log(error.message);
    }
  };

const logout = async(req,res) => {
    try {
        adminSession = req.session
        adminSession.adminId = false
        // isAdminLoggedin = false
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }

}

const adminhome  = async (req,res)=>{
    try {
     const usersData = await User.find({is_admin:0})
     res.render("home",{users:usersData});
    } catch (error) {
     console.log(error.message);
    }
   }

   const adminDashboard = async (req,res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const usersData = await User.find({is_admin:0});
        res.render("dashboard", {users:usersData});

    }
    catch(error) {
        console.log(error.message);
    }
   }



const blockUser = async (req,res) => {
    try {
        const userData = await User.findOneAndUpdate({_id:req.query.id},{$set:{is_verified:1}})
        res.redirect("/admin/dashboard");
    } catch (error) {
        console.log(error.message);
        
    }
}

   const unBlockUser = async(req,res) => {
    try {
        const userData = await User.findOneAndUpdate({_id:req.query.id}, {$set:{is_verified:0}});
        res.redirect("/admin/dashboard");
        
    } catch (error) {
        console.log("error while unblocking");
        
    }
   }


   const editCategory = async (req, res) => {
    try {
      adminSession = req.session
      adminSession.userId

    //   if (isAdminLoggedin) {
        const id = req.query.id
        console.log(id)
        const categoryData = await Category.findById({ _id: id })
        res.render('editcategory', { category: categoryData})
    //   } else {
    //     res.redirect('/admin/login')
    //   }
    } catch (error) {
      console.log(error.message)
    }
  }


  const updateCategory = async (req, res) => {
    try {
    //   adminSession = req.session
    //   if (isAdminLoggedin) {
        const id = req.params.id
        console.log(id)
        const categoryData = await Category.findByIdAndUpdate({ _id: id }, { name: req.body.category })
        console.log(categoryData)
        if (categoryData) {
          res.redirect('/admin/admin-category')
        }
    //   } else {
    //     res.redirect('/admin/login')
    //   }
    } catch (error) {
      console.log(error.message)
    }
  }
  


const addproduct = async (req,res)=>  {
    try {
        const adminSession = req.session
        adminSession.adminId
        const categoryData = await Category.find()
        console.log(categoryData)
        res.render('add-product', {category:categoryData})

    } catch (error) {
        console.log(error.message)
        
    }
}


    

const insertProduct = async (req,res) =>  {

    try {  
        
        const files = req.files
        const product =  Product ({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            description: req.body.description,
            image: files.map((x) => x.filename),
            // is_available:0
    })
    console.log(product)
    const categoryData = await Category.find()
    console.log(categoryData)
    const productData = await product.save();
    console.log(productData)

    if(productData) {
        res.render('add-product', {message:"product insertion has been successfull",category:categoryData})
    } else {
        res.render('add-product',{message:'product added failed', category:categoryData})
    }


} catch (error) {
        console.log(error.message);
        
    }
}

const viewproducts = async (req,res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const productData = await Product.find()
    res.render('view-products',{products:productData});
    } catch (error) {
        console.log(error.message)
    }

    

}

    
const productBlock = async (req,res) => {
    try {
        const productData = await Product.findOneAndUpdate({_id:req.query.id},{$set:{is_available:1}})
        res.redirect("/admin/view-products");
    } catch (error) {
        console.log(error.message);
        
    }
}

const productUnblock = async (req,res) => {
    try {
        const productData = await Product.findOneAndUpdate({_id:req.query.id}, {$set:{is_available:0}})
        res.redirect("/admin/view-products");
    } catch (error) {
        console.log(error.message);
        
    }
}

const addCategory = async (req,res) => {
    try {
    const adminSession = req.session
    adminSession.adminId
        res.render('add-category')
        
    } catch (error) {
        console.log(error.message)
        
    }
}

const categoryBlock = async (req,res) =>{
    try {
        const categoryData = await Category.findOneAndUpdate({_id:req.query.id},{$set:{is_available:1}})
        res.redirect('/admin/admin-category')
    } catch (error) {
        console.log(error.message)
    }
}

const categoryUnblock = async (req,res) =>{
    try {
        const categoryData = await Category.findOneAndUpdate({_id:req.query.id},{$set:{is_available:0}})
        res.redirect('/admin/admin-category')
    } catch (error) {
        console.log(error.message)
        
    }
}

const insertCategory = async (req,res) => {
    console.log('insert category')
    try {
        console.log('1');
        const category = Category ({name:req.body.category})

        const categoryData = await category.save()
        if(categoryData) {
            console.log(categoryData)
            console.log('category saved successfully')
            res.render('add-category',{message:'category saved successfully'})
        } else {
            console.log('failed to save category')
            res.render('add-category',{message:'Failed to save category'})
        }
        
    } catch (error) {
        console.log(error.message)
        console.log('error')
        
    }
}


const viewCategory = async (req,res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const categoryData = await Category.find()
        res.render('admin-category',{category:categoryData})
        
    } catch (error) {
        console.log(error.message)
    }
}

const adminLoadOffer = async(req,res) =>{
    try {
        const adminSession = req.session
        adminSession.adminId
        const offerData = await Offer.find()
        res.render('admin-offer',{offer:offerData})
    } catch (error) {
        console.log("error.message")
    }
}

const adminAddOffer = async (req,res) => {
    try {
        const offer = Offer({
            name:req.body.name,
            type:req.body.type,
            discount:req.body.discount
        })
        await offer.save()
        res.redirect("/admin/admin-offer")
    } catch (error) {
        console.log(error.message)
    }
}

const adminViewOrder = async (req,res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const productData  = await Product.find()
        const userData = await User.find({is_admin:0})
        const orderData = await Orders.find().sort({createdAt:-1})
        for(let key of orderData) {
            await key.populate('products.item.productId')
            await key.populate('userId')
        }
        if(orderType == undefined) {
            res.render('adminOrder',{
                users:userData,
                product:productData,
                order:orderData
            })
        } else {
            id= req.query.id
            res.render('adminOrder',{
                users:userData,
                product:productData,
                order:orderData,
                id:id
            })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const adminCancelOrder = async (req,res) =>{
    try {
        const id =req.query.id;
        await Orders.deleteOne({_id:id});
        res.redirect('/admin/adminOrder')
    } catch (error) {
        console.log(error.message)
    }
}

const adminConfirmOrder  = async(req,res) =>{
    try {
        const id = req.query.id
        await Orders.updateOne({_id:id},{$set:{status:'Confirmed'}})
        res.redirect('/admin/adminOrder');
    } catch (error) {
        console.log(error.message)
    }
}

const adminDelieveredOrder = async (req,res) =>{
    try {
        const id = req.query.id
        await Orders.updateOne({_id:id},{$set:{status:'Delivered'}})
        res.redirect('/admin/adminOrder');
    } catch (error) {
        console.log(error.message)
    }
}

const adminOrderDetails = async(req,res)=>{
    try {
        // const adminSession = req.session
        // adminSession.adminId
        const id = req.query.id
        const orderData = await Orders.findById({_id:id});
        await orderData.populate('products.item.productId');
        await orderData.populate('userId')
   res.render('adminOrder',{
    order:orderData,
   })
    } catch (error) {
      console.log(error.message);
    }
  }

  const getBanners = async (req, res) => {
    try {
        const adminSession = req.session
        adminSession.adminId
        const bannerData = await Banner.find()
        console.log(bannerData);
        res.render('banner', {
            banners: bannerData
        })

    } catch (error) {
        console.log(error.message)
    }
}

const addBanner = async (req, res) => {
    try {
        const newBanner = req.body.banner
        console.log(newBanner);
        const a = req.files
        console.log(req.files)
        const banner = new Banner({
            banner: newBanner,
            bannerImage: a.map((x) => x.filename)
        })
        const bannerData = await banner.save()

        if (bannerData) {
            res.redirect('/admin/loadBanners')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const currentBanner = async (req, res) => {
    try {

        const id = req.query.id

        await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } })
        await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } })
        res.redirect('/admin/loadBanners')
    } catch (error) {
        console.log(error.message)
    }
}

const usersDownload = async function(req,res){
    try {
      const workBook = new excelJs.Workbook();
      const workSheet = workBook.addWorksheet("My users");
      workSheet.columns=[
      {header:"S no.",key:"s_no"},
      {header:"FirstName",key:"firstname"},
      {header:"LastName",key:"lastname"},
      {header:"amount",key:"products.item.price"},
      {header:"Payment",key:"payment"},
      {header:"Country",key:"country"},
      {header:"Address",key:"address1"},
      {header:"State",key:"state"},
      {header:"City",key:"city"},
      {header:"Zip",key:"zip"},
      {header:"Date",key:"createdAt"},
      {header:"Status",key:"status"},
    //   {header:"Offer",key:"offer"}
      ]
  
      let counter =1;
  
      const userData = await Orders.find({});
  
      userData.forEach(function(users){
        users.s_no = counter;
        workSheet.addRow(users);
        counter++;
      })
  
      workSheet.getRow(1).eachCell(function(cell){
        cell.font = {bold:true};
      })
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
  
      res.setHeader(
        "Content-Disposition",`attachment;filename=users.xlsx`
      )
      
      return workBook.xlsx.write(res).then(function(){
        res.status(200);
      })
    } catch (error) {
      console.log(error.message)
    }
  }

module.exports = {
    loadLogin,
    verifyLogin,
    LoadDashboard,
    logout,
    adminhome,
    adminDashboard,
    blockUser,
    unBlockUser,
    addproduct,
    insertProduct,
    viewproducts,
    productBlock,
    productUnblock,
    addCategory,
    categoryBlock,
    categoryUnblock,
    insertCategory,
    viewCategory,
    adminLoadOffer,
    adminAddOffer,
    adminViewOrder,
    adminCancelOrder,
    adminConfirmOrder,
    adminDelieveredOrder,
    adminOrderDetails,
    getBanners,
    addBanner,
    currentBanner,
    usersDownload,
    editCategory,
    updateCategory
}


 