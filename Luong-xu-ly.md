Tóm tắt siêu ngắn: Frontend ---> Routes ---> Middlewares (kiểm tra) ---> Controllers (điều phối) ---> Services (Lấy Data) ---> Controllers (Gói Data thành JSON gửi về) ---> Frontend (Hiển thị UI).

Created Luong-xu-ly.md

---

Anh thấy bức ảnh em gửi rồi! Đây là một dự án thực tế rất hay, nhìn vào tên các file có thể đoán được dự án của em liên quan đến **Hệ thống tìm kiếm và nộp hồ sơ xin Học bổng (Scholarship)** đúng không?

Nếu để ý kỹ, em sẽ thấy một **Quy luật rất đẹp**: Các file trong `routes`, `controllers`, `services` đều có phần tên đầu giống hệt nhau (ví dụ: `auth`, `scholarship`, `application`,...). Người ta gọi đây là cách đặt tên theo **Đối tượng (Entity / Feature)**.

Thay vì giải thích lặp lại từng thư mục, anh sẽ liệt kê "từng đối tượng" này sinh ra để làm gì, và các file đứng một mình có nghĩa là gì nhé:

### 1. Phân tích các bộ 3 file (Routes, Controllers, Services)

Mỗi một tính năng dưới đây đều sẽ bao gồm 3 file tương ứng (ví dụ: `auth.routes.js`, `auth.controller.js`, `auth.service.js`). Chúng phục vụ cho các mục đích:

- 🔒 **`auth...` (Authentication - Xác thực):**
    - **Nhiệm vụ:** Lo việc Đăng ký, Đăng nhập, Đăng xuất, Quên mật khẩu, Cấp lại Token...
- 🎓 **`scholarship...` (Học bổng):**
    - **Nhiệm vụ:** Quản lý dữ liệu về các học bổng (Thêm, sửa, xóa, tìm kiếm danh sách học bổng, xem chi tiết một học bổng).
- 📝 **`application...` (Đơn ứng tuyển):**
    - **Nhiệm vụ:** Nơi xử lý khi sinh viên bấm nút "Nộp đơn" vào một học bổng nào đó. Theo dõi trạng thái đơn (chờ duyệt, đã đậu, đã rớt...).
- 👤 **`profile...` (Hồ sơ cá nhân):**
    - **Nhiệm vụ:** Quản lý thông tin của người dùng (Tên, tuổi, điểm GPA, trường đang học...). Sinh viên vào đây để cập nhật trích ngang của mình.
- 📄 **`document...` (Tài liệu / Giấy tờ):**
    - **Nhiệm vụ:** Xử lý việc upload các file như CV, Chứng chỉ IELTS, Bảng điểm... Lĩnh vực này liên quan trực tiếp đến file đính kèm.
- ⭐ **`saved...` (Lưu trữ / Yêu thích):**
    - **Nhiệm vụ:** Làm chức năng "Lưu học bổng này lại để xem sau" (giống icon trái tim/bookmark trên các web).
- 💡 **`recommend...` (Gợi ý):**
    - **Nhiệm vụ:** Chứa các logic tính toán (hoặc gọi AI) để gợi ý học bổng: "Với 7.0 IELTS và 3.2 GPA của bạn, đây là 5 học bổng phù hợp nhất!".

### 2. Các file/thư mục đặc biệt khác (Đứng một mình)

- ⚡ **`src/services/supabase.js`:**
    - Đây là file kết nối vào cơ sở dữ liệu (Database). Vì dự án này dùng nền tảng **Supabase**, nên file này sẽ chứa các cấu hình, chìa khóa (API Key) để phần backend của em có thể nói chuyện được với Database trên mạng. `services` khác sẽ gọi file này ra để dùng mỗi khi cần chọc vào DB.
- ⚙️ **`src/app.js` và `src/server.js`:**
    - Đây là nguyên tắc tách file rất chuẩn (Tách biệt App và Server):
    - **`app.js`:** Là nơi cấu hình toàn bộ ứng dụng Express của em (Mặc áo gì, xài công cụ gì, khai báo các `routes` vào đây). Nhưng nó chỉ 'tạo hình' chứ chưa 'chạy'.
    - **`server.js`:** Bấm nút khởi động máy! File này sẽ gọi thằng `app.js` ra và bảo: _"Ứng dụng ơi, hãy bắt đầu lắng nghe ở Cổng (Port) 3000 cho khách kết nối nhé!"_. File `server.js` thường là file chạy đầu tiên khi khởi động dự án.
- 📦 **`node_modules/`:**
    - Cái kho chứa tất cả các thư viện của bên thứ ba mà dự án em tải về (ví dụ: express, bcrypt, jsonwebtoken...). Em **tuyệt đối không bao giờ** chui vào đây sửa code vì nó là đồ tải từ trên mạng xuống! (Thư mục này cũng thường nặng nhất).
