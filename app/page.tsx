"use client";

import { useRef, useState } from "react";

const tools = [
  { icon: "🧩", title: "รวม PDF", desc: "รวมหลายไฟล์ PDF เป็นไฟล์เดียว", working: true },
  { icon: "✂️", title: "แยก PDF", desc: "แยกหน้าแรกของ PDF ออกเป็นไฟล์ใหม่", working: true },
  { icon: "🗑️", title: "ลบหน้า PDF", desc: "ลบหน้าที่ไม่ต้องการออกจาก PDF", working: true },
  { icon: "🗜️", title: "บีบอัด PDF", desc: "ลดขนาดไฟล์ PDF", working: false },
  { icon: "📝", title: "PDF เป็น Word", desc: "แปลง PDF เป็น DOCX", working: false },
  { icon: "📄", title: "Word เป็น PDF", desc: "แปลง DOCX เป็น PDF", working: false },
  { icon: "🖼️", title: "PDF เป็น JPG", desc: "แปลงหน้า PDF เป็นรูปภาพ", working: false },
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
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-orange-50 text-[#27212E]">
      <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/80 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <h1 className="text-2xl font-black">
      <span className="text-pink-500">💗</span> ConvertFlow ✨
    </h1>

    <nav className="hidden items-center gap-8 text-sm font-bold text-[#7B7286] md:flex">
      <a href="#tools" className="hover:text-pink-500">เครื่องมือ</a>
      <a href="#upload" className="hover:text-pink-500">อัปโหลด</a>
      <a href="#footer" className="hover:text-pink-500">ติดต่อเรา</a>
    </nav>
  </div>
</header>

      <section className="relative mx-auto max-w-7xl px-6 py-14 text-center">

  <div className="mx-auto mb-6 w-fit rounded-full bg-white px-5 py-2 text-sm font-bold text-[#7B7286] shadow-sm">
    💗 เครื่องมือแปลงไฟล์ครบในที่เดียว
  </div>

  <h2 className="text-5xl font-black tracking-tight md:text-7xl">
    แปลงไฟล์ได้ง่าย ๆ
    <span className="block text-[#FF4F8B]">เหมือนนับ 1 2 3</span>
  </h2>

  <p className="mx-auto mt-5 max-w-2xl text-xl font-bold text-[#FF4F8B]">
    น่ารัก ใช้งานง่าย สำหรับทุกคน 💗
  </p>

  <div id="tools" className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
    {tools.filter((tool) => tool.working).map((tool) => (
      <button
        key={tool.title}
        onClick={() => {
          setSelectedTool(tool);
          reset();
        }}
       className={`rounded-[1.5rem] border px-5 py-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
  selectedTool.title === tool.title
            ? "border-[#FF4F8B] bg-[#FFF0F6] shadow-pink-100"
    : "border-pink-100 bg-white/85"
}`}
      >
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-pink-50 text-4xl">
          {tool.icon}
        </div>
        <p className="text-lg font-black">{tool.title}</p>
        <p className="mt-2 text-sm text-[#7B7286]">{tool.desc}</p>
        <p className="mt-4 inline-block rounded-full bg-pink-100 px-4 py-2 text-xs font-black text-[#FF4F8B]">
          ใช้งานได้จริง
        </p>
      </button>
    ))}
  </div>
</section>
<section id="upload" className="mx-auto max-w-5xl px-6 pb-24">
  <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-pink-300 bg-white/85 p-8 shadow-2xl shadow-pink-100">

    <div className="absolute left-6 top-8 text-6xl">☁️</div>
    <div className="absolute right-4 top-10 text-6xl">📁</div>

    <div className="mb-8 text-center">
      <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-pink-50 text-4xl shadow-sm">
        ☁️
      </div>

      <p className="text-sm font-black text-pink-500">
        เครื่องมือที่เลือก
      </p>

      <h3 className="mt-2 text-4xl font-black text-[#27212E]">
        {selectedTool.title}
      </h3>

      <p className="mt-2 text-[#7B7286]">
        {selectedTool.desc}
      </p>
    </div>

    {selectedTool.title === "แปลงรูปภาพ" && (
      <select
        value={targetFormat}
        onChange={(e) => setTargetFormat(e.target.value)}
        className="mb-6 w-full rounded-2xl border border-[#D8CCFF] bg-white px-4 py-4 font-bold outline-none"
      >
        <option value="png">PNG</option>
        <option value="jpeg">JPG</option>
        <option value="webp">WEBP</option>
      </select>
    )}

    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.8rem] border-2 border-dashed border-[#D8CCFF] bg-[#FFFCFF] px-6 py-14 text-center hover:bg-[#FFF6FC]">

      <input
        type="file"
        ref={inputRef}
        multiple={selectedTool.title === "รวม PDF"}
        accept={acceptType}
        className="hidden"
        onChange={(e) => chooseFiles(e.target.files)}
      />

      <div className="mb-4 text-5xl">
        {selectedTool.icon}
      </div>

      <p className="text-xl font-black">
        {selectedTool.title === "รวม PDF"
          ? "เลือก PDF หลายไฟล์"
          : "เลือกไฟล์"}
      </p>

      <p className="mt-2 text-sm text-[#7B7286]">
        อัปโหลดไฟล์สำหรับ {selectedTool.title}
      </p>
    </label>

    {files.length > 0 && (
      <div className="mt-6 rounded-2xl bg-pink-50 p-4">
        <p className="font-black">
          เลือกแล้ว {files.length} ไฟล์
        </p>
      </div>
    )}

    <button
      onClick={convertFile}
      className="mt-6 w-full rounded-[1.5rem] bg-[#9B7CFF] px-6 py-4 font-black text-white hover:bg-[#8567F0]"
    >
      เริ่มใช้งาน {selectedTool.title}
    </button>

    {status && (
      <p className="mt-4 text-center text-sm font-bold text-[#7B7286]">
        {status}
      </p>
    )}

    {downloadUrl && (
      <a
        href={downloadUrl}
        download={downloadName}
        className="mt-5 block w-full rounded-[1.5rem] bg-[#27212E] px-6 py-4 text-center font-black text-white hover:bg-[#3A3144]"
      >
        ดาวน์โหลด {downloadName}
      </a>
    )}
  </div>
</section>
    </main>
  );
}