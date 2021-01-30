var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
var objectId=require('mongodb').ObjectID
const Razorpay=require('razorpay')
const moment = require('moment');
const { promises } = require('fs')
const { resolve } = require('path')
const accountSid = 'AC3685c3ecfd622fcd8106d55ee37b02ec';
const authToken  = '604807f4e7b62a4e92bea3d99fcc8766';
const client = require('twilio')(accountSid, authToken);

var instance = new Razorpay({
    key_id:'rzp_test_ZDcFvbfMx7whNh',
    key_secret:'aUGWW4CwTsANVWxeSZrCIX98',
});

module.exports={
    doSignup:(userData)=>{     
    return new Promise(async(resolve,reject)=>{  
            
    let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
    if(user!=null){
      resolve({signupErr:true})      
    }else{
        userData.password=await bcrypt.hash(userData.password,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
        resolve(data.ops[0])   
        })
    }
})
     
},
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            let otp=await db.get().collection(collection.OTP_COLLECTION).findOne({otp:userData.otp})
         
            if(user && otp===null){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("login succus");
                        response.user=user
                        response.status=true
                        resolve(response)

                    }else{
                        console.log("login failed1");
                        resolve({status:false})
                    }
                })
            }else if(otp){
                console.log("otppp");
                console.log(userData);
                if(userData.mobile===otp.mobile){
                    console.log("login succus");
                        response.user=user
                        response.status=true
                        resolve(response) 
                }
            }else{
                console.log("login failed2");
                resolve({status:false})
            }
        })
    },

addToCart:(proId,userId)=>{
    return new Promise(async(resolve,reject)=>{
        let vname=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
      
        let proObj={
            item:objectId(proId),
            quantity:1,
            vendor:vname.vendorname
          
        }
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId)
            if(proExist!=-1){
           
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                
                ).then(()=>{
                    resolve()
                })

            }else{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},
            {
                $push:{products:proObj}

                
            }

            ).then((response)=>{
                resolve()
            })
            }    

        }else{
            console.log('fail');
            let cartObj={
                user:objectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
    })
},
getOrdProd:(ordId)=>{
    console.log("order id");
    console.log(ordId);
    return new Promise(async(resolve,reject)=>{
        let ordItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match:{_id:objectId(ordId)}

        },
        {
             $unwind:'$products'   //same user same cart id for each products
        },
        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }

        },
        {
            $lookup:{
                 from:collection.PRODUCT_COLLECTION,
                 localField:'item',  //this data from cart collection,that is our input filed so calling local field.we want to search it for product collection.
                 foreignField:'_id', //this field speicifies the name of local field used in p roduct collection.
                 as:'product'  //array 
                
           }
         },
         {
             $project:{
                 item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
             }
         }
       
       
    ]).toArray()
    console.log(ordItems);
    
    resolve(ordItems) //needs only items
})
},


getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}

            },
            {
                 $unwind:'$products'   //same user same cart id for each products
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }

            },
            {
                $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',  //this data from cart collection,that is our input filed so calling local field.we want to search it for product collection.
                     foreignField:'_id', //this field speicifies the name of local field used in product collection.
                     as:'product'  //object with full fields from product collection.
                    
               }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             }
           
           
        ]).toArray()
        console.log("cart");
        console.log(cartItems);
       
        // console.log(cartItems[0].product);
        resolve(cartItems) //needs only items
    })
},

getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
    let count=0
    let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
    if(cart){
        count=cart.products.length
    }
       resolve(count)
    })
},
removeCart:(proId,userId)=>{
   
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({user:objectId(userId)},
        {
            $pull:{'products':{item:objectId(proId)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
       })
    }) 
},

changeProductQuantity:(details)=>{
    details.count=parseInt(details.count) 
    details.quantity=parseInt(details.quantity)
    
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
        }else{

        db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
                
                ).then((response)=>{
                resolve({status:true})
                })
            }
    })
},

getTotalAmount:(userId)=>{
    
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}

            },
            {
                 $unwind:'$products'   //same user same cart id for each products
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }

            },
            {
                $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',  //this data from cart collection,that is our input filed so calling local field.we want to search it for product collection.
                     foreignField:'_id', //this field speicifies the name of local field used in p roduct collection.
                     as:'product'  //array 
                    
               }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             },
             {
                 $group:{
                     _id:null,
                     total:{$sum:{$multiply:['$quantity','$product.price']}}
                 }
             }
           
           
        ]).toArray()
        if(total.length===0){
            resolve()
        }else{
            resolve(total[0].total) //needs only items
        }

    })

},

getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
     
    })
},
placeOrder:(order,products,total)=>{
    return new Promise ((resolve,reject)=>{
       // console.log(order,products,total);
         
        let status=order['payment-method']==='COD'?'placed':'pending'
        let orderObj={
            deliveryDetails:{
                name:order.name,
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode
            },
            userId:objectId(order.userId),
            paymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status,
            date:new Date(),
            date2:moment().format('L')
        }
    
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async(response)=>{
        db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
        var i;
        for (i = 0; i < products.length; i++) { 
        
        let proDet= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(products[i].item)})
        let newQty=proDet.quantity-products[i].quantity
      
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(products[i].item)},{
        
            $set:{
                quantity:newQty
            
            }
        })
    }
        resolve(response.ops[0]._id)
        
        })
        
    })


 },
 getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        console.log("cart");
        console.log(cart);
        console.log(cart.products);
        resolve(cart.products)
    })
},
getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userId);
        let orders= await db.get().collection(collection.ORDER_COLLECTION)
        .find({userId:objectId(userId)}).toArray()
        console.log(orders);
        resolve(orders)


    })
},
getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{user:objectId(orderId)}

            },
            {
                 $unwind:'$products'   //same user same cart id for each products
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }

            },
            {
                $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',  //this data from cart collection,that is our input filed so calling local field.we want to search it for product collection.
                     foreignField:'_id', //this field speicifies the name of local field used in p roduct collection.
                     as:'product'  //array 
                    
               }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             }
           
           
        ]).toArray()
        resolve(orderItems)
    })

},
generateRazorpay:(orderId,total)=>{
  
    return new Promise((resolve,reject)=>{
        var options= {
            amount:total,
            currency:"INR",
            receipt:""+orderId
        };
        instance.orders.create(options, function(err, order){
            if(err){
                console.log(err);
            }else
            console.log("New Order :",order);
            resolve(order)
        })
    
    })
},
sendOtp:(mobNo)=>{
   console.log(mobNo);
    return new Promise(async(resolve,reject)=>{
        var digits = '0123456789'; 
        let OTP = ''; 
        for (let i = 0; i < 4; i++ ) { 
           OTP += digits[Math.floor(Math.random() * 10)]; 
       } 
       
        client.messages
        .create({
           body: 'OTP:'+ OTP,
           from: '+12059647158',
           to: mobNo
         })
         let otpObj={
             mobile:mobNo,
             otp:OTP
         }
         db.get().collection(collection.OTP_COLLECTION).insertOne(otpObj)

        //.then(message => console.log(message.sid));

     
    })
},
verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
        let hmac = crypto.createHmac('sha256', 'aUGWW4CwTsANVWxeSZrCIX98')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })
},
changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(orderId)},
        {
            $set:{
               status:'placed'
            }
        }
        ).then(()=>{
            resolve()
        })
    })
},

getProdVendorwise:(vendor)=>{
    return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({vendorname:vendor}).toArray()
        resolve(products)
    })
},

getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        resolve(products)
    })
}

}




