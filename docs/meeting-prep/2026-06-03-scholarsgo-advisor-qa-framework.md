# ScholarsGo - Bo Hoi Dap Danh Gia So Bo

## Muc dich

Tai lieu nay duoc soan de nhom chuan bi cho buoi hop danh gia so bo du an `ScholarsGo - He thong San Hoc Bong & Quan ly Ho so Du hoc`.

Tai lieu bam sat codebase hien tai cua du an, khong viet theo kieu ly thuyet chung chung. Cac cau hoi tap trung vao:

- Hieu bai toan san pham
- Kien truc frontend/backend
- Cau truc du lieu va schema database
- Tich hop AI, OAuth, RSS/news
- Chat luong code va trade-off ky thuat
- Năng luc trinh bay theo 3 role trong nhom

## Nguon doi chieu trong codebase

- App backend: [backend/src/app.js](/Users/Shared/SchoolarsGo/backend/src/app.js:1)
- App frontend routes: [frontend/src/App.jsx](/Users/Shared/SchoolarsGo/frontend/src/App.jsx:1)
- Schema database: [database.sql](/Users/Shared/SchoolarsGo/database.sql:1)
- Recommend service: [backend/src/services/recommend.service.js](/Users/Shared/SchoolarsGo/backend/src/services/recommend.service.js:1)
- Chat service: [backend/src/services/chat.service.js](/Users/Shared/SchoolarsGo/backend/src/services/chat.service.js:1)
- Auth service: [backend/src/services/auth.service.js](/Users/Shared/SchoolarsGo/backend/src/services/auth.service.js:1)
- OAuth service: [backend/src/services/oauth.service.js](/Users/Shared/SchoolarsGo/backend/src/services/oauth.service.js:1)
- Application service: [backend/src/services/application.service.js](/Users/Shared/SchoolarsGo/backend/src/services/application.service.js:1)
- Application repository: [backend/src/repositories/application.repository.js](/Users/Shared/SchoolarsGo/backend/src/repositories/application.repository.js:1)
- Scholarship repository: [backend/src/repositories/scholarship.repository.js](/Users/Shared/SchoolarsGo/backend/src/repositories/scholarship.repository.js:1)
- Validators: [backend/src/utils/validators.js](/Users/Shared/SchoolarsGo/backend/src/utils/validators.js:1)
- Auth store: [frontend/src/stores/authStore.js](/Users/Shared/SchoolarsGo/frontend/src/stores/authStore.js:1)
- Auth hook: [frontend/src/hooks/useAuth.js](/Users/Shared/SchoolarsGo/frontend/src/hooks/useAuth.js:1)
- Recommend UI: [frontend/src/pages/RecommendPage.jsx](/Users/Shared/SchoolarsGo/frontend/src/pages/RecommendPage.jsx:1)
- Chat UI: [frontend/src/pages/ChatPage.jsx](/Users/Shared/SchoolarsGo/frontend/src/pages/ChatPage.jsx:1)

## Cau truc tai lieu

- Phan A: Cau hoi chung ca nhom
- Phan B: Frontend Developer
- Phan C: Backend Developer
- Phan D: PM / Full-stack / Architecture
- Phan E: Gotcha questions
- Phan F: Bang phan cong on tap

Tong so cau hoi: `24`

---

## Phan A - Cau hoi chung ca nhom

### Q1. ScholarsGo giai quyet bai toan gi ma Google va Facebook group chua giai quyet tot?

**Nguoi tra loi uu tien:** PM hoac Full-stack, nhung ca nhom phai nho.

**Giang vien dang kiem tra**

- Nhom co hieu pain point that su khong
- Co phan biet duoc `data discovery` va `workflow management` khong
- Co xac dinh ro target user la hoc sinh/sinh vien Viet Nam khong

**Cac y chinh can co**

- Thong tin hoc bong hien bi phan tan
- Nguoi dung kho danh gia hoc bong nao hop voi profile
- Deadline, ho so, tai lieu va trang thai nộp don hien khong duoc quan ly tap trung
- ScholarsGo khong chi la search, ma la workflow tu tim hoc bong den theo doi apply