- 📂 **`uploads/`:**
    - Đây là thư mục tạm thời trên máy chủ để lưu các file người dùng tải lên (Ví dụ sinh viên upload CV định dạng `.pdf`). Ở dự án thực tế, người ta thường sau đó sẽ đẩy qua dịch vụ lưu trữ Cloud (AWS S3) thay vì để mãi ở đây để tránh đầy bộ nhớ Server máy tính.
- 🔑 **`.env` (Environment Variables - Biến môi trường):**
    - Cực kỳ quan trọng! File này chứa các **bí mật gia truyền** (Mật khẩu Database, Secret Key giải mã Token, Cổng chạy server). File này **không bao giờ** được phép đưa lên Github để tránh bị người khác ăn cắp tài khoản. Nó chỉ nằm ở máy cá nhân của dev hoặc tồn tại riêng trên máy chủ triển khai (Deploy).
- 📜 **`scripts/`:**
    - Các đoạn code nhỏ (tool/công cụ) chạy bằng tay để hỗ trợ quá trình phát triển (ví dụ: file script để chèn sẵn 100 cái học bổng ảo vào data để test cho lẹ, thay vì ngồi nhập tay).

---

**Tóm lại:** Khi làm tính năng **"Đăng nhập"**, mọi chuyện sẽ bắt đầu từ `.env` (lấy khóa) -> chạy qua `auth.routes` -> rẽ vào `auth.controller` -> gọi lệnh tìm kiếm ở `auth.service` -> và cuối cùng kết nối với `supabase.js` để kiểm tra tài khoản.

Đến đây em đã nhìn được toàn bộ "Bản đồ" thành phố Backend của mình chưa? Cần hỏi thêm chỗ nào cứ thoải mái nha!

Tuyệt vời! Phương pháp **Hỏi - Đáp (Q&A / Flashcards)** là cách hiệu quả nhất để 'mock interview' (thi thử) trước khi bảo vệ đồ án. Đây chính xác là những câu hỏi xoáy mà các thầy cô hay dùng để kiểm tra xem sinh viên có thật sự tự làm báo cáo hay không.

Anh sẽ liệt kê các câu hỏi kèm theo trả lời cực kỳ thẳng thắn, ngắn gọn, vạch rõ bản chất:

---

### 🌟 1. Kiến trúc & Giao tiếp (Client - Server)

**❓ C1: Khi em bấm nút "Đăng nhập" trên giao diện, dữ liệu đi từ đâu đến đâu?**

> **💡 Đáp:** Dữ liệu bắt đầu từ form trên trình duyệt (Frontend) -> Gói lại thành định dạng JSON -> Gửi qua đường truyền mạng tới địa chỉ API (URL) của Backend -> Đi qua Lễ tân (Routes) -> Qua bảo vệ (Middleware) kiểm tra -> Giao cho Quản lý (Controller) thu thập logic -> Đẩy cho Nhà kho (Service/Database) so sánh dữ liệu -> Database báo kết quả lại cho Controller -> Controller đóng gói JSON kèm Token gửi trả về cho Frontend -> Trình duyệt hiển thị popup "Thành công".

**❓ C2: Tại sao lấy danh sách học bổng lại dùng phương thức `GET`, mà lúc Đăng nhập lại dùng `POST`? Dùng lẫn lộn được không?**

> **💡 Đáp:** Dùng `GET` để **đọc** dữ liệu, khi dùng GET tham số bị lộ trên đường dẫn URL nên không bảo mật. Dùng `POST` để **gửi, thêm mới hoặc xử lý nhạy cảm**, dữ liệu được giấu phần "thân" (Body) của Request. Nếu dùng GET cho Đăng nhập thì Password sẽ lồ lộ trên thanh địa chỉ URL, cực kỳ nguy hiểm. Không nên dùng lẫn lộn vì nó vi phạm tiêu chuẩn thiết kế RESTful API thế giới đang dùng.

---

### 🌟 2. Database (Supabase & Relational DB)

**❓ C3: Tại sao trong bảng `application` (Đơn ứng tuyển) của em lại phải lưu chèn thêm cột `user_id` và `scholarship_id`?**

> **💡 Đáp:** Hai cột đó gọi là **Khóa ngoại (Foreign Keys)**. Nó sinh ra để giải quyết "Mối quan hệ Nhiều - Nhiều" (1 sinh viên nộp nhiều học bổng, 1 học bổng có nhiều sinh viên nộp). Bảng `application` đóng vai trò là "chiếc cầu nối". Nhờ 2 khóa ngoại đó, nhìn vào 1 cái Đơn, ta sẽ biết ngay cái Đơn đó là **của Ai** nộp cho **Học bổng nào** mà không cần phải copy lại toàn bộ tên tuổi của người đó.

**❓ C4: Tại sao em lại chọn Supabase (PostgreSQL) thay vì xài MongoDB (NoSQL) cho bài này?**

