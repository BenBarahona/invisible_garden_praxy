import { NextRequest, NextResponse } from "next/server";
import { getMedicalProfessionalsGroupServer } from "@/lib/groupManager.server";

/**
 * API Route: Get Medical Professionals Group
 * 
 * Returns the current group data from server-side storage (Vercel KV).
 * This ensures clients always use the server's version of the group.
 * 
 * GET /api/get-group
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[SERVER] Get group request received");
    
    const { group, root } = await getMedicalProfessionalsGroupServer();
    
    // Convert BigInt members to strings for JSON serialization
    const membersAsStrings = group.members.map(m => m.toString());
    
    console.log("[SERVER] Returning group with", membersAsStrings.length, "members");
    console.log("[SERVER] Group root:", root.toString());
    
    return NextResponse.json({
      success: true,
      members: membersAsStrings,
      root: root.toString(),
      memberCount: membersAsStrings.length,
    });
  } catch (error) {
    console.error("[SERVER] Get group error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to get group";
    
    // If no certificates are linked yet, return empty group
    if (errorMessage.includes("No linked certificates")) {
      return NextResponse.json({
        success: false,
        error: "No linked certificates yet",
        members: [],
        root: "0",
        memberCount: 0,
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

