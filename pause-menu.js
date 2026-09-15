(() => {
  const root = document.createElement('div');
  root.id = 'pause-overlay';
  root.innerHTML = `
    <div class="pause-card">
      <div class="pause-kicker">ARENA</div>
      <h1>DURAKLATILDI</h1>
      <div class="pause-options">
        <button data-pause="resume" class="pause-option active">OYUNA GERİ DÖN</button>
        <button data-pause="sound" class="pause-option">SES</button>
        <button data-pause="controls" class="pause-option">KONTROLLER</button>
        <button data-pause="sensitivity" class="pause-option">HASSASİYET</button>
        <button data-pause="menu" class="pause-option">ANA MENÜ</button>
      </div>
      <section id="pause-detail" class="pause-detail"></section>
      <div class="pause-hint">ESC • menüyü aç/kapat</div>
    </div>`;
  document.body.appendChild(root);

  const detail = root.querySelector('#pause-detail');
  const options = [...root.querySelectorAll('.pause-option')];
  let pauseOpen = false;
  let rebinding = null;
  const defaultMap = { forward:'KeyW', back:'KeyS', left:'KeyA', right:'KeyD', jump:'Space', sprint:'ShiftLeft', crouch:'ControlLeft', dash:'KeyQ', boost:'KeyE', wave:'KeyF', pull:'KeyR' };
  const labels = { forward:'İleri', back:'Geri', left:'Sol', right:'Sağ', jump:'Zıpla', sprint:'Koş', crouch:'Eğil / Kay', dash:'Atıl', boost:'Yukarı İtiş', wave:'Enerji Dalgası', pull:'Küreyi Çek' };
  let bindings = {...defaultMap, ...JSON.parse(localStorage.getItem('arenaBindings') || '{}')};
  let volume = Number(localStorage.getItem('arenaVolume') ?? 70);
  let sensitivity = Number(localStorage.getItem('arenaSensitivity') ?? 1);
  window.gameMasterVolume = volume / 100;
  window.gameMouseSensitivity = sensitivity;

  const keyName = code => ({Space:'SPACE',ShiftLeft:'SHIFT',ShiftRight:'SHIFT',ControlLeft:'CTRL',ControlRight:'CTRL',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'})[code] || code.replace(/^Key/,'').replace(/^Digit/,'');
  const saveBindings = () => localStorage.setItem('arenaBindings', JSON.stringify(bindings));

  function soundBeep(freq=520, duration=.055) {
    if (!window.gameMasterVolume || !window.AudioContext) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    window.__arenaAudio ||= new Ctx();
    const ctx = window.__arenaAudio;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(.035 * window.gameMasterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
  }

  function renderSound() {
    detail.innerHTML = `<h2>SES</h2><label class="range-row"><span>Oyun sesi</span><strong id="volume-value">${volume}%</strong></label><input id="volume-slider" type="range" min="0" max="100" value="${volume}"><button class="small-btn" id="mute-btn">${volume===0?'SESİ AÇ':'SESSİZE AL'}</button>`;
    const slider = detail.querySelector('#volume-slider');
    slider.oninput = () => { volume = Number(slider.value); window.gameMasterVolume = volume/100; localStorage.setItem('arenaVolume', volume); detail.querySelector('#volume-value').textContent = volume+'%'; };
    detail.querySelector('#mute-btn').onclick = () => { volume = volume ? 0 : 70; window.gameMasterVolume=volume/100; localStorage.setItem('arenaVolume',volume); renderSound(); soundBeep(440,.08); };
  }

  function renderControls() {
    detail.innerHTML = `<h2>KONTROLLER</h2><p class="detail-note">Bir tuşa tıkla, sonra yeni tuşa bas.</p><div class="control-list">${Object.keys(bindings).map(k=>`<button class="control-row" data-bind="${k}"><span>${labels[k]}</span><b>${rebinding===k?'YENİ TUŞ...':keyName(bindings[k])}</b></button>`).join('')}</div>`;
    detail.querySelectorAll('[data-bind]').forEach(btn => btn.onclick = () => { rebinding=btn.dataset.bind; renderControls(); });
  }

  function renderSensitivity() {
    detail.innerHTML = `<h2>HASSASİYET</h2><p class="detail-note">Fare hareket hızını ayarla.</p><label class="range-row"><span>Fare hassasiyeti</span><strong id="sensitivity-value">${sensitivity.toFixed(1)}x</strong></label><input id="sensitivity-slider" type="range" min="0.1" max="3" step="0.1" value="${sensitivity}"><button class="small-btn" id="sensitivity-reset">VARSAYILANA DÖN</button>`;
    const slider = detail.querySelector('#sensitivity-slider');
    slider.oninput = () => { sensitivity = Number(slider.value); window.gameMouseSensitivity = sensitivity; localStorage.setItem('arenaSensitivity', sensitivity); detail.querySelector('#sensitivity-value').textContent = sensitivity.toFixed(1)+'x'; };
    detail.querySelector('#sensitivity-reset').onclick = () => { sensitivity=1; window.gameMouseSensitivity=1; localStorage.setItem('arenaSensitivity',1); renderSensitivity(); soundBeep(600,.05); };
  }

  function showDetail(type) {
    if(type==='sound') renderSound();
    else if(type==='controls') renderControls();
    else if(type==='sensitivity') renderSensitivity();
    else if(type==='resume') detail.innerHTML = `<p class="detail-note">Oyuna kaldığın yerden devam et.</p>`;
    else if(type==='menu') detail.innerHTML = `<h2>ANA MENÜ</h2><p class="detail-note">Ana menüye dönmek istediğine emin misin?</p><button class="confirm-btn" id="menu-confirm">ANA MENÜYE DÖN</button>`;
    detail.querySelector('#menu-confirm')?.addEventListener('click', () => { location.href = 'menu/'; });
  }

  function openPause() {
    if (pauseOpen) return;
    pauseOpen=true; root.classList.add('visible');
    document.exitPointerLock?.();
    options.forEach(x=>x.classList.remove('active')); options[0].classList.add('active');
    showDetail('resume'); soundBeep(330,.06);
  }
  function closePause() {
    if (!pauseOpen) return;
    pauseOpen=false; root.classList.remove('visible');
    document.querySelector('#game canvas')?.requestPointerLock(); soundBeep(660,.05);
  }

  options.forEach(btn => btn.addEventListener('click', () => {
    options.forEach(x=>x.classList.remove('active')); btn.classList.add('active');
    const type=btn.dataset.pause;
    if(type==='resume') closePause(); else showDetail(type);
    soundBeep(type==='resume'?660:500,.05);
  }));

  document.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      e.preventDefault();
      if (rebinding) { rebinding=null; showDetail('controls'); return; }
      pauseOpen ? closePause() : openPause();
      return;
    }
    if (!pauseOpen || !rebinding) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const used = Object.entries(bindings).find(([k,v]) => k!==rebinding && v===e.code);
    if (used) return;
    bindings[rebinding]=e.code; saveBindings(); rebinding=null; renderControls(); soundBeep(760,.07);
  }, true);

  const physicalDown = new Set();
  document.addEventListener('keydown', e => {
    if (pauseOpen) return;
    const entry = Object.entries(bindings).find(([,code]) => code===e.code);
    if (!entry) return;
    const original = defaultMap[entry[0]];
    if (e.code===original || physicalDown.has(e.code)) return;
    physicalDown.add(e.code);
    window.dispatchEvent(new KeyboardEvent('keydown', {code:original, key:e.key, bubbles:true, cancelable:true}));
    e.preventDefault();
  }, true);
  document.addEventListener('keyup', e => {
    const entry = Object.entries(bindings).find(([,code]) => code===e.code);
    if (!entry) return;
    const original = defaultMap[entry[0]];
    if (e.code===original || !physicalDown.has(e.code)) return;
    physicalDown.delete(e.code);
    window.dispatchEvent(new KeyboardEvent('keyup', {code:original, key:e.key, bubbles:true, cancelable:true}));
    e.preventDefault();
  }, true);

  document.addEventListener('mousemove', e => {
    if (pauseOpen || !document.pointerLockElement || sensitivity === 1 || e.__arenaScaled) return;
    const scaled = new MouseEvent('mousemove', {bubbles:true,cancelable:true,view:window,movementX:e.movementX*sensitivity,movementY:e.movementY*sensitivity});
    scaled.__arenaScaled = true;
    e.stopImmediatePropagation();
    document.dispatchEvent(scaled);
  }, true);

  showDetail('resume');
})();
