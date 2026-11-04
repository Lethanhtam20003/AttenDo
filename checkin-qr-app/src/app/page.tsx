import { Metadata } from "next";
import Image from "next/image";
import { Solutions } from "@/components/Solutions";

export const metadata: Metadata = {
  title: "Hệ thống điểm danh | Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn",
  description: "Hệ thống điểm danh do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng, hỗ trợ QR động, mã PIN và xác thực vị trí GPS.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col antialiased">
      <main className="flex-grow flex flex-col">
        
        {/* HERO SECTION: Chỉ chứa nội dung giới thiệu, căn giữa màn hình */}
        <section className="w-full pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-b from-slate-50/50 to-white flex flex-col justify-center text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            
            <div>
              <Image
                src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
                alt="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
                width={144}
                height={144}
                priority
                className="mx-auto mb-6 h-28 w-28 rounded-full object-contain shadow-sm sm:h-36 sm:w-36"
              />
              <p className="mb-4 text-sm font-semibold text-blue-800 sm:text-base">
                Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
              </p>
              <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-sm font-semibold shadow-sm">
                Hệ thống điểm danh
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Hệ Thống Điểm Danh & <br className="hidden sm:block" />
              <span className="text-blue-600">Quản Trị Quân Số Thông Minh</span>
            </h1>
            
            <p className="text-slate-600 text-lg sm:text-xl max-w-2xl leading-relaxed mx-auto">
              Giải pháp do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng, hỗ trợ điểm danh bằng QR động, mã PIN và xác thực vị trí GPS.
            </p>

          </div>
        </section>

        {/* SOLUTIONS SECTION: Tách thành một vùng riêng biệt phía dưới */}
        <section className="w-full py-12 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Solutions />
          </div>
        </section>
      
      </main>
    </div>
  );
}