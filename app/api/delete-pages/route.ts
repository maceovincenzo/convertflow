import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const pagesText = formData.get("pages") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes);

    const totalPages = pdf.getPageCount();

    const pagesToDelete = pagesText
      .split(",")
      .map((p) => Number(p.trim()) - 1)
      .filter((p) => p >= 0 && p < totalPages);

    const keepPages = [];

    for (let i = 0; i < totalPages; i++) {
      if (!pagesToDelete.includes(i)) {
        keepPages.push(i);
      }
    }

    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(
      pdf,
      keepPages
    );

    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    const pdfBytes = await newPdf.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="deleted-pages.pdf"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Delete pages failed" },
      { status: 500 }
    );
  }
}