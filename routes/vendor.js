var express = require('express');
var router = express.Router();
const vendorHelpers = require('../helpers/vendor-helpers');
const { PreconditionFailed } = require('http-errors');


const verifyLogin=(req,res,next)=>{
  if(req.session.vendorLoggedIn){
    next()
  }else{
    let style="user-login.css"
    res.redirect('/vendor/vendor-login')
  }
}

router.get('/vendor-home',(req,res)=>{
  let style='user-home.css' 
  res.render('vendor/vendor-home',{style})
})
router.get('/vendor-dashboard', verifyLogin,(req,res)=>{
  vendorHelpers.getSalesDet(req.session.vendor._id).then((salesDet)=>{
  res.render('vendor/vendor-dashboard',{vendor:true,salesDet})
});
})
router.get('/vendor-login',(req,res)=>{
  if(req.session.vendorLoggedIn){  
     vendorHelpers.getSalesDet(req.session.vendor._id).then((salesDet)=>{
    res.render('vendor/vendor-dashboard',{vendor:true,salesDet})
    })
  }else{
    let style="user-login.css"
    res.render('vendor/vendor-login',{style})
    req.session.vendorLoginErr=false
  }
  
})

router.post('/vendor-login',(req,res)=>{
  vendorHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.vendor=response.vendor
      req.session.vendorLoggedIn=true
      vendorHelpers.getSalesDet(req.session.vendor._id).then((salesDet)=>{
      res.render('vendor/vendor-dashboard',{vendor:true,salesDet})
      })
    }else{
      req.session.vendorLoginErr=true
      let style="user-login.css"
      res.render('vendor/vendor-login',{style,vendor:true})

    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.vendorLoggedIn=false
  req.session.vendor=null
  
  res.redirect('/vendor/vendor-home')
})

router.get('/view-products', verifyLogin,function(req, res, next) {
console.log("session");
  console.log(req.session.vendor);
  vendorHelpers.getAllProducts(req.session.vendor.shopname).then((products)=>{
    console.log(products);
    res.render('vendor/view-products',{products,vendor:true})

  })
  
});

router.get('/add-product', function(req, res) {
  res.render('vendor/add-product',{vendor:true})
  });
  
  router.post('/add-product',(req,res)=>{
    console.log(req.body);
    console.log(req.files.image); //to display image
    
    vendorHelpers.addProduct(req.body,(id)=>{
      let image=req.files.image
      
     image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/vendor/view-products')
        }else{
          console.log(err);
        }
      })
      
    })
  })


  router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
     vendorHelpers.deleteProduct(proId).then((response)=>{
      res.redirect('/vendor/view-products')
      
    })
  })

  router.get('/edit-product/:id',async(req,res)=>{
    let product=await vendorHelpers.getProductEdit(req.params.id)
    res.render('vendor/edit-product',{product,vendordashboard:true,tableStyle:true,vendor:true,wrtPage:true})
    
  })

  router.post('/edit-product/:id',(req,res)=>{
    let id=req.params.id
    vendorHelpers.updateProduct(req.params.id,req.body).then(()=>{
    })
    vendorHelpers.getAllProducts().then((products)=>{
     res.redirect('/vendor/view-products')
      if(req.files.Image){
        let image=req.files.image
        image.mv('./public/product-images/'+id+'.jpg')
             
      }
    })
  })
  router.get('/view-orders',async(req,res)=>{
    let orders=await vendorHelpers.getUserOrders()
    res.render('vendor/view-orders',{orders,vendor:true})
  })

  router.get('/sales-report',async(req,res)=>{
    res.render('vendor/sales-report',{vendor:true})
  })
  router.post('/sales-report',async(req,res)=>{ 
    console.log("session");
    console.log(req.session.vendor);
    let reportData=await vendorHelpers.salesReport(req.session.vendor.shopname,req.body)
    res.render('vendor/sales-report-table',{reportData,vendor:true})
  })

module.exports = router;
