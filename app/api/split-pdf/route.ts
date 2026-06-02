import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const zip = new JSZip();

    for (let i = 0; i < pdf.getPageCount(); i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdf, [i]);
      newPdf.addPage(page);

      const pageBytes = await newPdf.save();
      zip.file(`page-${i + 1}.pdf`, pageBytes);
    }

    const zipBytes = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(Buffer.from(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="split-pages.zip"',
      },
    });
  } catch (error) {
    console.error("SPLIT PDF ERROR:", error);
    return NextResponse.json({ error: "Split failed" }, { status: 500 });
  }
}