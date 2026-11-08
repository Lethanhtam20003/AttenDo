import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cho phép đầy đủ các đuôi tên miền ngrok kết nối HMR WebSocket trong môi trường dev
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  // Tắt chuyển tiếp console từ trình duyệt về terminal qua WebSocket để tránh lỗi forward-logs.ts khi đường truyền ngrok ngắt kết nối
  logging: {
    browserToTerminal: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
