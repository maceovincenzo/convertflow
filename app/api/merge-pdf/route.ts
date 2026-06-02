import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least 2 PDF files" },
        { status: 400 }
      );
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const copiedPages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedBytes = await mergedPdf.save();

    return new NextResponse(Buffer.from(mergedBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="merged.pdf"',
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