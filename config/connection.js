const mongoClient=require('mongodb').MongoClient

const state={
    db:null
}

module.exports.connect=function(done){
    // const url='mongodb://localhost:27017'
    const url='mongodb+srv://sukanya2122:sriyan%40Sree505@cluster0.tv7x1.mongodb.net/test'
    // const dbname='foodDelivery'
    const dbname='foodOrder'
        mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()

    })

 
}

module.exports.get=function(){
    return state.db

}