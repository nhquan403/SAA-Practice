---
title: "Phase 3: Review, kiểm thử toàn bộ, merge"
status: todo
---

# Phase 3: Review, kiểm thử toàn bộ, merge

## Overview

Đóng gói toàn bộ thay đổi của Phase 1+2 (6 file quiz) qua đúng quy trình đã
dùng cho mọi tính năng trước trong dự án này: code review độc lập, sửa phát
hiện thật (nếu có), kiểm thử lại toàn bộ, commit, push, merge `--no-ff` vào
`main`, build + test lại trên `main`, push `main`.

## Requirements

- [ ] Code review (subagent `code-reviewer`, có thể chạy song song theo
      từng file hoặc theo cặp) không còn phát hiện chặn nào.
- [ ] Toàn bộ Playwright (tính năng mới + hồi quy cũ) pass trên nhánh làm
      việc, sau đó pass lại trên `main` sau merge.
- [ ] Diff là additive tối đa có thể; nếu có sửa dòng cũ (ví dụ tách
      `gradeQuestion` khỏi `submitButtonListener`) thì phải là thay đổi có
      chủ đích, đã ghi rõ trong Phase 1, không phải hệ quả ngoài ý muốn.
- [ ] CRLF giữ nguyên trên cả 6 file.
- [ ] Merge vào `main` không có bất kỳ dòng khác biệt nào so với bản đã
      test (xác nhận bằng `git diff --stat` giữa `main` sau merge và nhánh
      nguồn phải rỗng).

## Implementation Steps

1. Spawn `code-reviewer` cho từng file (hoặc gộp cặp) với ngữ cảnh: đây là
   tính năng mới (không phải chỉnh sửa nội dung như các phase trước), tập
   trung vào (a) `gradeQuestion` chấm giống hệt logic cũ, không lệch kết quả
   giữa hai chế độ; (b) IndexedDB mở/ghi/đọc không có race condition khi
   người dùng bấm "Nộp bài thi" nhiều lần liên tiếp hoặc đóng tab giữa
   chừng; (c) `examMode`/`body.exam-mode` không rò rỉ ảnh hưởng sang các
   panel có sẵn (Kiến thức cần nhớ, Vì sao đáp án sai); (d) không có lỗi
   console thật; (e) `quizId` đúng theo từng file.
2. Áp toàn bộ phát hiện thật trong một đợt (không sửa file đang được review
   song song — làm việc khác trong lúc chờ, theo quy tắc đã thiết lập).
3. Build + chạy lại toàn bộ Playwright (tính năng mới trên 6 quiz + mọi bộ
   test hồi quy cũ: mã tham chiếu `Q<n>`, "Kiến thức cần nhớ" cả 6 quiz,
   "Vì sao đáp án sai" Quiz 1-2, `verify-prod.mjs`).
4. Screenshot chế độ thi thử (trước/sau khi nộp + bảng lịch sử) gửi người
   dùng.
5. Commit (một commit gộp cả 6 file, message theo chuẩn đã dùng), push
   nhánh `claude/dazzling-archimedes-d2igoj`.
6. Dry-run merge (`git merge-tree`) để chắc không xung đột với `main`, sau
   đó `git merge --no-ff` vào `main`.
7. Xác nhận `git diff --stat` giữa `main` sau merge và nhánh nguồn rỗng.
8. Build + chạy lại Playwright trên `main`, push `main`.
9. Dừng mọi server preview đã khởi động trong phase, xác nhận port trống.

## Todo

- [ ] Spawn code review cho 6 file.
- [ ] Áp phát hiện thật (nếu có), re-test.
- [ ] Chạy toàn bộ regression suite.
- [ ] Screenshot gửi người dùng.
- [ ] Commit + push nhánh.
- [ ] Dry-run merge, merge `--no-ff` vào `main`.
- [ ] Build + test lại trên `main`, push `main`.
- [ ] Dừng server, dọn file scratch tạm nếu có.
- [ ] Báo cáo hoàn thành: tóm tắt tính năng, kết quả review, bằng chứng
      test, hỏi người dùng có muốn thêm gì (ví dụ: xoá lịch sử, giới hạn
      thời gian làm bài, xuất lịch sử) hay dừng ở đây.

## Success Criteria

Tính năng thi thử + lịch sử IndexedDB chạy đúng trên cả 6 quiz ở `main`,
không regression, review sạch, mọi quy trình test/merge đã thiết lập trong
dự án được tuân thủ đầy đủ.
