(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.WordTrainerCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const USER_ID = "local-child";
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const CATEGORIES = [
    ["fruit", "果物"],
    ["vehicle", "乗り物"],
    ["color", "色"],
    ["animal", "動物"],
    ["food", "食べ物"],
    ["family", "家族"],
    ["school", "学校"],
    ["day_week", "曜日"],
    ["weather", "天気"],
    ["body", "体"],
    ["house", "家の中"],
    ["job", "職業"],
    ["feeling", "気持ち"],
    ["daily_life", "日常生活"]
  ].map(([id, name]) => ({ id, name }));

  const DEFAULT_SETTINGS = {
    userId: USER_ID,
    learningMode: "weekly",
    wordCount: 10,
    gradeLevel: 3,
    categoryMode: "random",
    selectedCategoryIds: ["fruit", "vehicle", "color"],
    passThresholdRate: 80,
    cooldownDays: 30,
    testFormat: "en_to_ja",
    randomize: true
  };

  const SEED_WORDS = [
    ["W0001", "apple", "りんご", 1, "fruit", "果物", "I like apples.", "私はりんごが好きです。"],
    ["W0002", "banana", "バナナ", 1, "fruit", "果物", "This banana is yellow.", "このバナナは黄色です。"],
    ["W0003", "orange", "オレンジ", 1, "fruit", "果物", "An orange is sweet.", "オレンジは甘いです。"],
    ["W0004", "red", "赤", 1, "color", "色", "The ball is red.", "ボールは赤いです。"],
    ["W0005", "blue", "青", 1, "color", "色", "The sky is blue.", "空は青いです。"],
    ["W0006", "green", "緑", 1, "color", "色", "The leaf is green.", "葉っぱは緑です。"],
    ["W0007", "dog", "犬", 1, "animal", "動物", "The dog runs.", "犬が走ります。"],
    ["W0008", "cat", "ねこ", 1, "animal", "動物", "The cat sleeps.", "ねこが眠ります。"],
    ["W0009", "hand", "手", 1, "body", "体", "I wash my hands.", "私は手を洗います。"],
    ["W0010", "room", "部屋", 1, "house", "家の中", "This room is bright.", "この部屋は明るいです。"],
    ["W0011", "car", "車", 2, "vehicle", "乗り物", "This is a car.", "これは車です。"],
    ["W0012", "bus", "バス", 2, "vehicle", "乗り物", "The bus is big.", "バスは大きいです。"],
    ["W0013", "train", "電車", 2, "vehicle", "乗り物", "I take a train.", "私は電車に乗ります。"],
    ["W0014", "mother", "母", 2, "family", "家族", "My mother is kind.", "私の母はやさしいです。"],
    ["W0015", "father", "父", 2, "family", "家族", "My father cooks.", "私の父は料理します。"],
    ["W0016", "school", "学校", 2, "school", "学校", "I go to school.", "私は学校へ行きます。"],
    ["W0017", "book", "本", 2, "school", "学校", "This book is fun.", "この本は楽しいです。"],
    ["W0020", "happy", "うれしい", 2, "feeling", "気持ち", "I am happy.", "私はうれしいです。"],
    ["W0021", "rice", "ごはん", 3, "food", "食べ物", "Rice is hot.", "ごはんは温かいです。"],
    ["W0022", "bread", "パン", 3, "food", "食べ物", "I eat bread.", "私はパンを食べます。"],
    ["W0023", "milk", "牛乳", 3, "food", "食べ物", "Milk is white.", "牛乳は白いです。"],
    ["W0024", "Monday", "月曜日", 3, "day_week", "曜日", "Monday is busy.", "月曜日は忙しいです。"],
    ["W0025", "Sunday", "日曜日", 3, "day_week", "曜日", "Sunday is fun.", "日曜日は楽しいです。"],
    ["W0026", "sunny", "晴れ", 3, "weather", "天気", "It is sunny.", "晴れています。"],
    ["W0027", "rainy", "雨の", 3, "weather", "天気", "It is rainy.", "雨が降っています。"],
    ["W0028", "bike", "自転車", 3, "vehicle", "乗り物", "I ride a bike.", "私は自転車に乗ります。"],
    ["W0029", "ship", "船", 3, "vehicle", "乗り物", "The ship is large.", "船は大きいです。"],
    ["W0030", "yellow", "黄色", 3, "color", "色", "The star is yellow.", "星は黄色です。"],
    ["W0031", "morning", "朝", 4, "daily_life", "日常生活", "Good morning.", "おはようございます。"],
    ["W0032", "night", "夜", 4, "daily_life", "日常生活", "It is night.", "夜です。"],
    ["W0035", "doctor", "医者", 4, "job", "職業", "The doctor helps people.", "医者は人を助けます。"],
    ["W0036", "teacher", "先生", 4, "job", "職業", "The teacher smiles.", "先生が笑います。"],
    ["W0037", "sad", "悲しい", 4, "feeling", "気持ち", "I feel sad.", "私は悲しいです。"],
    ["W0038", "angry", "怒った", 4, "feeling", "気持ち", "He is angry.", "彼は怒っています。"],
    ["W0039", "kitchen", "台所", 4, "house", "家の中", "The kitchen is clean.", "台所はきれいです。"],
    ["W0040", "bedroom", "寝室", 4, "house", "家の中", "My bedroom is small.", "私の寝室は小さいです。"],
    ["W0041", "friendly", "親しみやすい", 5, "daily_life", "日常生活", "She is friendly.", "彼女は親しみやすいです。"],
    ["W0042", "careful", "注意深い", 5, "daily_life", "日常生活", "Be careful.", "注意してください。"],
    ["W0043", "homework", "宿題", 5, "school", "学校", "I do homework.", "私は宿題をします。"],
    ["W0044", "question", "質問", 5, "school", "学校", "I have a question.", "質問があります。"],
    ["W0045", "shoulder", "肩", 5, "body", "体", "My shoulder hurts.", "肩が痛いです。"],
    ["W0046", "finger", "指", 5, "body", "体", "I point with my finger.", "私は指でさします。"],
    ["W0049", "strong", "強い", 5, "daily_life", "日常生活", "The wind is strong.", "風が強いです。"],
    ["W0050", "quiet", "静かな", 5, "daily_life", "日常生活", "This room is quiet.", "この部屋は静かです。"],
    ["W0051", "future", "未来", 6, "daily_life", "日常生活", "The future is bright.", "未来は明るいです。"],
    ["W0052", "practice", "練習する", 6, "school", "学校", "I practice English.", "私は英語を練習します。"],
    ["W0053", "important", "大切な", 6, "daily_life", "日常生活", "Family is important.", "家族は大切です。"],
    ["W0054", "different", "違う", 6, "daily_life", "日常生活", "We are different.", "私たちは違います。"],
    ["W0057", "engineer", "技術者", 6, "job", "職業", "An engineer makes things.", "技術者はものを作ります。"],
    ["W0058", "artist", "芸術家", 6, "job", "職業", "The artist paints.", "芸術家が絵を描きます。"],
  ].map(([wordId, english, japanese, gradeLevel, categoryId, categoryName, exampleEn, exampleJa]) => ({
    wordId,
    english,
    japanese,
    gradeLevel,
    categoryId,
    categoryName,
    exampleEn,
    exampleJa,
    difficulty: "easy",
    active: true,
    createdAt: "2026-06-01",
    updatedAt: "2026-06-01"
  }));

  function toDateOnly(date) {
    const value = date instanceof Date ? date : new Date(date);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, days) {
    const value = new Date(`${toDateOnly(date)}T00:00:00`);
    value.setDate(value.getDate() + days);
    return toDateOnly(value);
  }

  function weekMonday(date) {
    const value = new Date(`${toDateOnly(date)}T00:00:00`);
    const day = value.getDay() || 7;
    value.setDate(value.getDate() - day + 1);
    return toDateOnly(value);
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function getCategoryName(categoryId) {
    return CATEGORIES.find((category) => category.id === categoryId)?.name || categoryId;
  }

  function initialState() {
    return {
      settings: { ...DEFAULT_SETTINGS },
      words: [...SEED_WORDS],
      histories: {},
      learningSets: [],
      testResults: [],
      activityRecords: [],
      lastResult: null
    };
  }

  function historyFor(histories, wordId) {
    return histories[wordId] || {
      userId: USER_ID,
      wordId,
      status: "new",
      correctCount: 0,
      incorrectCount: 0
    };
  }

  function eligibleByGrade(words, settings) {
    return words.filter((word) => word.active && Number(word.gradeLevel) <= Number(settings.gradeLevel));
  }

  function resolveCategoryIds(words, settings, random = Math.random) {
    const gradeWords = eligibleByGrade(words, settings);
    const availableIds = [...new Set(gradeWords.map((word) => word.categoryId))];
    if (settings.categoryMode === "selected" && settings.selectedCategoryIds.length) {
      return settings.selectedCategoryIds;
    }
    if (!availableIds.length) return [];
    return [availableIds[Math.floor(random() * availableIds.length)]];
  }

  function isCoolingDown(history, today) {
    return Boolean(history.cooldownUntil && history.cooldownUntil >= today);
  }

  function rankWords(words, histories, today, random = Math.random) {
    const score = (word) => {
      const history = historyFor(histories, word.wordId);
      if (history.status === "new") return 0;
      if (history.status === "failed") return 1;
      if (history.status === "passed" && !isCoolingDown(history, today)) return 2;
      return 3;
    };
    const groups = new Map();
    for (const word of words) {
      const key = score(word);
      groups.set(key, [...(groups.get(key) || []), word]);
    }
    return [...groups.keys()]
      .sort((a, b) => a - b)
      .flatMap((key) => shuffle(groups.get(key), random));
  }

  function pickWords(words, histories, settings, today, random = Math.random) {
    const categoryIds = resolveCategoryIds(words, settings, random);
    const gradeWords = eligibleByGrade(words, settings);
    const available = gradeWords.filter((word) => !isCoolingDown(historyFor(histories, word.wordId), today));
    const selectedCategoryWords = available.filter((word) => categoryIds.includes(word.categoryId));
    const backupWords = available.filter((word) => !categoryIds.includes(word.categoryId));
    const rankedSelected = rankWords(selectedCategoryWords, histories, today, random);
    const rankedBackup = rankWords(backupWords, histories, today, random);
    const failedLimit = Math.ceil(settings.wordCount * 0.3);
    const failed = rankedSelected.filter((word) => historyFor(histories, word.wordId).status === "failed").slice(0, failedLimit);
    const notFailed = rankedSelected.filter((word) => !failed.includes(word));
    const combined = [...notFailed, ...failed, ...rankedBackup];
    const unique = [];
    for (const word of combined) {
      if (!unique.some((item) => item.wordId === word.wordId)) unique.push(word);
      if (unique.length >= settings.wordCount) break;
    }
    return { words: unique, categoryIds, hasEnoughWords: unique.length >= settings.wordCount };
  }

  function scheduleFor(settings, today) {
    if (settings.learningMode === "daily") {
      return {
        generatedAt: today,
        testAvailableFrom: addDays(today, 1),
        testAvailableUntil: undefined
      };
    }
    const monday = weekMonday(today);
    return {
      generatedAt: monday,
      testAvailableFrom: addDays(monday, 5),
      testAvailableUntil: addDays(monday, 6)
    };
  }

  function generateLearningSet(state, date = new Date(), random = Math.random) {
    const today = toDateOnly(date);
    const settings = state.settings;
    const pick = pickWords(state.words, state.histories, settings, today, random);
    if (!pick.hasEnoughWords) {
      return {
        ok: false,
        reason: "条件に合う単語が不足しています。カテゴリまたは学年設定を変更してください。",
        pickedWords: pick.words
      };
    }
    const schedule = scheduleFor(settings, today);
    const set = {
      setId: makeId("set"),
      userId: USER_ID,
      mode: settings.learningMode,
      wordIds: pick.words.map((word) => word.wordId),
      categoryIds: [...new Set(pick.words.map((word) => word.categoryId))],
      categories: [...new Set(pick.words.map((word) => word.categoryName))],
      generatedAt: schedule.generatedAt,
      testAvailableFrom: schedule.testAvailableFrom,
      testAvailableUntil: schedule.testAvailableUntil,
      status: "learning",
      passThresholdRate: settings.passThresholdRate
    };
    const histories = { ...state.histories };
    for (const word of pick.words) {
      const history = historyFor(histories, word.wordId);
      histories[word.wordId] = {
        ...history,
        status: history.status === "passed" ? history.status : "learning",
        firstSeenAt: history.firstSeenAt || today,
        lastSeenAt: today
      };
    }
    return {
      ok: true,
      state: {
        ...state,
        histories,
        learningSets: [set, ...state.learningSets]
      },
      set
    };
  }

  function activeSet(state) {
    return state.learningSets.find((set) => set.status === "learning" || set.status === "test_available");
  }

  function setIsTestable(set, date = new Date()) {
    if (!set) return false;
    const today = toDateOnly(date);
    if (today < set.testAvailableFrom) return false;
    if (set.testAvailableUntil && today > set.testAvailableUntil) return false;
    return set.status !== "completed";
  }

  function finishLearningSet(state, setId) {
    const set = state.learningSets.find((item) => item.setId === setId);
    if (!set) throw new Error("学習セットが見つかりません。");
    const histories = { ...state.histories };
    for (const wordId of set.wordIds) {
      const history = historyFor(histories, wordId);
      if (history.status === "learning") {
        histories[wordId] = {
          ...history,
          status: "new",
          cooldownUntil: undefined
        };
      }
    }
    return {
      ...state,
      histories,
      learningSets: state.learningSets.map((item) => (item.setId === setId ? { ...item, status: "completed" } : item))
    };
  }

  function finishActiveLearningSets(state) {
    return state.learningSets
      .filter((set) => set.status === "learning" || set.status === "test_available")
      .reduce((nextState, set) => finishLearningSet(nextState, set.setId), state);
  }

  function wordsForSet(state, set) {
    if (!set) return [];
    return set.wordIds.map((wordId) => state.words.find((word) => word.wordId === wordId)).filter(Boolean);
  }

  function questionTypeFor(settings, index) {
    if (settings.testFormat !== "mixed") return settings.testFormat;
    return index % 2 === 0 ? "en_to_ja" : "ja_to_en";
  }

  function createQuestions(state, set, random = Math.random) {
    const setWords = wordsForSet(state, set);
    const allWords = state.words.filter((word) => word.active);
    return setWords.map((word, index) => {
      const questionType = questionTypeFor(state.settings, index);
      const correctAnswer = questionType === "en_to_ja" ? word.japanese : word.english;
      const sameCategoryDistractors = allWords.filter((item) => item.wordId !== word.wordId && item.categoryId === word.categoryId);
      const distractors = uniqueAnswers(
        shuffle(sameCategoryDistractors, random).map((item) => (questionType === "en_to_ja" ? item.japanese : item.english))
      ).slice(0, 3);
      return {
        wordId: word.wordId,
        questionType,
        prompt: questionType === "en_to_ja" ? `${word.english} の意味はどれ？` : `「${word.japanese}」を英語で言うと？`,
        choices: shuffle([correctAnswer, ...distractors], random),
        correctAnswer
      };
    });
  }

  function uniqueAnswers(answers) {
    const seen = new Set();
    const unique = [];
    for (const answer of answers) {
      if (seen.has(answer)) continue;
      seen.add(answer);
      unique.push(answer);
    }
    return unique;
  }

  function submitTest(state, setId, submittedAnswers, date = new Date()) {
    const today = toDateOnly(date);
    const set = state.learningSets.find((item) => item.setId === setId);
    if (!set) throw new Error("学習セットが見つかりません。");
    const totalQuestions = submittedAnswers.length;
    const correctCount = submittedAnswers.filter((answer) => answer.isCorrect).length;
    const scoreRate = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scoreRate >= set.passThresholdRate;
    const histories = { ...state.histories };
    for (const answer of submittedAnswers) {
      const history = historyFor(histories, answer.wordId);
      if (answer.isCorrect) {
        histories[answer.wordId] = {
          ...history,
          status: "passed",
          lastTestedAt: today,
          lastResult: "correct",
          correctCount: history.correctCount + 1,
          passedAt: today,
          cooldownUntil: addDays(today, state.settings.cooldownDays - 1)
        };
      } else {
        histories[answer.wordId] = {
          ...history,
          status: "failed",
          lastTestedAt: today,
          lastResult: "incorrect",
          incorrectCount: history.incorrectCount + 1,
          cooldownUntil: undefined
        };
      }
    }
    const result = {
      testId: makeId("test"),
      setId,
      userId: USER_ID,
      testedAt: today,
      totalQuestions,
      correctCount,
      scoreRate,
      passed,
      answers: submittedAnswers
    };
    return {
      ...state,
      histories,
      learningSets: state.learningSets.map((item) => (item.setId === setId ? { ...item, status: "completed" } : item)),
      testResults: [result, ...state.testResults],
      activityRecords: [
        makeTestRecord(set, result, state),
        ...(state.activityRecords || [])
      ],
      lastResult: result
    };
  }

  function makeTestRecord(set, result, state) {
    const words = wordsForSet(state, set);
    return {
      recordId: makeId("record"),
      type: "test_completed",
      userId: set.userId,
      setId: set.setId,
      testId: result.testId,
      mode: set.mode,
      periodDate: set.generatedAt,
      recordedAt: result.testedAt,
      testedAt: result.testedAt,
      wordCount: result.totalQuestions,
      words: words.map((word) => ({
        wordId: word.wordId,
        english: word.english,
        japanese: word.japanese,
        gradeLevel: word.gradeLevel,
        categoryId: word.categoryId,
        categoryName: word.categoryName
      })),
      categoryIds: [...new Set(words.map((word) => word.categoryId))],
      categories: [...new Set(words.map((word) => word.categoryName))],
      testScore: {
        totalQuestions: result.totalQuestions,
        correctCount: result.correctCount,
        scoreRate: result.scoreRate,
        passed: result.passed,
        passThresholdRate: set.passThresholdRate
      }
    };
  }

  function normalizeImportedWord(row, now = toDateOnly(new Date())) {
    const wordId = String(row.word_id ?? row.wordId ?? "").trim();
    const english = String(row.english ?? "").trim();
    const japanese = String(row.japanese ?? "").trim();
    const gradeLevel = Number(row.grade_level ?? row.gradeLevel);
    const categoryId = String(row.category_id ?? row.categoryId ?? "").trim();
    const categoryName = String(row.category_name ?? row.categoryName ?? getCategoryName(categoryId)).trim();
    const rawActive = row.active;
    const activeText = String(rawActive).trim().toLowerCase();
    const active = typeof rawActive === "boolean" ? rawActive : activeText === "true" || activeText === "1" || activeText === "yes";
    return {
      wordId,
      english,
      japanese,
      gradeLevel,
      categoryId,
      categoryName,
      pronunciation: row.pronunciation || undefined,
      exampleEn: row.example_en || row.exampleEn || undefined,
      exampleJa: row.example_ja || row.exampleJa || undefined,
      imageUrl: row.image_url || row.imageUrl || undefined,
      audioUrl: row.audio_url || row.audioUrl || undefined,
      difficulty: row.difficulty || "easy",
      tags: Array.isArray(row.tags) ? row.tags : String(row.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      active,
      createdAt: row.created_at || row.createdAt || now,
      updatedAt: row.updated_at || row.updatedAt || now
    };
  }

  function validateImportedRows(rows, existingWords = []) {
    const errors = [];
    const normalized = [];
    const seenWordIds = new Set(existingWords.map((word) => word.wordId));
    const seenPairs = new Set(existingWords.map((word) => `${word.english.toLowerCase()}::${word.categoryId}`));
    rows.forEach((row, index) => {
      const line = index + 2;
      const word = normalizeImportedWord(row);
      const rowErrors = [];
      if (!word.wordId) rowErrors.push("word_id が空です。");
      if (!word.english) rowErrors.push("english が空です。");
      if (!/[A-Za-z]/.test(word.english)) rowErrors.push("english に英字が含まれていません。");
      if (!word.japanese) rowErrors.push("japanese が空です。");
      if (!Number.isInteger(word.gradeLevel) || word.gradeLevel < 1 || word.gradeLevel > 6) rowErrors.push("grade_level は 1〜6 の数字で入力してください。");
      if (!word.categoryId) rowErrors.push("category_id が空です。");
      const rawActive = row.active;
      const activeText = String(rawActive).trim().toLowerCase();
      if (rawActive === undefined || rawActive === null || rawActive === "") {
        rowErrors.push("active が空です。");
      } else if (!(typeof rawActive === "boolean" || ["true", "false", "1", "0", "yes", "no"].includes(activeText))) {
        rowErrors.push("active は true / false で入力してください。");
      }
      const pairKey = `${word.english.toLowerCase()}::${word.categoryId}`;
      if (seenWordIds.has(word.wordId)) rowErrors.push("word_id が重複しています。");
      if (seenPairs.has(pairKey)) rowErrors.push("english + category_id が重複しています。");
      if (rowErrors.length) {
        errors.push({ line, reasons: rowErrors });
      } else {
        normalized.push(word);
        seenWordIds.add(word.wordId);
        seenPairs.add(pairKey);
      }
    });
    return { validWords: normalized, errors };
  }

  return {
    USER_ID,
    CATEGORIES,
    DEFAULT_SETTINGS,
    SEED_WORDS,
    addDays,
    activeSet,
    createQuestions,
    finishActiveLearningSets,
    finishLearningSet,
    generateLearningSet,
    getCategoryName,
    initialState,
    normalizeImportedWord,
    setIsTestable,
    submitTest,
    toDateOnly,
    validateImportedRows,
    weekMonday,
    wordsForSet
  };
});
