import { QrCode, ScanFace, MapPin } from "lucide-react";

export const Solutions = () => {
  const solutions = [
    {
      icon: <QrCode className="w-6 h-6 text-blue-600" />,
      title: "1. Dynamic QR Code",
      desc: "Mã QR tự động đổi sau mỗi vài giây, ngăn chặn triệt để chụp ảnh màn hình gửi điểm danh hộ.",
      link: "/test-qr",
    },
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      title: "2. Khoanh Vùng Vị Trí GPS",
      desc: "Giới hạn phạm vi điểm danh theo tọa độ địa lý, tự động phát hiện ứng dụng can thiệp GPS ảo.",
      link: "/test-location",
    },
    {
      icon: <ScanFace className="w-6 h-6 text-blue-600" />,
      title: "3. Tạo mã Qr + xác minh địa chỉ",
      desc: "Xác minh địa chỉ.",
      link: "/host/setup",
    },
  ];

  return (
    <section id="solutions" className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Tính năng cốt lõi
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Các Giải Pháp Điểm Danh
          </h3>
          <p className="text-slate-600 text-sm mt-2">
            Đa dạng hình thức xác thực, thích ứng linh hoạt từ lớp học đến chuỗi doanh nghiệp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((item, index) => (
            <a
              key={index}
              className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              href={item.link}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
