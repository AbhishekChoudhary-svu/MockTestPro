export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

// POST: Trigger daily streak update on app load / page view
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    const lastLogin = dbUser.lastLogin ? new Date(dbUser.lastLogin) : null;
    let updated = false;

    if (lastLogin) {
      const oneDay = 24 * 60 * 60 * 1000;
      const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const d2 = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / oneDay);

      if (diffDays === 1) {
        dbUser.streak = (dbUser.streak || 0) + 1;
        updated = true;
      } else if (diffDays > 1) {
        dbUser.streak = 1;
        updated = true;
      } else if (diffDays === 0) {
        if (!dbUser.streak) {
          dbUser.streak = 1;
          updated = true;
        }
      }
    } else {
      dbUser.streak = 1;
      updated = true;
    }

    dbUser.lastLogin = today;
    await dbUser.save();

    return NextResponse.json({
      success: true,
      streak: dbUser.streak,
      updated,
      lastLogin: dbUser.lastLogin,
    });
  } catch (error) {
    console.error("Error checking streak:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET: Simply retrieve streak information without modifying anything
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      streak: dbUser.streak || 0,
      lastLogin: dbUser.lastLogin,
    });
  } catch (error) {
    console.error("Error getting streak:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
