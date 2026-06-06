const fs = require("node:fs");
const path = require("node:path");

const categories = {
  fruit: "果物",
  vehicle: "乗り物",
  color: "色",
  animal: "動物",
  food: "食べ物",
  family: "家族",
  school: "学校",
  day_week: "曜日",
  weather: "天気",
  body: "体",
  house: "家の中",
  place: "場所",
  job: "職業",
  action: "動作",
  feeling: "気持ち",
  daily_life: "日常生活"
};

const nouns = {
  fruit: [
    ["apple", "りんご"], ["banana", "バナナ"], ["orange", "オレンジ"], ["grape", "ぶどう"], ["melon", "メロン"],
    ["peach", "もも"], ["pear", "なし"], ["lemon", "レモン"], ["cherry", "さくらんぼ"], ["strawberry", "いちご"],
    ["pineapple", "パイナップル"], ["kiwi", "キウイ"], ["mango", "マンゴー"], ["plum", "すもも"], ["fig", "いちじく"]
  ],
  vehicle: [
    ["car", "車"], ["bus", "バス"], ["train", "電車"], ["bike", "自転車"], ["ship", "船"],
    ["plane", "飛行機"], ["truck", "トラック"], ["taxi", "タクシー"], ["boat", "ボート"], ["subway", "地下鉄"],
    ["scooter", "スクーター"], ["helicopter", "ヘリコプター"], ["rocket", "ロケット"], ["van", "バン"], ["ambulance", "救急車"]
  ],
  color: [
    ["red", "赤"], ["blue", "青"], ["green", "緑"], ["yellow", "黄色"], ["black", "黒"],
    ["white", "白"], ["pink", "ピンク"], ["purple", "紫"], ["brown", "茶色"], ["orange", "オレンジ色"],
    ["gray", "灰色"], ["gold", "金色"], ["silver", "銀色"], ["navy", "紺色"], ["beige", "ベージュ"]
  ],
  animal: [
    ["dog", "犬"], ["cat", "ねこ"], ["bird", "鳥"], ["fish", "魚"], ["rabbit", "うさぎ"],
    ["horse", "馬"], ["cow", "牛"], ["pig", "ぶた"], ["sheep", "羊"], ["goat", "やぎ"],
    ["lion", "ライオン"], ["tiger", "トラ"], ["bear", "くま"], ["monkey", "さる"], ["panda", "パンダ"],
    ["elephant", "ぞう"], ["giraffe", "キリン"], ["zebra", "シマウマ"], ["kangaroo", "カンガルー"], ["koala", "コアラ"]
  ],
  food: [
    ["rice", "ごはん"], ["bread", "パン"], ["milk", "牛乳"], ["egg", "卵"], ["cheese", "チーズ"],
    ["meat", "肉"], ["chicken", "鶏肉"], ["fish", "魚"], ["soup", "スープ"], ["salad", "サラダ"],
    ["cake", "ケーキ"], ["cookie", "クッキー"], ["pizza", "ピザ"], ["noodle", "めん"], ["sandwich", "サンドイッチ"],
    ["curry", "カレー"], ["tea", "お茶"], ["water", "水"], ["juice", "ジュース"], ["yogurt", "ヨーグルト"]
  ],
  family: [
    ["mother", "母"], ["father", "父"], ["sister", "姉妹"], ["brother", "兄弟"], ["grandmother", "祖母"],
    ["grandfather", "祖父"], ["aunt", "おば"], ["uncle", "おじ"], ["cousin", "いとこ"], ["baby", "赤ちゃん"],
    ["parent", "親"], ["child", "子ども"], ["family", "家族"], ["daughter", "娘"], ["son", "息子"]
  ],
  school: [
    ["school", "学校"], ["book", "本"], ["pencil", "鉛筆"], ["pen", "ペン"], ["eraser", "消しゴム"],
    ["ruler", "ものさし"], ["notebook", "ノート"], ["desk", "机"], ["chair", "いす"], ["classroom", "教室"],
    ["teacher", "先生"], ["student", "生徒"], ["homework", "宿題"], ["question", "質問"], ["lesson", "授業"],
    ["test", "テスト"], ["map", "地図"], ["globe", "地球儀"], ["library", "図書館"], ["marker", "マーカー"]
  ],
  day_week: [
    ["Monday", "月曜日"], ["Tuesday", "火曜日"], ["Wednesday", "水曜日"], ["Thursday", "木曜日"], ["Friday", "金曜日"],
    ["Saturday", "土曜日"], ["Sunday", "日曜日"], ["today", "今日"], ["tomorrow", "明日"], ["yesterday", "昨日"],
    ["morning", "朝"], ["afternoon", "午後"], ["evening", "夕方"], ["night", "夜"], ["week", "週"]
  ],
  weather: [
    ["sunny", "晴れ"], ["rainy", "雨の"], ["cloudy", "くもりの"], ["windy", "風の強い"], ["snowy", "雪の"],
    ["hot", "暑い"], ["cold", "寒い"], ["warm", "暖かい"], ["cool", "涼しい"], ["storm", "嵐"],
    ["rain", "雨"], ["snow", "雪"], ["wind", "風"], ["sky", "空"], ["cloud", "雲"]
  ],
  body: [
    ["head", "頭"], ["face", "顔"], ["eye", "目"], ["ear", "耳"], ["nose", "鼻"], ["mouth", "口"], ["tooth", "歯"],
    ["hand", "手"], ["finger", "指"], ["arm", "腕"], ["leg", "脚"], ["foot", "足"], ["shoulder", "肩"], ["knee", "ひざ"],
    ["heart", "心臓"], ["hair", "髪"], ["neck", "首"], ["back", "背中"], ["stomach", "おなか"], ["voice", "声"]
  ],
  house: [
    ["house", "家"], ["room", "部屋"], ["kitchen", "台所"], ["bedroom", "寝室"], ["bathroom", "浴室"],
    ["door", "ドア"], ["window", "窓"], ["floor", "床"], ["wall", "壁"], ["roof", "屋根"],
    ["bed", "ベッド"], ["table", "テーブル"], ["sofa", "ソファ"], ["lamp", "ランプ"], ["clock", "時計"],
    ["garden", "庭"], ["stairs", "階段"], ["mirror", "鏡"], ["shelf", "棚"], ["closet", "クローゼット"]
  ],
  place: [
    ["park", "公園"], ["library", "図書館"], ["station", "駅"], ["store", "店"], ["hospital", "病院"],
    ["zoo", "動物園"], ["museum", "博物館"], ["airport", "空港"], ["bank", "銀行"], ["post office", "郵便局"],
    ["restaurant", "レストラン"], ["beach", "浜辺"], ["mountain", "山"], ["river", "川"], ["bridge", "橋"],
    ["city", "市"], ["town", "町"], ["village", "村"], ["market", "市場"], ["hotel", "ホテル"]
  ],
  job: [
    ["doctor", "医者"], ["teacher", "先生"], ["artist", "芸術家"], ["engineer", "技術者"], ["nurse", "看護師"],
    ["farmer", "農家"], ["driver", "運転手"], ["pilot", "パイロット"], ["cook", "料理人"], ["singer", "歌手"],
    ["writer", "作家"], ["police officer", "警察官"], ["firefighter", "消防士"], ["dentist", "歯医者"], ["scientist", "科学者"]
  ],
  action: [
    ["run", "走る"], ["walk", "歩く"], ["jump", "跳ぶ"], ["eat", "食べる"], ["drink", "飲む"], ["read", "読む"],
    ["write", "書く"], ["listen", "聞く"], ["speak", "話す"], ["sing", "歌う"], ["dance", "踊る"], ["draw", "描く"],
    ["make", "作る"], ["open", "開ける"], ["close", "閉める"], ["clean", "掃除する"], ["wash", "洗う"],
    ["help", "助ける"], ["study", "勉強する"], ["practice", "練習する"], ["decide", "決める"], ["explain", "説明する"]
  ],
  feeling: [
    ["happy", "うれしい"], ["sad", "悲しい"], ["angry", "怒った"], ["tired", "疲れた"], ["sleepy", "眠い"],
    ["hungry", "おなかがすいた"], ["thirsty", "のどが渇いた"], ["scared", "こわい"], ["excited", "わくわくした"],
    ["nervous", "緊張した"], ["proud", "誇らしい"], ["bored", "退屈な"], ["calm", "落ち着いた"], ["lonely", "さみしい"], ["surprised", "驚いた"]
  ],
  daily_life: [
    ["friend", "友だち"], ["game", "ゲーム"], ["music", "音楽"], ["sport", "スポーツ"], ["club", "クラブ"],
    ["birthday", "誕生日"], ["holiday", "休日"], ["money", "お金"], ["ticket", "切符"], ["phone", "電話"],
    ["photo", "写真"], ["letter", "手紙"], ["bag", "かばん"], ["umbrella", "傘"], ["key", "鍵"],
    ["future", "未来"], ["dream", "夢"], ["plan", "計画"], ["rule", "ルール"], ["team", "チーム"]
  ]
};

