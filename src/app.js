const Core = window.WordTrainerCore;
const STORAGE_KEY = "kids-english-word-trainer-state-v1";

let state = loadState();
let studyIndex = 0;
let reviewWordIds = [];
let questions = [];
let questionIndex = 0;
let selectedChoice = "";
let submittedAnswers = [];

const views = ["home", "study", "test", "result", "records", "words"];
const el = {
  navButtons: document.querySelectorAll(".nav-button"),
  homeStatus: document.querySelector("#home-status"),
  homeMessage: document.querySelector("#home-message"),
  startStudyButton: document.querySelector("#start-study-button"),
  startTestButton: document.querySelector("#start-test-button"),
  studyStartButton: document.querySelector("#study-start-button"),
  showWordListButton: document.querySelector("#show-word-list-button"),
  studyCounter: document.querySelector("#study-counter"),
  wordCard: document.querySelector("#word-card"),
  nextWordButton: document.querySelector("#next-word-button"),
  finishStudyButton: document.querySelector("#finish-study-button"),
  studyWordList: document.querySelector("#study-word-list"),
  studyTestButton: document.querySelector("#study-test-button"),
  testCounter: document.querySelector("#test-counter"),
  testPanel: document.querySelector("#test-panel"),
  answerButton: document.querySelector("#answer-button"),
  nextQuestionButton: document.querySelector("#next-question-button"),
  resultPanel: document.querySelector("#result-panel"),
  reviewMistakesButton: document.querySelector("#review-mistakes-button"),
  nextLearningButton: document.querySelector("#next-learning-button"),
  homeSettingsForm: document.querySelector("#home-settings-form"),
  homeCategoryOptions: document.querySelector("#home-category-options"),
  wordListDialog: document.querySelector("#word-list-dialog"),
  wordListPanel: document.querySelector("#word-list-panel"),
  closeWordListButton: document.querySelector("#close-word-list-button"),
  importFile: document.querySelector("#import-file"),
  exportRecordsCsvButton: document.querySelector("#export-records-csv-button"),
  recordSummary: document.querySelector("#record-summary"),
  recordTableBody: document.querySelector("#record-table-body"),
  importMessage: document.querySelector("#import-message"),
  wordCountLabel: document.querySelector("#word-count-label"),
  wordForm: document.querySelector("#word-form"),
  wordTableBody: document.querySelector("#word-table-body")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.settings && saved?.words) {
      return { ...Core.initialState(), ...saved, activityRecords: saved.activityRecords || [] };
    }
  } catch (error) {
    console.warn(error);
  }
  return Core.initialState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function switchView(viewName) {
  views.forEach((view) => document.querySelector(`#${view}-view`).classList.toggle("active", view === viewName));
  el.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  render();
}

function currentSet() {
  return Core.activeSet(state);
}

function currentSetWords() {
  return Core.wordsForSet(state, currentSet());
}

function render() {
  renderHome();
  renderStudy();
  renderSettings();
  renderWords();
  renderRecords();
  renderResult();
}

function statusLabel(set) {
  if (!set) return "未生成";
  if (set.status === "completed") return "完了";
  if (Core.setIsTestable(set)) return "テスト可能";
  return "学習中";
}

function renderHome() {
  const set = currentSet();
  const words = currentSetWords();
  const modeLabel = state.settings.learningMode === "weekly" ? "毎週" : "毎日";
  const categoryLabel = state.settings.categoryMode === "random"
    ? "ランダム"
    : state.settings.selectedCategoryIds
      .map((categoryId) => Core.getCategoryName(categoryId))
      .join("、");
  el.homeStatus.innerHTML = [
    ["学習モード", modeLabel],
    ["学年", `小学${state.settings.gradeLevel}年生まで`],
    ["カテゴリ", categoryLabel || "未設定"],
    ["1回の単語数", `${state.settings.wordCount}語`],
    ["学習中の単語", `${words.length}語`],
    ["合格基準", `${state.settings.passThresholdRate}%`],
    ["登録単語数", `${state.words.length.toLocaleString()} / 10,000語`]
  ].map(([label, value]) => `<div class="status-item"><span>${label}</span><strong>${value}</strong></div>`).join("");
  el.startStudyButton.disabled = false;
  el.startTestButton.disabled = !Core.setIsTestable(set);
}

