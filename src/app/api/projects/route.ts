export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { projectRepo } from "@/lib/repositories/projectRepo";
import { v4 as uuidv4 } from "uuid";

/**
 * Projects API (Hardened)
 * Strictly enforces server-side userId from the session.
 */

export async function GET() {
    const traceId = uuidv4();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized", traceId }, { status: 401 });
        }

        const userId = (session.user as any).id;
        
        // Fetch only projects owned by this user
        const projects = await projectRepo.listByUser(userId);
        
        return NextResponse.json(projects, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error(`[Projects API ERROR] [${traceId}]:`, error);
        return NextResponse.json({ error: "Internal Server Error", traceId }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const traceId = uuidv4();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized", traceId }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required", traceId }, { status: 400 });
        }

        const project = await projectRepo.create(userId, name);
        
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error(`[Projects Create ERROR] [${traceId}]:`, error);
        return NextResponse.json({ error: "Internal Server Error", traceId }, { status: 500 });
    }
}
