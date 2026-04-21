export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
    let jsonFilePath = '';
    let stepFilePath = '';

    try {
        const body = await req.json();
        const { width = 200, height = 150, thickness = 10, holeRadius = 25 } = body;

        // 1. Create a temporary JSON file to pass parameters safely to Python without shell escaping issues
        const tmpDir = os.tmpdir();
        const runId = crypto.randomUUID();
        jsonFilePath = path.join(tmpDir, `params_${runId}.json`);
        await fs.writeFile(jsonFilePath, JSON.stringify({ width, height, thickness, holeRadius }));

        // 2. Locate the python script
        const scriptPath = path.join(process.cwd(), 'src', 'lib', 'python', 'cad_generator.py');

        // Allow graceful fallback if Python was just installed and current node process hasn't updated PATH
        const getPythonExecutable = async () => {
            try {
                await execFileAsync('python', ['--version']);
                return 'python';
            } catch {
                return path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe');
            }
        };

        const pythonExecutable = await getPythonExecutable();

        // 3. Execute the python script using CadQuery/OCCT engine to generate the STEP file mathematically
        const { stdout, stderr } = await execFileAsync(pythonExecutable, [scriptPath, jsonFilePath]);

        stepFilePath = stdout.trim();

        // Python script should return the absolute path of the generated STEP file text
        if (!stepFilePath.endsWith('.step')) {
            console.error("Python stderr: ", stderr);
            console.error("Python stdout: ", stdout);
            throw new Error(`Python script failed to return a STEP file path. Ensure CadQuery is installed. Logs: ${stderr}`);
        }

        // 4. Read the generated .step file back into Node.js buffer
        const fileBuffer = await fs.readFile(stepFilePath);

        // 5. Cleanup temporary files asynchronously so we don't block the response
        fs.unlink(jsonFilePath).catch(() => { });
        fs.unlink(stepFilePath).catch(() => { });

        // 6. Return the downloadable 3D CAD file
        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/step', // Standard STEP MIME 
                'Content-Disposition': `attachment; filename="AluCalc_Part_${width}x${height}x${thickness}_R${holeRadius}.step"`
            }
        });

    } catch (error) {
        console.error('API /export-step Error:', error);

        // Ensure cleanup in case of catastrophic failure
        if (jsonFilePath) fs.unlink(jsonFilePath).catch(() => { });
        if (stepFilePath) fs.unlink(stepFilePath).catch(() => { });

        return NextResponse.json(
            { error: 'Failed to generate 3D STEP file.', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
