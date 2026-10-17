(function () {
  'use strict';

  let data = LP.Store.load();
  const CAT = LP.CATEGORIES;
  const esc = LP.esc;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const SESSION_KEY = 'logipoly.admin';
  const FIXED_TYPES = ['start', 'finish'];

  const catOptions = (selected) => Object.entries(CAT)
    .map(([id, c]) => `<option value="${id}"${id === selected ? ' selected' : ''}>${c.icon} ${esc(c.name)}</option>`)
    .join('');

  function persist(message) {
    LP.Store.save(data);
    toast(message || 'Kaydedildi');
  }

  // ---------------- Giriş ----------------

  function isLoggedIn() {
    return !data.settings.adminPassword || sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function showAdmin() {
    $('#loginView').classList.add('hidden');
    $('#adminView').classList.remove('hidden');
    $('#btnLogout').classList.toggle('hidden', !data.settings.adminPassword);
    renderAll();
  }

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#loginPass').value === data.settings.adminPassword) {
      sessionStorage.setItem(SESSION_KEY, '1');
      $('#loginError').classList.add('hidden');
      showAdmin();
    } else {
      $('#loginError').classList.remove('hidden');
    }
  });

  $('#btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  // ---------------- Sekmeler ----------------

  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $$('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== `tab-${tab.dataset.tab}`));
  }));

  function renderAll() {
    $('#qFilter').innerHTML = `<option value="">Tüm kategoriler</option>${catOptions($('#qFilter').value)}`;
    renderQuestions();
    renderCases();
    renderPeople();
    renderTiles();
    renderBoxes();
    renderSettings();
  }

  // ---------------- Ortak: şık düzenleyici ----------------

  function optionsEditor(options, answer, hintText) {
    const opts = [...(options || [])];
    while (opts.length < 4) opts.push('');
    return `
      <div class="form-grid">
        <span class="muted">${hintText}</span>
        ${opts.map((o, i) => `
          <div class="option-row">
            <input type="radio" name="answer" value="${i}"${i === Number(answer) ? ' checked' : ''} title="Doğru cevap">
            <input type="text" name="opt${i}" value="${esc(o)}" placeholder="${'ABCD'[i]} şıkkı">
          </div>`).join('')}
      </div>`;
  }

  function readOptions(form) {
    const answer = Number(form.answer.value);
    const filled = [0, 1, 2, 3]
      .map((i) => ({ text: form[`opt${i}`].value.trim(), ok: i === answer }))
      .filter((o) => o.text);
    return { options: filled.map((o) => o.text), answer: filled.findIndex((o) => o.ok), filled };
  }

  // ---------------- Sorular ----------------

  function renderQuestions() {
    const filter = $('#qFilter').value;
    const search = $('#qSearch').value.trim().toLocaleLowerCase('tr');

    $('#qStats').innerHTML = Object.entries(CAT).map(([id, c]) => {
      const n = data.questions.filter((q) => q.category === id).length;
      return `<span class="chip count" style="--c:${c.color}">${c.icon} ${esc(c.name)}: ${n}</span>`;
    }).join('') + `<span class="chip count" style="--c:#34495e">Toplam: ${data.questions.length}</span>`;

    const list = data.questions.filter((q) =>
      (!filter || q.category === filter) &&
      (!search || q.text.toLocaleLowerCase('tr').includes(search)));

    $('#qBody').innerHTML = list.length ? list.map((q, i) => {
      const c = CAT[q.category] || { name: q.category, color: '#555', icon: '❓' };
      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td><span class="chip" style="--c:${c.color}">${c.icon} ${esc(c.name)}</span></td>
          <td class="q-cell">${esc(q.text)}</td>
          <td>${esc(q.options[q.answer] ?? '-')}</td>
          <td>${q.hint ? '💡' : '<span class="muted">—</span>'}</td>
          <td class="actions">
            <button class="btn sm" data-edit="${q.id}">✏️ Düzenle</button>
            <button class="btn sm danger" data-del="${q.id}">🗑️</button>
          </td>
        </tr>`;
    }).join('') : '<tr><td colspan="6" class="muted">Soru bulunamadı.</td></tr>';
  }

  $('#qFilter').addEventListener('change', renderQuestions);
  $('#qSearch').addEventListener('input', renderQuestions);
  $('#btnAddQ').addEventListener('click', () => openQuestionForm(null));
  $('#btnClearQ').addEventListener('click', () => {
    if (!data.questions.length) return;
    if (!confirm(`${data.questions.length} sorunun tamamı silinecek. Emin misiniz?`)) return;
    data.questions = [];
    persist('Tüm sorular silindi');
    renderQuestions();
  });

  $('#qBody').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (edit) openQuestionForm(data.questions.find((q) => q.id === edit.dataset.edit));
    if (del && confirm('Bu soru silinsin mi?')) {
      data.questions = data.questions.filter((q) => q.id !== del.dataset.del);
      persist('Soru silindi');
      renderQuestions();
    }
  });

  function openQuestionForm(q) {
    const isNew = !q;
    const draft = q || { category: $('#qFilter').value || Object.keys(CAT)[0], text: '', options: [], answer: 0, hint: '', explanation: '' };

    openModal(`
      <div class="m-head">${isNew ? '➕ Yeni Soru' : '✏️ Soruyu Düzenle'}</div>
      <form class="m-body form-grid" id="qForm">
        <label>Kategori
          <select name="category">${catOptions(draft.category)}</select>
        </label>
        <label>Soru metni
          <textarea name="text" required>${esc(draft.text)}</textarea>
        </label>
        ${optionsEditor(draft.options, draft.answer, 'Şıklar (doğru cevabı soldaki daireden işaretleyin, en az 2 şık gerekli)')}
        <label>İpucu (isteğe bağlı, "İpuçlu Soru" jokeri çıkınca gösterilir)
          <input type="text" name="hint" value="${esc(draft.hint || '')}">
        </label>
        <label>Açıklama (cevaptan sonra gösterilir, isteğe bağlı)
          <textarea name="explanation">${esc(draft.explanation || '')}</textarea>
        </label>
        <p class="error hidden" id="formError"></p>
        <div class="actions-bar">
          <button type="button" class="btn ghost" id="formCancel">Vazgeç</button>
          <button type="submit" class="btn primary">💾 Kaydet</button>
        </div>
      </form>`);

    $('#formCancel').onclick = closeModal;
    $('#qForm').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const { options, answer, filled } = readOptions(f);
      if (!f.text.value.trim()) return formError('Soru metni boş olamaz.');
      if (filled.length < 2) return formError('En az 2 şık doldurulmalı.');
      if (answer < 0) return formError('İşaretlenen doğru cevap şıkkı boş olamaz.');

      const record = {
        id: q ? q.id : LP.uid('q'),
        category: f.category.value,
        text: f.text.value.trim(),
        options,
        answer,
        hint: f.hint.value.trim(),
        explanation: f.explanation.value.trim(),
      };
      if (isNew) data.questions.push(record);
      else data.questions[data.questions.findIndex((x) => x.id === q.id)] = record;
      persist(isNew ? 'Soru eklendi' : 'Soru güncellendi');
      closeModal();
      renderQuestions();
    };
  }

  // ---------------- Vaka analizleri ----------------

  function renderCases() {
    $('#caseBody').innerHTML = data.cases.length ? data.cases.map((c, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td><b>${esc(c.title || '—')}</b></td>
        <td class="q-cell">${esc(c.text.length > 160 ? `${c.text.slice(0, 160)}…` : c.text)}</td>
        <td>${(c.options || []).filter((o) => o).length >= 2 ? '<span class="chip" style="--c:#2980b9">Çoktan seçmeli</span>' : '<span class="chip" style="--c:#8e44ad">Açık uçlu</span>'}</td>
        <td class="actions">
          <button class="btn sm" data-edit="${c.id}">✏️ Düzenle</button>
          <button class="btn sm danger" data-del="${c.id}">🗑️</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="5" class="muted">Henüz kurtarma sorusu yok. Yoksa kurtarma için normal sorular kullanılır.</td></tr>';
  }

  $('#btnAddCase').addEventListener('click', () => openCaseForm(null));
  $('#caseBody').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (edit) openCaseForm(data.cases.find((c) => c.id === edit.dataset.edit));
    if (del && confirm('Bu kurtarma sorusu silinsin mi?')) {
      data.cases = data.cases.filter((c) => c.id !== del.dataset.del);
      persist('Kurtarma sorusu silindi');
      renderCases();
    }
  });

  function openCaseForm(c) {
    const isNew = !c;
    const draft = c || { title: '', text: '', options: [], answer: 0, explanation: '' };

    openModal(`
      <div class="m-head">${isNew ? '➕ Yeni Kurtarma Sorusu' : '✏️ Kurtarma Sorusunu Düzenle'}</div>
      <form class="m-body form-grid" id="caseForm">
        <label>Başlık
          <input type="text" name="title" value="${esc(draft.title || '')}" maxlength="80">
        </label>
        <label>Soru / vaka metni
          <textarea name="text" rows="6" required>${esc(draft.text)}</textarea>
        </label>
        <label>İpucu
          <textarea name="hint" rows="2">${esc(draft.hint || '')}</textarea>
        </label>
        ${optionsEditor(draft.options, draft.answer, 'Şıklar (isteğe bağlı). Boş bırakırsanız soru açık uçlu olur ve öğretmen "Doğru / Yanlış" ile değerlendirir.')}
        <label>Açıklama / örnek cevap
          <textarea name="explanation">${esc(draft.explanation || '')}</textarea>
        </label>
        <p class="error hidden" id="formError"></p>
        <div class="actions-bar">
          <button type="button" class="btn ghost" id="formCancel">Vazgeç</button>
          <button type="submit" class="btn primary">💾 Kaydet</button>
        </div>
      </form>`);

    $('#formCancel').onclick = closeModal;
    $('#caseForm').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const { options, answer, filled } = readOptions(f);
      if (!f.text.value.trim()) return formError('Soru metni boş olamaz.');
      if (filled.length === 1) return formError('Çoktan seçmeli için en az 2 şık girin ya da tüm şıkları boş bırakın.');
      if (filled.length >= 2 && answer < 0) return formError('İşaretlenen doğru cevap şıkkı boş olamaz.');

      const record = {
        id: c ? c.id : LP.uid('v'),
        title: f.title.value.trim(),
        text: f.text.value.trim(),
        options: filled.length >= 2 ? options : [],
        answer: filled.length >= 2 ? answer : 0,
        explanation: f.explanation.value.trim(),
        hint: f.hint.value.trim(),
      };
      if (isNew) data.cases.push(record);
      else data.cases[data.cases.findIndex((x) => x.id === c.id)] = record;
      persist(isNew ? 'Kurtarma sorusu eklendi' : 'Kurtarma sorusu güncellendi');
      closeModal();
      renderCases();
    };
  }

  // ---------------- Kişiler ----------------

  function renderPeople() {
    const game = LP.GameStore.load();
    const drawn = new Set(game.drawn);
    const detained = new Set(game.detained.map((d) => d.name));
    $('#peopleText').value = data.people.join('\n');
    $('#peopleStats').innerHTML = `
      <span class="chip count" style="--c:#34495e">Toplam: ${data.people.length}</span>
      <span class="chip count" style="--c:#2980b9">Bu turda seçilen: ${data.people.filter((n) => drawn.has(n)).length}</span>
      <span class="chip count" style="--c:#c0392b">Gümrükte: ${detained.size}</span>`;
    $('#drawnList').innerHTML = data.people.length
      ? data.people.map((n) => {
        const cls = detained.has(n) ? ' detained' : drawn.has(n) ? ' drawn' : '';
        const icon = detained.has(n) ? '🛃 ' : drawn.has(n) ? '✔ ' : '';
        return `<span class="person-chip${cls}">${icon}${esc(n)}</span>`;
      }).join('')
      : '<span class="muted">Liste boş.</span>';
  }

  $('#btnSavePeople').addEventListener('click', () => {
    const lines = $('#peopleText').value.split(/\r?\n/);
    const cleaned = LP.Store.cleanPeople(lines);
    const dropped = lines.filter((l) => l.trim()).length - cleaned.length;
    data.people = cleaned;
    persist(`${cleaned.length} kişi kaydedildi${dropped ? ` (${dropped} tekrar eden isim atlandı)` : ''}`);
    renderPeople();
  });

  $('#btnResetDraw').addEventListener('click', () => {
    if (!confirm('Tır başlangıca dönecek; seçilenler ve gümrüktekiler sıfırlanacak. Emin misiniz?')) return;
    LP.GameStore.reset();
    toast('Oyun sıfırlandı');
    renderPeople();
  });

  // ---------------- Kareler ----------------

  function renderTiles() {
    $('#tBody').innerHTML = data.tiles.map((t, i) => {
      const fixed = FIXED_TYPES.includes(t.type);
      const needsCat = t.type === 'question';
      return `
        <tr data-i="${i}">
          <td class="num">${i}</td>
          <td>${fixed
            ? `<span class="chip" style="--c:#34495e">${esc(LP.TILE_TYPES[t.type])}</span>`
            : `<select data-f="type">
                <option value="question"${t.type === 'question' ? ' selected' : ''}>❓ Soru</option>
                <option value="chance"${t.type === 'chance' ? ' selected' : ''}>🍀 Şanslı Soru</option>
                <option value="customs"${t.type === 'customs' ? ' selected' : ''}>🛃 Gümrüğe Takıldın</option>
                <option value="penalty"${t.type === 'penalty' ? ' selected' : ''}>↩️ Ceza (1 kare geri)</option>
              </select>`}</td>
          <td><input data-f="name" value="${esc(t.name)}" maxlength="40"></td>
          <td>${t.type === 'finish' ? '<span class="muted">Varış — soru yok</span>'
            : t.type === 'start' ? '<span class="muted">Tüm kategorilerden</span>'
            : `<select data-f="category"${needsCat ? '' : ' disabled'}>${catOptions(t.category || 'plan')}</select>`}</td>
        </tr>`;
    }).join('');
  }

  $('#tBody').addEventListener('change', (e) => {
    if (e.target.dataset.f !== 'type') return;
    const select = e.target.closest('tr').querySelector('[data-f="category"]');
    if (select) select.disabled = e.target.value !== 'question';
  });

  $('#btnSaveTiles').addEventListener('click', () => {
    $$('#tBody tr').forEach((row) => {
      const t = data.tiles[Number(row.dataset.i)];
      const get = (f) => row.querySelector(`[data-f="${f}"]`);
      t.name = get('name').value.trim() || t.name;
      if (FIXED_TYPES.includes(t.type)) return;
      t.type = get('type').value;
      if (t.type === 'question') t.category = get('category').value;
      else delete t.category;
    });
    persist('Kareler kaydedildi');
    renderTiles();
  });

  // ---------------- Şans kutuları ----------------

  function renderBoxes() {
    $('#boxBody').innerHTML = data.boxes.length ? data.boxes.map((b, i) => `
      <tr data-id="${b.id}">
        <td class="num">${i + 1}</td>
        <td style="width:220px"><select data-f="type">${Object.entries(LP.BOX_TYPES).map(([id, t]) =>
          `<option value="${id}"${id === b.type ? ' selected' : ''}>${t.icon} ${esc(t.label)}</option>`).join('')}</select></td>
        <td><input data-f="text" value="${esc(b.text)}" maxlength="140"></td>
        <td class="actions"><button class="btn sm danger" data-del="${b.id}">🗑️</button></td>
      </tr>`).join('') : '<tr><td colspan="4" class="muted">Henüz kutu yok.</td></tr>';
  }

  function readBoxesFromTable() {
    return $$('#boxBody tr[data-id]').map((row) => ({
      id: row.dataset.id,
      type: row.querySelector('[data-f="type"]').value,
      text: row.querySelector('[data-f="text"]').value.trim(),
    }));
  }

  $('#btnAddBox').addEventListener('click', () => {
    data.boxes = readBoxesFromTable();
    data.boxes.push({ id: LP.uid('b'), type: 'help', text: 'Bir arkadaşından yardım alabilirsin!' });
    renderBoxes();
  });

  $('#boxBody').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (!del) return;
    data.boxes = readBoxesFromTable().filter((b) => b.id !== del.dataset.del);
    renderBoxes();
  });

  $('#btnSaveBoxes').addEventListener('click', () => {
    data.boxes = readBoxesFromTable().filter((b) => b.text);
    persist('Joker kutuları kaydedildi');
    renderBoxes();
  });

  // ---------------- Ayarlar ----------------

  function renderSettings() {
    const f = $('#settingsForm');
    $('#pawnSelect').innerHTML = LP.PAWNS.map((p) => `<option value="${p.id}">${p.icon} ${esc(p.name)}</option>`).join('');
    Object.entries(data.settings).forEach(([key, value]) => {
      if (f.elements[key]) f.elements[key].value = value;
    });
  }

  $('#settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const num = (name, min, max) => Math.min(max, Math.max(min, Number(f.elements[name].value) || 0));
    data.settings = {
      pawn: f.elements.pawn.value,
      boxCount: num('boxCount', 2, 6),
      adminPassword: f.elements.adminPassword.value,
    };
    persist('Ayarlar kaydedildi');
    $('#btnLogout').classList.toggle('hidden', !data.settings.adminPassword);
  });

  // ---------------- Yedekleme ----------------

  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logipoly-veri-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.questions)) throw new Error('questions alanı yok');
        if (!confirm(`${parsed.questions.length} soru içeren dosya yüklenecek ve mevcut verilerin üzerine yazılacak. Devam edilsin mi?`)) return;
        data = LP.Store.normalize(parsed);
        persist('Veriler içe aktarıldı');
        renderAll();
      } catch (err) {
        toast('Geçersiz dosya: ' + err.message, true);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  });

  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Tüm sorular, vakalar, kişiler, kareler, kutular ve ayarlar varsayılana dönecek. Emin misiniz?')) return;
    LP.Store.reset();
    data = LP.Store.load();
    toast('Varsayılan verilere dönüldü');
    renderAll();
  });

  // ---------------- Yardımcılar ----------------

  function formError(msg) {
    const err = $('#formError');
    err.textContent = msg;
    err.classList.remove('hidden');
  }

  function openModal(html) {
    $('#modalCard').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }

  function closeModal() {
    $('#modal').classList.add('hidden');
    $('#modalCard').innerHTML = '';
  }

  $('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  let toastTimer = null;
  function toast(message, isError) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('error', !!isError);
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2500);
  }

  if (isLoggedIn()) showAdmin();
  else $('#loginPass').focus();
})();
