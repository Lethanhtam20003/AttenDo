'use client';

import { useEffect } from 'react';
import { MapPin, Loader2, Navigation, AlertTriangle } from 'lucide-react';
import { useToolsStore } from '@/stores/tools-store';

export default function TestLocationPage() {
  const location = useToolsStore((state) => state.testLocation);
  const isLoading = useToolsStore((state) => state.isTestLocationLoading);
  const error = useToolsStore((state) => state.testLocationError);
  const setLocation = useToolsStore((state) => state.setTestLocation);
  const setIsLoading = useToolsStore((state) => state.setIsTestLocationLoading);
  const setError = useToolsStore((state) => state.setTestLocationError);
  const reset = useToolsStore((state) => state.resetTestLocation);

  useEffect(() => {
    reset();
  }, [reset]);

  // Hàm gọi Web Geolocation API
  const handleGetLocation = () => {
    // Reset state trước khi lấy vị trí mới
    setIsLoading(true);
    setError(null);
    setLocation(null);

    // Kiểm tra xem trình duyệt có hỗ trợ không
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      setIsLoading(false);
      return;
    }

    // Tiến hành lấy vị trí
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Thành công: Lưu tọa độ vào state
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        // Thất bại: Xử lý các mã lỗi
        let errorMessage = 'Không thể lấy vị trí.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Bạn đã từ chối cấp quyền vị trí. Vui lòng mở khóa trong cài đặt trình duyệt.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Không có tín hiệu GPS hiện tại.';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Hết thời gian chờ kết nối GPS. Hãy thử lại.';
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true, // Ưu tiên dùng GPS để lấy tọa độ chính xác nhất
        timeout: 10000,           // Đợi tối đa 10 giây
        maximumAge: 0,            // Không dùng dữ liệu cũ đã lưu cache
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <Navigation className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Kiểm tra vị trí</h1>
          <p className="text-sm text-gray-500 mt-1">Nhấn nút bên dưới để lấy tọa độ hiện tại của bạn</p>
        </div>

        {/* Nút bấm lấy vị trí */}
        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tìm vệ tinh...
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              Lấy vị trí của tôi
            </>
          )}
        </button>

        {/* Hiển thị lỗi (nếu có) */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2 border border-red-100">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {/* Hiển thị kết quả thành công */}
        {location && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">
                Tọa độ hiện tại
              </p>
              <div className="space-y-1 font-mono text-sm text-gray-700">
                <p>
                  <span className="font-semibold mr-2">Vĩ độ (Lat):</span> 
                  {location.lat.toFixed(6)}
                </p>
                <p>
                  <span className="font-semibold mr-2">Kinh độ (Lng):</span> 
                  {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
            
            {/* Nút mở Google Maps để kiểm chứng */}
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm text-blue-600 font-medium p-2 hover:underline"
            >
              Xem vị trí trên Google Maps →
            </a>
          </div>
        )}

      </div>
    </div>
  );
} 