**Red flags**

- “Lam de hoc cong nghe”
- “Vi chua ai lam”
- “Co AI nen hay”

**Khung tra loi**

> ScholarsGo giai quyet bai toan sinh vien tim hoc bong bi thieu mot he thong tap trung de tim kiem, luu, quan ly ho so va theo doi qua trinh ung tuyen. Google va Facebook groups giup tim thong tin, nhung khong giup quan ly hanh trinh apply. ScholarsGo ket hop search, profile, tracker, AI chatbot va recommendation thanh mot workflow lien mach.

---

### Q2. Diem khac biet lon nhat cua ScholarsGo so voi mot website listing hoc bong la gi?

**Giang vien dang kiem tra**

- Team co xac dinh ro USP khong
- Co biet phan biet feature “nice-to-have” va “core value” khong

**Y chinh**

- Search va filter chi la lop dau
- Recommendation dua tren profile
- Application tracker co state machine
- AI chatbot duoc grounding bang du lieu he thong
- News/RSS la lop ho tro cap nhat

**Khung tra loi**

> Diem khac biet cua ScholarsGo la tu mot danh sach hoc bong, he thong mo rong thanh mot nen tang ho tro quy trinh san hoc bong. Core value nam o profile-based recommendation, tracker theo doi trang thai ung tuyen, va chatbot co kha nang tu van dua tren du lieu he thong thay vi tra loi chung chung.

---

### Q3. MVP hien tai cua nhom gom nhung gi, va nhung gi chua lam?

**Giang vien dang kiem tra**

- Kha nang scope control
- Team co trung thuc ve maturity cua san pham khong

**Y chinh**

- Da co: scholarship search/filter, profile, documents, saved, applications, recommend, chat, news, admin
- Chua hoan thien: mobile app native, full ML recommender, full benchmark AI, hardening security/load test
- Phase 2: notification, analytics, richer personalization

**Khung tra loi**

> MVP hien tai da co day du luong chinh cho user web: tim hoc bong, cap nhat profile, tai tai lieu, luu hoc bong, tao va theo doi don ung tuyen, nhan goi y AI, chat voi bot va xem tin tuc. Phan chua lam sau hon la mobile app native, benchmark AI formal, va cac bai test tai nang cao.

---

### Q4. Tại sao nhom chon React + Node.js + Supabase + Gemini?

**Giang vien dang kiem tra**

- Kha nang defend tech stack
- Team co biet trade-off hay chi noi “quen tay”

**Y chinh**

- React + Vite phu hop SPA, component reuse tot
- Node.js + Express giup dong nhat JavaScript full-stack
- Supabase phu hop relational workflows hon NoSQL
- Gemini du chi phi cho MVP AI
- Team uu tien time-to-market va kha nang lam chu

**Red flags**

- “Vi trend”
- “Vi AI agent bao the”

**Khung tra loi**

> Team chon stack theo nguyen tac phu hop bai toan va nang luc nhom. React/Vite giup xay SPA nhanh. Node/Express giam friction vi team dung cung mot ngon ngu. Supabase/PostgreSQL phu hop du lieu co quan he ro nhu users, profiles, scholarships, applications, saved_scholarships. Gemini du re va du tot cho nhu cau chatbot/recommendation o muc MVP.

---

### Q5. Kien truc tong the cua he thong hien tai nhu the nao?

**Giang vien dang kiem tra**

- Nhom co nhin duoc architecture layer khong
- Co phan biet route/controller/service/repository khong

**Y chinh**

- Frontend SPA React
- Backend Express REST API
- Route -> controller -> service -> repository
- Database PostgreSQL tren Supabase
- External providers: Gemini/Groq/Zhipu, Facebook, Apple, RSS feeds

**Khung tra loi**

> Kien truc hien tai la web SPA o frontend va REST API o backend. Backend duoc tach thanh cac lop routes, controllers, services va repositories. Database la PostgreSQL tren Supabase. Cac he thong ngoai duoc tich hop qua service layer, bao gom AI providers, OAuth providers va news sources tu RSS.

---

### Q6. Vi sao bang `applications` duoc thiet ke co state machine thay vi chi luu text status don gian?

