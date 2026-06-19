export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Attempt from "@/models/Attempt";

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

    // Fetch stats
    const totalAttempts = await Attempt.countDocuments({
      userId: dbUser._id,
      status: "submitted",
    });

    const attempts = await Attempt.find({
      userId: dbUser._id,
      status: "submitted",
    });

    let averageScore = 0;
    if (totalAttempts > 0) {
      const totalScoreSum = attempts.reduce(
        (sum, att) => sum + (att.result?.totalScore || 0),
        0
      );
      const totalMarksSum = attempts.reduce(
        (sum, att) => sum + (att.result?.totalMarks || 0),
        0
      );
      averageScore =
        totalMarksSum > 0 ? Math.round((totalScoreSum / totalMarksSum) * 100) : 0;
    }

    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
        role: dbUser.role,
        targetExam: dbUser.targetExam || "",
        state: dbUser.state || "",
        streak: dbUser.streak || 0,
        createdAt: dbUser.createdAt,
      },
      stats: {
        testsAttempted: totalAttempts,
        averageScore: `${averageScore}%`,
        streak: dbUser.streak || 0,
        joinedDate: dbUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetExam, state } = body;

    // Connect to database
    await dbConnect();

    // Update user profile fields
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { targetExam, state } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        targetExam: updatedUser.targetExam,
        state: updatedUser.state,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
