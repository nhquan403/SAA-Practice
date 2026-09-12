---
title: "Phase 1: Xây dựng lõi tính năng trên Quiz 1"
status: todo
---

# Phase 1: Xây dựng lõi tính năng trên Quiz 1

## Overview

Xây và kiểm chứng đầy đủ toàn bộ tính năng thi thử + lưu lịch sử IndexedDB
trên **một file duy nhất** (`public/quizzes/quiz-1.html`) trước, dùng làm bản
tham chiếu (template) để nhân bản sang 5 quiz còn lại ở Phase 2. Không đụng
tới quiz-2..6 trong phase này.

Quiz 1 hiện đã có: bảng "Kiến thức cần nhớ" (`#knowledge-summary`), bảng "Vì
sao đáp án sai" (`#wronganswers-summary`), và mã tham chiếu `Q<n>` trên mỗi
câu hỏi (`__refNum` gán trước khi shuffle, badge `.question-refcode`). Phase
này không sửa các phần đó, chỉ thêm mới.

## Requirements

- [x] Nút chuyển chế độ "Luyện tập ⇄ Thi thử", mặc định Luyện tập.
- [x] Ở chế độ Thi thử: ẩn nút submit từng câu, cho chọn đáp án tự do, có nút
      "Nộp bài thi" cố định (sticky) luôn bật.
- [x] Nộp bài chấm toàn bộ 65 câu cùng lúc bằng logic chấm đã có (không viết
      lại), kể cả câu chưa chọn đáp án (tính sai).
- [x] Sau khi nộp: hiện bảng kết quả (điểm %, đúng/sai) + danh sách câu sai
      dạng link nhảy tới đúng câu (theo `Q<n>` ổn định).
- [x] Lưu attempt vào IndexedDB (`saa-practice-history` / store `attempts`),
      đọc lại được sau khi tải lại trang.
- [x] Bảng "Lịch sử thi thử" ẩn/hiện (giống UI `#knowledge-summary`), liệt kê
      các lần thi trước của Quiz 1, mới nhất trước.
- [x] Chuyển chế độ khi đang có lựa chọn dở dang → xác nhận trước khi reset.
- [x] Giữ nguyên CRLF, không có lỗi console, chế độ Luyện tập cũ không đổi.

## Implementation Steps

### 1. Refactor logic chấm điểm thành hàm dùng chung

File: `public/quizzes/quiz-1.html`, quanh `submitButtonListener` (hiện ở
dòng ~2238-2310).

Tách phần "so khớp đáp án + trả về đúng/sai" ra một hàm thuần
`gradeQuestion(form)` không phụ thuộc DOM event, ví dụ:

```js
function gradeQuestion(form) {
    const isMulti = form.dataset.isMulti === 'true';
    const questionId = form.dataset.questionId;
    let isCorrect;
    if (isMulti) {
        const correctAnswersSet = new Set(form.dataset.correctAnswers.split(','));
        const userAnswers = new Set(
            Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value)
        );
        isCorrect = correctAnswersSet.size === userAnswers.size &&
            [...correctAnswersSet].every(v => userAnswers.has(v));
    } else {
        const selected = form.querySelector('input[type="radio"]:checked');
        isCorrect = !!selected && selected.value === form.dataset.correctAnswer;
    }
    if (isCorrect) { correct.add(questionId); incorrect.delete(questionId); }
    else { incorrect.add(questionId); correct.delete(questionId); }
    return isCorrect;
}
```

`submitButtonListener` (chế độ Luyện tập) gọi `gradeQuestion(form)` rồi giữ
nguyên phần highlight/`updateScore()` như hiện tại — **không đổi hành vi chế
độ Luyện tập**. Xác nhận bằng cách so `git diff` chỉ thấy phần logic so khớp
được rút ra, không đổi kết quả chấm.

### 2. Thêm nút chuyển chế độ + trạng thái `examMode`

