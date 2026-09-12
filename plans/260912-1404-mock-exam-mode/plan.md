---
title: "Chế độ thi thử (Mock Exam Mode) + lịch sử vào IndexedDB"
description: "Thêm chế độ thi thử cho cả 6 quiz: trả lời hết 65 câu rồi mới nộp, xem điểm và các câu sai, lưu lịch sử mỗi lần thi vào IndexedDB kèm màn hình xem lại."
status: in-progress
priority: P1
effort: "~3 phases"
tags: [frontend, feature]
blockedBy: []
blocks: []
created: 2026-09-12
branch: claude/dazzling-archimedes-d2igoj
---

# Chế độ thi thử (Mock Exam Mode)

## Overview

Mỗi quiz (`public/quizzes/quiz-1.html` .. `quiz-6.html`) hiện chỉ có một chế
độ luyện tập: mỗi câu có nút "Submit Answer" riêng, nộp câu nào biết đúng/sai
câu đó ngay. Plan này thêm một **chế độ thứ hai** — "Thi thử" — mô phỏng thi
thật: chọn đáp án cho tất cả 65 câu, không thấy đúng/sai cho tới khi bấm một
nút "Nộp bài thi" duy nhất ở cuối. Sau khi nộp: hiển thị điểm tổng, số câu
đúng/sai, và danh sách các câu sai (bấm vào nhảy tới đúng câu đó, dùng chung
cơ chế mã tham chiếu `Q<n>` đã có). Mỗi lần thi thử được lưu vào IndexedDB
(điểm, thời gian, số câu đúng/sai, danh sách câu sai) và có một bảng "Lịch sử
thi thử" (ẩn/hiện, cùng kiểu UI với "Kiến thức cần nhớ") để xem lại các lần
thi trước của quiz đó.

Chế độ luyện tập hiện tại **giữ nguyên làm mặc định** — thi thử là một chế độ
bật thêm qua nút chuyển đổi ở đầu trang, không thay thế gì.

## Quyết định đã chốt với người dùng

- **Phạm vi**: áp dụng cho cả 6 quiz (không chỉ Quiz 1-3).
- **Cơ chế chuyển chế độ**: một nút toggle "Luyện tập ⇄ Thi thử" ở đầu trang
  quiz (gần khu vực điểm số hiện có), không tách thành 2 tab riêng.
- **Nộp bài thiếu câu**: vẫn cho nộp — câu chưa trả lời tính là sai, không
  chặn nút nộp.
- **Xem lại lịch sử**: có — thêm một bảng/danh sách lịch sử các lần thi thử
  (ngày giờ, điểm, số câu đúng/sai) cho mỗi quiz, không cần biểu đồ hay tổng
  hợp chéo giữa các quiz ở giai đoạn này.

## Ràng buộc kỹ thuật (từ bối cảnh dự án)

- Mỗi file `quiz-N.html` là một trang tĩnh độc lập, tự chứa toàn bộ CSS/JS
  trong chính nó (không có module dùng chung, không qua build step) — mọi
  thay đổi logic phải **lặp lại y hệt trên cả 6 file** (đã có tiền lệ: mã
  tham chiếu `Q<n>`, bảng "Kiến thức cần nhớ" đều làm theo cách này).
- Bắt buộc giữ line ending CRLF (`\r\n`) trong toàn bộ 6 file — quy tắc cứng
  của dự án, có tiền lệ lỗi thật đã xảy ra khi vi phạm.
- Mọi câu hỏi được xáo trộn thứ tự mỗi lần tải trang (`main()` shuffle
  `questionData` in-place) — danh sách "câu sai" sau khi nộp bài thi thử
  phải dùng mã tham chiếu `Q<n>` ổn định (`__refNum`, đã có sẵn từ tính năng
  trước) để liên kết đúng, không dùng số thứ tự hiển thị "Question N".
