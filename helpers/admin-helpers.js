var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
var objectId=require('mongodb').ObjectID

module.exports={
    
doLogin:(adminData)=>{
    console.log(adminData);
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        console.log(adminData);

        let admin=await db.get().collection(collection.CREDENTIAL_COLLECTION).findOne({username:adminData.username})
        if(admin){
            bcrypt.compare(adminData.password,admin.password).then((status)=>{
                if(status){
                    console.log("login succus");
                    response.admin=admin
                    response.status=true
                    resolve(response)

                }else{
                    console.log("login failed");
                    resolve({status:false})
                }
            })
        }else{
            console.log("login failedddd");
            resolve({status:false})
        }
    })
  },


addVendor:(vendorData)=>{
    
    return new Promise(async(resolve,reject)=>{
    vendorData.password= await bcrypt.hash(vendorData.password,10)
    db.get().collection(collection.VENDOR_COLLECTION).insertOne(vendorData).then((data)=>{
    resolve(data.ops[0]._id) //Getting array with one element

    })
}) 
   
},
getAllVendors:()=>{
    return new Promise(async(resolve,reject)=>{
        let vendors=await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
        resolve(vendors)
    })
  
},

blockVendor:(vendorId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:objectId(vendorId)},{
            $set:{
                status:"blocked"
            }
                    
        }).then((response)=>{
            resolve()
        })
    })
},
getAllVendorDetails:(vendorId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:objectId(vendorId)}).then((vendor)=>{
            resolve(vendor)
        })
    })
},
updateVendor:(vendorId,vendorDetails)=>{
    console.log(vendorId);
    console.log(vendorDetails);
    return new Promise((resolve,reject)=>{
        let res=db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:objectId(vendorId)})
        if(res){
            console.log("done");
        }else{
            console.log("fail");
        }   
        db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:objectId(vendorId)},{
           
            $set:{
                name:vendorDetails.name,
                shopname:vendorDetails.shopname,
                username:vendorDetails.username,
                password:vendorDetails.password,
             
            }
                   
        }).then((response)=>{
            resolve()
        })
    })
},

getAllCategories:()=>{
    return new Promise(async(resolve,reject)=>{
        let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
        resolve(categories)
    })
  
},

addCategory:(categoryData)=>{
    return new Promise(async(resolve,reject)=>{
    let category=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({categoryname:categoryData.categoryname})
    if(category){
        console.log("get");
      
    }else{
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData)
    }
  })
},
deleteCategory:(categoryId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CATEGORY_COLLECTION).removeOne({_id:objectId(categoryId)}).then((response)=>{
            console.log(response);
            resolve(response)
        })
    })
},
getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
      
    })
  
},

getSalesDet:()=>{
  
    return new Promise(async(resolve,reject)=>{
    let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
    let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

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
    let totAmount=0
    let salesTot1=0
    let salesTot2=0

    for (i = 0; i < orders.length; i++) { 
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

    let salesObj={
      totProducts:products.length,
      itemSold:orders.length,
      totAmount:totAmount,
      salesTot1:salesTot1,
      salesTot2:salesTot2
    }
    resolve(salesObj)

  })

}

}