**Giang vien dang kiem tra**

- Team co hieu business rules khong
- Co biet bien “status” thanh luong nghiep vu khong

**Y chinh**

- Trang thai co luong hop le: `draft -> submitted -> under_review -> interview -> accepted/rejected/withdrawn`
- Service dang enforce transition trong [application.service.js](/Users/Shared/SchoolarsGo/backend/src/services/application.service.js:1)
- Tranh cap nhat lung tung gay sai logic

**Khung tra loi**

> Nhom khong luu status theo kieu text tu do, ma coi no la mot state machine nho. Dieu nay giup luong ung tuyen nhat quan va de validate nghiep vu, vi mot don dang draft thi co the submit, nhung mot don da accepted khong the quay lai draft. Cach nay giup code ro hon va phu hop voi tracker.

---

### Q7. Schema database cua ScholarsGo co nhung bang chinh nao?

**Giang vien dang kiem tra**

- Team co nam schema that khong
- Co hieu quan he du lieu khong

**Y chinh**

- `users`
- `profiles`
- `documents`
- `scholarships`
- `applications`
- `saved_scholarships`
- Co them bang OAuth identities trong phase moi

**Khung tra loi**

> Schema cot loi hien tai xoay quanh users, profiles, documents, scholarships, applications va saved_scholarships. Users co 1 profile, co nhieu documents, co nhieu applications va saved items. Applications lien ket users voi scholarships. Saved_scholarships cho phep user luu hoc bong va them note. Ngoai ra auth da mo rong de ho tro social login qua bang identity mapping.

---

### Q8. RLS trong `database.sql` da du de bao mat he thong chua?

**Giang vien dang kiem tra**

- Team co biet security khong chi la “bat RLS”
- Co phan biet giua DB policy va app-level auth khong

**Y chinh**

- RLS la mot lop bao ve tot o DB
- Nhung backend van dang kiem soat auth/role rieng qua JWT cookie va middleware
- Chinh sach `scholarships_admin_insert/update` hien van de `true`, nghia la can noi ro app dang enforce admin o backend layer

**Khung tra loi**

> RLS la mot lop bao mat quan trong, nhung chua du neu dung mot minh. O project nay, backend dang dung JWT cookie va middleware role-check de kiem soat. Team can thua nhan rang mot so policy trong schema ban dau con de rong cho giai doan MVP, nen hien tai security duoc enforce chu yeu o backend application layer.

---

## Phan B - Frontend Developer Track

### Q9. Cac route chinh cua frontend hien tai duoc to chuc ra sao?

**File tham chieu:** [frontend/src/App.jsx](/Users/Shared/SchoolarsGo/frontend/src/App.jsx:1)

**Giang vien dang kiem tra**

- Ban co biet app flow khong
- Co biet page public, protected, admin route khong

**Y chinh**

- Public: home, scholarships, detail, login, register, forgot/reset, news
- Protected: dashboard, applications, recommend, chat, deadlines
- AdminRoute rieng cho `/admin`

**Khung tra loi**

> Frontend chia route theo 3 nhom: public routes, protected routes va admin routes. ProtectedRoute duoc dung cho cac page can dang nhap nhu dashboard, applications, recommend, chat. AdminRoute kiem tra them `user.role === 'admin'` de chan truy cap trai phep vao khu quan tri.

---

### Q10. State frontend dang duoc chia the nao giua local state, Zustand va React Query?

**File tham chieu:** [frontend/src/stores/authStore.js](/Users/Shared/SchoolarsGo/frontend/src/stores/authStore.js:1), [frontend/src/hooks/useAuth.js](/Users/Shared/SchoolarsGo/frontend/src/hooks/useAuth.js:1)

**Giang vien dang kiem tra**

- Hieu phan biet client state va server state
- Tranh dung global state mot cach khong can thiet

**Y chinh**

- Zustand: auth, mot so UI state, comparison state
- React Query/hook layer: data fetch va mutation tu API
- useState: input, modal, local UI interactions

**Khung tra loi**

