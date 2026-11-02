/* دردشة بوبو — a chat where Bubu the owl and Lulu tell «لغتي» stories to a child, one message at a time.
   The child answers with taps; words come back in later chats so they stick without feeling like a test. */
(() => {
'use strict';
const D = window.DATA, EMO = window.EMO || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = a => a[Math.random() * a.length | 0];
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const norm = s => String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const noTash = s => String(s).replace(/[ً-ْ]/g, '');
const arShort = m => noTash(String(m).split(/[،,+؛;]/)[0]).trim();
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the two friends ---------- */
const OWL = (size = 44, mood = 'happy') => `<svg class="owl ${mood}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true"><path d="M26 46 L20 18 L44 34 Z" fill="#7A4FD6"/><path d="M94 46 L100 18 L76 34 Z" fill="#7A4FD6"/><ellipse cx="60" cy="66" rx="38" ry="42" fill="#8E63F0"/><ellipse cx="60" cy="80" rx="24" ry="24" fill="#FFE3A6"/><path class="wing l" d="M23 62 q-10 18 4 34 q6-14 4-34z" fill="#6B44CF"/><path class="wing r" d="M97 62 q10 18-4 34 q-6-14-4-34z" fill="#6B44CF"/><circle cx="44" cy="50" r="15" fill="#fff"/><circle cx="76" cy="50" r="15" fill="#fff"/>${mood === 'wow' ? '<circle cx="44" cy="50" r="8" fill="#2A1E5C"/><circle cx="76" cy="50" r="8" fill="#2A1E5C"/>' : '<circle cx="46" cy="51" r="6.5" fill="#2A1E5C"/><circle cx="78" cy="51" r="6.5" fill="#2A1E5C"/>'}<circle cx="48" cy="48" r="2.4" fill="#fff"/><circle cx="80" cy="48" r="2.4" fill="#fff"/><path d="M55 60 L65 60 L60 69 Z" fill="#FFB020"/><circle cx="33" cy="64" r="5" fill="#FF8FB1" opacity=".7"/><circle cx="87" cy="64" r="5" fill="#FF8FB1" opacity=".7"/></svg>`;
/* Lulu: an original little girl with two puffs and a bow */
const LULU = (size = 44, mood = 'happy') => `<svg class="lulu ${mood}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true"><circle cx="24" cy="34" r="17" fill="#5A3A2E"/><circle cx="96" cy="34" r="17" fill="#5A3A2E"/><circle cx="60" cy="66" r="40" fill="#5A3A2E"/><ellipse cx="60" cy="72" rx="32" ry="33" fill="#FFD7B5"/><path d="M28 58 q32 -30 64 0 q-6 -26 -32 -28 q-26 2 -32 28z" fill="#5A3A2E"/><path d="M84 30 l14 -8 l-2 14 z M84 30 l12 10 l-14 2 z" fill="#FF5D8F"/><circle cx="85" cy="32" r="4" fill="#FF8FB1"/>${mood === 'wow' ? '<circle cx="47" cy="72" r="6" fill="#2A1E1E"/><circle cx="73" cy="72" r="6" fill="#2A1E1E"/><ellipse cx="60" cy="92" rx="6" ry="7" fill="#C2414F"/>' : mood === 'think' ? '<path d="M41 72 q6 -5 12 0 M67 72 q6 -5 12 0" stroke="#2A1E1E" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M52 92 q8 -3 16 0" stroke="#C2414F" stroke-width="4" fill="none" stroke-linecap="round"/>' : '<circle cx="47" cy="72" r="5" fill="#2A1E1E"/><circle cx="73" cy="72" r="5" fill="#2A1E1E"/><circle cx="49" cy="70" r="1.8" fill="#fff"/><circle cx="75" cy="70" r="1.8" fill="#fff"/><path d="M50 88 q10 9 20 0" stroke="#C2414F" stroke-width="4" fill="#fff" stroke-linecap="round"/>'}<circle cx="38" cy="84" r="5" fill="#FF8FB1" opacity=".6"/><circle cx="82" cy="84" r="5" fill="#FF8FB1" opacity=".6"/></svg>`;
const KIDS = ['👧', '👧🏻', '👧🏽', '👧🏾', '👸', '🧚‍♀️', '🦸‍♀️', '🐰', '🦄', '🐱'];

/* ---------- stories → chats ---------- */
const STORIES = [...(D.L.A || []), ...(D.L.B || [])];
const BY = new Map(STORIES.map((s, ix) => { s.ix = ix; return [s.id, s]; }));
const emoOf = w => EMO[w] || EMO[String(w).toLowerCase()] || '';
function vocab(s) {
  if (s._v) return s._v; const seen = new Set();
  return s._v = s.w.filter(([w]) => { const k = norm(w); if (!k || seen.has(k)) return false; seen.add(k); return true; }).map(([w, m]) => ({ w, m, k: norm(w), emo: emoOf(w), s: s.id }));
}
function pages(s) {
  if (s._pg) return s._pg; const out = []; let gi = 0; const vk = new Map(vocab(s).map(v => [v.k, v]));
  s.p.forEach(([en, ar], pi) => {
    const tk = []; let bold = false, cur = '', curB = false, grp = -1, g = 0;
    const flush = () => { if (cur) tk.push({ t: cur, b: curB, g: curB ? grp : -1, gi: gi++ }); cur = ''; curB = false; };
    for (let i = 0; i < en.length; i++) { if (en[i] === '*' && en[i + 1] === '*') { bold = !bold; if (bold) grp = g++; i++; continue; } if (/\s/.test(en[i])) { flush(); continue; } cur += en[i]; if (bold) curB = true; }
    flush();
    const groups = {}; tk.forEach((x, k) => { if (x.g >= 0) (groups[x.g] = groups[x.g] || []).push(k); });
    const words = [];
    Object.values(groups).forEach(ks => { for (let a = 0; a < ks.length; a++) for (let b = ks.length - 1; b >= a; b--) { const v = vk.get(norm(ks.slice(a, b + 1).map(k => tk[k].t).join(' '))); if (v && !words.includes(v)) { for (let k = a; k <= b; k++) tk[ks[k]].v = v; words.push(v); a = b; break; } } });
    const pics = []; words.forEach(v => v.emo && !pics.includes(v.emo) && pics.push(v.emo));
    tk.forEach(x => { const c = x.t.replace(/[^A-Za-z'-]/g, ''); const e = emoOf(c) || emoOf(c.toLowerCase()); if (e && !pics.includes(e) && pics.length < 3) pics.push(e); });
    out.push({ en, ar, tk, words, pics: pics.slice(0, 3), pi });
  });
  return s._pg = out;
}
const STOP = new Set('a an the to of in on at is am are was were be it i he she we they you and or but for with by as so not do does did this that these those my his her our their its me him us them from up'.split(' '));
const quiz = v => v.k.length > 2 && !STOP.has(v.k);
const PER = 7; /* sentences per chat part */
const parts = s => Math.ceil(pages(s).length / PER);

/* ---------- progress ---------- */
const KEY = 'bubu-chat.v1';
const DEF = { name: '', av: 0, done: {}, words: {}, stk: [], stars: 0, sfx: true, arVoice: true, rate: 1, last: null };
let G = Object.assign({}, DEF);
try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r) G = Object.assign({}, DEF, r); } catch (e) { }
let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { } }, 120); };
const wid = v => v.s + ':' + v.k;
const markWord = (v, ok) => { const r = G.words[wid(v)] || (G.words[wid(v)] = { ok: 0, bad: 0, t: 0 }); ok ? r.ok++ : r.bad++; r.t = Date.now(); save(); };
const meet = v => { if (!G.words[wid(v)]) { G.words[wid(v)] = { ok: 0, bad: 0, t: Date.now() }; save(); } };
const STICKERS = '🦄🐳🦋🌈🍩🚀🐙🦖🍉🎈🐝🌻🍭🐢🦜🎠🧁🐬🍦🦒🐞🌟🎡🐨🦔🍓🐠🪁🦩🍪🐣🌵🦕🐿️🍒🎪🐌🦀🍕🛸'.match(/\p{Extended_Pictographic}(️)?/gu);
const kidName = () => G.name || 'حبيبتي';

/* ---------- audio ---------- */
const enSay = w => String(w).replace(/-[^-]*-/g, '').replace(/\s\+.*$/, '').replace(/\bsb\b/g, 'somebody').replace(/\bsth\b/g, 'something').replace(/[؀-ۿ()\[\]]/g, '').replace(/\s+/g, ' ').trim().replace(/^[ ,.;:]+|[ ,.;:]+$/g, '');
const enKey = w => enSay(w).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' -]/g, ' ').trim();
const AU = D.au || { e: {} };
const PACKS = {}, PWAIT = {}, URLS = {};
window.__wp = (name, obj) => { PACKS[name] = obj; (PWAIT[name] || []).forEach(f => f()); delete PWAIT[name]; };
function loadPack(name) { return new Promise(res => { if (PACKS[name]) return res(); if (PWAIT[name]) return PWAIT[name].push(res); PWAIT[name] = [res]; const sc = document.createElement('script'); sc.src = 'wp/' + name + '.js'; sc.onerror = () => { (PWAIT[name] || []).forEach(f => f()); delete PWAIT[name]; }; document.head.appendChild(sc); }); }
async function clipUrl(w) { const id = AU.e[enKey(w)]; if (!id) return null; if (URLS[id]) return URLS[id]; const name = 'e' + id[0]; await loadPack(name); const b = PACKS[name]?.[id]; if (!b) return null; const bin = atob(b), u = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j); return URLS[id] = URL.createObjectURL(new Blob([u], { type: 'audio/webm' })); }
const prefetch = s => [...new Set(vocab(s).map(v => AU.e[enKey(v.w)]).filter(Boolean).map(id => 'e' + id[0]))].forEach(loadPack);
const wa = new Audio(), SA = new Audio(); let saSrc = '', saRaf = 0, tok = 0;
let voices = []; try { const pv = () => { voices = speechSynthesis.getVoices(); }; pv(); speechSynthesis.onvoiceschanged = pv; } catch (e) { }
function tts(text, lang, rate) {
  return new Promise(res => {
    const C = window.Capacitor?.Plugins?.TextToSpeech; if (C) { C.speak({ text, lang: lang === 'ar' ? 'ar-SA' : 'en-US', rate, volume: 1, category: 'ambient' }).then(res, res); return; }
    try { const v = voices.find(x => lang === 'ar' ? /^ar/i.test(x.lang) : /^en[-_]US/i.test(x.lang)); if (lang === 'ar' && !v) return res(); const u = new SpeechSynthesisUtterance(text); if (v) u.voice = v; u.lang = v ? v.lang : 'en-US'; u.rate = rate; u.onend = res; u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 8000); } catch (e) { res(); }
  });
}
function stopAll() { tok++; try { wa.pause(); SA.pause(); } catch (e) { } cancelAnimationFrame(saRaf); try { speechSynthesis.cancel(); window.Capacitor?.Plugins?.TextToSpeech?.stop?.(); } catch (e) { } }
async function sayWord(w, rate = 1) {
  stopAll(); const my = tok; const url = await clipUrl(w); if (my !== tok) return;
  if (!url) return tts(enSay(w), 'en', .8 * rate);
  return new Promise(res => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; wa.onended = fin; wa.onerror = fin; wa.src = url; wa.playbackRate = rate * (G.rate || 1); wa.play().catch(fin); setTimeout(fin, 7000); });
}
const sayAr = text => G.arVoice ? tts(noTash(text), 'ar', .95) : Promise.resolve();
/* play one story sentence and light each word as it is said */
function playPage(s, pg, bubble) {
  return new Promise(res => {
    const T = k => s.t[k] / 100, i0 = pg.tk[0]?.gi, i1 = pg.tk[pg.tk.length - 1]?.gi;
    if (!s.a || i0 == null || i0 >= s.t.length) return res();
    stopAll(); const my = tok;
    if (saSrc !== s.a) { SA.src = s.a; saSrc = s.a; }
    SA.playbackRate = .92 * (G.rate || 1);
    const st = Math.max(0, T(i0) - .12), en = i1 + 1 < s.t.length ? T(i1 + 1) - .08 : s.d;
    const els = bubble ? $$('.t', bubble) : [];
    const go = () => { try { SA.currentTime = st; } catch (e) { } SA.play().catch(res); let last = -1;
      let lt = -1, lc = performance.now(); const t0 = performance.now(), lim = ((en - st) / SA.playbackRate + 4) * 1000;
      const f = () => { if (my !== tok) return res(); const t = SA.currentTime, now = performance.now();
        if (t !== lt) { lt = t; lc = now; }
        if (t >= en || SA.ended || now - lc > 2500 || now - t0 > lim) { SA.pause(); els.forEach(e => e.classList.remove('on')); return res(); }
        let idx = -1; for (let k = 0; k < pg.tk.length; k++) { const g = pg.tk[k].gi; if (g < s.t.length && T(g) <= t + .03) idx = k; else break; }
        if (idx !== last) { els.forEach((e, k) => e.classList.toggle('on', k === idx)); last = idx; }
        saRaf = requestAnimationFrame(f); };
      saRaf = requestAnimationFrame(f); };
    if (SA.readyState >= 1) go(); else { SA.addEventListener('loadedmetadata', go, { once: true }); SA.load(); }
    setTimeout(res, 40000);
  });
}
let AC = null;
function tone(f, t0, dur, type = 'sine', vol = .12) { if (!G.sfx) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .05); } catch (e) { } }
const SFX = { msg: () => tone(880, 0, .07, 'sine', .06), send: () => { tone(620, 0, .06, 'triangle', .07); tone(930, .05, .08, 'triangle', .06); }, ok: () => [660, 880, 1320].forEach((f, k) => tone(f, k * .08, .18, 'triangle', .1)), no: () => tone(300, 0, .2, 'sine', .07), win: () => [523, 659, 784, 1046, 1318].forEach((f, k) => tone(f, k * .1, .3, 'triangle', .12)) };
function confetti() {
  if (reduce) return; const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
  const cols = ['#FF5D8F', '#FFC23D', '#7C5CFF', '#16C79A', '#3BB2FF'];
  const ps = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, a: 0, va: (Math.random() - .5) * .4, c: rnd(cols) }));
  const t0 = performance.now(); (function f(t) { x.clearRect(0, 0, innerWidth, innerHeight); ps.forEach(p => { p.vy += .3; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (t - t0 < 2400) requestAnimationFrame(f); else c.remove(); })(t0);
}

/* ---------- screens ---------- */
function render() { if (!G.name) return hello(); list(); }
function hello() {
  app.innerHTML = `<main class="hello">
    <div class="duo">${OWL(110, 'wow')}${LULU(104, 'happy')}</div>
    <div class="say1">أهلًا! أنا <b>بوبو</b> 🦉 وهاي صاحبتي <b>لولو</b> 👧<br>بدنا نحكيلك قصص بالإنجليزي ونلعب سوا. شو اسمك؟</div>
    <input class="nm" id="nm" maxlength="16" placeholder="اكتبي اسمك هون" autocomplete="off" aria-label="الاسم">
    <div class="avs">${KIDS.map((e, k) => `<button type="button" class="avb ${k === G.av ? 'on' : ''}" data-av="${k}" aria-label="شخصية">${e}</button>`).join('')}</div>
    <button class="go" type="button" id="go">يلا نبلّش! 💬</button></main>`;
  $$('[data-av]').forEach(b => b.onclick = () => { G.av = +b.dataset.av; $$('.avb').forEach(x => x.classList.toggle('on', x === b)); SFX.msg(); });
  $('#go').onclick = () => { G.name = ($('#nm').value || '').trim() || 'حبيبتي'; save(); SFX.win(); list(); };
}
function nextStory() { return STORIES.find(s => (G.done[s.id] || 0) < parts(s)) || STORIES[0]; }
function list() {
  stopAll(); document.body.classList.remove('in-chat');
  const nx = nextStory();
  app.innerHTML = `<header class="lh"><div class="in"><span class="me">${KIDS[G.av]}</span><div class="grow"><b>أهلًا ${esc(kidName())}!</b><small>⭐ ${AR(G.stars)} · 🎟️ ${AR(G.stk.length)} ملصق</small></div><button class="ib" type="button" id="set" aria-label="الإعدادات">⚙️</button></div></header>
    <main class="lw">
      <button class="cont" type="button" data-s="${nx.id}"><span class="duo s">${OWL(46)}${LULU(42)}</span><span class="grow"><b>كمّلي الدردشة</b><small>${esc(noTash(nx.ar))} · الجزء ${AR(Math.min(parts(nx), (G.done[nx.id] || 0) + 1))} من ${AR(parts(nx))}</small></span><span class="pill">يلا 💬</span></button>
      ${G.stk.length ? `<div class="stks">${G.stk.slice(-12).map(e => `<span>${e}</span>`).join('')}</div>` : ''}
      <h2>كل الدردشات</h2>
      <div class="threads">${STORIES.map(s => { const d = G.done[s.id] || 0, n = parts(s), pg = pages(s); const prev = pg[Math.min(pg.length - 1, d * PER)]; return `<button class="th" type="button" data-s="${s.id}"><span class="tav" style="background:var(--c${s.ix % 5})">${pg.find(p => p.pics.length)?.pics[0] || '📖'}</span><span class="grow"><b>${esc(noTash(s.ar))}</b><small>${d >= n ? '✅ خلصت كل الأجزاء' : esc(prev.en.replace(/\*\*/g, '').slice(0, 46)) + '…'}</small></span><span class="meta">${d >= n ? '⭐' : s === nx ? '<span class="new">جديد</span>' : `${AR(d)}/${AR(n)}`}</span></button>`; }).join('')}</div>
    </main>`;
  $$('[data-s]').forEach(b => b.onclick = () => openChat(BY.get(b.dataset.s)));
  $('#set').onclick = settings;
}
function settings() {
  const sc = document.createElement('div'); sc.className = 'scrim'; const p = document.createElement('div'); p.className = 'sheet';
  p.innerHTML = `<div class="in"><b style="font-size:19px">الإعدادات</b>
    <label class="row">الاسم <input class="nm sm" id="nm2" value="${esc(G.name)}" maxlength="16"></label>
    <div class="row">الشخصية <span class="avs sm">${KIDS.map((e, k) => `<button type="button" class="avb ${k === G.av ? 'on' : ''}" data-av="${k}">${e}</button>`).join('')}</span></div>
    <label class="row"><input type="checkbox" id="arv" ${G.arVoice ? 'checked' : ''}> لولو تقرا الكلام العربي بصوت</label>
    <label class="row"><input type="checkbox" id="sfx" ${G.sfx ? 'checked' : ''}> أصوات الرسائل</label>
    <div class="row">سرعة الصوت <span class="seg">${[[.8, 'بطيء'], [1, 'عادي']].map(([v, l]) => `<button type="button" data-r="${v}" class="${G.rate === v ? 'on' : ''}">${l}</button>`).join('')}</span></div>
    <button class="go" type="button" id="ok">تمام</button></div>`;
  document.body.append(sc, p);
  $$('[data-av]', p).forEach(b => b.onclick = () => { G.av = +b.dataset.av; $$('.avb', p).forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-r]', p).forEach(b => b.onclick = () => { G.rate = +b.dataset.r; $$('[data-r]', p).forEach(x => x.classList.toggle('on', x === b)); });
  const close = () => { G.name = $('#nm2', p).value.trim() || G.name; G.arVoice = $('#arv', p).checked; G.sfx = $('#sfx', p).checked; save(); sc.remove(); p.remove(); list(); };
  $('#ok', p).onclick = close; sc.onclick = close;
}

/* ---------- the chat ---------- */
let C = null;
function openChat(s) {
  stopAll(); prefetch(s); G.last = s.id; save(); document.body.classList.add('in-chat');
  const part = Math.min(parts(s) - 1, G.done[s.id] || 0);
  C = { s, part, run: Math.random(), stars: 0, asked: 0, ok: 0, met: [] };
  app.innerHTML = `<header class="ch"><div class="in"><button class="ib" type="button" id="back" aria-label="رجوع">→</button><span class="duo s">${OWL(40)}${LULU(38)}</span><div class="grow"><b>بوبو ولولو</b><small id="status">متّصلين الآن</small></div><span class="star" id="st">⭐ <span>0</span></span></div></header>
    <main class="feed" id="feed" aria-live="polite"></main>
    <footer class="replies" id="rp"><div class="in" id="rpin"></div></footer>`;
  $('#back').onclick = () => { C = null; list(); };
  runChat(C);
}
const alive = c => C === c && $('#feed');
function status(t) { const e = $('#status'); if (e) e.textContent = t; }
function scrollEnd() { const f = $('#feed'); if (f) f.scrollTo({ top: f.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); }
async function typing(who, ms = 700) {
  const f = $('#feed'); if (!f) return; const t = document.createElement('div'); t.className = 'msg ' + who + ' typing';
  t.innerHTML = `<span class="av">${who === 'bubu' ? OWL(34) : LULU(34)}</span><div class="bub"><i></i><i></i><i></i></div>`;
  f.appendChild(t); status((who === 'bubu' ? 'بوبو' : 'لولو') + ' عم ' + (who === 'bubu' ? 'يكتب' : 'تكتب') + '…'); scrollEnd();
  await wait(reduce ? 150 : ms); t.remove(); status('متّصلين الآن');
}
function addMsg(who, html, cls = '') {
  const f = $('#feed'); if (!f) return null; const m = document.createElement('div'); m.className = `msg ${who} ${cls}`;
  m.innerHTML = who === 'me' ? `<div class="bub">${html}</div><span class="av me">${KIDS[G.av]}</span>` : `<span class="av">${who === 'bubu' ? OWL(34) : LULU(34)}</span><div class="bub"><span class="who">${who === 'bubu' ? 'بوبو' : 'لولو'}</span>${html}</div>`;
  f.appendChild(m); SFX.msg(); scrollEnd(); return m;
}
async function say(c, who, html, opt = {}) { if (!alive(c)) return null; await typing(who, opt.t ?? (300 + Math.min(1200, String(html).replace(/<[^>]+>/g, '').length * 22))); if (!alive(c)) return null; const m = addMsg(who, html, opt.cls); if (opt.ar && alive(c)) await sayAr(opt.ar); return m; }
/* show reply buttons and wait for a tap */
function ask(c, opts, cls = '') {
  return new Promise(res => {
    const box = $('#rpin'); if (!box) return res(null); box.className = 'in ' + cls;
    box.innerHTML = opts.map((o, k) => `<button type="button" class="rb ${o.cls || ''}" data-k="${k}">${o.html}</button>`).join('');
    $('#rp').classList.add('up'); setTimeout(scrollEnd, 330);
    $$('.rb', box).forEach(b => b.onclick = () => { if (!alive(c)) return res(null); const o = opts[+b.dataset.k]; box.innerHTML = ''; $('#rp').classList.remove('up'); SFX.send(); res(o); });
  });
}
const wordHtml = v => `<span class="vw" data-w="${esc(v.w)}">${v.emo ? v.emo + ' ' : ''}<b class="en">${esc(v.w)}</b></span>`;
document.addEventListener('click', e => {
  const w = e.target.closest('[data-w]'); if (w) { e.stopPropagation(); w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); sayWord(w.dataset.w); return; }
  const r = e.target.closest('[data-replay]'); if (r && C) { const pg = pages(C.s)[+r.dataset.replay]; playPage(C.s, pg, r.closest('.bub')); }
}, true);
const PRAISE_L = ['يا شاطرة! 👏', 'برافو عليكي! 🌟', 'صح صح! 🎉', 'واو إنتِ ذكية كتير! 💖', 'هايلة! 🥳'];
const PRAISE_B = ['Great job!', 'Well done!', 'Super!', 'Excellent!', 'Wow!'];
const SOFT = ['ولا يهمك، بنتعلم سوا 🤗', 'مش مشكلة، هاي الصح 😊'];
function star(c, el) { c.stars++; G.stars++; save(); const s = $('#st span'); if (s) { s.textContent = c.stars; s.parentElement.classList.remove('bump'); void s.parentElement.offsetWidth; s.parentElement.classList.add('bump'); } }

/* the games inside the chat, all about words just met */
async function gameMeaning(c, v, pool) {
  const ms = shuffle([v, ...shuffle(pool.filter(x => x !== v && quiz(x) && arShort(x.m) !== arShort(v.m))).slice(0, 2)]);
  await say(c, 'lulu', `بوبو، شو يعني ${wordHtml(v)}؟ 🤔<br><small>${esc(kidName())}، بتعرفي؟ ساعديني!</small>`, { ar: `بوبو شو يعني الكلمة؟ ${kidName()} بتعرفي؟` });
  sayWord(v.w);
  const pick = await ask(c, ms.map(x => ({ html: `${x.emo ? x.emo + ' ' : ''}${esc(arShort(x.m))}`, x })));
  if (!pick) return; addMsg('me', `${pick.x.emo ? pick.x.emo + ' ' : ''}${esc(arShort(pick.x.m))}`);
  const ok = pick.x === v; c.asked++; markWord(v, ok);
  if (ok) { c.ok++; star(c); SFX.ok(); await say(c, 'lulu', `${rnd(PRAISE_L)} ${wordHtml(v)} يعني <b>${esc(arShort(v.m))}</b>`, { ar: `يعني ${arShort(v.m)}` }); }
  else { SFX.no(); await say(c, 'bubu', `${rnd(SOFT)}<br>${wordHtml(v)} يعني <b>${esc(arShort(v.m))}</b>`, { cls: 'soft' }); sayWord(v.w); }
}
async function gamePicture(c, v, pool) {
  const ps = shuffle([v, ...shuffle(pool.filter(x => x.emo && x.emo !== v.emo)).slice(0, 2)]);
  if (ps.length < 3) return gameMeaning(c, v, pool);
  await say(c, 'bubu', `<span class="en">Show me <b>${esc(v.w)}</b>!</span> 👀<br><small>وين الصورة؟ اضغطي عليها!</small>`);
  sayWord(v.w);
  const pick = await ask(c, ps.map(x => ({ html: `<span class="bigemo">${x.emo}</span>`, x })), 'pics');
  if (!pick) return; addMsg('me', `<span class="bigemo">${pick.x.emo}</span>`);
  const ok = pick.x === v; c.asked++; markWord(v, ok);
  if (ok) { c.ok++; star(c); SFX.ok(); await say(c, 'bubu', `<b class="en">${rnd(PRAISE_B)}</b> ${v.emo} = ${wordHtml(v)} ✨`); sayWord(v.w); }
  else { SFX.no(); await say(c, 'lulu', `${rnd(SOFT)}<br>هاي هي ${wordHtml(v)} 👉 <span class="bigemo">${v.emo}</span>`, { ar: arShort(v.m) }); }
}
async function gameVoice(c, v, pool) {
  const ws = shuffle([v, ...shuffle(pool.filter(x => x.k !== v.k && quiz(x))).slice(0, 2)]);
  const m = await say(c, 'bubu', `<button class="vn" type="button" data-w="${esc(v.w)}"><span>▶</span><i></i><i></i><i></i><i></i><i></i><i></i><i></i><small>رسالة صوتية</small></button><small>اسمعي… شو قلت؟ 🎧</small>`);
  if (!m) return; await sayWord(v.w);
  const pick = await ask(c, ws.map(x => ({ html: `${x.emo ? x.emo + ' ' : ''}<span class="en">${esc(x.w)}</span>`, x })));
  if (!pick) return; addMsg('me', `<span class="en">${esc(pick.x.w)}</span>`);
  const ok = pick.x === v; c.asked++; markWord(v, ok);
  if (ok) { c.ok++; star(c); SFX.ok(); await say(c, 'bubu', `<b class="en">${rnd(PRAISE_B)}</b> 🎧 ${wordHtml(v)}`); }
  else { SFX.no(); await say(c, 'bubu', `${rnd(SOFT)} قلت ${wordHtml(v)}`, { cls: 'soft' }); sayWord(v.w); }
}
async function gameSpell(c, v) {
  const w = v.w.toLowerCase(); if (!/^[a-z]{3,6}$/.test(w)) return false;
  await say(c, 'lulu', `ساعديني أكتب ${v.emo || ''} <b class="en">${esc(v.w)}</b> ✍️<br><small>اضغطي الحروف بالترتيب</small>`, { ar: 'ساعديني أكتبها' });
  sayWord(v.w);
  const letters = w.split(''); let got = 0, mist = 0;
  const box = $('#rpin'); if (!box) return true; $('#rp').classList.add('up'); setTimeout(scrollEnd, 330); box.className = 'in spell';
  await new Promise(res => {
    const draw = () => { box.innerHTML = `<div class="slots en">${letters.map((ch, k) => `<span class="${k < got ? 'f' : ''}">${k < got ? ch : ''}</span>`).join('')}</div><div class="lets en">${shuffle(letters.map((ch, k) => ({ ch, k }))).map(o => `<button type="button" class="rb lt" data-ch="${o.ch}">${o.ch}</button>`).join('')}</div>`;
      $$('.lt', box).forEach(b => b.onclick = () => { if (!alive(c)) return res(); if (b.dataset.ch === letters[got]) { got++; SFX.msg(); b.remove(); const sl = $$('.slots span', box); sl[got - 1].textContent = letters[got - 1]; sl[got - 1].classList.add('f'); if (got === letters.length) { box.innerHTML = ''; $('#rp').classList.remove('up'); res(); } } else { mist++; SFX.no(); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 300); } }); };
    draw();
  });
  if (!alive(c)) return true;
  addMsg('me', `✍️ <b class="en">${esc(v.w)}</b>`); c.asked++; markWord(v, mist === 0); if (mist === 0) { c.ok++; star(c); }
  SFX.ok(); await say(c, 'lulu', `${rnd(PRAISE_L)} كتبتيها ${mist ? 'وتعلّمتيها' : 'من أول مرة'}! ${wordHtml(v)}`, { ar: 'برافو عليكي' }); sayWord(v.w);
  return true;
}
async function gameRepeat(c, v) {
  await say(c, 'bubu', `Say it with me! 🗣️<br>${wordHtml(v)}<br><small>قوليها بصوت عالي معي</small>`);
  await sayWord(v.w, .85); await wait(300); await sayWord(v.w);
  const pick = await ask(c, [{ html: '🗣️ قلتها!' }, { html: '🔁 كمان مرة' }]);
  if (!pick) return; if (pick.html.includes('🔁')) { addMsg('me', '🔁 كمان مرة'); await sayWord(v.w, .8); await ask(c, [{ html: '🗣️ قلتها!' }]); }
  addMsg('me', `🗣️ <b class="en">${esc(v.w)}</b>!`); star(c); SFX.ok();
  await say(c, 'lulu', `${rnd(['صوتك حلو كتير! 🎤', 'قلتيها أحسن مني 😄', 'يا سلام على اللفظ! 👌'])}`, { ar: 'صوتك حلو كتير' });
}
async function runChat(c) {
  const s = c.s, all = pages(s), from = c.part * PER, part = all.slice(from, from + PER), pool = vocab(s);
  await wait(300);
  /* warm-up: words met before come back */
  const here = new Set(part.flatMap(pg => pg.words.map(wid)));
  const old = Object.entries(G.words).filter(([k]) => !here.has(k) && quiz({ k: k.slice(k.indexOf(':') + 1) })).sort((a, b) => (b[1].bad - b[1].ok) - (a[1].bad - a[1].ok) || a[1].t - b[1].t).slice(0, 8).map(([k]) => { const i = k.indexOf(':'), st = BY.get(k.slice(0, i)); return st && vocab(st).find(v => v.k === k.slice(i + 1)); }).filter(Boolean);
  await say(c, 'bubu', `<b class="en">Hello</b> ${esc(kidName())}! 👋`, { t: 500 }); sayWord('hello');
  if (c.part === 0) await say(c, 'lulu', `هاي ${esc(kidName())}! 💖 بوبو بدّه يحكيلنا قصة اليوم: <b>${esc(noTash(s.ar))}</b> ${part.find(p => p.pics.length)?.pics[0] || '📖'}`, { ar: `هاي ${kidName()}! بوبو بده يحكيلنا قصة اليوم` });
  else await say(c, 'lulu', `رجعتي! 🥳 بنكمّل قصة <b>${esc(noTash(s.ar))}</b>، الجزء ${AR(c.part + 1)}`, { ar: 'رجعتي! بنكمّل القصة' });
  if (old.length >= 3 && alive(c)) {
    const v = rnd(old.slice(0, 5));
    await say(c, 'lulu', `بس أول إشي… تتذكّري هاي الكلمة؟ 🤩`, { ar: 'بس أول اشي، تتذكري هاي الكلمة؟' });
    await (v.emo && Math.random() < .6 ? gamePicture(c, v, [...old, ...pool]) : gameMeaning(c, v, [...old, ...pool]));
  }
  if (!alive(c)) return;
  await say(c, 'bubu', `<b class="en">Are you ready?</b> 📖`, { t: 500 });
  const r = await ask(c, [{ html: '✋ جاهزة!' }, { html: '🚀 يلا بوبو!' }]); if (!r) return; addMsg('me', r.html);
  let since = 0; const used = new Set();
  for (let k = 0; k < part.length; k++) {
    if (!alive(c)) return;
    const pg = part[k], idx = from + k;
    const sent = pg.tk.map((t, j) => t.v ? `<span class="t v" data-w="${esc(t.v.w)}">${esc(t.t)}</span>` : `<span class="t">${esc(t.t)}</span>`).join(' ');
    const m = await say(c, 'bubu', `${pg.pics.length ? `<div class="scene">${pg.pics.map(e => `<span>${e}</span>`).join('')}</div>` : ''}<p class="en sent">${sent}</p><p class="tr">${esc(pg.ar)}</p><button class="rep" type="button" data-replay="${idx}" aria-label="اسمعي مرة ثانية">🔊</button>`, { cls: 'story' });
    if (!m) return;
    pg.words.forEach(v => { meet(v); if (!c.met.includes(v)) c.met.push(v); });
    await playPage(s, pg, $('.bub', m));
    if (!alive(c)) return;
    since++;
    const fresh = pg.words.filter(v => !used.has(v) && quiz(v)), metQ = c.met.filter(quiz);
    if ((since >= 2 || k === part.length - 1) && (fresh.length || metQ.length)) {
      since = 0; const fe = fresh.filter(v => v.emo); const v = rnd(fe.length && Math.random() < .6 ? fe : fresh.length ? fresh : metQ); used.add(v);
      const kind = v.emo ? rnd(['pic', 'pic', 'voice', 'mean', 'spell', 'repeat']) : rnd(['voice', 'mean', 'mean', 'spell', 'repeat']);
      if (kind === 'pic') await gamePicture(c, v, pool);
      else if (kind === 'voice') await gameVoice(c, v, pool);
      else if (kind === 'spell') { if (!(await gameSpell(c, v))) await gameMeaning(c, v, pool); }
      else if (kind === 'repeat') await gameRepeat(c, v);
      else await gameMeaning(c, v, pool);
    } else if (Math.random() < .35 && alive(c)) {
      await say(c, 'lulu', rnd(['واو! 😮', 'بعدين شو صار؟ 🤩', 'يا ريتني كنت معهم! 😍', 'حلوة كتير! 💕']), { t: 450 });
    }
  }
  if (!alive(c)) return;
  /* sticker + goodbye */
  const left = STICKERS.filter(e => !G.stk.includes(e)), stk = left.length ? rnd(left) : rnd(STICKERS); if (!G.stk.includes(stk)) G.stk.push(stk);
  G.done[s.id] = Math.max(G.done[s.id] || 0, c.part + 1); save();
  await say(c, 'bubu', `🎁 <b class="en">A sticker for you!</b><div class="stk">${stk}</div>`);
  SFX.win(); confetti();
  const fin = (G.done[s.id] || 0) >= parts(s);
  await say(c, 'lulu', fin ? `خلّصنا القصة كلها! 🎉 إنتِ بطلة يا ${esc(kidName())} 🏆` : `بكرة بنكمّل القصة! 💖 جمعتي ${AR(c.stars)} نجمة اليوم ⭐`, { ar: fin ? 'خلصنا القصة كلها! إنتِ بطلة' : 'بكرة بنكمّل القصة' });
  if (c.met.length) await say(c, 'bubu', `<b>كلمات اليوم</b> 🧺<div class="wl">${c.met.map(v => wordHtml(v)).join('')}</div><small>اضغطي على أي كلمة لتسمعيها</small>`);
  await say(c, 'bubu', `<b class="en">Bye bye</b> ${esc(kidName())}! 👋🦉`, { t: 500 }); sayWord('bye');
  const nx = fin ? STORIES[s.ix + 1] : s;
  const r2 = await ask(c, [{ html: fin ? '📖 القصة الجاية' : '▶️ كمّلي الجزء الجاي', go: nx }, { html: '🏠 الدردشات' }]);
  if (!r2 || !alive(c)) return; if (r2.go) openChat(r2.go); else list();
}

render();
})();
