var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
var objectId=require('mongodb').ObjectID
const { FactorPage } = require('twilio/lib/rest/verify/v2/service/entity/factor')

module.exports={
    
doLogin:(vendorData)=>{
    console.log(vendorData);
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
       
        let vendor=await db.get().collection(collection.VENDOR_COLLECTION).findOne({username:vendorData.username})
        if(vendor){
           
            if(vendor.status==="blocked"){
               console.log("blocked");

                resolve({status:false})
            }else{

            console.log(vendorData.password);
            console.log(vendor.password);
            bcrypt.compare(vendorData.password,vendor.password).then((status)=>{
                if(status){
                    console.log("login succus");
                    response.vendor=vendor
                    response.status=true
                    resolve(response)

                }else{
                    console.log("login failed.");
                    resolve({status:false})
                }
            })
          }
        }else{
            console.log("login failedddd");
            resolve({status:false})
        }
    })
},

getAllProducts:(vendor)=>{
    return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({vendorname:vendor}).toArray()
        resolve(products)
    })
},


addProduct:(product,callback)=>{
    product.price=parseInt(product.price)
    product.quantity=parseInt(product.quantity)
    console.log(product);
    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
    callback(data.ops[0]._id) 

    })
   
},

getProductEdit:(proId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
            resolve(product)
        })
    })
},

deleteProduct:(prodId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
            console.log(response);
            resolve(response)
        })
    })
},

updateProduct:(proId,proDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
            $set:{
                name:proDetails.name,
                description:proDetails.description,
                price:parseInt(proDetails.price),
                category:proDetails.category,
                quantity:parseInt(proDetails.quantity),
                vendorname:proDetails.vendorname
            }
            
        }).then((response)=>{
            resolve()
        })
    })
},

getUserOrders:()=>{
    return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        console.log(orders);
        resolve(orders)


    })
},
getSalesDet:(vendorId)=>{
      return new Promise(async(resolve,reject)=>{
      let vendor =await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:objectId(vendorId)})
      let vendorName=vendor.shopname
    
      let products=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
          {
            $match:{vendorname:vendorName}
          }
      ]).toArray()

      let orders=await db.get().collection(collection.ORDER_COLLECTION).find({
      "products.vendor" : vendorName
       }).toArray();

       var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
       var today = new Date();
       var thisMonth = months[today.getMonth()]
       var prevMonthNo = today.getMonth()
       if(prevMonthNo===0){
           var prevMonth=months[11]
       }else{
           var prevMonth=months[prevMonthNo]
       }
         
       var i=0 
       let j=0
       let totAmount=0
       let salesTot1=0
       let salesTot2=20
       let proList=[]
    
       for (i = 0; i < orders.length; i++) { 
            let proArray=orders[i].products
            
            for(j=0;j<proArray.length;j++){
              
                      console.log(proList);
                      console.log(proArray[j].item);
                    proExist = proList.findIndex(x => x.item ===proArray[j].item);
                              
                if(proExist!=-1){
                  proList[proExist].quantity=proList[proExist].quantity+ proArray[j].quantity
                
                }else{
                    let proObj={
                        item:proArray[j].item,
                        quantity:proArray[j].quantity
                    }
                    proList.push(proObj);
                  
                }    
                    
            }
                  
           totAmount=totAmount+ orders[i].totalAmount
           date=orders[i].date
           month=months[date.getMonth()]
           if(month===thisMonth){
               salesTot1 = salesTot1 + orders[i].totalAmount
           }
           if(month===prevMonth){
               salesTot2 = salesTot2 + orders[i].totalAmount
           }
       }

    //   const ordersObj = Object.assign({}, orders);
    
  
      let salesObj={
        totProducts:products.length,
        itemSold:orders.length,
        totAmount:totAmount,
        salesTot1:salesTot1,
        salesTot2:salesTot2
       

      }
      resolve(salesObj)

    })

},
salesReport:(vendorName,dateDetails)=>{
    console.log(dateDetails);
    return new Promise(async(resolve,reject)=>{   
        let reportData=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            // {
            //     $match:{'products.vendor':vendorName}

            // }
            {
                $unwind:'$products'   //same user same cart id for each products
            },
            {
                $match:{'products.vendor':vendorName}
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity',
                    totalAmount:1
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
                $group: {
                  _id: "$item",
                  totalQty: { $sum: { $multiply: [ "$quantity", 1 ] } },
                  totalSaleAmount: { $sum: { $multiply: [ "$quantity","$product.price"  ] } }
                
               }
            }  

        ]).toArray()
        console.log("order file");
        console.log(reportData);
    })
}

}






















