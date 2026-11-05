"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, House, RefreshCw } from "lucide-react";

export default function ErrorPage({
    error,
    retry,
}: {
    error: unknown;
    retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <section className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
            <div className="w-full max-w-lg text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <AlertTriangle aria-hidden="true" className="h-7 w-7" />
                </div>
                <p className="mt-5 text-sm font-semibold text-blue-700">ĐÃ XẢY RA LỖI</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Hệ thống chưa thể xử lý yêu cầu
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    Đã có sự cố ngoài dự kiến. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={retry}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                    >
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                        Thử lại
                    </button>
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <House aria-hidden="true" className="h-4 w-4" />
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </section>
    );
}