# Hệ thống điểm danh

Ứng dụng điểm danh do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng. Người tổ chức có thể tạo phiên, chia sẻ mã QR và theo dõi người tham dự; người tham dự mở liên kết phiên để điền thông tin và điểm danh.

## Chức năng

- Tạo và quản lý phiên điểm danh; xem danh sách người tham dự và tìm kiếm theo tên hoặc thông tin.
- Cấu hình biểu mẫu thông tin người tham dự theo từng phiên.
- Chọn phương thức xác thực: vị trí GPS, mã PIN, QR động hoặc kết hợp các phương thức.
- Màn hình Host hiển thị thông tin phiên và mã xác thực; hỗ trợ theo dõi phiên đang diễn ra.
- Xác thực người quản lý bằng tài khoản Supabase Auth. Người tham dự không cần đăng nhập.

## Công nghệ

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL và Realtime
- Bun

## Yêu cầu

- [Bun](https://bun.sh/) phiên bản 1.3 trở lên
- Một dự án Supabase

## Cài đặt và chạy

Các lệnh sau được chạy trong thư mục ứng dụng:

```bash
cd checkIn-qr-app
bun install
```

Tạo file `.env.local` trong `checkIn-qr-app` với thông tin dự án Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Thiết lập cơ sở dữ liệu trong Supabase:

1. Mở **SQL Editor** của dự án Supabase và chạy `checkIn-qr-app/supabase/schema.sql`.
2. Chạy lần lượt các file trong `checkIn-qr-app/supabase/migrations/` theo thứ tự tên file.
3. Tạo tài khoản người quản lý trong **Supabase Dashboard → Authentication → Users**. Ứng dụng không có chức năng đăng ký tài khoản công khai.

Khởi động môi trường phát triển:

```bash
bun run dev
```

Mở [http://localhost:3000](http://localhost:3000). Đăng nhập bằng tài khoản quản lý tại `/auth`.

## Các trang chính

| Đường dẫn | Mục đích |
| --- | --- |
| `/` | Trang giới thiệu hệ thống |
| `/auth` | Đăng nhập người quản lý |
| `/host/manage` | Quản lý phiên và xem danh sách người tham dự |
| `/host/gps/setup` | Tạo phiên có xác thực vị trí GPS |
| `/host/qr-pin/setup` | Tạo phiên xác thực bằng QR và PIN |
| `/host/dynamic-qr/setup` | Tạo phiên sử dụng QR động |
| `/host/live/[eventId]` | Màn hình Host của phiên |
| `/check-in/[eventId]` | Biểu mẫu điểm danh cho người tham dự |

Các trang `/host/*` yêu cầu đăng nhập. Tài khoản quản lý chỉ xem và quản lý các phiên do tài khoản đó tạo.

## Kiểm tra và build

```bash
bun run lint
bun run build
```

## Bảo mật cấu hình

- Không commit `.env.local` hoặc chia sẻ khóa Supabase.
- Ứng dụng sử dụng Supabase anon key ở phía client; không đặt `service_role` key trong biến `NEXT_PUBLIC_*` hoặc trong mã chạy ở trình duyệt.
- Khi triển khai, cấu hình hai biến môi trường Supabase trong môi trường hosting và áp dụng schema cùng migrations cho đúng dự án.