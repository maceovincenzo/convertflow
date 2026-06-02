import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, route: "merge-pdf" });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least 2 PDF files" },
        { status: 400 }
      );
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      const copiedPages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    return new NextResponse(Buffer.from(mergedBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
      },
    });
  } catch (error) {
    console.error("MERGE PDF ERROR:", error);

    return NextResponse.json(
      { error: "Merge failed" },
      { status: 500 }
    );
  }
}