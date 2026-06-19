import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      
      if (!user.email) return false;
      
      try {
        await dbConnect();
        
        let dbUser = await User.findOne({ email: user.email });
        
        if (!dbUser) {
          // Default all new signups to 'student'
          const role = 'student';

          dbUser = await User.create({
            googleId: account?.providerAccountId || profile?.sub || '',
            name: user.name || 'User',
            email: user.email,
            avatar: user.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || 'User')}`,
            role: role,
            streak: 0,
            isBanned: false,
            lastLogin: new Date(),
          });
        } else {
          if (dbUser.isBanned) {
            return false;
          }
          dbUser.lastLogin = new Date();
          await dbUser.save();
        }
        
        return true;
      } catch (error) {
        console.error("Error during signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.targetExam = user.targetExam;
        token.state = user.state;
        token.deleted = false;
      } else {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.targetExam = dbUser.targetExam;
          token.state = dbUser.state;
          token.deleted = false;
        } else {
          // User was deleted from DB — mark session as invalid
          token.deleted = true;
        }
      }
      
      if (trigger === "update" && session) {
        if (session.targetExam !== undefined) token.targetExam = session.targetExam;
        if (session.state !== undefined) token.state = session.state;
        if (session.name !== undefined) token.name = session.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'student' | 'admin';
        session.user.targetExam = token.targetExam as string | undefined;
        session.user.state = token.state as string | undefined;
        // Signal to client that this user no longer exists in DB
        (session.user as Record<string, unknown>).deleted = token.deleted === true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
