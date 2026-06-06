const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../src/core.js");

test("weekly learning set uses Monday generation and weekend test window", () => {
  const state = Core.initialState();
  const result = Core.generateLearningSet(state, new Date("2026-06-06T09:00:00"));

  assert.equal(result.ok, true);
  assert.equal(result.set.mode, "weekly");
  assert.equal(result.set.generatedAt, "2026-06-01");
  assert.equal(result.set.testAvailableFrom, "2026-06-06");
  assert.equal(result.set.testAvailableUntil, "2026-06-07");
  assert.equal(result.set.wordIds.length, 10);
});

test("daily learning set makes the test available the next day", () => {
  const state = Core.initialState();
  state.settings.learningMode = "daily";
  state.settings.wordCount = 5;
  const result = Core.generateLearningSet(state, new Date("2026-06-01T09:00:00"));

  assert.equal(result.ok, true);
  assert.equal(result.set.generatedAt, "2026-06-01");
  assert.equal(result.set.testAvailableFrom, "2026-06-02");
  assert.equal(result.set.testAvailableUntil, undefined);
});

test("correct words enter cooldown and incorrect words become failed", () => {
  let state = Core.initialState();
  state.settings.wordCount = 2;
  const generated = Core.generateLearningSet(state, new Date("2026-06-06T09:00:00"));
  state = generated.state;
  const [firstWordId, secondWordId] = generated.set.wordIds;

  state = Core.submitTest(state, generated.set.setId, [
    {
      wordId: firstWordId,
      questionType: "en_to_ja",
      userAnswer: "ok",
      correctAnswer: "ok",
      isCorrect: true
    },
    {
      wordId: secondWordId,
      questionType: "en_to_ja",
      userAnswer: "bad",
      correctAnswer: "ok",
      isCorrect: false
    }
  ], new Date("2026-06-06T10:00:00"));

  assert.equal(state.histories[firstWordId].status, "passed");
  assert.equal(state.histories[firstWordId].cooldownUntil, "2026-07-05");
  assert.equal(state.histories[secondWordId].status, "failed");
  assert.equal(state.histories[secondWordId].cooldownUntil, undefined);
  assert.equal(state.lastResult.scoreRate, 50);
  assert.equal(state.lastResult.passed, false);
  assert.equal(state.activityRecords[0].type, "test_completed");
  assert.equal(state.activityRecords[0].testScore.scoreRate, 50);
  assert.equal(state.activityRecords.length, 1);
  assert.equal(state.activityRecords[0].wordCount, 2);
  assert.ok(state.activityRecords[0].categories.length >= 1);
});

test("cooldown words are excluded from the next generation", () => {
  let state = Core.initialState();
  state.settings.wordCount = 2;
  state.settings.categoryMode = "selected";
  state.settings.selectedCategoryIds = ["fruit"];
  const generated = Core.generateLearningSet(state, new Date("2026-06-01T09:00:00"));
  state = generated.state;
  const passedWordId = generated.set.wordIds[0];

  state.histories[passedWordId] = {
    ...state.histories[passedWordId],
    status: "passed",
    cooldownUntil: "2026-07-01"
  };
  state.learningSets = [];

  const next = Core.generateLearningSet(state, new Date("2026-06-02T09:00:00"));
  assert.equal(next.ok, true);
  assert.equal(next.set.wordIds.includes(passedWordId), false);
});

test("learning set stays active until test submission or explicit finish", () => {
  let state = Core.initialState();
  state.settings.wordCount = 2;
  const generated = Core.generateLearningSet(state, new Date("2026-06-06T09:00:00"));
  state = generated.state;

  assert.equal(Core.activeSet(state).setId, generated.set.setId);

  state = Core.finishLearningSet(state, generated.set.setId);

  assert.equal(Core.activeSet(state), undefined);
  assert.equal(state.learningSets[0].status, "completed");
  assert.equal(state.testResults.length, 0);
  assert.equal(state.activityRecords.length, 0);
  assert.ok(generated.set.wordIds.every((wordId) => state.histories[wordId].status === "new"));
});

test("finishing active learning sets clears the active set without test records", () => {
  let state = Core.initialState();
  state.settings.wordCount = 2;
  const generated = Core.generateLearningSet(state, new Date("2026-06-06T09:00:00"));
  state = Core.finishActiveLearningSets(generated.state);

  assert.equal(Core.activeSet(state), undefined);
  assert.equal(state.learningSets[0].status, "completed");
  assert.equal(state.testResults.length, 0);
  assert.equal(state.activityRecords.length, 0);
});

test("import validation reports required field and duplicate errors", () => {
  const rows = [
    {
      word_id: "W0001",
      english: "apple",
      japanese: "りんご",
      grade_level: 1,
      category_id: "fruit",
      category_name: "果物",
      active: true
    },
    {
      word_id: "",
      english: "",
      japanese: "",
      grade_level: 9,
      category_id: "",
      active: true
    }
  ];

  const result = Core.validateImportedRows(rows, Core.SEED_WORDS);
  assert.equal(result.validWords.length, 0);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0].reasons.join(" "), /重複/);
  assert.match(result.errors[1].reasons.join(" "), /word_id/);
  assert.match(result.errors[1].reasons.join(" "), /grade_level/);
});

test("test choices prefer words from the same category", () => {
  const state = Core.initialState();
  state.settings.testFormat = "en_to_ja";
  const set = {
    setId: "set-test",
    userId: Core.USER_ID,
    mode: "weekly",
    wordIds: ["W0001"],
    generatedAt: "2026-06-01",
    testAvailableFrom: "2026-06-06",
    status: "learning",
    passThresholdRate: 80
  };

  const questions = Core.createQuestions(state, set, () => 0.1);
  const question = questions[0];
  const fruitAnswers = new Set(state.words.filter((word) => word.categoryId === "fruit").map((word) => word.japanese));
  const distractors = question.choices.filter((choice) => choice !== question.correctAnswer);

  assert.ok(distractors.length > 0);
  assert.ok(distractors.every((choice) => fruitAnswers.has(choice)));
});