> Frontend dang dung mo hinh tach state tuong doi ro. Global state can duoc giu lau nhu auth thi dua vao Zustand va co persist. Du lieu tu server thi lay qua hook/mutation va co cache theo query layer. Cac state nho trong page nhu input, toggle, modal van de o local state de tranh lam store phinh to khong can thiet.

---

### Q11. Vi sao auth store chi luu `user` va `isAuthenticated`, khong luu token?

**Giang vien dang kiem tra**

- Hieu auth model cua chinh project
- Co biet cookie-based auth khac localStorage token auth the nao

**Y chinh**

- Backend issue JWT bang httpOnly cookie
- Frontend khong can giu token trong JS store
- Store chi luu session state de render UI

**Khung tra loi**

> Frontend khong luu JWT token vi backend dang su dung httpOnly cookie. Dieu nay giam rui ro lo token qua JavaScript. Zustand chi luu user va isAuthenticated de dieu khien giao dien, con viec gui token se do browser tu dong xu ly qua cookie.

---

### Q12. Recommend page hien thi nhung signal nao de nguoi dung hieu vi sao duoc goi y?

**File tham chieu:** [frontend/src/pages/RecommendPage.jsx](/Users/Shared/SchoolarsGo/frontend/src/pages/RecommendPage.jsx:1)

**Giang vien dang kiem tra**

- Frontend co biet consume dung response contract backend khong
- Co hieu explainability khong

**Y chinh**

- match_score
- rule_score
- semantic_score
- confidence
- profile_gaps
- profile_readiness
- ai_reason

**Khung tra loi**

> Recommend page khong chi show danh sach hoc bong, ma show ca `match_score`, `rule_score`, `semantic_score`, `confidence`, `profile_gaps` va `ai_reason`. Muc tieu la tang explainability de user hieu vi sao mot hoc bong duoc de xuat va can bo sung thong tin gi de he thong goi y chinh xac hon.

---

### Q13. Chat UI da xu ly nhung concern nao lien quan den UX va an toan hien thi noi dung?

**File tham chieu:** [frontend/src/pages/ChatPage.jsx](/Users/Shared/SchoolarsGo/frontend/src/pages/ChatPage.jsx:1)

**Giang vien dang kiem tra**

- Co nhin thay risk XSS o chat khong
- Co quan tam loading, typing, quick reply khong

**Y chinh**

- DOMPurify sanitize noi dung render
- loading/typing indicator
- quick replies
- copy message
- welcome state va history separator

**Khung tra loi**

> Chat UI da co mot so xu ly quan trong ve UX va safety. Noi dung tra ve duoc format nhe nhung qua DOMPurify de giam rui ro XSS. Ngoai ra giao dien co typing indicator, quick replies, copy response va welcome state de giam cam giac “man hinh trong” cho nguoi dung moi.

---

### Q14. Diem yeu hien tai cua frontend la gi neu giang vien hoi that?

**Giang vien dang kiem tra**

- Kha nang tu danh gia
- Muc do trung thuc

**Y chinh**

- Landing page chua that su noi bat
- Chua co test frontend sau
- PWA/mobile native chua day du
- SEO SPA con yeu

**Khung tra loi**

> Neu danh gia trung thuc, frontend da dung duoc cho MVP nhung phan marketing UI va polish van chua manh. Landing page chua that su premium, test UI chua sau, va phan SEO cua SPA chua toi uu. Day la nhung huong nhom uu tien sau khi luong nghiep vu cot loi da on.

---

### Q15. Neu giang vien hoi “vi sao khong dung Next.js?”, ban tra loi the nao?

**Giang vien dang kiem tra**

- Ban co biet defend choice ma khong bao thu

**Y chinh**

- Next.js tot cho SSR/SEO
- Nhung team chon React + Vite de giam do phuc tap va fit timeline
- Bai toan MVP hien tai uu tien SPA + API tach rieng

**Khung tra loi**

> Next.js la mot lua chon tot neu ngay tu dau team uu tien SEO, SSR va full-stack React framework. Tuy nhien nhom chon React + Vite vi quen tay hon, toc do iteration nhanh, va kien truc tach frontend/backend ro rang phu hop voi timeline ngan cua MVP. Doi lai, nhom chap nhan han che ve SEO va se can can nhac neu mo rong san pham.

