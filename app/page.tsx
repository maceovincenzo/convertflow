"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { signIn } from "next-auth/react";

const tools = [
  { icon: "🧩", title: "รวม PDF", desc: "รวมหลายไฟล์ PDF เป็นไฟล์เดียว", working: true },
  { icon: "✂️", title: "แยก PDF", desc: "แยกหน้าแรกของ PDF ออกเป็นไฟล์ใหม่", working: true },
  { icon: "🗑️", title: "ลบหน้า PDF", desc: "ลบหน้าที่ไม่ต้องการออกจาก PDF", working: true },
  { icon: "🗜️", title: "บีบอัด PDF", desc: "ลดขนาดไฟล์ PDF", working: false },
  { icon: "📝", title: "PDF เป็น Word", desc: "แปลง PDF เป็น DOCX", working: false },
  { icon: "📄", title: "Word เป็น PDF", desc: "แปลง DOCX เป็น PDF", working: false },
  { icon: "🖼️", title: "PDF เป็น JPG", desc: "แปลงหน้า PDF เป็นรูปภาพ", working: true },
  { icon: "🌅", title: "JPG เป็น PDF", desc: "รวมรูปภาพเป็น PDF", working: true },
  { icon: "🎨", title: "แปลงรูปภาพ", desc: "JPG, PNG, WEBP", working: true },
  { icon: "🎵", title: "แปลงเสียง", desc: "MP3, WAV, M4A", working: false },
  { icon: "🎬", title: "แปลงวิดีโอ", desc: "MP4, MOV, WEBM", working: false },
];

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState("png");
  const [preview, setPreview] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");
  const [status, setStatus] = useState("");
  const [pagesToDelete, setPagesToDelete] = useState("");

  function reset() {
    setFiles([]);
    setPreview("");
    setDownloadUrl("");
    setDownloadName("");
    setStatus("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const selected = Array.from(fileList);
    setFiles(selected);
    setDownloadUrl("");
    setDownloadName("");
    setStatus("");

    if (selected[0].type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected[0]));
    } else {
      setPreview("");
    }
  }

  async function convertFile() {
    if (files.length === 0) {
      setStatus("กรุณาเลือกไฟล์ก่อนค่ะ");
      return;
    }

    if (!selectedTool.working) {
      setStatus(`เครื่องมือ "${selectedTool.title}" กำลังพัฒนาค่ะ`);
      return;
    }

    try {
      setStatus("กำลังประมวลผล...");
      setDownloadUrl("");

  if (selectedTool.title === "PDF เป็น JPG") {
  setStatus("กำลังแปลง PDF เป็น JPG...");

  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();

  const pdfjsLib = await import("pdfjs-dist");

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  disableWorker: true,
} as any).promise;

  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas not supported");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    } as any).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("แปลง JPG ไม่สำเร็จ"));
        },
        "image/jpeg",
        0.95
      );
    });

    zip.file(`page-${i}.jpg`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);

  setDownloadUrl(url);
  setDownloadName("pdf-to-jpg.zip");
  setStatus("แปลง PDF เป็น JPG สำเร็จแล้ว");

  return;
}

if (selectedTool.title === "ลบหน้า PDF") {
  const formData = new FormData();
  formData.append("file", files[0]);
  formData.append("pages", pagesToDelete);

  const response = await fetch("/api/delete-pages", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Delete pages failed");

  const blob = await response.blob();
  setDownloadUrl(URL.createObjectURL(blob));
  setDownloadName("deleted-pages.pdf");
  setStatus("ลบหน้า PDF สำเร็จแล้ว");
  return;
}
      if (selectedTool.title === "แยก PDF") {
        const formData = new FormData();
        formData.append("file", files[0]);

        const response = await fetch("/api/split-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Split failed");

        const blob = await response.blob();
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName("split-pages.zip");
        setStatus("แยก PDF สำเร็จแล้ว");
        return;
      }

      if (selectedTool.title === "รวม PDF") {
        if (files.length < 2) {
          setStatus("กรุณาเลือก PDF อย่างน้อย 2 ไฟล์ค่ะ");
          return;
        }

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const response = await fetch("/api/merge-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Merge failed");

        const blob = await response.blob();
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName("merged.pdf");
        setStatus("รวม PDF สำเร็จแล้ว");
        return;
      }

      if (selectedTool.title === "JPG เป็น PDF") {
        const formData = new FormData();
        formData.append("file", files[0]);

        const response = await fetch("/api/image-to-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Convert failed");

        const blob = await response.blob();
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(files[0].name.replace(/\.[^/.]+$/, "") + ".pdf");
        setStatus("แปลง JPG เป็น PDF สำเร็จแล้ว");
        return;
      }

      if (selectedTool.title === "แปลงรูปภาพ") {
        const image = new Image();
        image.src = URL.createObjectURL(files[0]);

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas error");

        if (targetFormat === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(image, 0, 0);

        const mime =
          targetFormat === "png"
            ? "image/png"
            : targetFormat === "webp"
            ? "image/webp"
            : "image/jpeg";

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("Convert failed"))),
            mime,
            0.94
          );
        });

        const ext = targetFormat === "jpeg" ? "jpg" : targetFormat;
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(files[0].name.replace(/\.[^/.]+$/, "") + "." + ext);
        setStatus("แปลงรูปภาพสำเร็จแล้ว");
        return;
      }
    } catch (error) {
      console.error(error);
      setStatus("ทำงานไม่สำเร็จ ลองเลือกไฟล์ใหม่อีกครั้งค่ะ");
    }
  }

  const acceptType =
    selectedTool.title === "รวม PDF" || selectedTool.title === "แยก PDF"
      ? "application/pdf"
      : selectedTool.title === "แปลงรูปภาพ" || selectedTool.title === "JPG เป็น PDF"
      ? "image/jpeg,image/png,image/webp"
      : "*";

