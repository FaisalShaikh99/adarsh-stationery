
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
        async signIn({ account, profile, user }) { 
            try {
                if (account.provider !== "google") return false;

                await dbConnect();

                //  SAFE EMAIL EXTLECTION: Profile se lo, agar undefined hai toh user object se lo!
                const userEmail = profile?.email || user?.email;
                const userName = profile?.name || user?.name;
                const userImage = profile?.picture || user?.image;
                const googleId = profile?.sub || user?.id;

                if (!userEmail) {
                    console.log("NextAuth Error: Could not extract email from Google identity.");
                    return false;
                }

              
                if (userEmail === process.env.SUPER_ADMIN_EMAIL) {
                    const superAdmin = await Admin.findOne({ email: userEmail });

                    if (!superAdmin) {
                        await Admin.create({
                            name: userName,
                            email: userEmail,
                            googleId: googleId,
                            image: userImage,
                            role: "superadmin",
                            isActive: true,
                            invitedBy: null
                        });
                    } else {
                        await Admin.findOneAndUpdate(
                            { email: userEmail },
                            { lastLogin: Date.now(), image: userImage, isActive: true }
                        );
                    }
                    return true;
                }

          
                const existingAdmin = await Admin.findOne({ email: userEmail });
                
                if (existingAdmin) {
                    // 🟢 User jab bhi dubara login karega, status wapas Active (true) ho jayega!
                    await Admin.findOneAndUpdate(
                        { email: userEmail },
                        { 
                            lastLogin: Date.now(), 
                            image: userImage, 
                            isActive: true 
                        }
                    );
                    return true; 
                }

              
                const invite = await AdminInvite.findOne({
                    email: userEmail,
                    isUsed: false,
                    $or: [
                        { expiresAt: { $gt: new Date() } },
                        { expiredAt: { $gt: new Date() } }
                    ]
                });

                if (invite) {
                    await Admin.create({
                        name: userName,
                        email: userEmail,
                        googleId: googleId,
                        image: userImage,
                        role: invite.role, 
                        isActive: true, 
                        invitedBy: invite.invitedBy
                    });

                    await AdminInvite.findByIdAndUpdate(
                        invite._id,
                        { isUsed: true }
                    );

                    return true;
                }

                console.log(`Unauthorized access attempt blocked for: ${userEmail}`);
                return false;

            } catch (error) {
                console.log("SignIn error:", error);
                return false;
            }
        },
        async jwt({ token, profile, user }) { 
            try {
                const targetEmail = profile?.email || user?.email || token?.email;
                
                if (targetEmail) {
                    await dbConnect();
                    const admin = await Admin.findOne({ email: targetEmail });
                    if (admin) {
                        token.role = admin.role;
                        token.id = admin._id.toString();
                        token.lastLogin = admin.lastLogin;
                    }
                }
                return token;
            } catch (error) {
                console.log("JWT error:", error);
                return token;
            }
        },

        async session({ session, token }) {
            try {
                if (token) {
                session.user.role = token.role   
                session.user.id = token.id   
                session.user.lastLogin = token.lastLogin;    
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
    signIn: '/admin/sign-in'
  }
}