---

## Phan C - Backend Developer Track

### Q16. Luong request trong backend di qua cac lop nao?

**File tham chieu:** [backend/src/app.js](/Users/Shared/SchoolarsGo/backend/src/app.js:1)

**Giang vien dang kiem tra**

- Ban co hieu layer backend hay khong

**Y chinh**

- Express route
- validate middleware
- auth/role middleware neu can
- controller
- service
- repository
- DB/external API

**Khung tra loi**

> Request vao backend se di qua middleware chung nhu helmet, cors, json parser, rate limit. Sau do route co the di qua validate va auth middleware. Controller lam nhiem vu nhan request/tra response, service xu ly business logic, repository giao tiep voi Supabase/PostgreSQL hoac external providers.

---

### Q17. Tai sao `applications` can ca service layer va repository layer, khong query truc tiep trong controller?

**File tham chieu:** [backend/src/services/application.service.js](/Users/Shared/SchoolarsGo/backend/src/services/application.service.js:1), [backend/src/repositories/application.repository.js](/Users/Shared/SchoolarsGo/backend/src/repositories/application.repository.js:1)

**Giang vien dang kiem tra**

- Team co hieu separation of concerns khong

**Y chinh**

- Controller giu request/response
- Service giu business rules: transition, delete policy, formatting
- Repository giu truy van DB

**Khung tra loi**

> Team tach service va repository de tranh controller bi phinh to va de business rules co the test/bao tri de hon. Vi du, luat chuyen trang thai don ung tuyen va chinh sach khong cho xoa mot so status nam o service, trong khi repository chi phu trach query du lieu.

---

### Q18. State machine cua `applications` dang enforce nhu the nao?

**Giang vien dang kiem tra**

- Ban co nho luong business khong

**Y chinh**

- VALID_TRANSITIONS trong service
- `draft -> submitted`
- `submitted -> under_review/rejected/withdrawn`
- `under_review -> interview/rejected/withdrawn`
- `interview -> accepted/rejected/withdrawn`
- accepted/rejected/withdrawn la terminal

**Khung tra loi**

> Trang thai duoc enforce o service qua bang `VALID_TRANSITIONS`. Moi request update status deu di qua ham assertValidTransition de chan nhung buoc nhay khong hop le. Dieu nay giup tracker phan anh dung nghiep vu thay vi de frontend gui bat ky status nao cung duoc.

---

### Q19. Query scholarships hien tai co the gap van de N+1 o dau?

**File tham chieu:** [backend/src/repositories/scholarship.repository.js](/Users/Shared/SchoolarsGo/backend/src/repositories/scholarship.repository.js:1)

**Giang vien dang kiem tra**

- Ban co thuc su hieu N+1 khong

**Y chinh**

- `findAll()` fetch scholarships xong moi attach saved status cho user
- Day khong phai N+1 tung record, ma la 2 queries: 1 query scholarships + 1 query saved by ids
- La acceptable cho MVP

**Khung tra loi**

> Trong scholarship list hien tai, team da tranh kieu N+1 tung record. Repository lay danh sach hoc bong truoc, sau do neu co user thi lay mot query phu de tim cac scholarship_id da save trong tap ids do. Nghia la dang o mo hinh 2 queries cho list, khong phai 1 + N queries.

---

### Q20. Input validation cua backend dang duoc lam the nao?

**File tham chieu:** [backend/src/utils/validators.js](/Users/Shared/SchoolarsGo/backend/src/utils/validators.js:1)

**Y chinh**

- Zod schemas
- validate query, body
- enum statuses, degrees, languages
- UUID checks cho scholarship_id, documents_used

**Khung tra loi**

> Backend dung Zod de validate request body va query params. Vi du, scholarship query co limit toi da 50, GPA trong khoang 0-4, IELTS 0-9, status ung tuyen phai nam trong danh sach cho phep. Cach nay giup backend chan input xau som truoc khi vao business logic.

---

### Q21. Auth flow email/password hien tai dien ra the nao?