return (
  <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_7%_28%,#EEF2FF_0,transparent_30%),radial-gradient(circle_at_96%_30%,#F5EFFF_0,transparent_32%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_60%,#FFFFFF_100%)] text-slate-900">
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[90px] max-w-[1440px] items-center justify-between px-12">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-2xl text-white shadow-lg shadow-violet-200">
            📄
          </div>

          <div>
            <h1 className="text-2xl font-black leading-none tracking-tight">
              <span>File</span>
              <span className="text-violet-600">Convert</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              แปลงไฟล์ออนไลน์ ฟรี!
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-20 text-base font-bold text-slate-700 md:flex">
          <a href="#tools" className="hover:text-violet-600">เครื่องมือ</a>
          <a href="#upload" className="hover:text-violet-600">วิธีใช้</a>
          <a href="#" className="hover:text-violet-600">ราคา</a>
          <a href="#" className="hover:text-violet-600">บทความ</a>
        </nav>

        <div className="flex items-center gap-5">
          <button className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-xl shadow-sm">
            🌙
          </button>
      <button
        onClick={() => signIn("google")}
        className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-8 py-3 text-base font-black text-white shadow-lg"
>
       เข้าสู่ระบบ
      </button>
        </div>
      </div>
    </header>

    <section className="relative mx-auto max-w-[1440px] px-12 pt-7 text-center">
      <div className="pointer-events-none absolute left-4 top-16 hidden h-52 w-52 rotate-[-15deg] items-center justify-center rounded-[2.2rem] bg-violet-100/40 text-8xl opacity-60 shadow-2xl md:flex">
        📄
      </div>

      <div className="pointer-events-none absolute right-20 top-20 hidden text-7xl opacity-35 md:block">
        ☁️
      </div>

      <div className="pointer-events-none absolute left-48 top-8 text-4xl opacity-60">✨</div>
      <div className="pointer-events-none absolute left-64 top-44 h-5 w-5 rounded-full bg-violet-400 opacity-55" />
      <div className="pointer-events-none absolute left-72 top-24 h-3 w-3 rounded-full bg-pink-300 opacity-70" />
      <div className="pointer-events-none absolute right-48 top-40 h-5 w-5 rounded-full bg-violet-400 opacity-55" />
      <div className="pointer-events-none absolute right-28 bottom-24 text-4xl opacity-50">✨</div>

      <h2 className="mx-auto max-w-5xl text-6xl font-black leading-[1.08] tracking-tight text-slate-900 md:text-7xl">
        แปลงไฟล์
        <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
          ง่าย ๆ
        </span>
        ในไม่กี่วินาที
      </h2>

      <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-8 text-slate-600">
        รองรับไฟล์หลากหลายรูปแบบ ใช้งานฟรี ไม่ต้องสมัครสมาชิก
        <br />
        ปลอดภัย ไม่เก็บข้อมูลไฟล์ของคุณ 🛡️
      </p>
    </section>

    <section id="upload" className="relative mx-auto mt-5 max-w-[800px] px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-violet-100">
        <div className="relative overflow-hidden rounded-[1.6rem] border-2 border-dashed border-violet-300 px-8 py-8 text-center">
          <div className="pointer-events-none absolute left-5 top-4 text-4xl opacity-45">☁️</div>
          <div className="pointer-events-none absolute right-5 top-4 text-4xl opacity-45">☁️</div>

          <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 text-5xl shadow-xl shadow-violet-200">
            📁
          </div>

          <h3 className="text-2xl font-black text-slate-900">
            ลากไฟล์มาวางที่นี่
          </h3>

          <p className="mt-1 text-sm font-bold text-slate-500">หรือ</p>

          {selectedTool.title === "แปลงรูปภาพ" && (
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="mx-auto mt-4 block w-full max-w-xs rounded-2xl border border-violet-200 bg-white px-5 py-3 font-bold text-slate-700 outline-none"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WEBP</option>
            </select>
          )}

          {selectedTool.title === "ลบหน้า PDF" && (
            <input
              type="text"
              value={pagesToDelete}
              onChange={(e) => setPagesToDelete(e.target.value)}
              placeholder="ใส่หน้าที่ต้องการลบ เช่น 2,4,5"
              className="mx-auto mt-4 block w-full max-w-md rounded-2xl border border-violet-200 bg-white px-5 py-3 font-bold text-slate-700 outline-none"
            />
          )}

          <label className="mx-auto mt-4 inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-9 py-3 text-base font-black text-white shadow-lg shadow-violet-200 transition hover:scale-105">
            เลือกไฟล์จากคอมพิวเตอร์
            <span>📂</span>

            <input
              ref={inputRef}
              type="file"
              multiple={selectedTool.title === "รวม PDF"}
              accept={acceptType}
              className="hidden"
              onChange={(e) => chooseFiles(e.target.files)}
            />
          </label>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
            รองรับไฟล์: PDF, JPG, PNG, GIF, MP4, MP3, DOCX, XLSX, PPTX, TXT และอื่น ๆ
            <br />
            ขนาดสูงสุด 100MB
          </p>

          {files.length > 0 && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-violet-50 px-5 py-4 text-left">
              <p className="mb-2 font-black text-slate-800">
                ไฟล์ที่เลือก ({files.length} ไฟล์)
              </p>

              {files.map((file, index) => (
                <p key={index} className="mt-1 truncate text-sm font-bold text-slate-600">
                  {index + 1}. {file.name}
                </p>
              ))}

              {preview &&
                selectedTool.title !== "รวม PDF" &&
                selectedTool.title !== "แยก PDF" && (
                  <img
                    src={preview}
                    alt="preview"
                    className="mt-4 max-h-72 w-full rounded-2xl bg-white object-contain"
                  />
                )}
            </div>
          )}

          <button
            onClick={convertFile}
            disabled={files.length === 0}
            className="mx-auto mt-5 block w-full max-w-md rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-400 px-8 py-3 text-base font-black text-white shadow-lg shadow-violet-200 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            เริ่มใช้งาน {selectedTool.title}
          </button>

          {status && (
            <p className="mt-3 text-center text-sm font-black text-slate-600">
              {status}
            </p>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadName}
              className="mx-auto mt-4 block w-full max-w-md rounded-2xl bg-slate-900 px-8 py-3 text-center text-base font-black text-white transition hover:bg-slate-800"
            >
              ดาวน์โหลด {downloadName}
            </a>
          )}
        </div>
      </div>
    </section>

    <section id="tools" className="mx-auto mt-3 max-w-[1410px] px-12 pb-8">
      <div className="rounded-[2.2rem] bg-white/95 p-5 shadow-2xl shadow-violet-100">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-black text-slate-900">
            ✨ เครื่องมือแปลงไฟล์ยอดนิยม ✨
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-6">
          {tools.filter((tool) => tool.working).map((tool) => (
            <button
              key={tool.title}
              onClick={() => {
                setSelectedTool(tool);
                reset();
              }}
              className={`min-h-[240px] rounded-[1.6rem] border bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                selectedTool.title === tool.title
                  ? "border-violet-400 shadow-violet-100 ring-2 ring-violet-100"
                  : "border-slate-200"
              }`}
            >
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-violet-50 text-4xl">
                {tool.icon}
              </div>

              <p className="text-lg font-black text-slate-900">
                {tool.title}
              </p>

              <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-slate-500">
                {tool.desc}
              </p>

              <p className="mt-4 inline-flex rounded-xl bg-violet-50 px-4 py-2 text-sm font-black text-violet-600">
                ใช้งานได้จริง
              </p>
            </button>
          ))}

          <button className="min-h-[240px] rounded-[1.6rem] border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-4xl">
              🔲
            </div>

            <p className="text-lg font-black text-slate-900">
              เครื่องมือเพิ่มเติม
            </p>

            <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-slate-500">
              เครื่องมืออื่น ๆ อีกมากมาย รอคุณอยู่
            </p>

            <p className="mt-4 inline-flex rounded-xl bg-violet-50 px-4 py-2 text-sm font-black text-violet-600">
              ดูทั้งหมด
            </p>
          </button>
        </div>

        <div className="mt-5 grid gap-4 rounded-[1.6rem] bg-slate-50/90 p-5 md:grid-cols-4">
          {[
            ["⚡", "รวดเร็ว", "แปลงไฟล์ได้ในไม่กี่วินาที", "bg-violet-100"],
            ["🛡️", "ปลอดภัย 100%", "ไม่เก็บข้อมูลไฟล์ของคุณ", "bg-green-100"],
            ["⬇️", "ดาวน์โหลดง่าย", "เสร็จแล้วโหลดได้ทันที", "bg-blue-100"],
            ["📱", "รองรับทุกอุปกรณ์", "คอมพิวเตอร์ มือถือ แท็บเล็ต", "bg-orange-100"],
          ].map((item) => (
            <div key={item[1]} className="flex items-center gap-4 border-slate-200 md:border-r last:border-r-0">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-3xl ${item[3]} text-3xl`}>
                {item[0]}
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{item[1]}</p>
                <p className="text-sm font-semibold text-slate-500">{item[2]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </main>
);
}