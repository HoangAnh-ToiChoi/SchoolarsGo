-- ============================================================
-- SCHOLARSGO — 016: nguồn của bậc học (R20)
-- ============================================================
-- Gợi ý chỉ loại học bổng sai bậc khi bậc đủ tin: 'category' (chuyên mục nguồn), 'title' (tiêu đề), 'admin'.
-- 'body' (đoán từ thân bài), 'ai' và NULL (không rõ) chỉ trừ điểm. Chạy lại nhiều lần không lỗi.

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS degree_source VARCHAR(10);

-- Dòng nhập tay (không có link bài kéo về) là do người xác nhận
UPDATE scholarships SET degree_source = 'admin'
 WHERE degree_source IS NULL AND degree <> 'Any' AND source_url IS NULL;

-- Dòng kéo về trước migration này: tiêu đề nêu đúng bậc đang lưu và không nêu bậc khác thì tính là 'title'
WITH titles AS (
  SELECT id, degree,
         title ~* '\m(bachelor''?s?|undergraduate|undergrad|bsc)\M' AS bachelor,
         title ~* '\m(master''?s?|msc|mba|postgraduate)\M'          AS master,
         title ~* '\m(ph\.?d|doctoral|doctorate|dphil)\M'           AS phd
    FROM scholarships
   WHERE degree_source IS NULL AND degree <> 'Any'
)
UPDATE scholarships AS s SET degree_source = 'title'
  FROM titles AS t
 WHERE s.id = t.id
   AND t.bachelor = (t.degree = 'Bachelor')
   AND t.master = (t.degree = 'Master')
   AND t.phd = (t.degree = 'PhD');
