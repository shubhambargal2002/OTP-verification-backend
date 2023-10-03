const mongoose=require('mongoose');
const DATABASE = process.env.DATABASE;

// mongoose.set('strictQuery', false);

mongoose.connect(DATABASE).then(()=>{
    console.log("connected to mongoDB successfully")
}).catch((error)=>{
    console.log(error)
    console.log("error")
})
