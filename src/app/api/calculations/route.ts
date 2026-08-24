export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculationService } from "@/lib/services/calculationService";
import { ExecutionTimeline, TelemetryMode } from "@/lib/utils/timeline";
import { v4 as uuidv4 } from "uuid";

/**
 * Calculations Persistence API (Contract Transmitter)
 */

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const traceId = uuidv4();

    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized", traceId }, { status: 401 });
        }

        if (!projectId) {
            return NextResponse.json({ error: "projectId is required", traceId }, { status: 400 });
        }

        const calculations = await calculationService.getProjectCalculations(projectId);
        
        return NextResponse.json(calculations, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error: any) {
        console.error(`[Calculations List ERROR] [${traceId}]:`, error);
        return NextResponse.json({ error: "Internal Server Error", traceId }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const traceId = uuidv4();
    const timeline = new ExecutionTimeline();
    const telemetryMode: TelemetryMode = process.env.NODE_ENV === 'development' ? 'full' : 'summary';

    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ 
                success: false,
                traceId,
                error: { code: "AUTH_REQUIRED", message: "Unauthorized", layer: "api", recoverable: true }
            }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();

        // Service returns the full ExecutionResult contract
        const result = await calculationService.saveCalculation(
            userId, 
            body, 
            traceId, 
            timeline, 
            telemetryMode
        );

        return NextResponse.json(result, { 
            status: result.success ? 201 : 400 
        });

    } catch (err: any) {
        return NextResponse.json({ 
            success: false,
            traceId,
            error: { code: "FATAL_ERROR", message: err.message, layer: "api", recoverable: false }
        }, { status: 500 });
    }
}
