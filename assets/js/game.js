(function () {
  'use strict';

  const data = LP.Store.load();
  const tiles = data.tiles;
  const settings = data.settings;
  const CAT = LP.CATEGORIES;
  const esc = LP.esc;
  const $ = (sel) => document.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const N = tiles.length;
  const LAST = N - 1;
  const PAWN = LP.PAWNS.find((p) => p.id === settings.pawn) || LP.PAWNS[0];
  const icon = LP.icon;
  const SPECIAL = {
    start: { icon: 'arrowUp', color: '#0e7c86' },
    chance: { icon: 'sparkles', color: '#ff7a1a' },
    customs: { icon: 'shieldAlert', color: '#e11d48' },
    penalty: { icon: 'undo', color: '#7c3aed' },
    finish: { icon: 'flag', color: '#f5b301' },
  };
  const catIcon = (id) => LP.CATEGORY_ICONS[id] || 'package';
  const TEST_ANSWER_KEY = 'logipoly.test.answer';
  const showTestAnswer = () => LP.TEST_MODE && localStorage.getItem(TEST_ANSWER_KEY) !== 'off';

  let game = LP.GameStore.load();
  let busy = false;
  let tileEls = [];
  let pawnEl = null;

  const save = () => LP.GameStore.save(game);
  const detainedNames = () => game.detained.map((d) => d.name);
  const availablePeople = () => data.people.filter((n) => !detainedNames().includes(n));
  const remainingPeople = () => availablePeople().filter((n) => !game.drawn.includes(n));

  // ---------------- Tahta ----------------

  // 7x7 ızgaranın çevresi = 24 kare. Sol alttan başlar, saat yönünde ilerler.
  function gridPos(i) {
    if (i <= 6) return { row: 7 - i, col: 1, side: 'left' };
    if (i <= 12) return { row: 1, col: 1 + (i - 6), side: 'top' };
    if (i <= 18) return { row: 1 + (i - 12), col: 7, side: 'right' };
    return { row: 7, col: 7 - (i - 18), side: 'bottom' };
  }

  function tileVisual(t) {
    if (t.type === 'question') {
      const cat = CAT[t.category] || { color: '#7f8c8d', name: 'Genel' };
      return { color: cat.color, icon: catIcon(t.category), label: cat.name };
    }
    const sp = SPECIAL[t.type] || {};
    return { color: sp.color || 'transparent', icon: sp.icon || '', label: LP.TILE_TYPES[t.type] };
  }

  function buildBoard() {
    const board = $('#board');
    tileEls = tiles.map((t, i) => {
      const pos = gridPos(i);
      const corner = i % 6 === 0;
      const vis = tileVisual(t);
      const el = document.createElement('div');
      el.className = `tile side-${pos.side} type-${t.type}${corner ? ' corner' : ''}`;
      el.style.gridRow = pos.row;
      el.style.gridColumn = pos.col;
      el.style.setProperty('--cat', vis.color);
      el.title = LP.TEST_MODE ? `Test: tırı ${i}. kareye götür (${t.name})` : `${i}. kare: ${t.name} — ${vis.label}`;
      if (LP.TEST_MODE) el.addEventListener('click', () => testJump(i));
      const special = t.type !== 'question';
      const tag = { start: 'Çıkış', finish: 'Varış', chance: 'Şanslı', customs: 'Gümrük', penalty: 'Ceza' }[t.type];
      el.innerHTML = `
        ${special ? '' : '<span class="band"></span>'}
        <span class="t-num">${special ? tag : String(i).padStart(2, '0')}</span>
        <span class="t-icon${special ? ' emblem' : ''}">${icon(vis.icon)}</span>
        <span class="t-name">${esc(t.name)}</span>
        <span class="detained-badge"></span>`;
      board.insertBefore(el, $('#pawnLayer'));
      return el;
    });

    pawnEl = document.createElement('div');
    pawnEl.className = 'pawn';
    pawnEl.innerHTML = icon(LP.PAWN_ICONS[PAWN.id] || 'truck');
    pawnEl.title = PAWN.name;
    $('#pawnLayer').appendChild(pawnEl);

    const legendItem = (color, ic, name) =>
      `<div class="legend-item"><span class="swatch" style="--c:${color}">${icon(ic)}</span>${esc(name)}</div>`;
    $('#legend').innerHTML = Object.entries(CAT).map(([id, c]) => legendItem(c.color, catIcon(id), c.name)).join('')
      + legendItem(SPECIAL.chance.color, 'sparkles', 'Şanslı Soru (joker kutuları)')
      + legendItem(SPECIAL.customs.color, 'shieldAlert', 'Gümrüğe Takıldın')
      + legendItem(SPECIAL.penalty.color, 'undo', 'Ceza: 1 kare geri');

    document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
  }

  function renderTiles() {
    tileEls.forEach((el, i) => {
      el.classList.toggle('passed', i < game.pos);
      el.classList.toggle('here', i === game.pos);
      const count = game.detained.filter((d) => d.tile === i).length;
      const badge = el.querySelector('.detained-badge');
      badge.innerHTML = count ? `${icon('user')}${count}` : '';
      badge.classList.toggle('show', count > 0);
    });
  }

  function renderPawn(hop) {
    const tile = tileEls[game.pos] || tileEls[0];
    pawnEl.style.left = `${tile.offsetLeft + tile.offsetWidth / 2}px`;
    pawnEl.style.top = `${tile.offsetTop + tile.offsetHeight / 2}px`;
    if (hop) {
      pawnEl.classList.remove('hop');
      void pawnEl.offsetWidth;
      pawnEl.classList.add('hop');
    }
  }

  // ---------------- Akış ----------------

  function onMainAction() {
    if (busy) return;
    if (game.finished) showVictory();
    else if (game.rescueMode) rescue();
    else pickPerson();
  }

  async function pickPerson() {
    if (!data.people.length) {
      await showInfo({ icon: 'users', title: 'Kişi listesi boş', text: 'Yönetici panelindeki "Kişiler" sekmesinden isim ekleyin.' });
      return;
    }
    if (!data.questions.length) {
      await showInfo({ icon: 'question', title: 'Soru yok', text: 'Yönetici panelindeki "Sorular" sekmesinden soru ekleyin.' });
      return;
    }
    if (!availablePeople().length) {
      await showInfo({ icon: 'shieldAlert', tone: 'customs', title: 'Herkes gümrükte!', text: 'Seçilebilecek kimse kalmadı. Yeni oyun başlatabilirsiniz.' });
      return;
    }

    busy = true;
    renderAll();
    const name = await choosePresentPerson();
    if (!name) {
      busy = false;
      renderAll();
      return;
    }

    game.current = name;
    if (!game.answered.includes(name)) game.answered.push(name);
    log(`Seçilen kişi: ${name}`, 'pick');
    save();
    renderAll();
    await sleep(500);

    const tile = tiles[game.pos];
    if (tile.type === 'customs') {
      await detainAtCustoms(name);
    } else {
      const joker = tile.type === 'chance' ? await openBoxes(name) : null;
      const skip = joker && (joker.type === 'step' || joker.type === 'advance') ? (joker.type === 'advance' ? 2 : 1) : 0;
      if (skip) {
        log(`${name} soruyu cevaplamadan ${skip} kutu atladı.`, 'ok');
        await advanceSteps(skip);
      } else {
        const correct = await askQuestion(name, tile, joker);
        if (correct) {
          game.stats.correct++;
          log(`${name} doğru cevapladı, tır bir kare ilerliyor.`, 'ok');
          await advance();
        } else {
          game.stats.wrong++;
          log(`${name} yanlış cevapladı, tır bu karede bekliyor.`, 'bad');
          shakePawn();
        }
      }
    }

    save();
    busy = false;
    renderAll();
  }

  // Tır bir kare ilerler; varıştan önce gümrükte biri varsa alarm verilir.
  async function advance() {
    await advanceSteps(1);
  }

  // Birkaç kare ilerler. Gümrük, ceza, yeni bir şans karesi ya da varışta durur.
  async function advanceSteps(steps) {
    for (let i = 0; i < steps; i++) {
      if (game.finished || game.rescueMode) return;
      if (game.pos + 1 >= LAST && game.detained.length) {
        await startRescue();
        return;
      }
      await moveForward();
      if (game.pos === LAST) {
        finishGame();
        return;
      }
      const tile = tiles[game.pos];
      if (tile.type === 'customs' || tile.type === 'chance' || tile.type === 'penalty') {
        await resolveLanding();
        return;
      }
    }
  }

  async function resolveLanding() {
    const tile = tiles[game.pos];
    if (game.pos === LAST) {
      finishGame();
      return;
    }
    if (tile.type === 'customs') {
      log('Tır gümrüğe geldi! Sıradaki seçilen kişi gümrüğe takılacak.', 'bad');
      return;
    }
    if (tile.type === 'chance') {
      LP.Sound.chance();
      tileEls[game.pos].classList.add('lucky-glow');
      setTimeout(() => tileEls[game.pos]?.classList.remove('lucky-glow'), 1600);
      log('Şans karesi! Sıradaki kişi önce bir şans kutusu seçecek.', 'chance');
      return;
    }
    if (tile.type !== 'penalty') return;
    if (game.usedPenalties.includes(game.pos)) {
      log(`${tile.name} cezası zaten uygulandı, tır yoluna devam ediyor.`);
      await sleep(300);
      await advance();
      return;
    }
    game.usedPenalties.push(game.pos);
    save();
    LP.Sound.tension();
    tileEls[game.pos].classList.add('danger-pulse');
    await sleep(1500);
    tileEls[game.pos].classList.remove('danger-pulse');
    LP.Sound.penalty();
    await showInfo({
      icon: 'undo',
      tone: 'penalty',
      title: `Ceza: ${tile.name}`,
      text: 'Tır bir kare geri gidiyor! Sıradaki kişi o kareden yeni bir soru cevaplayarak yola devam edecek.',
    });
    game.pos = Math.max(0, game.pos - 1);
    renderTiles();
    renderPawn(true);
    flashTile(game.pos);
    log(`Ceza! ${tile.name} yüzünden tır bir kare geri gitti.`, 'bad');
    await sleep(450);
  }

  async function detainAtCustoms(name) {
    game.detained.push({ name, tile: game.pos });
    log(`${name} gümrüğe takıldı! Oyunun sonunda kurtarılacak.`, 'bad');
    save();
    renderAll();
    await showJail(name);
    await advance();
  }

  function showJail(name) {
    return new Promise((resolve) => {
      $('#modal').classList.add('police');
      openModal(`
        <div class="jail-card">
          <div class="jail-hero">
            <img src="assets/img/customs-truck.jpg" alt="Gümrük ekibi tırı zincirliyor">
            <span class="jail-tear" style="left:62%;top:49.5%;animation-delay:2.2s"></span>
            <span class="jail-tear" style="left:60.5%;top:50%;animation-delay:3.4s"></span>
            <span class="jail-tear" style="left:29.5%;top:47.5%;animation-delay:2.8s"></span>
            <span class="jail-gate"></span>
            <span class="jail-flash"></span>
          </div>
          <div class="jail-body">
            <div class="jail-kicker">${icon('shieldAlert')}Gümrük kontrolü</div>
            <h2>Gümrüğe Takıldın!</h2>
            <p><b>${esc(name)}</b>, gümrükte kaldın! Tır yoluna devam ediyor, sıradaki kişi bir sonraki soruyu cevaplayacak. Sınıf seni bitişten önce kurtarmak zorunda.</p>
            <button class="btn primary" id="infoOk">Tamam</button>
          </div>
        </div>`);
      LP.Sound.jail();
      const ok = $('#infoOk');
      ok.focus();
      ok.onclick = () => {
        $('#modal').classList.remove('police');
        closeModal();
        resolve();
      };
    });
  }

  async function choosePresentPerson() {
    while (true) {
      let pool = remainingPeople();
      if (!pool.length) {
        game.drawn = [];
        pool = remainingPeople();
        if (!pool.length) {
          await showInfo({ icon: 'users', title: 'Seçilecek kimse kalmadı', text: 'Sınıfta seçilebilecek kimse kalmadı. Yeni oyun başlatabilirsiniz.' });
          return null;
        }
        log('Herkes bir kez seçildi, liste yeniden başlıyor.');
      }

      renderCenter();
      const name = pool[Math.floor(Math.random() * pool.length)];
      await spinRoulette(pool, name);
      if (await confirmPerson(name)) {
        game.drawn.push(name);
        return name;
      }

      game.drawn.push(name);
      log(`${name} sınıfta yok, yeni kişi seçiliyor.`);
      save();
      await sleep(280);
    }
  }

  function confirmPerson(name) {
    return new Promise((resolve) => {
      openModal(`
        <div class="info-card person-confirm">
          <p class="person-ask">Bu kişi sınıfta mı?</p>
          <h2>${esc(name)}</h2>
          <div class="modal-actions center">
            <button class="btn ghost dark-text big" id="personSkip">Tekrar Kişi Seç</button>
            <button class="btn primary big" id="personHere">Sınıfta, devam et</button>
          </div>
        </div>`);
      const here = $('#personHere');
      here.focus();
      here.onclick = () => { closeModal(); resolve(true); };
      $('#personSkip').onclick = () => { closeModal(); resolve(false); };
    });
  }

  async function spinRoulette(pool, finalName) {
    const box = $('#personBox');
    const label = $('#personName');
    box.classList.remove('chosen');
    box.classList.add('spinning');
    const steps = Math.min(24, 8 + pool.length);
    for (let k = 0; k < steps; k++) {
      label.textContent = pool[Math.floor(Math.random() * pool.length)];
      LP.Sound.tick(k / steps);
      await sleep(50 + k * k * 0.6);
    }
    label.textContent = finalName;
    LP.Sound.picked();
    box.classList.remove('spinning');
    box.classList.add('chosen');
  }

  async function moveForward() {
    LP.Sound.truck();
    game.pos = Math.min(LAST, game.pos + 1);
    renderTiles();
    renderPawn(true);
    flashTile(game.pos);
    await sleep(450);
  }

  async function startRescue() {
    game.rescueMode = true;
    log('Gümrükte unutulan arkadaş var! Kurtarma sorusu çözülmeden oyun bitmez.', 'bad');
    save();
    renderAll();
    document.body.classList.add('alarm');
    LP.Sound.siren();
    await showInfo({
      icon: 'siren',
      tone: 'alarm',
      title: 'Gümrükte unuttuğunuz biri var!',
      text: `${detainedNames().join(', ')} hâlâ gümrükte. Koçtaş vaka analizi çözülmeden oyun bitmez. "Kurtarma Operasyonu" ile soruyu sınıfça çözün.`,
    });
    LP.Sound.stopSiren();
    document.body.classList.remove('alarm');
  }

  async function rescue() {
    const names = detainedNames();
    if (!names.length) return;
    busy = true;
    renderCenter();
    const ok = await askCase(pickCase(), names);
    if (ok) {
      game.rescued.push(...game.detained.map((d) => d.name));
      game.detained = [];
      log(`Sınıf Koçtaş vaka analizini çözdü. Kurtarılanlar: ${names.join(', ')}.`, 'ok');
      game.rescueMode = false;
      renderAll();
      while (game.pos < LAST) await moveForward();
      finishGame();
    } else {
      log('Koçtaş vaka analizi yanlış cevaplandı. Kurtarma sorusu tekrar sorulacak.', 'bad');
    }
    save();
    busy = false;
    renderAll();
  }

  function finishGame() {
    game.finished = true;
    log('Tebrikler, kazandınız! Tüm yükler teslim edildi.', 'ok');
    save();
    renderAll();
    showVictory();
  }

  // ---------------- Sorular ----------------

  function pickQuestion(category, needHint) {
    let pool = category ? data.questions.filter((q) => q.category === category) : data.questions;
    if (!pool.length) pool = data.questions;
    if (needHint) {
      const withHint = pool.filter((q) => q.hint && q.hint.trim());
      if (withHint.length) pool = withHint;
    }
    let available = pool.filter((q) => !game.asked.includes(q.id));
    if (!available.length) {
      const ids = new Set(pool.map((q) => q.id));
      game.asked = game.asked.filter((id) => !ids.has(id));
      available = pool;
    }
    const q = available[Math.floor(Math.random() * available.length)];
    game.asked.push(q.id);
    return q;
  }

  function dropWrongOptions(opts, count) {
    for (let k = 0; k < count && opts.filter((o) => !o.ok).length > 1; k++) {
      const wrong = opts.filter((o) => !o.ok);
      opts.splice(opts.indexOf(wrong[Math.floor(Math.random() * wrong.length)]), 1);
    }
  }

  function askQuestion(name, tile, joker) {
    return new Promise((resolve) => {
      const category = tile.type === 'question' ? tile.category : null;
      const q = pickQuestion(category, joker && joker.type === 'hint');
      const cat = CAT[q.category] || { name: 'Genel', color: '#555' };
      const opts = shuffle(q.options
        .map((text, i) => ({ text, ok: i === Number(q.answer) }))
        .filter((o) => String(o.text).trim()));

      let jokerHtml = '';
      if (joker) {
        const jt = LP.BOX_TYPES[joker.type];
        let extra = '';
        if (joker.type === 'fifty') dropWrongOptions(opts, 2);
        if (joker.type === 'retry') extra = '<div class="joker-extra">İki yanlış cevap hakkın var.</div>';
        if (joker.type === 'hint') {
          if (q.hint && q.hint.trim()) {
            extra = `<div class="joker-extra"><b>İpucu:</b> ${esc(q.hint)}</div>`;
          } else {
            dropWrongOptions(opts, 1);
            extra = '<div class="joker-extra">Bu sorunun ipucu yok, bunun yerine bir yanlış şık elendi.</div>';
          }
        }
        jokerHtml = `<div class="joker-banner"><span class="jb-icon">${icon(LP.BOX_ICONS[joker.type])}</span><div><b>${esc(jt.label)}</b> ${esc(joker.text)}${extra}</div></div>`;
      }

      const lucky = tile.type === 'chance';

      $('#modalCard').classList.add('qshow');
      openModal(`
        <div class="q-head${lucky ? ' lucky' : ''}" style="--cat:${lucky ? SPECIAL.chance.color : cat.color}">
          <span class="q-head-icon">${icon(lucky ? 'sparkles' : catIcon(q.category))}</span>
          <div>
            <div class="q-cat">${lucky ? 'Şanslı Soru · ' : ''}${esc(cat.name)}</div>
            <div class="q-tile">Kare ${String(game.pos).padStart(2, '0')} · ${esc(tile.name)}</div>
          </div>
        </div>
        <div class="q-body" style="--cat:${cat.color}">
          <div class="q-player">${icon('user')}<b>${esc(name)}</b> cevaplıyor</div>
          ${jokerHtml}
          <div class="q-text">${esc(q.text)}</div>
          <div class="q-options">
            ${opts.map((o, i) => `<button class="q-option${o.ok && showTestAnswer() ? ' test-correct' : ''}" data-i="${i}"><b>${'ABCDEF'[i] || i + 1}</b><span>${esc(o.text)}</span></button>`).join('')}
          </div>
          <div id="qResult"></div>
          <div class="modal-actions"><button class="btn primary hidden" id="qContinue">Devam${icon('arrowRight')}</button></div>
        </div>`);
      if (lucky) LP.Sound.lucky();
      else LP.Sound.question();

      const buttons = [...document.querySelectorAll('.q-option')];
      let done = false;
      let misses = joker && joker.type === 'retry' ? 2 : 0;

      const finish = (chosen) => {
        if (done) return;
        const correct = opts[chosen].ok;
        if (!correct && misses > 0) {
          misses--;
          LP.Sound.wrong();
          buttons[chosen].disabled = true;
          buttons[chosen].classList.add('wrong');
          $('#qResult').innerHTML = `
            <div class="q-result bad">
              <div class="qr-line">${icon('x')}${misses ? 'Yanlış. Bir hakkın daha var.' : 'Yanlış. Son şansın.'}</div>
            </div>`;
          return;
        }
        done = true;
        if (correct) LP.Sound.correct();
        else LP.Sound.wrong();
        buttons.forEach((b, i) => {
          b.disabled = true;
          if (opts[i].ok) b.classList.add('correct');
          else if (i === chosen) b.classList.add('wrong');
        });
        const msg = correct ? 'Doğru! Tır bir kare ilerliyor.' : 'Yanlış! Tır bu karede bekliyor.';
        $('#qResult').innerHTML = `
          <div class="q-result ${correct ? 'ok' : 'bad'}">
            <div class="qr-line">${icon(correct ? 'check' : 'x')}${esc(msg)}</div>
            ${q.explanation ? `<div class="q-exp">${esc(q.explanation)}</div>` : ''}
          </div>`;
        const cont = $('#qContinue');
        cont.classList.remove('hidden');
        cont.focus();
        cont.onclick = () => { closeModal(); resolve(correct); };
      };

      buttons.forEach((b, i) => b.addEventListener('click', () => finish(i)));
    });
  }

  function isBoostChance() {
    const pos = gridPos(game.pos);
    return pos.row === 1 && pos.col === 7;
  }

  function openBoxes(name) {
    return new Promise((resolve) => {
      const source = isBoostChance() ? LP.BOOST_BOXES : LP.CLASSIC_BOXES;
      const boxes = shuffle(source.map((b) => ({ ...b })));
      if (!boxes.length) {
        resolve(null);
        return;
      }

      openModal(`
        <div class="info-card chance-card">
          <div class="info-icon tone-chance">${icon('sparkles')}</div>
          <h2>Şanslı Soru</h2>
          <p>${esc(name)}, bir kutu seç.</p>
          <div class="boxes">
            ${boxes.map((b, i) => {
              const t = LP.BOX_TYPES[b.type];
              return `<button class="lucky-box" data-i="${i}">
                <span class="lb-front">${icon('gift')}<b>${String(i + 1).padStart(2, '0')}</b></span>
                <span class="lb-back">${icon(LP.BOX_ICONS[b.type])}<small>${esc(t.label)}</small></span>
              </button>`;
            }).join('')}
          </div>
          <p class="box-note" id="boxNote"></p>
          <button class="btn primary hidden" id="boxGo">Devam${icon('arrowRight')}</button>
        </div>`);

      const els = [...document.querySelectorAll('.lucky-box')];
      els.forEach((el, i) => el.addEventListener('click', () => {
        els.forEach((b) => { b.disabled = true; b.classList.add('open'); });
        el.classList.add('picked');
        LP.Sound.boxOpen();
        const b = boxes[i];
        const t = LP.BOX_TYPES[b.type];
        $('#boxNote').textContent = b.text;
        log(`${name} şans kutusundan "${t.label}" jokeri çıkardı.`, 'chance');
        const go = $('#boxGo');
        go.classList.remove('hidden');
        go.focus();
        go.onclick = () => { closeModal(); resolve(b); };
      }));
    });
  }

  function pickCase() {
    const featured = data.cases.find((c) => c.id === 'koctas') || data.cases[0];
    if (featured) return featured;
    const q = pickQuestion(null, false);
    return { title: 'Kurtarma Sorusu', text: q.text, options: q.options, answer: q.answer, explanation: q.explanation };
  }

  function askCase(c, names) {
    const list = Array.isArray(names) ? names : [names];
    const who = list.join(', ');
    return new Promise((resolve) => {
      const opts = shuffle((c.options || [])
        .map((text, i) => ({ text, ok: i === Number(c.answer) }))
        .filter((o) => String(o.text).trim()));
      const multiple = opts.length >= 2;

      $('#modalCard').classList.add('qshow', 'case-fit');
      openModal(`
        <div class="q-head case-head" style="--cat:#b3123a">
          <span class="q-head-icon">${icon('siren')}</span>
          <div>
            <div class="q-cat">Vaka Analizi${c.title ? ` · ${esc(c.title)}` : ''}</div>
            <div class="q-tile">${esc(who)} gümrükte. Bu soru tahta sorularından ayrıdır; sınıfça çözülmeden oyun bitmez.</div>
          </div>
        </div>
        <div class="q-body" style="--cat:#b3123a">
          <div class="case-text">${esc(c.text)}</div>
          ${multiple ? `
            <div class="q-options">
              ${opts.map((o, i) => `<button class="q-option${o.ok && showTestAnswer() ? ' test-correct' : ''}" data-i="${i}"><b>${'ABCDEF'[i] || i + 1}</b><span>${esc(o.text)}</span></button>`).join('')}
            </div>` : `
            <p class="case-note">Bu açık uçlu bir soru. Sınıfça tartışın, cevabınızı söyleyin; ardından öğretmen değerlendirsin.</p>
            ${c.explanation ? `<button class="btn ghost dark-text" id="caseReveal">${icon('bulb')}Örnek Cevabı Göster</button><div id="caseAnswer"></div>` : ''}
            <div class="modal-actions">
              <button class="btn danger" id="caseNo">${icon('x')}Kurtaramadık</button>
              <button class="btn success" id="caseYes">${icon('check')}Doğru Cevapladık</button>
            </div>`}
          <div id="qResult"></div>
          <div class="modal-actions"><button class="btn primary hidden" id="qContinue">Devam${icon('arrowRight')}</button></div>
        </div>`);

      if (!multiple) {
        const reveal = $('#caseReveal');
        if (reveal) {
          reveal.onclick = () => {
            $('#caseAnswer').innerHTML = `<div class="q-result ok"><div class="q-exp">${esc(c.explanation)}</div></div>`;
            reveal.disabled = true;
          };
        }
        $('#caseYes').onclick = () => { closeModal(); resolve(true); };
        $('#caseNo').onclick = () => { closeModal(); resolve(false); };
        return;
      }

      const buttons = [...document.querySelectorAll('.q-option')];
      buttons.forEach((b, i) => b.addEventListener('click', () => {
        const correct = opts[i].ok;
        buttons.forEach((x, j) => {
          x.disabled = true;
          if (correct && opts[j].ok) x.classList.add('correct');
          if (j === i && !correct) x.classList.add('wrong');
        });
        $('#qResult').innerHTML = correct
          ? `<div class="q-result ok"><div class="qr-line">${icon('check')}Doğru! ${esc(who)} gümrükten kurtuldu.</div>${c.explanation ? `<div class="q-exp">${esc(c.explanation)}</div>` : ''}</div>`
          : `<div class="q-result bad"><div class="qr-line">${icon('x')}Yanlış! ${esc(who)} hâlâ gümrükte. Vaka analizini tekrar çözün.</div></div>`;
        const cont = $('#qContinue');
        cont.classList.remove('hidden');
        cont.focus();
        cont.onclick = () => { closeModal(); resolve(correct); };
      }));
    });
  }

  // ---------------- Bitiş ve yeni oyun ----------------

  function showVictory() {
    openModal(`
      <div class="victory">
        <div class="victory-hero">
          <div class="bunting">${Array.from({ length: 16 }, (_, i) => `<span style="--d:${i}"></span>`).join('')}</div>
          <img src="assets/img/delivery-happy.jpg" alt="Kargosunu teslim alan mutlu aile">
        </div>
        <div class="victory-kicker">Teslimat tamamlandı</div>
        <h2>Tebrikler, Kazandınız!</h2>
        <p>Tır teslimat noktasına ulaştı${game.rescued.length ? ' ve gümrükteki tüm arkadaşlarınızı kurtardınız' : ''}. Harika bir takım çalışması!</p>
        <div class="victory-stats">
          <div><b>${game.stats.correct}</b><span>Doğru</span></div>
          <div><b>${game.stats.wrong}</b><span>Yanlış</span></div>
          <div><b>${game.answered.length}</b><span>Katılan</span></div>
          <div><b>${game.rescued.length}</b><span>Kurtarılan</span></div>
        </div>
        ${game.rescued.length ? `<p class="rescued-line">Kurtarılanlar: ${esc(game.rescued.join(', '))}</p>` : ''}
        <div class="modal-actions center">
          <button class="btn ghost dark-text" id="btnCloseVictory">Kapat</button>
          <button class="btn primary" id="btnRestart">${icon('rotate')}Yeni Oyun</button>
        </div>
      </div>`);
    LP.Sound.victory();
    LP.confetti(6500);
    $('#btnCloseVictory').onclick = closeModal;
    $('#btnRestart').onclick = () => { closeModal(); newGame(true); };
  }

  function newGame(skipConfirm) {
    if (busy) return;
    const started = game.pos > 0 || game.drawn.length || game.detained.length;
    if (!skipConfirm && started && !confirm('Tır başlangıca dönecek, gümrüktekiler ve seçilen kişiler sıfırlanacak. Emin misiniz?')) return;
    LP.GameStore.reset();
    game = LP.GameStore.load();
    $('#personBox').classList.remove('chosen');
    log('Yeni oyun başladı! "Kişi Seç" ile ilk kişiyi belirleyin.');
    save();
    renderAll();
  }

  function showHelp() {
    showInfo({
      icon: 'info',
      title: 'Nasıl Oynanır?',
      text: '"Kişi Seç" ile sınıftan rastgele biri seçilir. İsim çıkınca kişi sınıftaysa soruya geçilir, sınıfta yoksa yeniden kişi seçilir. Sınıfta olan kişi tırın bulunduğu karenin sorusunu cevaplar. Doğru cevapta tır bir kare ilerler, yanlış cevapta olduğu yerde bekler. Şanslı Soru karelerinde önce bir kutu açılır. Çoğunda iki yanlış şık silinir, iki kez yanlış cevap hakkı ya da birine danışma çıkar. Atlama yalnız sağ üst köşededir; orada 1 ya da 2 kutu atlanır ve soru sorulmaz. Tır "Gümrüğe Takıldın" karesindeyken seçilen kişi gümrükte kalır, tır yoluna devam eder. Ceza karesine gelen tır bir kare geri gider. Varıştan önce gümrükte kalan arkadaşlar, tahta sorularından ayrı olan Koçtaş vaka analizi sınıfça çözülmeden kurtarılamaz ve oyun bitmez!',
    });
  }

  // ---------------- Görünüm ----------------

  function renderAll() {
    renderTiles();
    renderPawn(false);
    renderSidebar();
    renderCenter();
    renderLog();
  }

  function renderSidebar() {
    $('#progressText').innerHTML = `<b>${String(game.pos).padStart(2, '0')}</b><span>/ ${LAST}</span><em>${esc(tiles[game.pos].name)}</em>`;
    $('#progressBar').style.width = `${(game.pos / LAST) * 100}%`;
    $('#statCorrect').textContent = game.stats.correct;
    $('#statWrong').textContent = game.stats.wrong;
    $('#statPeople').textContent = game.answered.length;

    const items = [
      ...game.detained.map((d) => `<li>${icon('shieldAlert')}<span>${esc(d.name)}</span><small>${esc(tiles[d.tile] ? tiles[d.tile].name : '')}</small></li>`),
      ...game.rescued.map((n) => `<li class="rescued">${icon('check')}<span>${esc(n)}</span><small>kurtarıldı</small></li>`),
    ];
    $('#detainedList').innerHTML = items.length ? items.join('') : '<li class="empty">Gümrükte bekleyen yok.</li>';
  }

  function renderCenter() {
    const atFinish = game.rescueMode && !game.finished;
    $('#board').classList.toggle('rescue', atFinish);
    const btn = $('#btnMain');
    btn.disabled = busy;
    if (game.finished) btn.innerHTML = `${icon('trophy')}Kazandınız`;
    else if (atFinish) btn.innerHTML = `${icon('siren')}Kurtarma Operasyonu · ${game.detained.length}`;
    else btn.innerHTML = `${icon('users')}Kişi Seç`;
    btn.classList.toggle('danger-glow', atFinish);

    if (atFinish && game.detained.length) {
      $('#personLabel').textContent = 'Kurtarılacak kişi';
      $('#personName').textContent = game.detained[0].name;
    } else {
      $('#personLabel').textContent = 'Seçilen kişi';
      $('#personName').textContent = game.current || '—';
    }
  }

  function renderLog() {
    $('#gameLog').innerHTML = game.log.map((e) => {
      const entry = typeof e === 'string' ? { m: e } : e;
      return `<li class="log-${entry.k || 'info'}">${esc(entry.m)}</li>`;
    }).join('');
  }

  function log(msg, kind) {
    game.log.unshift({ m: msg, k: kind || 'info' });
    game.log = game.log.slice(0, 100);
    renderLog();
  }

  function shakePawn() {
    LP.Sound.shake();
    pawnEl.classList.remove('shake');
    void pawnEl.offsetWidth;
    pawnEl.classList.add('shake');
  }

  function flashTile(i) {
    const el = tileEls[i];
    el.classList.remove('landed');
    void el.offsetWidth;
    el.classList.add('landed');
  }

  // ---------------- Modal ----------------

  function openModal(html) {
    $('#modalCard').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }

  function closeModal() {
    $('#modal').classList.add('hidden');
    $('#modalCard').classList.remove('wide', 'case-fit', 'qshow');
    $('#modalCard').innerHTML = '';
  }

  const isModalOpen = () => !$('#modal').classList.contains('hidden');

  function showInfo({ icon: ic, tone, title, text, sub }) {
    return new Promise((resolve) => {
      openModal(`
        <div class="info-card">
          <div class="info-icon tone-${tone || 'default'}">${icon(ic)}</div>
          <h2>${esc(title)}</h2>
          <p>${esc(text)}</p>
          ${sub ? `<div class="info-sub">${esc(sub)}</div>` : ''}
          <button class="btn primary" id="infoOk">Tamam</button>
        </div>`);
      const ok = $('#infoOk');
      ok.focus();
      ok.onclick = () => { closeModal(); resolve(); };
    });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------------- Test modu ----------------

  const TEST_SOUNDS = {
    picked: 'Kişi seçildi', question: 'Soru açıldı', chance: 'Şans karesine varış', lucky: 'Şanslı soru', boxOpen: 'Kutu açıldı',
    correct: 'Doğru cevap', wrong: 'Yanlış cevap', truck: 'Tır ilerliyor', shake: 'Tır titriyor',
    tension: 'Ceza gerilimi', penalty: 'Ceza (offf)', jail: 'Nezarethane', siren: 'Siren', victory: 'Kazanma',
  };

  async function testJump(i) {
    if (busy || isModalOpen()) return;
    busy = true;
    game.finished = false;
    game.rescueMode = false;
    game.usedPenalties = game.usedPenalties.filter((p) => p !== i);
    log(`Test: tır ${i}. kareye götürüldü.`);
    if (i === 0) {
      game.pos = 0;
      renderAll();
    } else if (i === LAST) {
      game.pos = LAST - 1;
      renderAll();
      await advance();
    } else {
      game.pos = i - 1;
      renderAll();
      await moveForward();
      await resolveLanding();
    }
    save();
    busy = false;
    renderAll();
  }

  function testAddDetained() {
    if (busy) return;
    const pool = availablePeople().filter((n) => n !== game.current);
    if (!pool.length) return;
    const name = pool[Math.floor(Math.random() * pool.length)];
    const customs = tiles.findIndex((t) => t.type === 'customs');
    game.detained.push({ name, tile: customs >= 0 ? customs : game.pos });
    log(`Test: ${name} gümrüğe eklendi.`, 'bad');
    save();
    renderAll();
  }

  function buildTestPanel() {
    document.body.classList.add('test-mode');
    const panel = document.createElement('div');
    panel.className = 'test-panel';
    panel.innerHTML = `
      <div class="tp-head">
        <b>Test Modu</b>
        <button class="tp-toggle" id="tpToggle" title="Küçült">–</button>
      </div>
      <div class="tp-body">
        <p class="tp-note">Gerçek oyun etkilenmez. Tahtada bir kareye tıklayarak tırı oraya götürebilirsiniz.</p>
        <label class="tp-row">Kareye git
          <select id="tpTile">${tiles.map((t, i) => `<option value="${i}">${i} · ${esc(t.name)}</option>`).join('')}</select>
          <button class="btn sm primary" id="tpGo">Git</button>
        </label>
        <label class="tp-check"><input type="checkbox" id="tpAnswer"${showTestAnswer() ? ' checked' : ''}> Doğru şıkkı işaretle</label>
        <div class="tp-grid">
          <button class="btn sm" id="tpDetain">Gümrüğe kişi ekle</button>
          <button class="btn sm" id="tpAlarm">Bitiş alarmı</button>
          <button class="btn sm" id="tpVictory">Kazanma ekranı</button>
          <button class="btn sm" id="tpReset">Testi sıfırla</button>
        </div>
        <label class="tp-row">Ses dene
          <select id="tpSound">${Object.entries(TEST_SOUNDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          <button class="btn sm" id="tpPlay">${icon('volume')}</button>
        </label>
        <a class="btn sm ghost tp-exit" href="index.html">Testten çık</a>
      </div>`;
    document.body.appendChild(panel);

    $('#tpToggle').onclick = () => {
      panel.classList.toggle('collapsed');
      $('#tpToggle').textContent = panel.classList.contains('collapsed') ? '+' : '–';
    };
    $('#tpGo').onclick = () => testJump(Number($('#tpTile').value));
    $('#tpAnswer').onchange = (e) => localStorage.setItem(TEST_ANSWER_KEY, e.target.checked ? 'on' : 'off');
    $('#tpDetain').onclick = testAddDetained;
    $('#tpAlarm').onclick = () => {
      if (busy || isModalOpen()) return;
      if (!game.detained.length) testAddDetained();
      testJump(LAST);
    };
    $('#tpVictory').onclick = () => { if (!busy) showVictory(); };
    $('#tpReset').onclick = () => newGame(true);
    $('#tpPlay').onclick = () => {
      const name = $('#tpSound').value;
      LP.Sound[name]();
      if (name === 'victory') LP.confetti(4000);
    };
  }

  // ---------------- Başlat ----------------

  if (game.pos > LAST) game.pos = 0;
  if (game.pos === LAST && !game.finished) {
    game.pos = LAST - 1;
    game.rescueMode = true;
  }
  buildBoard();
  if (LP.TEST_MODE) buildTestPanel();
  if (!game.log.length) log('Hoş geldiniz! "Kişi Seç" ile ilk kişiyi belirleyin.');
  renderAll();

  $('#btnMain').addEventListener('click', onMainAction);
  $('#btnNewGame').addEventListener('click', () => newGame(false));
  $('#btnHelp').addEventListener('click', () => { if (!busy && !isModalOpen()) showHelp(); });
  const renderSoundBtn = () => {
    $('#btnSound').innerHTML = `${icon(LP.Sound.enabled ? 'volume' : 'volumeOff')}Ses ${LP.Sound.enabled ? 'Açık' : 'Kapalı'}`;
  };
  renderSoundBtn();
  $('#btnSound').addEventListener('click', () => { LP.Sound.toggle(); renderSoundBtn(); });
  const renderFullBtn = () => {
    const on = !!document.fullscreenElement;
    $('#btnFull').innerHTML = `${icon(on ? 'minimize' : 'maximize')}${on ? 'Tam Ekrandan Çık' : 'Tam Ekran'}`;
  };
  renderFullBtn();
  $('#btnFull').addEventListener('click', () => {
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const go = document.fullscreenElement ? exit.call(document) : req.call(root);
    if (go && go.catch) go.catch(() => {});
  });
  document.addEventListener('fullscreenchange', renderFullBtn);
  window.addEventListener('resize', () => renderPawn(false));
  document.addEventListener('keydown', (e) => {
    if (isModalOpen()) return;
    if ((e.code === 'Space' || e.code === 'Enter') && e.target === document.body) {
      e.preventDefault();
      onMainAction();
    }
  });
  window.addEventListener('storage', (e) => {
    if ((e.key === LP.Store.KEY || e.key === LP.GameStore.KEY) && !busy) location.reload();
  });
})();
