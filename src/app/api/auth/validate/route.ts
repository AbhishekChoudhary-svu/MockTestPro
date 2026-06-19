export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";

/**
 * GET /api/auth/validate
 * Checks if the currently logged-in session user still exists in the DB.
 * Returns { valid: true } if user exists, { valid: false } if not.
 * The client uses this to auto-sign-out when an admin deletes a user account.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // No session at all — not logged in
      return NextResponse.json({ valid: false, reason: "no_session" });
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ valid: false, reason: "user_deleted" });
    }

    if (dbUser.isBanned) {
      return NextResponse.json({ valid: false, reason: "user_banned" });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error in validate route:", error);
    return NextResponse.json({ valid: true }); // fail open to avoid mass logouts on DB issues
  }
}