const modifiers = [
  ["big", "大きい"], ["small", "小さい"], ["new", "新しい"], ["old", "古い"], ["long", "長い"],
  ["short", "短い"], ["fast", "速い"], ["slow", "遅い"], ["good", "よい"], ["bad", "悪い"],
  ["clean", "きれいな"], ["quiet", "静かな"], ["strong", "強い"], ["weak", "弱い"], ["kind", "親切な"],
  ["bright", "明るい"], ["dark", "暗い"], ["easy", "簡単な"], ["hard", "難しい"], ["favorite", "お気に入りの"]
];

const categoryIds = Object.keys(categories);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function row(wordId, english, japanese, grade, categoryId, difficulty = "easy") {
  const exampleEn = `I know ${english}.`;
  const exampleJa = `私は「${japanese}」を知っています。`;
  return [
    wordId,
    english,
    japanese,
    grade,
    categoryId,
    categories[categoryId],
    "",
    exampleEn,
    exampleJa,
    difficulty,
    "true"
  ].map(csvEscape).join(",");
}

function uniqueEntriesForGrade(grade, globalSeen) {
  const entries = [];
  const seen = new Set();
  const add = (english, japanese, categoryId) => {
    const normalized = `${english.toLowerCase()}::${categoryId}`;
    if (seen.has(normalized) || globalSeen.has(normalized)) return;
    seen.add(normalized);
    globalSeen.add(normalized);
    entries.push({ english, japanese, categoryId });
  };

  const categoryPools = Object.fromEntries(categoryIds.map((categoryId) => [categoryId, candidatesForCategory(categoryId, grade)]));
  let cursor = 0;
  while (entries.length < 500) {
    let addedThisRound = false;
    for (const categoryId of categoryIds) {
      const pool = categoryPools[categoryId];
      while (cursor < pool.length) {
        const [english, japanese] = pool[cursor];
        const before = entries.length;
        add(english, japanese, categoryId);
        if (entries.length > before) {
          addedThisRound = true;
          break;
        }
        cursor += 1;
      }
      if (entries.length >= 500) return entries;
    }
    cursor += 1;
    if (!addedThisRound && categoryIds.every((categoryId) => cursor >= categoryPools[categoryId].length)) break;
  }

  throw new Error(`Grade ${grade} only generated ${entries.length} entries.`);
}

