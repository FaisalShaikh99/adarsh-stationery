import mongoose from "mongoose";


const AdminInviteSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
    },
    role : {
        type : String,
        required : true,
        default : "staff"
    },
    message : {
        type : String,
    },
    token : {
        type : String,
        required : true,
        unique : true
    },
    expiresAt : {
        type : Date,
        default: () => new Date(Date.now() + 24*60*60*1000)
    },
    isUsed: {
        type : Boolean,
        default : false
    },
    invitedBy : {
        type : mongoose.Types.ObjectId,
        ref : "Admin",
        default : null,

    }
},{timestamps : true})

export const AdminInvite =  mongoose.models.AdminInvite || mongoose.model("AdminInvite", AdminInviteSchema)