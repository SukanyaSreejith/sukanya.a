
var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const { PreconditionFailed } = require('http-errors');
const vendorHelpers = require('../helpers/vendor-helpers');
const { response } = require('express');
const { sendOtp } = require('../helpers/user-helpers');


const verifyLogin=(req,res,next)=>{
 
  if(req.session.userLoggedIn){
     next()
  }else{
    console.log("else");
 
    // let style="user-login.css"
    res.redirect('/user/user-login')
  }
}

router.get('/user-home',(req,res)=>{
  let style='user-home.css' 
  res.render('user/user-home',{style})
})


router.get('/user-signup',(req,res)=>{
  let style="user-login.css"
  res.render('user/user-signup',{style})
})

router.post('/change-product-quantity',(req,res,next)=>{
    userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.session.user._id) 
    res.json(response) //converting the response data into json. json using to pass data as object

  })
})

router.get('/user-login',async(req,res)=>{

  let style="user-login.css"
  if(req.session.userLoggedIn){
      let userDet=req.session.user
      let cartCount=null
      cartCount=await userHelpers.getCartCount(req.session.user._id)
      userHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products',{user:true,products,cartCount,userDet}) 
    })
  }else{  
    req.session.userloginErr=true
    let style="user-login.css"
    res.render('user/user-login',{style,login:true})   
  }

})
router.post('/user-login',(req,res)=>{
  userHelpers.doLogin(req.body).then(async(response)=>{
    let cartCount=null
    if(response.status){
      req.session.user=response.user
      req.session.userLoggedIn=true
      let userDet=req.session.user
     
      cartCount=  await userHelpers.getCartCount(req.session.user._id)
      userHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products',{user:true,products,cartCount,userDet}) 
      })

    }else{
      req.session.userloginErr=true
      let style="user-login.css"
      res.render('user/user-login',{style,"loginErr":req.session.userloginErr})
    }
  })
})
router.get('/view-products',(req,res)=>{
 
  let userDet=null
  userHelpers.getAllProducts().then((products)=>{
    console.log("Product");
    console.log(products);
    if(req.session.userLoggedIn){
      let userDet=req.session.user 
      res.render('user/view-products',{products,user:true,userDet})  
    }else{
      console.log("pro");
      console.log(products);
      res.render('user/view-products',{products,user:true,userDet}) 
    }
    })
  
})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
     console.log("cart succ");
     res.json({status:true})
  
   }) 
 })
router.get('/cart',verifyLogin,async(req,res)=>{
  if(req.session.userLoggedIn){
    let userDet=req.session.user
    let products=await userHelpers.getCartProducts(req.session.user._id)
    let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{products,user:req.session.user,totalValue,user:true,userDet})
  }
  })


router.get('/place-order',verifyLogin, async(req,res)=>{
  let userDet=req.session.user
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,userr:req.session.user,user:true,userDet})
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{userr:req.session.user,user:true})
})
router.get('/otp-login',(req,res)=>{
  let style="user-login.css"
  res.render('user/otp-login',{style})
})

router.get('/view-order-products:id',async(req,res)=>{
  let products=  await userHelpers.getOrdProd(req.params.id)
  res.render('user/view-order-products',{user:true,products})
})

router.get('/send-otp/:mobNo',(req,res)=>{
  userHelpers.sendOtp(req.params.mobNo).then(()=>{
  res.json({status:true})

  }) 
})

router.post('/place-order',async(req,res)=>{
 
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
 
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    }else{  
       userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
       res.json(response)
       })
    }
  })
 
})
router.get('/remove-cart/:id',async(req,res)=>{
  let proId=req.params.id
   console.log(req.session.user._id);
  await userHelpers.removeCart(proId,req.session.user._id).then(async(response)=>{
  if(response){
    let products=await userHelpers.getCartProducts(req.session.user._id)
    let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{products,user:req.session.user,totalValue,user:true,remove:true})
  }
    
  })
})

router.get('/logout',(req,res)=>{
  
  req.session.userLoggedIn=false
  //req.session.destroy()
  req.session.user=null
  res.redirect('/user/user-home')

})
router.get('/about',(req,res)=>{
  let style="user-common.css"
  res.render('user/about',{style})
})

router.post('/user-signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{ 
    console.log("response");
    console.log(response);
    if(response.signupErr){
      console.log("Error");
      req.session.userSignupErr=true
      let style="user-login.css"
      res.render('user/user-signup',{"userSignupErr":req.session.userSignupErr,style})
    }else{
      console.log("no error");
   
    req.session.user=response
    req.session.user.loggedIn=true
    let userDet=req.session.user
    userHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,userDet,user:true})
    
  })
}
})
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let userId=null
  if(req.session.userLoggedIn){
    userId=req.session.user._id
    let userDet=req.session.user
  
  let orders=await userHelpers.getUserOrders(userId)
  res.render('user/orders',{userr:req.session.user,orders,user:true,userDet})
  }
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrdProd(req.params.id)
 
  if(req.session.userLoggedIn){
    let userDet=req.session.user
    res.render('user/view-order-products',{user:req.session.user,products,user:true,userDet})
  }
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['receipt']).then(()=>{
      console.log('payment success');
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })

})

router.get('/explore',async(req,res)=>{
  res.render('user/explore')
})
router.get('/our-bakers', async(req,res)=>{
   adminHelpers.getAllVendors().then((vendors)=>{
    let userDet=null
    if(req.session.userLoggedIn){
      userDet=req.session.user
    }
    res.render('user/our-bakers',{vendors,user:true,userDet})
  
    })
});
router.get('/view-products-vendorwise/:vendorName', async(req,res)=>{
  let vendor=req.params.vendorName
  let cartCount=null
  let userDet=null
  if(req.session.userLoggedIn){
    let userDet=req.session.user
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    userHelpers.getProdVendorwise(vendor).then((products)=>{
    res.render('user/view-products-vendorwise',{products,user:true,cartCount,userDet})
  })
  }else{
    let userDet=null
    let cartCount=null
    userHelpers.getProdVendorwise(vendor).then((products)=>{
    res.render('user/view-products-vendorwise',{products,user:true,cartCount,userDet})
    })
  
  }
  
});

module.exports = router;