function renderStudy() {
  const set = currentSet();
  el.studyTestButton.disabled = !Core.setIsTestable(set);
  const words = reviewWordIds.length
    ? reviewWordIds.map((wordId) => state.words.find((word) => word.wordId === wordId)).filter(Boolean)
    : Core.wordsForSet(state, set);
  if (!words.length) {
    el.studyCounter.textContent = "";
    el.wordCard.innerHTML = `<p class="empty">学習する単語がありません。</p>`;
    el.studyWordList.innerHTML = `<p class="empty">単語がありません。</p>`;
    return;
  }
  const word = words[Math.min(studyIndex, words.length - 1)];
  el.studyCounter.textContent = `${Math.min(studyIndex + 1, words.length)} / ${words.length}`;
  el.wordCard.innerHTML = `
    <p class="word-category">小学${word.gradeLevel}年生・${word.categoryName}</p>
    <h3>${escapeHtml(word.english)}</h3>
    <p class="meaning">意味：${escapeHtml(word.japanese)}</p>
    ${word.exampleEn ? `<p class="example">例文：${escapeHtml(word.exampleEn)}</p>` : ""}
    ${word.exampleJa ? `<p class="example">日本語：${escapeHtml(word.exampleJa)}</p>` : ""}
  `;
  el.studyWordList.innerHTML = words.map((item, index) => `
    <button class="study-word-button ${index === studyIndex ? "active" : ""}" data-study-word-index="${index}" type="button">
      ${escapeHtml(item.english)}
    </button>
  `).join("");
}

function renderSettings() {
  syncSettingsForm(el.homeSettingsForm, el.homeCategoryOptions);
}

function syncSettingsForm(form, categoryOptions) {
  form.learningMode.value = state.settings.learningMode;
  form.wordCount.value = state.settings.wordCount;
  form.gradeLevel.value = state.settings.gradeLevel;
  form.categoryMode.value = state.settings.categoryMode;
  form.passThresholdRate.value = state.settings.passThresholdRate;
  form.cooldownDays.value = state.settings.cooldownDays;
  form.testFormat.value = state.settings.testFormat;
  const selectedCategoryId = state.settings.selectedCategoryIds[0] || Core.CATEGORIES[0].id;
  categoryOptions.innerHTML = Core.CATEGORIES.map((category) => `
    <label class="check-chip">
      <input type="radio" name="selectedCategoryId" value="${category.id}" ${selectedCategoryId === category.id ? "checked" : ""} />
      <span>${category.name}</span>
    </label>
  `).join("");
}

function renderWords() {
  const gradeSelect = el.wordForm.gradeLevel;
  const categorySelect = el.wordForm.categoryId;
  el.wordCountLabel.textContent = `登録単語数：${state.words.length.toLocaleString()} / 10,000語`;
  if (!gradeSelect.options.length) {
    gradeSelect.innerHTML = [1, 2, 3, 4, 5, 6].map((grade) => `<option value="${grade}">小学${grade}年生</option>`).join("");
    categorySelect.innerHTML = Core.CATEGORIES.map((category) => `<option value="${category.id}">${category.name}</option>`).join("");
  }
  el.wordTableBody.innerHTML = state.words
    .slice()
    .sort((a, b) => a.gradeLevel - b.gradeLevel || a.wordId.localeCompare(b.wordId))
    .map((word) => `
      <tr>
        <td>${escapeHtml(word.english)}</td>
        <td>${escapeHtml(word.japanese)}</td>
        <td>小${word.gradeLevel}</td>
        <td>${escapeHtml(word.categoryName)}</td>
        <td>${word.active ? "使用中" : "停止"}</td>
        <td><button class="text-button" data-delete-word="${word.wordId}">削除</button></td>
      </tr>
    `).join("");
}

