import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "./dbConnect";
import { Admin } from "@/models/admin.model";
import { AdminInvite } from "@/models/adminInvite.model";

export const authOptions = {
    providers : [
    GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })  
    ],

    callbacks: {
    async signIn({ account, profile }) {
        try {
            // 1. Google provider and verification check
            if (account.provider !== "google") return false;
            if (!profile.email_verified) return false;

            await dbConnect();

            // Superadmin Check
            if (profile.email === process.env.SUPER_ADMIN_EMAIL) {
            const superAdmin = await Admin.findOne({ email: profile.email });

            if (!superAdmin) {
                await Admin.create({
                name: profile.name,
                email: profile.email,
                googleId: profile.sub,
                image: profile.picture,
                role: "superadmin",
                isActive: true,
                invitedBy: null
                });
            } else {
                await Admin.findOneAndUpdate(
                { email: profile.email },
                { lastLogin: Date.now(), image: profile.picture }
                );
            }
            return true;
            }

            // Agar koi purana sub-admin ya staff dobara login kare toh
            const existingAdmin = await Admin.findOne({ email: profile.email });
            
            if (existingAdmin) {
            // Agar superadmin ne is admin ko block/deactivate kiya hai toh login mat hone do
            if (!existingAdmin.isActive) return false;

            // Last login aur profile picture update 
            await Admin.findOneAndUpdate(
                { email: profile.email },
                { lastLogin: Date.now(), image: profile.picture }
            );
            return true; // Successfully logged in
            }

            // 4. Invited Admin Check (First time login only for new admin)
            const invite = await AdminInvite.findOne({
            email: profile.email,
            isUsed: false,
            expiresAt: { $gt: new Date() } // Token expire nahi hona chahiye
            });

            if (invite) {
    
            await Admin.create({
                name: profile.name,
                email: profile.email,
                googleId: profile.sub,
                image: profile.picture,
                role: invite.role, // admin ya staff jo invite me tha
                isActive: true,
                invitedBy: invite.invitedBy
            });

            await AdminInvite.findByIdAndUpdate(
                invite._id,
                { isUsed: true }
            );

            return true;
            }

            return false;

        } catch (error) {
            console.log("SignIn error:", error);
            return false;
        }
    },

    async jwt({ token, profile }) {
        try {
            if (profile) {
            await dbConnect()
            const admin = await Admin.findOne({ 
                email: profile.email 
            })
            if (admin) {
                token.role = admin.role
                token.id = admin._id.toString()
            }
            }
            return token
        } catch (error) {
            console.log("JWT error:", error)
            return token
        }
        },

    async session({ session, token }) {
        try {
            if (token) {
            session.user.role = token.role   
            session.user.id = token.id       
            }
            return session
        } catch (error) {
            console.log("Session error:", error)
            return session
        }
        }           
    },

    session: {
        strategy: "jwt" 
    },
    pages: {
    signIn: '/admin/login'
  }
}