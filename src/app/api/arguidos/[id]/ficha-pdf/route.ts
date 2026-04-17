import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 10) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'download');
    await fs.mkdir(outputDir, { recursive: true });

    // Generate a unique filename
    const filename = `ficha_${id}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // Call the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_ficha.py');
    const pythonExe = '/home/z/.venv/bin/python3';

    try {
      const { stderr } = await execFileAsync(pythonExe, [scriptPath, id, outputPath], {
        timeout: 15000,
      });

      if (stderr && stderr.includes('ERROR')) {
        return NextResponse.json({ error: 'Erro ao gerar ficha' }, { status: 500 });
      }
    } catch (execError: any) {
      console.error('PDF generation script error:', execError);
      return NextResponse.json({ error: 'Erro ao gerar ficha PDF' }, { status: 500 });
    }

    // Read the generated PDF
    const pdfBuffer = await fs.readFile(outputPath);

    // Clean up the file after reading
    try {
      await fs.unlink(outputPath);
    } catch {
      // ignore cleanup errors
    }

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ficha_arguido.pdf"`,
      },
    });
  } catch (error) {
    console.error('Ficha PDF error:', error);
    return NextResponse.json({ error: 'Erro ao gerar ficha PDF' }, { status: 500 });
  }
}
