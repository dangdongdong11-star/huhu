// index.js — Hidden Directive v1.0
// Peaches & Cream Core 툴바에서 '추가 지시 입력칸 + 📌 지속 지시'만 떼어낸 단독 확장.
// 입력한 지시는 채팅창에 메시지로 남지 않고, 프롬프트에만 숨겨서 들어간다.
//   - Apply : 입력한 지시를 다음 응답 1회에만 숨겨서 넣고 생성
//   - 📌    : 입력한 지시를 캐릭터별로 고정해 해제 전까지 계속 숨겨서 넣음

const MODULE_NAME = 'hidden-directive';
const TOOLBAR_ID  = 'hd-toolbar';

function ctx() { return SillyTavern.getContext(); }

function getCharKey() {
  try {
    const c  = ctx();
    const ch = c?.characters?.[c?.characterId];
    const avatar = ch?.avatar?.replace(/\.[^/.]+$/, '') || ch?.filename?.replace(/\.[^/.]+$/, '');
    const name   = c?.name2 || ch?.name || 'default';
    return (avatar ? `${name}_${avatar}` : name).replace(/[^a-zA-Z0-9가-힣]/g, '_');
  } catch (e) { return 'default'; }
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════
function getStore() {
  const { extensionSettings } = ctx();
  if (!extensionSettings[MODULE_NAME]) extensionSettings[MODULE_NAME] = { toolbarEnabled: true, chars: {} };
  const s = extensionSettings[MODULE_NAME];
  if (s.toolbarEnabled === undefined) s.toolbarEnabled = true;
  if (!s.chars) s.chars = {};
  return s;
}
function getCharStore() {
  const s = getStore(), key = getCharKey();
  if (!s.chars[key]) s.chars[key] = { directiveEnabled: false, directiveText: '' };
  const cd = s.chars[key];
  if (cd.directiveEnabled === undefined) cd.directiveEnabled = false;
  if (cd.directiveText    === undefined) cd.directiveText    = '';
  return cd;
}
function saveStore() { ctx().saveSettingsDebounced(); }

// ═══════════════════════════════════════════
// 프롬프트
// ═══════════════════════════════════════════
function buildDirectivePrompt() {
  const cd = getCharStore();
  if (!cd.directiveEnabled || !cd.directiveText) return '';
  return `[PERSISTENT DIRECTION]\n아래 지시를 이 지시가 해제되기 전까지 롤플레이 전반에 계속 반영하라:\n"${cd.directiveText}"`;
}
function refreshDirectivePrompt() {
  try { ctx().setExtensionPrompt(MODULE_NAME + '_directive', buildDirectivePrompt(), 1, 0); }
  catch (e) { console.warn(`[${MODULE_NAME}] directive prompt error`, e); }
}

// ═══════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════
function injectStyle() {
  if (document.getElementById('hd-style')) return;
  const s = document.createElement('style');
  s.id = 'hd-style';
  s.textContent = `
#${TOOLBAR_ID}{width:100%;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;}
.hd-wrap{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;background:#fff;border-top:0.5px solid #e8e8e8;}
.hd-input{flex:1;min-width:0;padding:8px 12px;border-radius:10px;border:1px solid #e0e0e6;background:#f8f8fa;font-size:13px;color:#1a1a1a;outline:none;font-family:inherit;}
.hd-input::placeholder{color:#bbb;}
.hd-input:focus{border-color:#aaa;}
.hd-input-shake{border-color:#e05050!important;animation:hdShake .4s ease;}
@keyframes hdShake{
  0%,100%{transform:translateX(0);}
  20%{transform:translateX(-4px);}
  40%{transform:translateX(4px);}
  60%{transform:translateX(-3px);}
  80%{transform:translateX(3px);}
}
.hd-pin{padding:7px 10px;border-radius:10px;font-size:14px;background:#f0f0f4;border:1px solid #e0e0e6;cursor:pointer;font-family:inherit;flex-shrink:0;transition:all .12s;line-height:1;}
.hd-pin:hover{border-color:#c0c0cc;}
.hd-pin.active{background:#f0a020;border-color:#f0a020;box-shadow:0 0 0 3px rgba(240,160,32,0.25);}
.hd-reset{padding:7px 14px;border-radius:10px;font-size:13px;font-weight:500;color:#666;background:#f0f0f4;border:1px solid #e0e0e6;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;}
.hd-reset:hover{color:#333;}
.hd-apply{background:#1a1a1a;color:#fff;border:none;border-radius:10px;padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;flex-shrink:0;font-family:inherit;white-space:nowrap;transition:opacity .15s;}
.hd-apply:active{opacity:.8;}
.hd-apply.busy{opacity:.5;pointer-events:none;}
.hd-close{font-size:13px;color:#888;background:none;border:none;cursor:pointer;padding:2px 4px;font-family:inherit;flex-shrink:0;}
.hd-close:hover{color:#333;}
@media(prefers-color-scheme:dark){
  .hd-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .hd-input{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .hd-pin{background:#2c2c2e;border-color:#3a3a3c;}
  .hd-pin.active{background:#f0a020;border-color:#f0a020;box-shadow:0 0 0 3px rgba(240,160,32,0.3);}
  .hd-reset{background:#2c2c2e;border-color:#3a3a3c;color:#888;}
  .hd-apply{background:#fff;color:#000;}
  .hd-close{color:#888;}
  .hd-close:hover{color:#fff;}
}
@media(max-width:430px){
  .hd-wrap{gap:5px;padding:8px 8px 10px;}
  .hd-input{min-width:44px;padding:8px 8px;font-size:12.5px;}
  .hd-pin{padding:7px 8px;}
  .hd-reset{padding:7px 9px;font-size:12px;}
  .hd-apply{padding:7px 10px;font-size:12px;}
}`;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════
// 툴바
// ═══════════════════════════════════════════
function buildToolbarHTML() {
  return `
    <div id="${TOOLBAR_ID}">
      <div class="hd-wrap">
        <input class="hd-input" id="hd-input" type="text" placeholder="추가 지시를 입력하세요..."/>
        <button class="hd-pin" id="hd-pin" title="지속 지시">📌</button>
        <button class="hd-reset" id="hd-reset">초기화</button>
        <button class="hd-apply" id="hd-apply">Apply</button>
        <button class="hd-close" id="hd-close" title="툴바 닫기 (요술봉 메뉴에서 다시 열기)">✕</button>
      </div>
    </div>`;
}

function renderToolbar() {
  removeToolbar();
  if (!getStore().toolbarEnabled) return;
  injectStyle();
  const div = document.createElement('div');
  div.innerHTML = buildToolbarHTML();
  const toolbar  = div.firstElementChild;
  const sendForm = document.getElementById('send_form');
  if (sendForm) sendForm.insertAdjacentElement('beforebegin', toolbar);
  else document.body.appendChild(toolbar);

  document.getElementById('hd-pin').addEventListener('click', toggleDirective);
  document.getElementById('hd-reset').addEventListener('click', resetInput);
  document.getElementById('hd-apply').addEventListener('click', applyOnce);
  document.getElementById('hd-close').addEventListener('click', () => setToolbarEnabled(false));
  // ST 스와이프 제스처가 툴바 터치를 가로채지 않도록
  ['touchstart', 'touchmove', 'touchend'].forEach(evt => toolbar.addEventListener(evt, e => e.stopPropagation(), { passive: false }));

  syncPinButton();
}

function removeToolbar() { document.getElementById(TOOLBAR_ID)?.remove(); }

function setToolbarEnabled(on) {
  getStore().toolbarEnabled = on;
  saveStore();
  if (on) renderToolbar(); else removeToolbar();
}

function syncPinButton() {
  const btn = document.getElementById('hd-pin');
  if (!btn) return;
  const cd = getCharStore();
  btn.classList.toggle('active', !!cd.directiveEnabled);
  btn.title = cd.directiveEnabled ? `지속 지시 (누르면 해제)\n현재: ${cd.directiveText}` : '지속 지시';
}

function shakeInput(inputEl, msg) {
  if (!inputEl) return;
  inputEl.focus();
  inputEl.classList.remove('hd-input-shake');
  void inputEl.offsetWidth; // 애니메이션 재시작용 리플로우
  inputEl.classList.add('hd-input-shake');
  const origPlaceholder = inputEl.dataset.origPlaceholder || inputEl.placeholder;
  inputEl.dataset.origPlaceholder = origPlaceholder;
  inputEl.placeholder = msg;
  setTimeout(() => {
    inputEl.classList.remove('hd-input-shake');
    inputEl.placeholder = origPlaceholder;
  }, 1200);
}

// ── 📌 지속 지시 ──
function toggleDirective() {
  const cd = getCharStore();
  if (cd.directiveEnabled) {
    // 켬 → 끔: 입력창 내용과 무관하게 해제
    cd.directiveEnabled = false;
    cd.directiveText    = '';
  } else {
    // 끔 → 켬: 지금 입력창 텍스트를 지속 지시로 저장
    const inputEl = document.getElementById('hd-input');
    const text = inputEl?.value?.trim() || '';
    if (!text) { shakeInput(inputEl, '먼저 지시 내용을 입력하세요'); return; }
    cd.directiveEnabled = true;
    cd.directiveText    = text;
    inputEl.value = '';
  }
  saveStore();
  refreshDirectivePrompt();
  syncPinButton();
}

// ── Apply: 다음 응답 1회만 ──
let hdBusy = false;
async function applyOnce() {
  if (hdBusy) return;
  const inputEl  = document.getElementById('hd-input');
  const userText = inputEl?.value?.trim() || '';
  if (!userText) { shakeInput(inputEl, '먼저 지시 내용을 입력하세요'); return; }

  const actionMsg = `IMMEDIATE INSTRUCTION: In your very next response, you MUST — User's additional instruction: "${userText}". Stay in character. Do this without exception.`;
  inputEl.value = '';

  const applyBtn = document.getElementById('hd-apply');
  hdBusy = true; applyBtn?.classList.add('busy');
  const { setExtensionPrompt, generate } = ctx();
  try {
    setExtensionPrompt(MODULE_NAME + '_action', actionMsg, 1, 0);
    await generate('normal', {});
  } catch (e) {
    console.error(`[${MODULE_NAME}] apply error`, e);
  } finally {
    setTimeout(() => { try { setExtensionPrompt(MODULE_NAME + '_action', '', 1, 0); } catch (e) {} }, 300);
    hdBusy = false;
    document.getElementById('hd-apply')?.classList.remove('busy');
  }
}

function resetInput() {
  const inputEl = document.getElementById('hd-input');
  if (inputEl) inputEl.value = '';
}

// ═══════════════════════════════════════════
// 요술봉 메뉴 (툴바 켜기/끄기)
// ═══════════════════════════════════════════
function addWandMenuItem() {
  const $item = $(`<div id="hd-wand-btn" class="list-group-item flex-container flexGap5"><span>📌</span><span>Hidden Directive 툴바</span></div>`);
  $item.on('click', () => {
    $('#extensionsMenu').hide();
    setToolbarEnabled(!getStore().toolbarEnabled);
  });
  $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
jQuery(() => {
  getStore();
  addWandMenuItem();
  const { eventSource, event_types } = ctx();
  eventSource.on(event_types.CHAT_CHANGED, () => {
    refreshDirectivePrompt();                       // 캐릭터별 📌 지시로 교체
    if (getStore().toolbarEnabled) renderToolbar();  // 📌 버튼 상태 갱신
  });
  refreshDirectivePrompt();
  renderToolbar();
  console.log(`[${MODULE_NAME}] v1.0 로드 완료`);
});
