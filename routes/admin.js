var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const vendorHelpers = require('../helpers/vendor-helpers');
const { PreconditionFailed } = require('http-errors');

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    let style="user-login.css"
    res.render('admin/admin-login',{style})
  }
}
router.get('/admin-home',(req,res)=>{
  let style='user-home.css' 
  res.render('admin/admin-home',{style})
})
router.get('/admin-dashboard',async(req,res)=>{
  if(req.session.adminLoggedIn){
    adminHelpers.getSalesDet().then((salesDet)=>{
      res.render('admin/admin-dashboard',{admin:true,salesDet}) 
      })
     
    }else{
      req.session.adminLoginErr=true
      let style="user-login.css"
      res.render('admin/admin-login',{style})
    }
});

router.get('/admin-login', function(req, res, next) {
  if(req.session.adminLoggedIn){
    adminHelpers.getSalesDet().then((salesDet)=>{
      res.render('admin/admin-dashboard',{admin:true,salesDet}) 
      })
     
    }else{
      req.session.adminLoginErr=true
      let style="user-login.css"
      res.render('admin/admin-login',{style})
    }
  
});

router.post('/admin-login',(req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      req.session.adminLoggedIn=true
      adminHelpers.getSalesDet().then((salesDet)=>{
      res.render('admin/admin-dashboard',{admin:true,salesDet}) 
      })
     }else{
      req.session.adminLoginErr=true
      let style="user-login.css"
      res.redirect('/admin/admin-login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.adminLoggedIn=false
  req.session.admin=null
  res.redirect('/admin/admin-home')
})


router.get('/view-vendors', function(req, res, next) {
  adminHelpers.getAllVendors().then((vendors)=>{
  res.render('admin/view-vendors',{vendors,admindashboard:true,admin:true,tableStyle:true})

  })
  
});

router.get('/add-vendor', function(req, res) {
  let style="sidebar.css"
  
  res.render('admin/add-vendor',{admindashboard:true,admin:true,style,tableStyle:true,wrtPage:true})
  })

  
  router.post('/add-vendor',(req,res)=>{
        
    adminHelpers.addVendor(req.body).then((id)=>{
      let image=req.files.image
      console.log(image);
      
     image.mv('./public/vendor-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          adminHelpers.getAllVendors().then((vendors)=>{
           res.render("admin/view-vendors",{vendors,admindashboard:true,admin:true,tableStyle:true})
          })
        }else{
          console.log(err);
        }
      })
      
    })
    
  })

  // router.get('/delete-vendor/:id',(req,res)=>{
  //   let vendorId=req.params.id
  //   console.log(vendorId);
  //   adminHelpers.deleteVendor(vendorId).then((response)=>{
  //   })
  //   adminHelpers.getAllVendors().then((vendors)=>{
  //     res.render("admin/view-vendors",{vendors,admindashboard:true,admin:true,tableStyle:true})
  //   })
  // })

    router.get('/block-vendor/:id',(req,res)=>{
    let vendorId=req.params.id
    console.log(vendorId);
    adminHelpers.blockVendor(vendorId).then((response)=>{
    })
    adminHelpers.getAllVendors().then((vendors)=>{
      res.render("admin/view-vendors",{vendors,admindashboard:true,admin:true,tableStyle:true})
    })
  })


  router.get('/edit-vendor/:id',async(req,res)=>{
    let vendorDet=await adminHelpers.getAllVendorDetails(req.params.id)
    res.render('admin/edit-vendor',{vendorDet,admindashboard:true,admin:true,tableStyle:true,wrtPage:true})
    
  })

  router.post('/edit-vendor/:id',(req,res)=>{
    let id=req.params.id
    adminHelpers.updateVendor(req.params.id,req.body).then(()=>{
    })
      adminHelpers.getAllVendors().then((vendors)=>{
      res.render("admin/view-vendors",{vendors,admindashboard:true,admin:true,tableStyle:true})
      if(req.files.image){
        let image=req.files.Image
        image.mv('./public/pvendor-images/'+id+'.jpg')
             
      }
    })
  })


  router.get('/view-categories', function(req, res, next) {
  adminHelpers.getAllCategories().then((categories)=>{
  res.render('admin/view-categories',{categories,admindashboard:true,admin:true,tableStyle:true})

  })
})
router.get('/add-category', function(req, res) {
  res.render('admin/add-category',{admindashboard:true,admin:true,wrtPage:true,tableStyle:true})

});
router.get('/view-users', function(req, res, next) {
  adminHelpers.getAllUsers().then((users)=>{
  //  res.render('admin/view-users',{users,admindashboard:true,admin:true,tableStyle:true,wrtPage:true})
  res.render('admin/view-users',{users,admin:true,admindashboard:true,tableStyle:true})

  })
  
});

router.post('/add-category',(req,res)=>{
  console.log(req.body);
  adminHelpers.addCategory(req.body)
  adminHelpers.getAllCategories().then((categories)=>{
  res.render('admin/view-categories',{admindashboard:true,admin:true,wrtPage:true,tableStyle:true})

})

router.get('/delete-category/:id',(req,res)=>{
  let categoryId=req.params.id
  console.log(categoryId);
  adminHelpers.deleteCategory(categoryId).then((response)=>{
  })
  adminHelpers.getAllCategories().then((categories)=>{
    res.render("admin/view-categories",{categories,admindashboard:true,admin:true,tableStyle:true})
  })
})

});
router.get('/view-orders',async(req,res)=>{
  let orders=await vendorHelpers.getUserOrders()
  res.render('admin/view-orders',{orders,admin:true})
})

 
module.exports = router;