function renderRecords() {
  const records = (state.activityRecords || []).filter((record) => record.type === "test_completed");
  const testRecords = records;
  const average = testRecords.length
    ? Math.round(testRecords.reduce((sum, record) => sum + (record.testScore?.scoreRate || 0), 0) / testRecords.length)
    : 0;
  el.recordSummary.innerHTML = [
    ["記録件数", `${records.length}件`],
    ["テスト回数", `${testRecords.length}回`],
    ["平均正答率", `${average}%`]
  ].map(([label, value]) => `<div class="status-item"><span>${label}</span><strong>${value}</strong></div>`).join("");
  el.recordTableBody.innerHTML = records.map((record) => {
    const score = record.testScore
      ? `${record.testScore.correctCount}/${record.testScore.totalQuestions} (${record.testScore.scoreRate}%)`
      : "-";
    const words = (record.words || []).map((word) => `${word.english}:${word.japanese}`).join(" / ");
    return `
      <tr>
        <td>${escapeHtml(record.recordedAt || "")}</td>
        <td>テスト</td>
        <td>${record.mode === "weekly" ? "毎週" : "毎日"}</td>
        <td>${record.wordCount || 0}</td>
        <td>${escapeHtml((record.categories || []).join("、"))}</td>
        <td>${escapeHtml(score)}</td>
        <td>${escapeHtml(words)}</td>
        <td><button class="text-button" data-delete-record="${record.recordId}">削除</button></td>
      </tr>
    `;
  }).join("");
}

