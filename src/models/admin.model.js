import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    name : {
        type : String,
        requied : true,
        default : "Admin"
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    googleId : {
        type : String,
        unique : true,
        required : true
    },
    image : {
        type : String
    },
    role : {
        type : String,
        enum : ["superadmin", "admin", "staff"],
        default :" staff"
    },
    isActive : {
        type : Boolean,
        default : false
    },
    lastLogin  : {
        type : Date,
        default : Date.now()
    },
    invitedBy : {
        type : mongoose.Types.ObjectId,
        ref : "Admin",
        default : null,
    },
}, {timestamps : true})

export const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);