**File tham chieu:** [backend/src/services/auth.service.js](/Users/Shared/SchoolarsGo/backend/src/services/auth.service.js:1)

**Y chinh**

- register: check email ton tai, hash password, create user
- login: find user, compare hash, update last login, issue token
- getMe: load current user
- forgot/reset password co token hash

**Khung tra loi**

> Email/password auth dang theo flow kha chuan: dang ky se check email trung, hash password va tao user. Dang nhap se tim user, compare password_hash, cap nhat last login va issue JWT. Phan quyen mat khau dung raw token gui email, nhung trong DB chi luu ban hash cua token de giam rui ro lo reset token.

---

### Q22. Tai sao OAuth service duoc tach rieng khoi auth service?

**File tham chieu:** [backend/src/services/oauth.service.js](/Users/Shared/SchoolarsGo/backend/src/services/oauth.service.js:1)

**Giang vien dang kiem tra**

- Ban co hieu phan chia trach nhiem khi tich hop external provider

**Y chinh**

- OAuth service lo viec build auth URL, exchange code, verify token, fetch profile
- Auth service lo viec link/create local user va issue auth result
- Giam coupling, de thay doi provider de hon

**Khung tra loi**

> Team tach OAuth service de phan “xac thuc voi provider” khoi phan “quan ly user local”. OAuth service xu ly logic Facebook/Apple, con Auth service xu ly link identity vao users, phat JWT va emit lifecycle events. Cach tach nay giup code it roi hon va de mo rong provider moi.

---

### Q23. Recommendation engine cua backend hien tai la ML hay khong?

**File tham chieu:** [backend/src/services/recommend.service.js](/Users/Shared/SchoolarsGo/backend/src/services/recommend.service.js:1)

**Giang vien dang kiem tra**

- Bay trung thuc ky thuat
- Bay ve AI hype

**Y chinh**

- Khong phai full ML
- Hybrid: rule fit + semantic fit + Gemini explanation
- Co profile readiness, score breakdown
- Chon practical approach vi MVP

**Khung tra loi**

> Recommendation hien tai khong phai machine learning training model day du. He thong la hybrid: tinh rule-based fit, tinh semantic fit bang text similarity va sau do co the dung Gemini de enrich explanation. Cach nay phu hop voi du lieu hien tai va du muc tieu MVP ma khong thoi phong la ML.

---

### Q24. Chatbot da co co che fallback nhu the nao khi Gemini loi hoac het quota?

**File tham chieu:** [backend/src/services/chat.service.js](/Users/Shared/SchoolarsGo/backend/src/services/chat.service.js:1)

**Y chinh**

- Thu Gemini theo 2 model
- Neu 429 thi fallback Groq
- Neu tiep tuc loi thi fallback Zhipu
- Neu van fail thi tra ve raw scholarship list neu co

**Khung tra loi**

> Chatbot khong phu thuoc vao mot model duy nhat. He thong thu Gemini theo thu tu model, neu gap 429 thi fallback sang Groq, sau do sang Zhipu. Neu cac provider deu qua tai ma he thong da query duoc hoc bong tu DB, bot se tra ve ket qua that tu he thong thay vi im lang hoac bịa.

---

## Phan D - PM / Full-stack / Architecture Track

### Q25. Team phan cong vai tro 3 thanh vien ra sao, va lam sao tranh silo?

**Giang vien dang kiem tra**

- Teamwork co that khong
- Co phu thuoc 1 nguoi hay khong

**Y chinh**

- Frontend Dev, Backend Dev, PM/Full-stack
- GitHub review
- Sync hang tuan
- Demo chéo module
- PM nam flow tong, nhung moi nguoi phai hieu mot phan role kia

**Khung tra loi**

> Team chia ro role de tang toc, nhung van co co che tranh silo thong qua code review, sync hang tuan va demo chéo. PM/Full-stack giu buc tranh tong the, Frontend va Backend phu trach module sau hon, nhung ca nhom van phai nam luong du lieu chinh va deployment co ban.

---

### Q26. Trade-off lon nhat trong qua trinh lam MVP cua nhom la gi?

**Y chinh**

