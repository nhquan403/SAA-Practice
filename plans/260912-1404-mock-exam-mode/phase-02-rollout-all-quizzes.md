---
title: "Phase 2: Nhân bản sang Quiz 2-6"
status: todo
---

# Phase 2: Nhân bản sang Quiz 2-6

## Overview

Áp dụng y hệt phần đã xây và kiểm chứng ở Phase 1 (`quiz-1.html`) sang
`public/quizzes/quiz-2.html` .. `quiz-6.html`, theo đúng kỹ thuật vá cơ học
đã dùng cho mã tham chiếu `Q<n>` trước đây trong dự án này: viết một script
Python áp cùng một tập chuỗi tìm/thay thế (CSS, HTML, JS) lên cả 5 file, giữ
CRLF, rồi kiểm chứng từng file bằng Playwright.

Không tự do diễn giải lại UI/logic cho từng quiz — mục tiêu là **giống hệt
Phase 1**, chỉ khác đúng một chỗ: `quizId` trong `saveAttemptToHistory`/
`loadHistory` phải là số quiz thật của file đó (2, 3, 4, 5, 6).

## Requirements

- [x] Cả 5 file quiz-2..quiz-6 có đầy đủ: nút chuyển chế độ, chế độ Thi thử
      hoạt động đúng, bảng kết quả, lưu/đọc lịch sử đúng `quizId` của từng
      quiz, bảng "Lịch sử thi thử".
- [x] Vị trí chèn HTML/CSS/JS nhất quán với vị trí đã dùng ở quiz-1.html
      (đối chiếu qua `diff` giữa quiz-1 và từng file sau khi vá, phần mới
      phải khớp ngoại trừ `quizId`).
- [x] Giữ CRLF trên cả 5 file, không đụng tới quiz-1.html hay bất kỳ nội
      dung nào khác của quiz-2..6 (bảng "Kiến thức cần nhớ" đã có, mã tham
      chiếu `Q<n>` đã có, dữ liệu câu hỏi).

## Implementation Steps

1. Xác nhận anchor chèn (dòng `</style>`, vị trí `#score-stats-container`,
   `<section id="quiz-container">`, cuối `<body>` trước `<script>`, vị trí
   `</script>`) giống hệt giữa quiz-1.html (sau Phase 1) và quiz-2..6.html —
   dùng `grep -n` so dòng như đã làm với mã tham chiếu `Q<n>` trước đây.
   Nếu có sai khác do các tính năng trước (ví dụ quiz-1/2 có thêm
   `#wronganswers-summary` mà quiz-3..6 không có), script vá phải xử lý cả
   hai trường hợp anchor (chèn sau `#wronganswers-summary` nếu có, nếu không
   thì sau `#knowledge-summary`).
2. Viết script Python dùng kỹ thuật `io.open(path, 'r', encoding='utf-8', newline='')`
   + hàm `crlf()` (đã thiết lập sẵn trong phiên làm việc này) để chèn từng
   khối CSS/HTML/JS đã hoàn thiện ở Phase 1 vào cả 5 file, thay `quizId: 1`
   bằng số quiz tương ứng.
3. Sau khi vá: kiểm `git diff --stat` mỗi file (số dòng thêm phải tương ứng
   với Phase 1, không có dòng xoá ngoài những chỗ Phase 1 đã đổi ở
   `submitButtonListener`/`renderSingleQuestion`/`main()`), 0 bare LF, 0 id
   trùng lặp.
4. Build + chạy lại toàn bộ Playwright test của Phase 1 cho từng quiz 2-6
   (viết một bản test lặp qua mảng `[2,3,4,5,6]`, mirror cách đã làm với
   `q456test.mjs` cho tính năng trước).

## Todo

- [x] Viết/điều chỉnh script vá cơ học từ nội dung Phase 1.
- [x] Chạy vá cho quiz-2, quiz-3, quiz-4, quiz-5, quiz-6.
- [x] Kiểm `git diff --stat` + CRLF + duplicate-id cho cả 5 file.
- [x] Build lại, chạy Playwright cho cả 5 quiz: chọn 65 câu → nộp → điểm
      đúng → danh sách câu sai nhảy đúng chỗ → lịch sử lưu đúng `quizId` →
      tải lại thấy lịch sử còn → chế độ Luyện tập không đổi.
- [x] Chạy lại các bộ test hồi quy đã có từ trước (mã tham chiếu `Q<n>`,
      "Kiến thức cần nhớ", "Vì sao đáp án sai") để xác nhận không có
      regression trên cả 6 quiz.
- [x] Xác nhận `quizId` không bị lẫn giữa các quiz (thi thử ở Quiz 2 không
      hiện trong lịch sử của Quiz 3, ví dụ) — kiểm bằng cách nộp bài ở 2 quiz
      khác nhau rồi xem lịch sử riêng từng quiz.

## Success Criteria

Cả 6 quiz có hành vi thi thử + lịch sử giống hệt nhau (trừ nội dung
câu hỏi và `quizId`), toàn bộ Playwright pass, không regression ở tính năng
cũ. Chưa commit/merge ở phase này (gộp vào Phase 3).
