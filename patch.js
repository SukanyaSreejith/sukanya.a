
const bcrypt=require('bcrypt')


var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/foodDelivery";



MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});


MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("foodDelivery");
    dbo.createCollection("credential", function(err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  });
 
    return new Promise(async(resolve,reject)=>{
        const Password=await bcrypt.hash("redhat",10)
        resolve()
        
        addData(Password);

    });
 
  function addData(Password){
      console.log(Password);
      
      MongoClient.connect(url, function(err, db) {
      if (err) throw err;
          var dbo = db.db("foodDelivery");
          var myobj = { username: "administrator", password: Password };
          dbo.collection("credential").insertOne(myobj, function(err, res) {
      if (err) throw err;
          console.log("1 document inserted");
          db.close();
    });
});
  }


  