Vị trí HTML: ngay sau `<section id="score-stats-container">` (đóng ở dòng
~986) và trước `<section id="quiz-container">` (dòng 988) — sibling section
mới `#mode-toggle-container` với hai nút hoặc một switch, ví dụ:

```html
<section id="mode-toggle-container">
    <button type="button" id="mode-practice-btn" class="mode-btn mode-btn-active" aria-pressed="true">📝 Luyện tập</button>
    <button type="button" id="mode-exam-btn" class="mode-btn" aria-pressed="false">⏱️ Thi thử</button>
</section>
```

JS: biến toàn cục `let examMode = false;`. Bấm nút đổi chế độ:
- Nếu đang có ít nhất 1 đáp án đã chọn (`document.querySelector('input:checked')`),
  `confirm("Chuyển chế độ sẽ làm mới bài làm hiện tại. Tiếp tục?")` trước khi
  đổi.
- Khi đổi: set `examMode`, thêm/bỏ class `exam-mode` trên `<body>` (dùng CSS
  để ẩn nút submit từng câu và ẩn/hiện nút "Nộp bài thi" — xem bước 3), reset
  toàn bộ input về unchecked, xoá class `correct-answer`/`incorrect-answer`,
  xoá `correct`/`incorrect` Set, gọi lại `updateScore()`, ẩn bảng kết quả nếu
  đang hiện.

### 3. Ẩn nộp từng câu + nút "Nộp bài thi" cố định

CSS (thêm trước `</style>`):
```css
body.exam-mode .single-question-container button[type="submit"] { display: none; }
#exam-submit-bar { position: fixed; bottom: 0; left: 0; right: 0; ... ; display: none; }
body.exam-mode #exam-submit-bar { display: flex; }
```

HTML: `#exam-submit-bar` chứa nút "Nộp bài thi" + đếm số câu đã chọn
("42/65 câu đã chọn"), đặt cuối `<body>` (trước `<script>`) để không phụ
thuộc scroll của `main`.

JS guard: đầu `submitButtonListener`, thêm `if (examMode) { e.preventDefault(); return; }`
để phòng trường hợp form vẫn bị submit bằng Enter dù nút đã ẩn.

### 4. Chấm toàn bộ khi bấm "Nộp bài thi"

```js
function submitExam() {
    document.querySelectorAll('.single-question-container').forEach(form => {
        gradeQuestion(form);
        // highlight giống submitButtonListener nhưng áp cho mọi form
    });
    updateScore();
    const wrongRefNums = [...incorrect].map(qid => refNumByQuestionId[qid]).sort((a,b)=>a-b);
    renderExamResults(correct.size, incorrect.size, wrongRefNums);
    saveAttemptToHistory({ correctCount: correct.size, wrongCount: incorrect.size, wrongRefNums });
}
```

Cần một map `questionId -> refNum` (đã có sẵn `__refNum` gắn lúc shuffle —
dựng map này trong `main()` cùng lúc tag `__refNum`, ví dụ
`refNumByQuestionId[q.id] = q.__refNum`).

`renderExamResults(...)` hiện một `<section id="exam-results">` (ẩn mặc định,
hiện sau khi nộp): điểm %, đúng/sai, và với mỗi refNum trong `wrongRefNums`
một link `<a href="#q-refnum-${n}">Q${n}</a>` — cần gắn `id="q-refnum-${refNum}"`
lên mỗi `.single-question-container` lúc render (`renderSingleQuestion`) để
link nhảy tới đúng câu.

### 5. IndexedDB: lưu và đọc lịch sử

Thêm một helper nhỏ, thuần JS (không cần thư viện), trước IIFE toggle hiện
có:

