"use client";

import { FormEvent, useEffect, useRef } from "react";
import { Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToolsStore } from "@/stores/tools-store";

export default function TestQrPage() {
  const value = useToolsStore((state) => state.testQrValue);
  const generatedValue = useToolsStore((state) => state.generatedQrValue);
  const error = useToolsStore((state) => state.testQrError);
  const setValue = useToolsStore((state) => state.setTestQrValue);
  const setGeneratedValue = useToolsStore((state) => state.setGeneratedQrValue);
  const setError = useToolsStore((state) => state.setTestQrError);
  const reset = useToolsStore((state) => state.resetTestQr);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError("Vui lòng nhập nội dung trước khi tạo mã QR.");
      setGeneratedValue("");
      return;
    }

    setError("");
    setGeneratedValue(trimmedValue);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !generatedValue) {
      setError("Không tìm thấy mã QR để tải xuống. Vui lòng tạo lại mã.");
      return;
    }

    const link = document.createElement("a");
    link.download = "ma-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-10">
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <QrCode aria-hidden="true" size={25} />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Công cụ kiểm thử
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Tạo mã QR</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Nhập văn bản hoặc đường dẫn để tạo mã QR và tải về dưới dạng ảnh.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleGenerate}>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="qr-content"
              >
                Nội dung mã QR
              </label>
              <textarea
                id="qr-content"
                className="min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Ví dụ: https://example.com"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                type="submit"
              >
                Tạo mã QR
              </button>
            </form>
          </div>

          <div className="flex min-h-80 flex-col items-center justify-center border-t border-slate-100 bg-slate-50 p-6 sm:p-10 md:border-l md:border-t-0">
            {generatedValue ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={generatedValue}
                    size={240}
                    level="M"
                    includeMargin
                    aria-label="Mã QR đã tạo"
                  />
                </div>
                <p className="mt-5 max-w-full break-all text-center text-xs text-slate-500">
                  {generatedValue}
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onClick={handleDownload}
                  type="button"
                >
                  <Download aria-hidden="true" size={17} />
                  Tải ảnh PNG
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <QrCode aria-hidden="true" size={34} />
                </div>
                <p className="font-semibold text-slate-700">Mã QR sẽ hiển thị tại đây</p>
                <p className="mt-2 text-sm text-slate-500">
                  Nhập nội dung và nhấn “Tạo mã QR” để bắt đầu.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
