"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gắn logic đăng nhập của bạn tại đây (NextAuth, Supabase, JWT...)
    console.log("Đăng nhập với:", { email, password });
  };

  return (
    <div id="login" className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h3>
        <p className="text-xs text-slate-500 mt-1">
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email / Mã định danh
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@attendo.vn"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mật khẩu
            </label>
            <a href="#" className="text-[11px] text-blue-600 hover:underline">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
        >
          <span>Vào bảng điều khiển</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};