- `correct`/`incorrect` là hai `Set` toàn cục theo `questionId` (id gốc của
  câu hỏi, không phải `Q<n>`), được cập nhật bởi `submitButtonListener` hiện
  có — logic chấm điểm cho từng loại câu (radio/checkbox, so khớp
  `data-correct-answer(s)`) cần được **tái sử dụng**, không viết lại, để chế
  độ thi thử chấm giống hệt chế độ luyện tập.
- IndexedDB là per-origin: cả 6 trang `quiz-N.html` được phục vụ cùng origin
  (`/quizzes/quiz-N.html`), nên có thể dùng chung một database
  (`saa-practice-history`) với object store `attempts` đánh index theo
  `quizId` — không cần 6 database riêng.
- Không có test suite tự động trong repo (chỉ kiểm bằng tay + Playwright viết
  tạm trong phiên làm việc) — mỗi phase phải tự kiểm bằng Playwright trước
  khi coi là xong.

## Kiến trúc / luồng hoạt động

```
Chế độ Luyện tập (mặc định)          Chế độ Thi thử
─────────────────────────            ─────────────────────────
Mỗi câu có nút "Submit"       →      Không có nút submit từng câu
Nộp câu nào, biết đúng/sai câu đó    Chỉ chọn đáp án, không thấy đúng/sai
                                      Nút "Nộp bài thi" cố định cuối trang
                                              │
                                              ▼
                                      Chấm toàn bộ 65 câu cùng lúc
                                      (dùng lại logic chấm hiện có)
                                              │
                                              ▼
                                      Hiển thị: điểm %, đúng/sai, danh sách
                                      câu sai (link nhảy tới Q<n>)
                                              │
                                              ▼
                                      Lưu attempt vào IndexedDB
                                      (saa-practice-history / attempts)
                                              │
                                              ▼
                                      Cập nhật bảng "Lịch sử thi thử"
                                      (đọc lại từ IndexedDB, mới nhất trước)
```

Chuyển chế độ (bấm toggle) làm mới phiên làm bài hiện tại (xoá lựa chọn đã
chọn, reset điểm) — có xác nhận trước khi reset nếu người dùng đã chọn ít
nhất một câu, tránh mất bài đang làm dở do bấm nhầm.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Xây dựng lõi tính năng trên Quiz 1](./phase-01-exam-mode-core.md) | Pending |
| 2 | [Phase 2: Nhân bản sang Quiz 2-6](./phase-02-rollout-all-quizzes.md) | Pending |
| 3 | [Phase 3: Review, kiểm thử toàn bộ, merge](./phase-03-review-and-ship.md) | Pending |

## Success Criteria

- [ ] Mỗi quiz có nút chuyển "Luyện tập ⇄ Thi thử", mặc định là Luyện tập.
- [ ] Ở chế độ Thi thử: chọn được đáp án cho tất cả 65 câu mà không thấy
      đúng/sai; có một nút "Nộp bài thi" cố định; nộp được kể cả khi chưa trả
      lời hết (câu bỏ trống tính sai).
- [ ] Sau khi nộp: hiển thị điểm % và số câu đúng/sai giống hệt cách tính
      hiện có; hiển thị danh sách câu sai, mỗi câu bấm vào nhảy đúng tới câu
      đó trên trang (dùng mã `Q<n>` ổn định).
- [ ] Mỗi lần nộp bài thi thử được lưu vào IndexedDB
      (`saa-practice-history`), không mất khi tải lại trang.
- [ ] Có bảng "Lịch sử thi thử" (ẩn/hiện như các bảng khác) liệt kê các lần
      thi trước của quiz đó: ngày giờ, điểm, đúng/sai.
- [ ] Áp dụng đồng nhất cho cả 6 quiz; chế độ Luyện tập hiện tại không đổi
      hành vi.
- [ ] Giữ CRLF, không có lỗi console, không có regression ở các tính năng đã
      có (mã tham chiếu `Q<n>`, bảng "Kiến thức cần nhớ", bảng "Vì sao đáp án
      sai" ở Quiz 1-2).
- [ ] Code review sạch (không có phát hiện chặn) trước khi merge vào `main`.

<!-- slug: mock-exam-mode -->
