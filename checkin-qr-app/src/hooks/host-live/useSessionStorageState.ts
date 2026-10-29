import { useCallback, useSyncExternalStore } from 'react';

// Dùng sự kiện tùy chỉnh thay vì sự kiện 'storage' mặc định.
// Lý do: Sự kiện 'storage' của trình duyệt CHỈ kích hoạt khi dữ liệu thay đổi từ một tab KHÁC.
// Sự kiện custom này giúp đồng bộ state giữa nhiều component TRONG CÙNG một tab.
const SESSION_STORAGE_UPDATE_EVENT = 'session-storage-update';

export function useSessionStorageState(key: string, initialValue: string) {
  // 1. subscribe: Đăng ký listener để thông báo cho React biết khi nào external store thay đổi.
  const subscribe = useCallback((onStoreChange: () => void) => {
    // Check SSR (Server-Side Rendering) để tránh crash do gọi 'window' trên môi trường Node.js (Next.js/Remix).
    if (typeof window === 'undefined') {
      return () => {};
    }
    window.addEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
    
    // Cleanup function: Tránh memory leak khi component unmount
    return () => window.removeEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
  }, []);

  // 2. getSnapshot: Hàm đọc và trả về giá trị hiện tại từ sessionStorage.
  // React sẽ gọi hàm này mỗi khi 'onStoreChange' được trigger ở trên.
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      return sessionStorage.getItem(key) ?? initialValue;
    } catch {
      // Bắt lỗi catch (cần thiết) vì một số trình duyệt ở chế độ ẩn danh (Incognito) 
      // hoặc bị khóa cookie chặn truy cập Storage, nếu không catch sẽ làm crash cả app.
      return initialValue;
    }
  }, [initialValue, key]);

  // 3. getServerSnapshot: Giá trị dùng khi render HTML trên Server.
  // Bắt buộc truyền initialValue để giao diện lúc render trên server khớp 100% với lúc load lần đầu trên client,
  // giúp tránh lỗi Hydration Mismatch cực kì phổ biến trong Next.js/SSR.
  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);
  
  // Liên kết 3 hàm trên vào useSyncExternalStore để React tự động quản lý state này.
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (nextValue: string) => {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        sessionStorage.setItem(key, nextValue);
        // Cực kỳ quan trọng: Phát ra sự kiện custom ngay sau khi setItem.
        // Bước này đóng vai trò "kéo cò" kích hoạt onStoreChange trong hàm subscribe,
        // ép TẤT CẢ các component đang gọi hook này phải chạy lại hàm getSnapshot và re-render UI.
        window.dispatchEvent(new Event(SESSION_STORAGE_UPDATE_EVENT));
      } catch {
        // Bỏ qua lỗi storage (VD: vượt quá dung lượng cho phép của sessionStorage)
      }
    },
    [key]
  );

  return [value, setValue] as const;
}