- Uu tien web MVP thay vi native mobile
- Uu tien workflow core thay vi marketing UI
- Uu tien hybrid AI practical thay vi full ML
- Uu tien data cleaning duong vua phai thay vi full enterprise data pipeline

**Khung tra loi**

> Trade-off lon nhat la nhom uu tien mot web MVP chay duoc, co luong nghiep vu ro rang, thay vi om qua nhieu feature va cong nghe. Dieu do co nghia la chap nhan chua co mobile native, chua co full ML, va mot so phan polish UI chua dat muc san pham thuong mai.

---

### Q27. Kien truc hien tai co ho tro mo rong sang mobile app duoc khong?

**Y chinh**

- Backend da la REST API tach rieng
- Auth, scholarships, applications, recommend, chat co the reuse
- Frontend mobile co the la React Native/Expo o phase sau
- Can lam lai UI layer, nhung business/API co the tai su dung

**Khung tra loi**

> Kien truc hien tai kha than thien voi mobile expansion vi backend da tach thanh REST API doc lap. Neu lam React Native/Expo o phase sau, nhom co the tai su dung phan lon API, auth model va business logic, chi can viet lai presentation layer va mot so interaction mobile-specific.

---

### Q28. Neu duoc dau tu them 4 tuan, PM uu tien 3 viec nao va vi sao?

**Y chinh**

- Test va hardening
- Data quality pipeline
- Product polish / landing / analytics co ban

**Khung tra loi**

> Neu co them 4 tuan, em uu tien 3 viec: thu nhat la hardening va test de giam regression; thu hai la cai thien data quality vi hoc bong la tai san cot loi; thu ba la polish trai nghiem nguoi dung, nhat la landing va dashboard, de san pham trinh bay thuyet phuc hon khi demo va thu nghiem user.

---

## Phan E - Gotcha questions

### G1. Neu bo AI di, project con gia tri khong?

**Cau tra loi nen nho**

> Co. AI la lop tang trai nghiem, nhung gia tri cot loi cua ScholarsGo nam o database hoc bong, profile management, application tracker va quy trinh quan ly apply. Neu bo AI, he thong van giai duoc mot bai toan thuc te. Dieu nay chung minh product khong song nho hype AI.

---

### G2. Team da do duoc accuracy cua recommendation/chat chua?

**Cau tra loi nen nho**

> Team chua co benchmark hoc thuat chinh thuc hay A/B test tren user that. O muc MVP, team danh gia bang scenario testing, spot-check ket qua va fallback behavior. Day la mot gioi han ma team xac dinh ro, va neu phat trien tiep thi can bo sung bo do formal hon.

---

## Phan F - Bang phan cong on tap

| Role | Can nam chac | Nen luyen tra loi |
|---|---|---|
| Frontend Dev | Router, auth store, RecommendPage, ChatPage, responsive, UI trade-offs | Q9-Q15 |
| Backend Dev | app.js, validators, application service, scholarship repo, auth, oauth, recommend, chat fallback | Q16-Q24 |
| PM / Full-stack | Product vision, scope, trade-offs, architecture, deployment, roadmap, collaboration | Q1-Q8, Q25-Q28 |

## Checklist truoc buoi hop

- Nho chinh xac route chinh cua frontend va backend
- Nho 6 bang chinh trong schema va quan he giua chung
- Nho state machine cua applications
- Nho recommendation hien tai la `hybrid`, khong claim full ML
- Nho chatbot co fallback chain va grounding DB
- Nho auth la `JWT httpOnly cookie`, frontend khong luu token
- Nho 3 diem yeu that su cua project de tra loi trung thuc

## Loi khuyen cuoi

- Khong co gang tra loi “nguy hiem” hon muc team da lam
- Khong nhan nhung tu nhay cam nhu “AI thong minh”, “accuracy 95%”, “production-ready” neu chua do
- Luon tra loi theo mau:

1. Team da lam gi
2. Tai sao chon cach do
3. Trade-off la gi
4. Huong cai thien tiep theo la gi

Neu giang vien hoi xoay sau hon, tra loi ngan, trung thuc, co logic se an diem hon viec co gang “noi cho ngau”.
