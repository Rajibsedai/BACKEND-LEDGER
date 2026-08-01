const mongoose = require("mongoose");

function connectTODB()
{
    mongoose.connect(process.env.MONGO_URL)
    .then(()=>{
        console.log("server is connected to DB")
    })
    .catch(err=>{
        
        console.log("Error connecting to DB")
        process.exit(1)
        // so that our server stop when database connection failed
    })
}

module.exports= connectTODB