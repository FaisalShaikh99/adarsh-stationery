import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "./dbConnect";
import { Admin } from "@/models/admin.model";
import { AdminInvite } from "@/models/adminInvite.model";

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })  
    ],

    callbacks: {
        async signIn({ account, profile, user }) { 
            try {
                if (account?.provider !== "google") return false;

                await dbConnect();

                const userEmail = (profile?.email || user?.email)?.toLowerCase()?.trim();
                const userName = profile?.name || user?.name;
                const userImage = profile?.picture || user?.image;
                const googleId = profile?.sub || user?.id;

                if (!userEmail) {
                    console.log("NextAuth Error: Could not extract email from Google identity.");
                    return "/admin/sign-in?error=UnregisteredGoogle";
                }

                // 1. SuperAdmin Google Login Check
                if (userEmail === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()?.trim()) {
                    const superAdmin = await Admin.findOne({ email: userEmail });

                    if (!superAdmin) {
                        await Admin.create({
                            name: userName,
                            email: userEmail,
                            googleId: googleId,
                            image: userImage,
                            role: "superadmin",
                            isActive: true,
                            isBlocked: false,
                            invitedBy: null
                        });
                    } else {
                        // TASK 2: Check block status for SuperAdmin
                        if (superAdmin.isBlocked) {
                            console.log(`Blocked SuperAdmin Google login attempt: ${userEmail}`);
                            return "/admin/sign-in?error=AccountRestricted";
                        }
                        await Admin.findOneAndUpdate(
                            { email: userEmail },
                            { lastLogin: Date.now(), image: userImage, isActive: true }
                        );
                    }
                    return true;
                }

                // 2. Existing Team Member Check
                const existingAdmin = await Admin.findOne({ email: userEmail });
                
                if (existingAdmin) {
                    // TASK 2: Check block status for team member
                    if (existingAdmin.isBlocked) {
                        console.log(`Blocked team member Google login attempt: ${userEmail}`);
                        return "/admin/sign-in?error=AccountRestricted";
                    }
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

                // 3. Pending Invitation Check
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
                        isBlocked: false,
                        invitedBy: invite.invitedBy
                    });

                    await AdminInvite.findByIdAndUpdate(
                        invite._id,
                        { isUsed: true }
                    );

                    return true;
                }

                // TASK 2: Uninvited Google account -> reject with generic message
                console.log(`Unregistered Google login attempt blocked for: ${userEmail}`);
                return "/admin/sign-in?error=UnregisteredGoogle";

            } catch (error) {
                console.log("SignIn error:", error);
                return "/admin/sign-in?error=UnregisteredGoogle";
            }
        },

        async jwt({ token, profile, user }) { 
            try {
                const targetEmail = (profile?.email || user?.email || token?.email)?.toLowerCase()?.trim();
                
                if (targetEmail) {
                    await dbConnect();
                    const admin = await Admin.findOne({ email: targetEmail });
                    if (admin) {
                        // Real-time block check on every JWT token evaluation
                        token.isBlocked = !!admin.isBlocked;
                        if (admin.isBlocked) {
                            token.role = null;
                        } else {
                            token.name = admin.name;
                            token.picture = admin.image;
                            token.role = admin.role;
                            token.id = admin._id.toString();
                            token.lastLogin = admin.lastLogin;
                        }
                    } else {
                        token.isBlocked = true;
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
                    // Real-time active session invalidation for blocked accounts
                    if (token.isBlocked) {
                        session.user = null;
                        session.isBlocked = true;
                        return session;
                    }
                    if (!session.user) session.user = {};
                    if (token.name) session.user.name = token.name;
                    if (token.picture) session.user.image = token.picture;
                    session.user.role = token.role;
                    session.user.id = token.id;
                    session.user.lastLogin = token.lastLogin;
                    session.isBlocked = false;
                }
                return session;
            } catch (error) {
                console.log("Session error:", error);
                return session;
            }
        }
    },

    session: {
        strategy: "jwt" 
    },
    pages: {
        signIn: '/admin/sign-in'
    }
};