export const dynamic = 'force-static';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculationService } from "@/lib/services/calculationService";
import { ExecutionTimeline, TelemetryMode } from "@/lib/utils/timeline";
import { v4 as uuidv4 } from "uuid";

/**
 * Compute API Route (Contract Transmitter)
 */

export async function POST(req: NextRequest) {
    const traceId = uuidv4();
    const timeline = new ExecutionTimeline();
    const telemetryMode: TelemetryMode = process.env.NODE_ENV === 'development' ? 'full' : 'summary';
    
    try {
        const body = await req.json();
        const session = await getServerSession(authOptions);
        
        // 1. Authorization Logic (Allow 'temp' projects for anonymous users)
        const isAnonymousAllowed = body.projectId === "temp";
        
        if (!isAnonymousAllowed && (!session || !(session.user as any).id)) {
            return NextResponse.json({ 
                success: false,
                traceId,
                error: { code: "AUTH_REQUIRED", message: "Unauthorized: Please log in to save or reference project data.", layer: "api", recoverable: true }
            }, { status: 401 });
        }

        const userId = (session?.user as any)?.id || "anonymous_lite_user";

        // Service returns the full ExecutionResult contract
        const result = await calculationService.handleComputeRequest(
            userId, 
            body, 
            traceId, 
            timeline, 
            telemetryMode
        );

        return NextResponse.json(result, { 
            status: result.success ? 200 : 400 
        });
        
    } catch (err: any) {
        return NextResponse.json({ 
            success: false,
            traceId,
            error: { code: "FATAL_ERROR", message: err.message, layer: "api", recoverable: false }
        }, { status: 500 });
    }
}
