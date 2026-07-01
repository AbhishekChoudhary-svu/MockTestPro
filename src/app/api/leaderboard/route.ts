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

    // 1. Fetch all student users (exclude admin for fair leaderboard)
    const students = await User.find({ role: "student", isBanned: false })
      .select("_id name avatar state targetExam streak createdAt")
      .lean();

    // 2. Fetch all submitted attempts to calculate average scores & counts
    const allAttempts = await Attempt.find({ status: "submitted" })
      .select("userId result.totalScore result.totalMarks")
      .lean();

    // Group attempts by userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAttemptsMap: Record<string, any[]> = {};
    for (const att of allAttempts) {
      const uid = att.userId.toString();
      if (!userAttemptsMap[uid]) {
        userAttemptsMap[uid] = [];
      }
      userAttemptsMap[uid].push(att);
    }

    // 3. Combine user details and attempt stats
    const leaderboardData = students.map((student) => {
      const uid = student._id.toString();
      const userAttempts = userAttemptsMap[uid] || [];
      const totalAttempts = userAttempts.length;

      let avgScorePercent = 0;
      if (totalAttempts > 0) {
        const scoreSum = userAttempts.reduce((sum, att) => sum + (att.result?.totalScore || 0), 0);
        const marksSum = userAttempts.reduce((sum, att) => sum + (att.result?.totalMarks || 0), 0);
        avgScorePercent = marksSum > 0 ? Math.round((scoreSum / marksSum) * 100) : 0;
      }

      // Combo points system for overall leaderboard positioning:
      // Points = Accuracy * 10 + Attempts * 25 + Streak * 50
      const totalPoints = avgScorePercent * 10 + totalAttempts * 25 + (student.streak || 0) * 50;

      return {
        id: uid,
        name: student.name,
        avatar: student.avatar,
        state: student.state || "N/A",
        targetExam: student.targetExam || "N/A",
        streak: student.streak || 0,
        testsAttempted: totalAttempts,
        averageScore: avgScorePercent,
        points: totalPoints,
        joinedDate: student.createdAt,
      };
    });

    // 4. Sort by points descending by default
    leaderboardData.sort((a, b) => b.points - a.points);

    // Add rank based on sorted order
    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return NextResponse.json(rankedLeaderboard);
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