function candidatesForCategory(categoryId, grade) {
  const base = [...nouns[categoryId], ...categoryCombos(categoryId)];
  const possessive = nouns[categoryId].flatMap(([nounEn, nounJa]) => [
    [`my ${nounEn}`, `私の${nounJa}`],
    [`your ${nounEn}`, `あなたの${nounJa}`],
    [`this ${nounEn}`, `この${nounJa}`],
    [`that ${nounEn}`, `あの${nounJa}`]
  ]);
  const gradePhrases = base.map(([english, japanese]) => [`grade ${grade} ${english}`, `${grade}年生の${japanese}`]);
  return [...base, ...possessive, ...gradePhrases];
}

function categoryCombos(categoryId) {
  if (categoryId === "color") {
    const colorNouns = [...nouns.fruit, ...nouns.animal, ...nouns.vehicle, ...nouns.house.slice(0, 10)];
    return nouns.color.flatMap(([colorEn, colorJa]) => colorNouns.map(([nounEn, nounJa]) => [`${colorEn} ${nounEn}`, `${colorJa}の${nounJa}`]));
  }

  if (categoryId === "action") {
    const adverbs = [
      ["fast", "速く"], ["slowly", "ゆっくり"], ["well", "上手に"], ["together", "一緒に"], ["again", "もう一度"],
      ["every day", "毎日"], ["at school", "学校で"], ["at home", "家で"], ["in the morning", "朝に"], ["after lunch", "昼食後に"]
    ];
    return nouns.action.flatMap(([verbEn, verbJa]) => adverbs.map(([adverbEn, adverbJa]) => [`${verbEn} ${adverbEn}`, `${adverbJa}${verbJa}`]));
  }

  if (categoryId === "feeling") {
    const stems = [
      ["feel", "感じる"], ["look", "見える"], ["become", "になる"], ["sound", "に聞こえる"], ["stay", "のままでいる"]
    ];
    return nouns.feeling.flatMap(([feelingEn, feelingJa]) => stems.map(([stemEn, stemJa]) => [`${stemEn} ${feelingEn}`, `${feelingJa}${stemJa}`]));
  }

  if (categoryId === "weather") {
    const weatherNouns = [["day", "日"], ["morning", "朝"], ["afternoon", "午後"], ["weekend", "週末"], ["sky", "空"]];
    return nouns.weather.flatMap(([weatherEn, weatherJa]) => weatherNouns.map(([nounEn, nounJa]) => [`${weatherEn} ${nounEn}`, `${weatherJa}の${nounJa}`]));
  }

  if (categoryId === "day_week") {
    const timeWords = [["morning", "朝"], ["afternoon", "午後"], ["evening", "夕方"], ["night", "夜"], ["class", "授業"]];
    return nouns.day_week.flatMap(([dayEn, dayJa]) => timeWords.map(([timeEn, timeJa]) => [`${dayEn} ${timeEn}`, `${dayJa}の${timeJa}`]));
  }

  const words = nouns[categoryId];
  return modifiers.flatMap(([modifierEn, modifierJa]) => words.map(([nounEn, nounJa]) => [`${modifierEn} ${nounEn}`, `${modifierJa}${nounJa}`]));
}

const lines = ["word_id,english,japanese,grade_level,category_id,category_name,pronunciation,example_en,example_ja,difficulty,active"];
const globalSeen = new Set();
for (let grade = 1; grade <= 6; grade += 1) {
  const entries = uniqueEntriesForGrade(grade, globalSeen).slice(0, 500);
  entries.forEach((entry, index) => {
    const wordId = `G${grade}-${String(index + 1).padStart(3, "0")}`;
    const difficulty = grade <= 2 ? "easy" : grade <= 4 ? "normal" : "hard";
    lines.push(row(wordId, entry.english, entry.japanese, grade, entry.categoryId, difficulty));
  });
}

const outputPath = path.join(__dirname, "..", "templates", "word-template.csv");
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${lines.length - 1} word rows to ${outputPath}`);
