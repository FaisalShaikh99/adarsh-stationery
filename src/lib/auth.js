import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "./dbConnect";
import { Admin } from "@/models/admin.model";
import { AdminInvite } from "@/models/AdminInvite.model";

export const authOption = {
    providers : [
    GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })  
    ],
    callbacks: {
       async signIn({ account, profile }) {
  try {
    // Google provider check
    if (account.provider !== "google") return false
    if (!profile.email_verified) return false

    await dbConnect()

    // Superadmin check
    if (profile.email === process.env.SUPER_ADMIN_EMAIL) {
      const superAdmin = await Admin.findOne({ 
        email: profile.email 
      })

      if (!superAdmin) {
        await Admin.create({
          name: profile.name,
          email: profile.email,
          googleId: profile.sub,
          image: profile.picture,
          role: "superadmin",
          isActive: true,
          invitedBy: null
        })
      } else {
        await Admin.findOneAndUpdate(
          { email: profile.email },
          { lastLogin: Date.now(), image: profile.picture }
        )
      }
      return true
    }

    // Invited admin check
    const invite = await AdminInvite.findOne({
      email: profile.email,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (invite) {
      const existingAdmin = await Admin.findOne({  // ← Admin, not AdminInvite
        email: profile.email
      })

      if (!existingAdmin) {
        await Admin.create({
          name: profile.name,
          email: profile.email,
          googleId: profile.sub,
          image: profile.picture,
          role: invite.role,
          isActive: true,
          invitedBy: invite.invitedBy
        })
      }

      await AdminInvite.findByIdAndUpdate(
        invite._id,
        { isUsed: true }
      )

      return true
    }

    // Koi bhi check pass nahi hua
    return false

  } catch (error) {
    console.log("SignIn error:", error)
    return false  // error pe bhi bahar bhejo
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