# Tuần 1 — Bản đồ não Next.js 16 (Pha 0)

Dành cho người đến từ backend. Mục tiêu cuối tuần: **chỉ rõ từng dòng trong luồng điểm danh chạy trên Node hay trên browser**, và giải thích được vì sao `checkIn` không được chạy trên client.

Không học cache, Tailwind, hay refactor lớn tuần này.

Nguồn chuẩn (đúng version app đang chạy, Next 16.4.3):

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/02-guides/server-and-client-boundary.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` (chỉ phần “What are Server Functions”)
- `node_modules/next/dist/docs/01-app/04-glossary.md` (các mục trong mục 3 bên dưới)

---

## 1. Next.js là gì, theo nghĩa backend

Next.js trong repo này không phải “frontend gọi API Java”. Nó là **một process Node** vừa:

1. Nhận HTTP (routing theo thư mục)
2. Chạy logic (query Supabase, validate PIN)
3. Trả **HTML + một payload đặc biệt (RSC)** + **một ít JS** cho browser

Giống BFF + template engine (Thymeleaf/Razor) trong cùng service. Browser không phải nguồn sự thật.

```
Điện thoại / laptop
    │  GET /checkin/:id
    ▼
Next.js (Node)     ←  layout.tsx, page.tsx, actions/*.ts
    │  SQL
    ▼
Supabase / Postgres
```

Hai chỗ **chạy code TypeScript**:

| Chỗ chạy | Tên Next | Giống backend |
|---|---|---|
| Máy chủ Node | Server Component, Server Action | Controller + service + render HTML |
| Trình duyệt | Client Component, hook | App mobile: click, GPS, localStorage |

Cùng ngôn ngữ TypeScript. **Không cùng trust boundary.**

---

## 2. Routing = file system, không phải `@RequestMapping`

Trong `src/app/`, **thư mục = đoạn URL**. File đặc biệt mới thành route.

| File | Vai trò backend |
|---|---|
| `page.tsx` | Handler GET của đúng URL đó; default export = UI |
| `layout.tsx` | Wrapper dùng chung; không re-render khi đổi page con (giống layout filter) |
| `loading.tsx` | UI chờ (tuần này chưa bắt buộc) |
| `error.tsx` | Exception UI theo segment (tuần này chưa bắt buộc) |
| `[eventId]` | Path variable, giống `@PathVariable` |

Map repo:

| URL | File |
|---|---|
| `/` | `src/app/page.tsx` |
| `/auth` | `src/app/auth/page.tsx` |
| `/checkin/:eventId` | `src/app/checkin/[eventId]/page.tsx` |
| `/host/setup` | `src/app/host/setup/page.tsx` |
| `/host/live/:eventId` | `src/app/host/live/[eventId]/page.tsx` |

`src/app/layout.tsx` là **root layout** — bắt buộc có `<html>` và `<body>`. Mọi trang nằm trong `{children}`. Header/Footer ở đây = chrome dùng chung.

**Quy tắc:** chỉ `page.tsx` / `route.ts` mới public. File hook, component, action **không** thành URL dù nằm gần `app/`.

Alias `@/` = `src/` (`tsconfig.json`). `import { checkIn } from '@/actions/checkin'` không phải HTTP path.

---

## 3. Từ điển tuần này (thuộc lòng)

### Server Component (mặc định)

File **không** có `'use client'` ở dòng đầu. Chạy **chỉ trên server**. Code này **không** gửi xuống browser.

Được: đọc DB, dùng secret (`process.env` không có `NEXT_PUBLIC_`), `async/await` query.

Không được: `useState`, `onClick`, `window`, `localStorage`, `navigator.geolocation`.

Giống JSP/Razor: render HTML từ data server. Khác JSP: có thể `await` DB ngay trong component.

`src/app/page.tsx` và `src/app/layout.tsx` đang là Server Component. `src/app/auth/page.tsx` cũng vậy — đúng mẫu.

### Client Component (`'use client'`)

Dòng đầu file, trước mọi import. Ranh giới: **file này và mọi file nó import** đi vào **JS bundle gửi browser**.

Được: state, click, `useEffect`, GPS, `localStorage`, custom hook.

Vẫn được render HTML **lần đầu trên server** (để hiện trang nhanh), rồi browser chạy lại để gắn sự kiện. `console.log` trong Client Component có thể hiện **cả terminal Node lẫn DevTools**.

Bảng chính thức (docs Next):

| | Trên server | Trong browser |
|---|---|---|
| Server Component | Có | Không |
| Client Component | Có (HTML lần đầu) | Có (bắt buộc) |

“Client” = **cũng** chạy trên browser, không phải “chỉ browser”.

`src/app/checkin/[eventId]/page.tsx` đang `'use client'` cả trang → toàn bộ JSX + hook của trang đó vào bundle điện thoại.

### `'use client'` là biên module, không phải annotation từng hàm

Một khi file A có `'use client'`, import B từ A thì B cũng vào client graph, **dù B không ghi directive**.

Không cần (và không nên) dán `'use client'` lên mọi file.

### RSC Payload

Không phải JSON REST của bạn. Đây là **cây UI đã render phía server**, dạng serialize:

- HTML/text từ Server Component
- “ô trống” chỗ Client Component + đường dẫn file JS của ô đó
- **props** Server truyền xuống Client

Browser dùng payload này để lắp DOM, rồi hydrate.

### Hydration

HTML đã có trên màn hình (chưa bấm được). React gắn `onClick` / state vào DOM có sẵn. Giống trang SSR xong mới bind event. Lệch HTML server vs client → lỗi hydration (tuần sau mới sâu).

### Server Function / Server Action (`'use server'`)

Hàm `async` chạy **trên server**. Browser gọi qua mạng. Next dùng **POST** (không phải GET).

- **Server Function** = tên rộng (mọi hàm server gọi được từ client)
- **Server Action** = dùng khi submit form / mutation

Trong repo: cả file `src/actions/*.ts` bắt đầu `'use server'` → **mọi export** là Server Function, kể cả `getEvent` (đọc). Tuần này chỉ cần hiểu: gọi `checkIn(...)` từ hook **không phải** hàm local; đó là RPC POST.

**Cảnh báo bảo mật (docs Next, bắt buộc nhớ):** ai cũng có thể POST thẳng vào action, không cần đi qua UI. Mỗi action phải tự authz — giống không tin `@PostMapping` chỉ vì nút ẩn trên HTML.

### Module graph

Hai đồ thị compile riêng: server graph và client graph. Client **không import** code server. Client nhận **kết quả đã render + props đã serialize**.

Hệ quả: không truyền từ Server → Client những thứ không serialize được (class DB connection, function, secret object). Chỉ data thuần: string, number, object JSON-like.

### `NEXT_PUBLIC_...`

Env có prefix này **lọt ra browser**. Key không có prefix chỉ có trên server. `NEXT_PUBLIC_SUPABASE_ANON_KEY` cố ý public (RLS chặn). Service role key **cấm** prefix này.

---

## 4. Pattern chuẩn (thuộc, chưa cần sửa code tuần này)

Server lấy data, Client chỉ tương tác:

```tsx
// app/checkin/[eventId]/page.tsx  ← KHÔNG có 'use client'
import { getEvent } from '@/lib/data'      // chạy Node
import { CheckinForm } from '@/components/checkin/CheckinForm' // 'use client'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { eventId } = await params          // Next 15+: params là Promise
  const event = await getEvent(eventId)     // SELECT trên server
  return <CheckinForm event={event} />      // chỉ đưa data thuần xuống browser
}
```

```tsx
// components/checkin/CheckinForm.tsx
'use client'
export function CheckinForm({ event }: { event: Event }) {
  // GPS, ô PIN, submit → gọi action checkIn
}
```

Ánh xạ:

```
Data (Postgres)
  → Server Component (handler)
  → props (DTO)
  → Client Component (UI tương tác)
  → Server Action POST (command)
  → Postgres
```

Repo **chưa** làm vậy trên check-in/live/setup: page client tự `useEffect` gọi `getEvent`. Chạy đúng, khác pattern chuẩn. Tuần 1 chỉ **nhận ra**, không refactor.

Mẫu gần chuẩn sẵn: `src/app/auth/page.tsx` (server) bọc `LoginForm` (client).

---

## 5. Map AttenDo — bài học chính tuần này

Mở từng file, ghi cột **Node** hay **Browser**.

### `checkIn` — phải Node

File: `src/actions/checkin.ts` — `'use server'`

Việc server đang làm (đúng):

- Đọc event (tọa độ hội trường, bán kính, status)
- Haversine so GPS client gửi lên
- So PIN + grace 15s
- Chặn trùng `device_id`
- Insert `attendance_records`

Nếu đoạn này chạy browser: user sửa JS, bỏ check bán kính, tự insert. Giống để business rule trong Android app không có API.

Client **được** gửi: `userLat`, `userLng`, `pinInput`, `fullName`, `deviceId`. Đó là *claim*. Server *verify*.

### Check-in UI — đang Browser cả trang

`src/app/checkin/[eventId]/page.tsx` + hooks:

| Việc | Chỗ đúng | File hiện tại |
|---|---|---|
| Đọc config event (tên, fields, tọa độ) | Node (SSR) | Hook `useCheckinEvent` → gọi action `getEvent` |
| GPS | Browser | `useCheckinLocation` |
| Ô form, PIN user gõ | Browser | `useCheckinForm` |
| `localStorage` device / đã check-in | Browser (không tin tuyệt đối) | `useCheckinForm` |
| Rule PIN, bán kính, insert | Node | `checkIn` |

### Host live

| Việc | Chỗ đúng |
|---|---|
| QR, đếm ngược PIN, nút xoay PIN | Browser |
| `rotatePin` ghi DB | Node |
| Danh sách tên nhảy | Browser subscribe Realtime (websocket), không phải cache Next |
| `getEvent` / `getCurrentPin` lần đầu | Có thể Node; hiện gọi từ hook |

### Host setup

| Việc | Chỗ đúng |
|---|---|
| Bản đồ Leaflet | Browser, `ssr: false` (cần `window`) |
| `createEvent` insert event + PIN đầu | Node |

### Layout / landing

`layout.tsx`, `page.tsx` (home): Server. Đúng. Không GPS, không click phức tạp (ngoài link).

---

## 6. Lịch 7 ngày (~10–12 giờ)

| Ngày | Việc | Xong khi |
|---|---|---|
| 1 | Đọc tài liệu này một lượt. Đọc docs `05-server-and-client-components.md` phần “When to use” + “How do they work”. | Kể được 4 lý do dùng Client vs 4 lý do dùng Server |
| 2 | Đọc `server-and-client-boundary.md` đến hết bảng server/browser. Mở `layout.tsx` vs `checkin/.../page.tsx`. | Chỉ được file nào có `'use client'` và hệ quả bundle |
| 3 | Đọc `03-layouts-and-pages.md` (page + layout + `[param]`). Vẽ cây URL từ `src/app`. | Vẽ đúng 6 route trong mục 2 |
| 4 | Đọc `07-mutating-data.md` đến hết warning POST. Đọc `checkin.ts` từ đầu tới insert. | Giải thích `checkIn` = POST, không phải hàm local |
| 5 | Bài tập hai cột (mục 7) cho **check-in**. | Không còn dòng “không biết cột” |
| 6 | Hai cột cho **host-setup** và **host-live**. Tra glossary: Hydration, RSC Payload, Client Component | |
| 7 | Tự giải đề mục 8, không nhìn đáp án. Đọc lại chỗ sai. | Pass 8/10 |

Mỗi ngày: 60–90 phút đọc + 20 phút mở đúng file repo. Không viết feature.

---

## 7. Bài tập bắt buộc — bảng hai cột

In hoặc ghi chép. Với mỗi dòng code / hành vi: đánh **N** (Node) hoặc **B** (Browser) hoặc **N rồi B** (Client Component hydrate).

### Luồng attendee

- User mở `/checkin/abc`
- Hiện tiêu đề sự kiện
- Xin quyền GPS
- Tính khoảng cách so với hội trường **để hiện cảnh báo trên UI**
- User gõ PIN
- Bấm xác nhận
- Haversine **để quyết định được lưu hay không**
- Insert attendance
- Ghi `localStorage` đã check-in
- Host thấy tên nhảy trên màn chiếu

Gợi ý đáp án (xem sau khi tự làm): B mở URL; N *nên* lấy tiêu đề (hiện B); B GPS; B cảnh báo UX; B gõ PIN; B bấm; **N** quyết định lưu; **N** insert; B localStorage; B Host qua websocket (server Postgres phát sự kiện, không phải Next cache).

### Câu hỏi chốt pha 0

Vì sao `haversineDistance` nằm trong `actions/checkin.ts` chứ không trong `useCheckinLocation`?

Đáp: UI được phép ước lượng khoảng cách để UX. **Quyết định nghiệp vụ** (accept/reject) phải ở server. Client có thể bị sửa. Hai lần tính không mâu thuẫn: client gợi ý, server chốt.

---

## 8. Tự kiểm tra (đáp án cuối file)

1. File không ghi `'use client'` thì mặc định chạy ở đâu?
2. `'use client'` đặt giữa file được không?
3. Client Component có chạy trên server lúc GET trang lần đầu không?
4. Server Component có dùng `useState` được không?
5. `checkIn()` gọi từ hook — HTTP method?
6. Có tin UI ẩn nút thì action không bị gọi không?
7. `NEXT_PUBLIC_SUPABASE_URL` có lộ ra browser không?
8. `[eventId]` trong tên folder nghĩa là gì?
9. `layout.tsx` có phải trang (`/layout`) không?
10. Vì sao Leaflet `ssr: false`?

---

## 9. Tuần này **không** học

- `'use cache'`, `cacheLife`, `unstable_cache`
- Tailwind, animation
- Refactor tách page server (pha 1)
- Auth sâu, RLS
- Redux, React Query

Nếu docs Next dẫn sang caching: đọc 1 đoạn “có cái này, tuần 3 mới đụng” rồi quay lại.

---

## 10. Cách đọc docs gốc (đừng đọc blog)

Mở file trong `node_modules/next/dist/docs/...` của **đúng project này**. Blog 2023 nói `getServerSideProps`, `export const revalidate` — **không** phải Next 16 của bạn.

Gặp thuật ngữ lạ → `04-glossary.md`, không Google trước.

---

## Đáp án mục 8

1. Server (Server Component).  
2. Không — phải dòng đầu file, trước import.  
3. Có — để ra HTML; rồi browser chạy lại (hydrate).  
4. Không.  
5. POST.  
6. Không — POST thẳng được; action phải tự authz.  
7. Có — prefix `NEXT_PUBLIC_`.  
8. Path param động.  
9. Không — wrapper; không tạo URL `/layout`.  
10. Cần `window`/`document`; render Node sẽ vỡ hoặc hydration lệch.
