---
title: "Thêm khoá Claude Certified Developer - Foundations vào app ôn thi"
description: "Thêm khoá thứ hai (6 đề Claude Certified Developer - Foundations) với đúng cấu trúc và tính năng như khoá AWS SAA, chuyển khoá bằng một thanh chọn ở đầu app."
status: in-progress
priority: P1
effort: "~1 phase"
tags: [frontend, content, feature]
blockedBy: []
blocks: []
created: 2026-10-27
branch: feat/claude-dev-course
---

# Khoá Claude Certified Developer - Foundations

## Mục tiêu

Người dùng ôn được khoá Claude Certified Developer - Foundations trong cùng app,
với mọi tính năng đang có ở khoá SAA: 6 quiz, chế độ luyện tập/thi thử, lịch sử
thi thử lưu IndexedDB, mã tham chiếu `Q<n>`, nút cuộn xuống cuối, bảng "Kiến thức
cần nhớ", bảng "Vì sao các đáp án sai lại sai", và tab "📘 Tài liệu" tổng hợp chéo
6 quiz.

## Quyết định đã chốt với người dùng

- **Vị trí**: thư mục mới trong repo này (`public/claude-dev/`), dùng chung app,
  có thanh chuyển khoá AWS SAA ⇄ Claude Developer.
- **Nội dung**: đầy đủ như SAA, gồm cả phần tổng hợp viết bằng tiếng Việt.

## Thiết kế

- `public/claude-dev/quizzes/quiz-1..6.html`: sinh từ `public/quizzes/quiz-1.html`
  (làm khuôn mã) + dữ liệu câu hỏi của file upload + 2 panel nội dung riêng mỗi quiz.
  Mỗi đề có 53 câu, điểm đạt 72%.
- Lịch sử thi thử dùng DB riêng `claude-dev-practice-history` vì hai khoá cùng
  origin và cùng dải `QUIZ_ID` 1..6.
- `public/claude-dev/reference.html`: dùng CSS/JS của `public/reference.html`,
  nội dung tổng hợp từ 6 panel "Kiến thức cần nhớ" của khoá Claude.
- `src/App.jsx`: danh sách khoá `COURSES`, một danh sách tab phẳng cố định
  `ALL_TABS` để giữ nguyên bất biến iframe (key ổn định, thứ tự ổn định), nhớ tab
  cuối cùng của mỗi khoá.

## Ràng buộc

- Giữ CRLF trong các file quiz như khoá SAA.
- Không đụng tới nội dung và hành vi của khoá SAA.
- Mã `Q<n>` = thứ tự gốc trong dữ liệu (trước khi xáo trộn).

## Tiêu chí chấp nhận

- [ ] 6 trang quiz Claude mở được qua app, đủ 53 câu, chấm điểm và thi thử chạy đúng.
- [ ] Lịch sử thi thử Claude không lẫn với SAA.
- [ ] Mỗi quiz có panel kiến thức (mọi Q1..Q53 được trích dẫn) và panel phân tích
      câu sai (đủ 53 dòng).
- [ ] Tab Tài liệu của khoá Claude hiển thị, tìm kiếm và mục lục hoạt động.
- [ ] Chuyển khoá qua lại không làm mất bài đang làm ở quiz nào.
- [ ] `npm run build` thành công.
