import mongoose from 'mongoose';


if (!process.env.MONGODB_URI) {
       throw new Error('Please define the MONGODB_URI environment variable');
     }

     let cached = global.mongoose;
     
     if(!cached){
        cached = global.mongoose = {
            isConnected : null,
            promise : null
        }
     }

export  async function dbConnect() {
     if(cached.isConnected){
        console.log("Database Already Connected");
        return cached.isConnected
    }
     
    if(!cached.promise){
        cached.promise = mongoose.connect(process.env.MONGODB_URI , {
            bufferCommands: false
        })
    }
 try {
    cached.isConnected = await cached.promise;
    console.log('✅ MongoDB connected!');
    return cached.isConnected;
  } catch (error) {
    cached.promise = null;
    console.log('❌ MongoDB connection failed!', error);
    throw error;
  }
  
}