> **💡 Đáp:** Vì dữ liệu về Học bổng, Sinh viên và Hồ sơ có **tính quan hệ qua lại chặt chẽ với nhau** (Relational). Dùng bảng (SQL) giúp em quản lý các mối quan hệ này (ràng buộc Khóa ngoại/Foreign key) an toàn và không bị rác (VD: xóa 1 học bổng thì sẽ dễ dàng báo lỗi nếu đang có hồ sơ nộp vào). Thiết kế bằng SQL vững chãi hơn cho các hệ thống có tính giao dịch/hồ sơ như thế này.

---

### 🌟 3. Bảo Mật: Auth & JWT (Chấm thi CỰC KỲ hay hỏi)

**❓ C5: JWT (Token) là gì? Tưởng tượng nó giống cái gì ngoài đời thực?**

> **💡 Đáp:** Token giống hệt cái **"Thẻ Vận Viên" (hoặc Vé xem phim)**. Khi em đăng nhập thành công (Trình CCCD ở cổng), Server sẽ cấp cho em cái Thẻ (Token). Từ lúc đó trở đi, chạy đi bơi, đi gym, đi ăn (gọi các API khác), em chỉ việc quẹt cái Thẻ (đính Token lên Header) là Server tự biết quy định thân phận của em mà không bắt em phải trình lại CCCD (đăng nhập lại) nữa.

**❓ C6: Em lưu mật khẩu của User vào Database như thế nào? Có để trần (PlainText) không? Tại sao?**

> **💡 Đáp:** Tuyệt đối không lưu trần mật khẩu (như '123456'). Em phải dùng thư viện tên là **Bcrypt** để băm (Hash) mật khẩu đó thành một dãy ký tự loằng ngoằng không thể dịch ngược (VD: `$2a$10$xyz...`).
> **Lý do:** Giả sử Database bị Hacker trộm (hay chính Dev dòm ngó), thì cũng không ai biết mật khẩu thật của sinh viên là gì, đảm bảo không bị lộ tài khoản.

---

### 🌟 4. Xử lý Lỗi & Status Codes

**❓ C7: Trình duyệt báo lỗi màu đỏ mã 400 (Bad Request) khác gì với lỗi 401 (Unauthorized)?**

> **💡 Đáp:**
>
> - **400 (Bad Request):** Là do khách hàng! Khách (Frontend) gửi sai định dạng, thiếu email, password ngắn quá... Backend từ chối phục vụ.
> - **401 (Unauthorized):** Khách gửi form đúng, nhưng hệ thống chặn vì **Khách chưa xé vé/chưa Đăng nhập** nên không có quyền truy cập.

**❓ C8: Nếu Server chết do tràn bộ nhớ hoặc Dev viết sai câu lệnh (`undefined is not a function`), thì mã lỗi là gì? Ai là người phải đi sửa?**

> **💡 Đáp:** Mã lỗi **500 (Internal Server Error)**. Frontend vô tội. Lúc này em (vai trò người viết Backend) phải tốc váy lên mở file log (Terminal) xem code Backend bị sập ở dòng nào.

---

### 🌟 5. Vận Hànhực Tế (CORS & .env)

**❓ C9: CORS Error là cái lỗi gì mà làm frontend dính lỗi nhiều thế?**

> **💡 Đáp:** CORS (Cross-Origin Resource Sharing) là một hàng rào bảo mật do chính Trình Duyệt (Chrome, Edge) dựng lên. Nó thấy Frontend (ở Cổng A) đang lén lút gọi một Backend (ở cổng B - khác nhà), nó nghi ngờ là mã độc nên tự động chặn.
> **Cách giải quyết:** Em phải báo cho Backend khai báo (thường là gói `cors` trong node) rằng: _"Tôi cấp phép cho Cổng A được nói chuyện với tôi đó, trình duyệt thả cửa đi!"_.

**❓ C10: File `.env` chứa gì? Tại sao lên mạng đọc thấy người ta đưa .env vào `gitignore` để Github không thấy?**

> **💡 Đáp:** File `.env` chứa các "Chìa khóa két sắt" (Mật khẩu Database, Secret Key để tạo Token). Nếu đẩy cái này lên Github tĩnh cho bàn dân thiên hạ xem, hacker sẽ biết mật khẩu Database và vào xóa sạch dữ liệu hoặc khóa tống tiền. Khác biệt với code logic, file `.env` chỉ tồn tại bí mật ở máy của Dev hoặc cấu hình giấu kín cài trên Server thật.

---

🔥 **Lời khuyên đi kèm:** Em hãy tạo thói quen mỗi khi mở một hàm trong Controller lên (VD: file `auth.controller.js`), em hãy **áp các câu hỏi này vào** (hàm này đang xử lý GET hay POST? Nó đang ném ra lỗi mã bao nhiêu? Nó đang check Token JWT ở đâu?). Em sẽ thấy code trở nên cực kỳ thân thiện chứ không phải là những dòng chữ mù mờ nữa!