```js
const HISTORY_DB = 'saa-practice-history', HISTORY_STORE = 'attempts';
function openHistoryDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(HISTORY_DB, 1);
        req.onupgradeneeded = () => {
            const store = req.result.createObjectStore(HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
            store.createIndex('by_quiz', 'quizId');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function saveAttemptToHistory({ correctCount, wrongCount, wrongRefNums }) {
    const db = await openHistoryDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).add({
        quizId: 1, timestamp: Date.now(), correctCount, wrongCount,
        totalQuestions: totalNumberOfQuestions, wrongRefNums,
    });
    return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function loadHistory() {
    const db = await openHistoryDb();
    return new Promise((resolve, reject) => {
        const idx = db.transaction(HISTORY_STORE, 'readonly').objectStore(HISTORY_STORE).index('by_quiz');
        const req = idx.getAll(IDBKeyRange.only(1));
        req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
        req.onerror = () => reject(req.error);
    });
}
```

`quizId: 1` cố định trong file này (Quiz 1) — ở Phase 2, mỗi file dùng đúng
số quiz của chính nó khi nhân bản.

### 6. Bảng "Lịch sử thi thử"

HTML: `<section id="exam-history-summary">` theo đúng khuôn mẫu
`#knowledge-summary` / `#wronganswers-summary` đã có (button toggle +
`aria-expanded="false"` + content `hidden` mặc định) — đặt làm sibling cuối
cùng, sau `#wronganswers-summary` (hoặc sau `#knowledge-summary` nếu quiz đó
chưa có wronganswers) và trước `<footer>`.

Nội dung: bảng `Ngày giờ | Điểm | Đúng | Sai`, render từ `loadHistory()` mỗi
khi mở panel lần đầu và mỗi khi có attempt mới được lưu. Không cần xoá/sửa
lịch sử ở phase này (YAGNI — chỉ xem).

## Todo

- [x] Rút `gradeQuestion(form)` từ `submitButtonListener`, xác nhận chế độ
      Luyện tập chấm giống hệt như trước (so kết quả trước/sau refactor).
- [x] Thêm `#mode-toggle-container` + CSS `.mode-btn`/`.mode-btn-active` +
      JS chuyển `examMode`, có `confirm()` khi có lựa chọn dở dang.
- [x] Thêm `body.exam-mode` CSS ẩn nút submit từng câu, hiện `#exam-submit-bar`.
- [x] Thêm guard `if (examMode) return` đầu `submitButtonListener`.
- [x] Dựng `refNumByQuestionId` map trong `main()`.
- [x] Viết `submitExam()` + `renderExamResults()`, gắn `id="q-refnum-${n}"`
      lên mỗi question container.
- [x] Viết `openHistoryDb`/`saveAttemptToHistory`/`loadHistory` (IndexedDB).
- [x] Thêm `#exam-history-summary` (toggle ẩn/hiện + bảng lịch sử).
- [x] Build + chạy Playwright: chọn 65 câu ở chế độ thi thử, nộp bài, kiểm
      tra điểm/đúng/sai đúng, danh sách câu sai nhảy đúng chỗ, tải lại trang
      thấy lịch sử vẫn còn (attempt đã lưu), chuyển lại Luyện tập vẫn hoạt
      động như cũ, Quiz 2-6 và các bảng có sẵn (Kiến thức cần nhớ, Vì sao
      đáp án sai) không bị ảnh hưởng, 0 lỗi console.
- [x] Screenshot gửi người dùng xác nhận UI trước khi sang Phase 2.

## Success Criteria

Toàn bộ mục ở "Requirements" đạt trên `quiz-1.html`, có bằng chứng Playwright
(điểm/đúng/sai khớp, lịch sử tồn tại sau reload, không regression ở tính năng
cũ, 0 lỗi console thật sự — không tính nhiễu mạng font Google đã biết trước).
Không commit/merge ở phase này — Phase 1 kết thúc khi đã demo được cho người
dùng (screenshot) và tự kiểm xong; commit thực hiện gộp cùng Phase 3 sau khi
nhân bản đủ 6 quiz, theo đúng quy trình đã dùng cho các tính năng trước trong
dự án này (branch → implement → test → review → commit → merge một lần).