function exportRecordsCsv() {
  const header = ["record_id", "date", "type", "mode", "word_count", "categories", "score", "passed", "words"];
  const rows = (state.activityRecords || []).filter((record) => record.type === "test_completed").map((record) => [
    record.recordId || "",
    record.recordedAt || "",
    record.type || "",
    record.mode || "",
    record.wordCount || 0,
    (record.categories || []).join("|"),
    record.testScore ? `${record.testScore.correctCount}/${record.testScore.totalQuestions} (${record.testScore.scoreRate}%)` : "",
    record.testScore ? String(record.testScore.passed) : "",
    (record.words || []).map((word) => `${word.english}:${word.japanese}`).join("|")
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText(`word-trainer-records-${Core.toDateOnly(new Date())}.csv`, `${csv}\n`, "text/csv;charset=utf-8");
}

function deleteRecord(recordId) {
  const record = (state.activityRecords || []).find((item) => item.recordId === recordId);
  state = {
    ...state,
    activityRecords: (state.activityRecords || []).filter((item) => item.recordId !== recordId),
    testResults: (state.testResults || []).filter((item) => item.testId !== record?.testId),
    lastResult: state.lastResult?.testId === record?.testId ? null : state.lastResult
  };
  saveState();
  renderRecords();
  renderResult();
}

function downloadText(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function renderResult() {
  const result = state.lastResult;
  if (!result) {
    el.resultPanel.innerHTML = `<p class="empty">まだテスト結果がありません。</p>`;
    el.reviewMistakesButton.disabled = true;
    return;
  }
  const correct = result.answers.filter((answer) => answer.isCorrect);
  const mistakes = result.answers.filter((answer) => !answer.isCorrect);
  el.reviewMistakesButton.disabled = mistakes.length === 0;
  el.resultPanel.innerHTML = `
    <div class="score-line ${result.passed ? "passed" : "failed"}">
      <strong>${result.passed ? "合格" : "不合格"}</strong>
      <span>正解数：${result.correctCount} / ${result.totalQuestions}</span>
      <span>正答率：${result.scoreRate}%</span>
    </div>
    <div class="answer-review">
      <h3>問題ごとの回答</h3>
      <div class="answer-list">
        ${answerReviewHtml(result.answers)}
      </div>
    </div>
    <div class="result-columns">
      <div>
        <h3>正解した単語</h3>
        ${wordListHtml(correct)}
      </div>
      <div>
        <h3>間違えた単語</h3>
        ${wordListHtml(mistakes)}
      </div>
    </div>
  `;
}

function answerReviewHtml(answers) {
  return answers.map((answer, index) => {
    const word = state.words.find((item) => item.wordId === answer.wordId);
    const questionText = answer.questionType === "en_to_ja"
      ? `${word?.english || answer.wordId} の意味`
      : `${word?.japanese || answer.wordId} を英語で`;
    return `
      <div class="answer-item ${answer.isCorrect ? "correct" : "incorrect"}">
        <div>
          <strong>問題 ${index + 1}: ${escapeHtml(questionText)}</strong>
          <p>あなたの答え：${escapeHtml(answer.userAnswer)}</p>
          <p>正解：${escapeHtml(answer.correctAnswer)}</p>
        </div>
        <span>${answer.isCorrect ? "正解" : "不正解"}</span>
      </div>
    `;
  }).join("");
}

function wordListHtml(answers) {
  if (!answers.length) return `<p class="empty">なし</p>`;
  return `<ul>${answers.map((answer) => {
    const word = state.words.find((item) => item.wordId === answer.wordId);
    return `<li>${escapeHtml(word?.english || answer.wordId)}：${escapeHtml(word?.japanese || answer.correctAnswer)}</li>`;
  }).join("")}</ul>`;
}

function showLearningWordList() {
  const words = currentSetWords();
  if (!words.length) {
    el.wordListPanel.innerHTML = `<p class="empty">現在の学習単語はありません。</p>`;
  } else {
    el.wordListPanel.innerHTML = `
      <div class="popup-word-grid">
        ${words.map((word) => `
          <div class="popup-word-item">
            <strong>${escapeHtml(word.english)}</strong>
            <span>${escapeHtml(word.japanese)}</span>
            <small>小学${word.gradeLevel}年生・${escapeHtml(word.categoryName)}</small>
          </div>
        `).join("")}
      </div>
    `;
  }
  if (typeof el.wordListDialog.showModal === "function") {
    el.wordListDialog.showModal();
  } else {
    el.wordListDialog.setAttribute("open", "");
  }
}

function prepareLearningSet() {
  const active = currentSet();
  if (active && active.status !== "completed") {
    el.homeMessage.textContent = "進行中の学習セットがあります。";
    return;
  }
  const result = Core.generateLearningSet(state, new Date());
  if (!result.ok) {
    el.homeMessage.textContent = result.reason;
    return;
  }
  state = result.state;
  saveState();
  studyIndex = 0;
  reviewWordIds = [];
  el.homeMessage.textContent = "新しい単語を用意しました。";
  switchView("study");
}

function startStudy() {
  if (!currentSet()) {
    const result = Core.generateLearningSet(state, new Date());
    if (!result.ok) {
      el.homeMessage.textContent = result.reason;
      switchView("home");
      return;
    }
    state = result.state;
    saveState();
  }
  studyIndex = 0;
  reviewWordIds = [];
  switchView("study");
}

function moveNextWord() {
  const count = reviewWordIds.length || currentSetWords().length;
  studyIndex = (studyIndex + 1) % Math.max(count, 1);
  renderStudy();
}

function selectStudyWord(index) {
  const count = reviewWordIds.length || currentSetWords().length;
  if (index < 0 || index >= count) return;
  studyIndex = index;
  renderStudy();
}

function finishStudy() {
  const set = currentSet();
  if (!set) {
    switchView("home");
    return;
  }
  state = Core.finishLearningSet(state, set.setId);
  saveState();
  studyIndex = 0;
  reviewWordIds = [];
  el.homeMessage.textContent = "学習を終了しました。次に始めると新しい単語を用意します。";
  switchView("home");
}

function startTest() {
  const set = currentSet();
  if (!Core.setIsTestable(set)) return;
  questions = Core.createQuestions(state, set);
  questionIndex = 0;
  selectedChoice = "";
  submittedAnswers = [];
  renderQuestion();
  switchView("test");
}

function renderQuestion() {
  const question = questions[questionIndex];
  if (!question) return;
  el.testCounter.textContent = `${questionIndex + 1} / ${questions.length}`;
  el.answerButton.disabled = false;
  el.nextQuestionButton.disabled = true;
  el.testPanel.innerHTML = `
    <p class="question">${escapeHtml(question.prompt)}</p>
    <div class="choice-grid">
      ${question.choices.map((choice) => `
        <label class="choice">
          <input type="radio" name="choice" value="${escapeHtml(choice)}" />
          <span>${escapeHtml(choice)}</span>
        </label>
      `).join("")}
    </div>
    <p id="answer-feedback" class="message"></p>
  `;
}

function answerQuestion() {
  const checked = document.querySelector("input[name='choice']:checked");
  if (!checked) {
    document.querySelector("#answer-feedback").textContent = "答えを選んでください。";
    return;
  }
  const question = questions[questionIndex];
  selectedChoice = checked.value;
  const isCorrect = selectedChoice === question.correctAnswer;
  submittedAnswers[questionIndex] = {
    wordId: question.wordId,
    questionType: question.questionType,
    userAnswer: selectedChoice,
    correctAnswer: question.correctAnswer,
    isCorrect
  };
  moveNextQuestion();
}

function moveNextQuestion() {
  if (questionIndex < questions.length - 1) {
    questionIndex += 1;
    selectedChoice = "";
    renderQuestion();
    return;
  }
  state = Core.submitTest(state, currentSet().setId, submittedAnswers, new Date());
  saveState();
  switchView("result");
}

function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const selectedCategory = el.homeCategoryOptions.querySelector("input:checked");
  const selectedCategoryIds = selectedCategory ? [selectedCategory.value] : [];
  const nextSettings = {
    ...state.settings,
    learningMode: form.learningMode.value,
    wordCount: Number(form.wordCount.value),
    gradeLevel: Number(form.gradeLevel.value),
    categoryMode: form.categoryMode.value,
    selectedCategoryIds,
    passThresholdRate: Number(form.passThresholdRate.value),
    cooldownDays: Number(form.cooldownDays.value),
    testFormat: form.testFormat.value
  };
  const settingsChanged = JSON.stringify(state.settings) !== JSON.stringify(nextSettings);
  state = { ...state, settings: nextSettings };
  if (settingsChanged) {
    state = Core.finishActiveLearningSets(state);
    studyIndex = 0;
    reviewWordIds = [];
  }
  saveState();
  el.homeMessage.textContent = settingsChanged
    ? "設定を保存しました。次に始めると新しい設定で単語を用意します。"
    : "設定を保存しました。";
  render();
}

function resetProgress() {
  state = {
    ...state,
    histories: {},
    learningSets: [],
    testResults: [],
    lastResult: null
  };
  saveState();
  render();
}

async function importWords(event) {
  const file = event.target.files[0];
  if (!file) return;
  const rows = await readImportFile(file);
  if (rows.length > 10000) {
    el.importMessage.textContent = "登録可能な単語数は10,000語までです。ファイルの行数を減らしてください。";
    event.target.value = "";
    return;
  }
  const { validWords, errors } = Core.validateImportedRows(rows, []);
  if (errors.length) {
    el.importMessage.innerHTML = `インポートできない行があります。<br>${errors.slice(0, 5).map((error) => `${error.line}行目：${error.reasons.join(" ")}`).join("<br>")}`;
    return;
  }
  state = {
    ...state,
    words: validWords,
    histories: {},
    learningSets: [],
    testResults: [],
    activityRecords: [],
    lastResult: null
  };
  saveState();
  el.importMessage.textContent = `${validWords.length}語をインポートしました。既存の単語データは差し替えられました。`;
  event.target.value = "";
  render();
  renderWords();
}

function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    if (file.name.toLowerCase().endsWith(".json")) {
      reader.onload = () => resolve(JSON.parse(reader.result));
      reader.readAsText(file);
      return;
    }
    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.onload = () => resolve(parseCsv(reader.result));
      reader.readAsText(file);
      return;
    }
    reader.onload = () => {
      if (!window.XLSX) {
        reject(new Error("Excelインポートライブラリを読み込めませんでした。"));
        return;
      }
      const workbook = XLSX.read(reader.result, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      resolve(XLSX.utils.sheet_to_json(firstSheet, { defval: "" }));
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  const headers = rows.shift()?.map((value) => value.trim()) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function addWord(event) {
  event.preventDefault();
  if (state.words.length >= 10000) {
    el.importMessage.textContent = "登録可能な単語数は10,000語までです。";
    return;
  }
  const category = Core.CATEGORIES.find((item) => item.id === el.wordForm.categoryId.value);
  const nextNumber = state.words.length + 1;
  const word = Core.normalizeImportedWord({
    word_id: `U${String(nextNumber).padStart(4, "0")}`,
    english: el.wordForm.english.value,
    japanese: el.wordForm.japanese.value,
    grade_level: Number(el.wordForm.gradeLevel.value),
    category_id: category.id,
    category_name: category.name,
    active: true
  });
  const validation = Core.validateImportedRows([{
    word_id: word.wordId,
    english: word.english,
    japanese: word.japanese,
    grade_level: word.gradeLevel,
    category_id: word.categoryId,
    category_name: word.categoryName,
    active: word.active
  }], state.words);
  if (validation.errors.length) {
    el.importMessage.textContent = validation.errors[0].reasons.join(" ");
    return;
  }
  state = { ...state, words: [...state.words, word] };
  saveState();
  el.wordForm.reset();
  renderWords();
}

function deleteWord(wordId) {
  state = { ...state, words: state.words.filter((word) => word.wordId !== wordId) };
  saveState();
  renderWords();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

el.navButtons.forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
el.startStudyButton.addEventListener("click", startStudy);
el.startTestButton.addEventListener("click", startTest);
el.studyStartButton.addEventListener("click", startStudy);
el.showWordListButton.addEventListener("click", showLearningWordList);
el.closeWordListButton.addEventListener("click", () => el.wordListDialog.close());
el.nextWordButton.addEventListener("click", moveNextWord);
el.finishStudyButton.addEventListener("click", finishStudy);
el.studyWordList.addEventListener("click", (event) => {
  const index = Number(event.target.dataset.studyWordIndex);
  if (Number.isInteger(index)) selectStudyWord(index);
});
el.studyTestButton.addEventListener("click", startTest);
el.answerButton.addEventListener("click", answerQuestion);
el.nextQuestionButton.addEventListener("click", moveNextQuestion);
el.homeSettingsForm.addEventListener("submit", saveSettings);
el.homeCategoryOptions.addEventListener("change", (event) => {
  if (event.target.name === "selectedCategoryId") {
    el.homeSettingsForm.categoryMode.value = "selected";
  }
});
el.importFile.addEventListener("change", (event) => importWords(event).catch((error) => {
  el.importMessage.textContent = error.message;
}));
el.exportRecordsCsvButton.addEventListener("click", exportRecordsCsv);
el.wordForm.addEventListener("submit", addWord);
el.wordTableBody.addEventListener("click", (event) => {
  const wordId = event.target.dataset.deleteWord;
  if (wordId) deleteWord(wordId);
});
el.recordTableBody.addEventListener("click", (event) => {
  const recordId = event.target.dataset.deleteRecord;
  if (recordId) deleteRecord(recordId);
});
el.reviewMistakesButton.addEventListener("click", () => {
  reviewWordIds = state.lastResult.answers.filter((answer) => !answer.isCorrect).map((answer) => answer.wordId);
  studyIndex = 0;
  switchView("study");
});
el.nextLearningButton.addEventListener("click", () => {
  prepareLearningSet();
});

render();
