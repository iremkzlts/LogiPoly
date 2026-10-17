window.LP = window.LP || {};

LP.esc = function (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

LP.uid = function (prefix) {
  return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

// Veriler şimdilik tarayıcının localStorage'ında tutulur.
// İleride bu katman bir API (ör. Vercel + veritabanı) ile değiştirilebilir.
LP.Store = {
  KEY: 'logipoly.data.v1',

  defaults() {
    return JSON.parse(JSON.stringify({
      questions: LP.DEFAULT_QUESTIONS,
      cases: LP.DEFAULT_CASES,
      tiles: LP.DEFAULT_TILES,
      tilesVersion: LP.TILES_VERSION,
      contentVersion: LP.CONTENT_VERSION,
      boxes: LP.DEFAULT_BOXES,
      people: LP.DEFAULT_PEOPLE,
      settings: LP.DEFAULT_SETTINGS,
    }));
  },

  cleanPeople(list) {
    const seen = new Set();
    return (list || [])
      .map((n) => String(n).trim())
      .filter((n) => {
        const key = n.toLocaleLowerCase('tr');
        if (!n || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  },

  normalize(raw) {
    const def = this.defaults();
    const d = raw && typeof raw === 'object' ? raw : {};
    const withIds = (list, prefix) => list.map((x) => (x.id ? x : { ...x, id: LP.uid(prefix) }));

    const freshContent = d.contentVersion !== LP.CONTENT_VERSION;
    const questions = !freshContent && Array.isArray(d.questions)
      ? withIds(d.questions.filter((q) => q && q.text && Array.isArray(q.options) && q.options.length >= 2), 'q')
      : def.questions;
    const cases = !freshContent && Array.isArray(d.cases) ? withIds(d.cases.filter((c) => c && c.text), 'v') : def.cases;
    const current = d.tilesVersion === LP.TILES_VERSION;
    const tiles = current && Array.isArray(d.tiles) && d.tiles.length === def.tiles.length
      ? d.tiles.map((t) => (LP.TILE_TYPES[t.type] ? t : { ...t, type: 'question' }))
      : def.tiles;
    const boxes = current && Array.isArray(d.boxes)
      ? withIds(d.boxes.filter((b) => b && LP.BOX_TYPES[b.type]), 'b')
      : def.boxes;
    const people = Array.isArray(d.people) ? this.cleanPeople(d.people) : def.people;
    const settings = Object.assign({}, def.settings, d.settings || {});
    delete settings.questionTime;
    return { questions, cases, tiles, tilesVersion: LP.TILES_VERSION, contentVersion: LP.CONTENT_VERSION, boxes, people, settings };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? this.normalize(JSON.parse(raw)) : this.defaults();
    } catch (e) {
      console.warn('LogiPoly verisi okunamadı, varsayılanlar kullanılıyor.', e);
      return this.defaults();
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  reset() {
    localStorage.removeItem(this.KEY);
  },
};

// ?test=1 ile açılan test modu ayrı bir kayıt kullanır; gerçek oyun etkilenmez.
LP.TEST_MODE = new URLSearchParams(location.search).has('test');

// Devam eden oyunun durumu. Sayfa yenilense bile kaldığı yerden devam eder.
LP.GameStore = {
  KEY: LP.TEST_MODE ? 'logipoly.game.test' : 'logipoly.game.v2',

  fresh() {
    return {
      pos: 0,
      drawn: [],
      current: null,
      detained: [],
      rescued: [],
      answered: [],
      stats: { correct: 0, wrong: 0 },
      asked: [],
      askedCases: [],
      usedPenalties: [],
      rescueMode: false,
      finished: false,
      log: [],
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? Object.assign(this.fresh(), JSON.parse(raw)) : this.fresh();
    } catch (e) {
      return this.fresh();
    }
  },

  save(game) {
    localStorage.setItem(this.KEY, JSON.stringify(game));
  },

  reset() {
    localStorage.removeItem(this.KEY);
  },
};
