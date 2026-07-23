import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
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
        required : true,
        sparse: true
    },
    password : {
        type : String,
        default : null
    },
    image : {
        type : String
    },
    role : {
        type : String,
        enum : ["superadmin", "admin", "staff"],
        default :"staff"
    },
    isActive : {
        type : Boolean,
        default : false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    lastLogin  : {
        type : Date,
        default : Date.now
    },
    invitedBy : {
        type : mongoose.Types.ObjectId,
        ref : "Admin",
        default : null,
    },
    notifyNewOrder: {
        type: Boolean,
        default: true
    },
    notifyLowStock: {
        type: Boolean,
        default: true
    },
    notifyNewTeamMember: {
        type: Boolean,
        default: true
    }
}, {timestamps : true});

// Indexes
AdminSchema.index({ email: 1 });
AdminSchema.index({ role: 1 });

export const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);