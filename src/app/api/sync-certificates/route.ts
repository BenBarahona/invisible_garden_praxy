import { NextRequest, NextResponse } from "next/server";
import { syncFromClientData } from "@/lib/groupManager.server";

export interface LinkedCertificate {
  certificate_number: string;
  first_name: string;
  last_name: string;
  commitment: string;
  linkedAt: string;
}

/**
 * API Route: Sync certificates from client to server
 * 
 * This endpoint allows the client to sync its localStorage data with the server.
 * In production, you'd use a proper database instead of this sync mechanism.
 * 
 * POST /api/sync-certificates
 * Body: { linkedCertificates: LinkedCertificate[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkedCertificates } = body;

    console.log("[SERVER] Received sync request:", {
      certificateCount: Array.isArray(linkedCertificates) ? linkedCertificates.length : 0,
      certificates: linkedCertificates,
    });

    if (!Array.isArray(linkedCertificates)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Sync data to server-side storage
    await syncFromClientData(linkedCertificates);

    console.log(`[SERVER] Successfully synced ${linkedCertificates.length} certificates to server`);

    return NextResponse.json({
      success: true,
      message: `Synced ${linkedCertificates.length} certificates`,
      certificateCount: linkedCertificates.length,
    });
  } catch (error) {
    console.error("[SERVER] Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync certificates" },
      { status: 500 }
    );
  }
}

