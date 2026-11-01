"use client";
export default function ErrorPage() {
    return (
        
        <div className="text-center px-6 max-w-md">
            <h1 className="text-9xl font-extrabold text-indigo-600 tracking-widest">404</h1>
            <div className="bg-indigo-500 px-2 text-sm rounded rotate-12 absolute text-white font-semibold">
                Lỗi Hệ Thống
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl mt-6">
                Oops! Trang bạn tìm kiếm không tồn tại.
            </p>
            <p className="mt-4 text-gray-600">
                Có vẻ như liên kết đã hỏng hoặc trang đã bị di chuyển. Hãy quay lại trang chủ để tiếp tục trải nghiệm.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <a href="/" className="inline-block px-5 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
                    Về Trang Chủ
                </a>
                <a href="javascript:history.back()" className="inline-block px-5 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                    Quay Lại
                </a>
            </div>
        </div>
    );
}