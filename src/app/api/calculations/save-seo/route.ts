export const dynamic = 'force-static';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculationRepo } from "@/lib/repositories/calculationRepo";
import { projectRepo } from "@/lib/repositories/projectRepo";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { calculatorId, inputs, result, resultVar, resultJson } = await req.json();

        // 1. Get or Create default "Personal Workspace" project for the user
        let projects = await projectRepo.listByUser(session.user.id);
        let targetProjectId = projects[0]?.id;

        if (!targetProjectId) {
            const newProject = await projectRepo.create(session.user.id, "Personal Workspace");
            targetProjectId = newProject.id;
        }

        // 2. Save calculation
        const saved = await calculationRepo.save(
            targetProjectId,
            `seo_${calculatorId}`,
            inputs,
            "v1.0.0",
            resultJson || { [resultVar]: result }
        );

        return NextResponse.json({ success: true, id: saved.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
