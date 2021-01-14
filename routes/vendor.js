var express = require('express');
var router = express.Router();
const vendorHelpers = require('../helpers/vendor-helpers');
const { PreconditionFailed } = require('http-errors');


const verifyLogin=(req,res,next)=>{
  if(req.session.vendorLoggedIn){
    next()
  }else{
    let style="user-login.css"
    res.redirect('/vendor/vendor-login',{style,vendor:true})
  }
}

router.get('/vendor-dashboard', verifyLogin,(req,res)=>{
  res.render('vendor/vendor-dashboard',{vendor:true,vendordashboard:true,tableStyle:true})
});
router.get('/vendor-login',(req,res)=>{
  if(req.session.vendorLoggedIn){    
    res.render('vendor/vendor-dashboard',{vendor:true,vendordashboard:true,tableStyle:true})
   
  }else{
    let style="user-login.css"
    res.render('vendor/vendor-login',{"loginErr":req.session.vendorLoginErr,style,vendor:true})
    req.session.vendorLoginErr=false
  }
  
})

router.post('/vendor-login',(req,res)=>{
  vendorHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.vendor=response.vendor
      req.session.vendorLoggedIn=true
      vendorHelpers.getSalesDet(req.session.vendor._id).then((salesDet)=>{
      res.render('vendor/vendor-dashboard',{vendor:true,vendordashboard:true,tableStyle:true,salesDet})
      })
    }else{
      req.session.vendorLoginErr=true
      let style="user-login.css"
      res.render('vendor/vendor-login',{style,vendor:true})

    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.vendor=null
  req.session.vendorLoggedIn=false
  res.redirect('/vendor/vendor-login')
})

router.get('/view-products', function(req, res, next) {
  vendorHelpers.getAllProducts().then((products)=>{
    console.log(products);
    res.render('vendor/view-products',{products,vendordashboard:true,vendor:true,tableStyle:true})

  })
  
});

router.get('/add-product', function(req, res) {
  res.render('vendor/add-product',{vendordashboard:true,vendor:true,wrtPage:true,tableStyle:true})
  });
  
  router.post('/add-product',(req,res)=>{
    console.log(req.body);
    console.log(req.files.image); //to display image
    
    vendorHelpers.addProduct(req.body,(id)=>{
      let image=req.files.image
      
     image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          vendorHelpers.getAllProducts().then((products)=>{
         
          res.render("vendor/view-products",{products,vendordashboard:true,vendor:true,tableStyle:true})
          })
        }else{
          console.log(err);
        }
      })
      
    })
  })


  router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
     vendorHelpers.deleteProduct(proId).then((response)=>{
      vendorHelpers.getAllProducts().then((products)=>{
      res.redirect('/vendor/view-products')
      })
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
     res.redirect('/vendor/view-products',{products,vendordashboard:true,vendor:true,tableStyle:true})
      if(req.files.Image){
        let image=req.files.image
        image.mv('./public/product-images/'+id+'.jpg')
             
      }
    })
  })
  router.get('/view-orders',async(req,res)=>{
    let orders=await vendorHelpers.getUserOrders()
    res.render('vendor/view-orders',{orders,vendor:true,vendordashboard:true,tableStyle:true})
  })


module.exports = router;
