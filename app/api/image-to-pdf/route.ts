import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.create();

    let image;
    let dims;

    if (
      file.type === "image/jpeg" ||
      file.type === "image/jpg"
    ) {
      image = await pdfDoc.embedJpg(bytes);
      dims = image.scale(1);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(bytes);
      dims = image.scale(1);
    } else {
      return NextResponse.json(
        { error: "Only JPG and PNG supported" },
        { status: 400 }
      );
    }

    const page = pdfDoc.addPage([dims.width, dims.height]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: dims.width,
      height: dims.height,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="image.pdf"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Convert failed" },
      { status: 500 }
    );
  }
}