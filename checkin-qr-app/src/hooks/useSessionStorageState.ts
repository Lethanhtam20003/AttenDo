import { useCallback, useSyncExternalStore } from 'react';

// Dùng một sự kiện tùy chỉnh của trình duyệt để thông báo cho tất cả các instance của hook
// khi sessionStorage thay đổi, giúp các component đồng bộ dữ liệu ngay cả khi giá trị được cập nhật
// từ tab khác hoặc từ một hook khác.
const SESSION_STORAGE_UPDATE_EVENT = 'session-storage-update';

export function useSessionStorageState(key: string, initialValue: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    window.addEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
    return () => window.removeEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      return sessionStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (nextValue: string) => {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        // Lưu giá trị vào sessionStorage và thông báo cho các subscriber để hook render lại
        // ngay khi dữ liệu thay đổi từ component hiện tại hoặc từ một component khác.
        sessionStorage.setItem(key, nextValue);
        window.dispatchEvent(new Event(SESSION_STORAGE_UPDATE_EVENT));
      } catch {
        // ignore storage errors (e.g. private mode quotas)
      }
    },
    [key]
  );

  return [value, setValue] as const;
}
