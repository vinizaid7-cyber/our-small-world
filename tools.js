/* أدوات خاصة: كبسة سرية لزيادة المصاري (بدون أي زر ظاهر)
   طرق الفتح (كلها بتكتب الكود 1220):
   1) من اللابتوب: اكتب 1220 على الكيبورد (وانت مش جوّا خانة كتابة)
   2) من التلفون: اضغط ضغطة طويلة (حوالي ثانية ونص) على عدّاد 🪙 فوق ← بتطلع خانة الكود
   3) من الشات: اكتب 1220 وأرسل ← ما بتنبعت رسالة، بتفتح القائمة مباشرة
   الزيادة بتتسجّل كحدث عادي (cfg_adj) فبتتزامن وبتنحفظ مثل باقي المصاري، بس بدون أي إشعار للشريك. */
(function () {
  const OSW = window.OSW, CODE = "1220", MAXADD = 1000000, QUICK = [100, 500, 1000, 5000, 10000, 50000];
  let buf = "", bt = 0, box = null, lpTimer = 0, lpFired = 0;
  const G = () => OSW.game;
  const ready = () => !!(OSW.app && OSW.app.state && OSW.app.state().ready && G());
  const coins = () => { try { return G().state().coins; } catch (e) { return 0; } };
  const sfx = (n) => { try { OSW.audio.sfx(n); } catch (e) {} };
  const close = () => { if (box) { box.remove(); box = null; } };

  function shell(inner) {
    close();
    box = document.createElement("div");
    box.className = "overlay";
    box.style.cssText = "z-index:9999;align-items:center";
    box.innerHTML = `<div class="modal-card" style="border-radius:26px;padding:18px 16px 20px;position:relative">${inner}</div>`;
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.body.appendChild(box);
    return box;
  }

  function pinPad() {
    if (!ready()) return;
    const b = shell(`<h3 style="text-align:center">🔒</h3><input id="qPin" class="in" type="password" inputmode="numeric" autocomplete="off" maxlength="8" style="text-align:center;font-size:24px;letter-spacing:8px"><div class="row" style="margin-top:10px;justify-content:center"><button class="btn alt" id="qPinX">إلغاء</button></div>`);
    const inp = b.querySelector("#qPin");
    inp.addEventListener("input", () => { if (inp.value === CODE) menu(); else if (inp.value.length >= CODE.length) inp.value = ""; });
    b.querySelector("#qPinX").onclick = close;
    setTimeout(() => inp.focus(), 80);
  }

  function menu(msg) {
    if (!ready()) return;
    const b = shell(`<h3 style="text-align:center">🪙 قديش بدك تزيد مصاري؟</h3>
      <div class="coinbar" style="text-align:center;margin:4px 0 10px">رصيدكم الحالي: <b id="qBal">${coins()}</b></div>
      <div id="qMsg" class="hint" style="text-align:center;min-height:22px;margin-bottom:6px">${msg || ""}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:10px">${QUICK.map((n) => `<button class="btn sm gold" data-q="${n}">+${n}</button>`).join("")}</div>
      <input id="qAmt" class="in" type="number" inputmode="numeric" min="1" max="${MAXADD}" placeholder="أو اكتب المبلغ اللي بدك إياه" style="text-align:center;font-size:18px">
      <div class="row" style="gap:8px;justify-content:center;margin-top:12px"><button class="btn berry" id="qGo">زيد 🪙</button><button class="btn alt" id="qX">إغلاق</button></div>`);
    let busy = false;
    const add = async (n) => {
      n = Math.floor(+n);
      const m = b.querySelector("#qMsg");
      if (!(n >= 1 && n <= MAXADD)) { m.textContent = "اكتب رقم من 1 إلى " + MAXADD; return; }
      if (busy) return; busy = true;
      try {
        await G().do("cfg_adj", { n });
        sfx("coin");
        b.querySelector("#qBal").textContent = coins();
        m.textContent = "✅ انزاد " + n + " 🪙";
        b.querySelector("#qAmt").value = "";
      } catch (e) { m.textContent = "⚠️ ما زبطت: " + (e && e.message ? e.message : "جرّب مرة ثانية"); }
      busy = false;
    };
    b.querySelectorAll("[data-q]").forEach((x) => (x.onclick = () => add(x.dataset.q)));
    b.querySelector("#qGo").onclick = () => add(b.querySelector("#qAmt").value);
    b.querySelector("#qAmt").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(e.target.value); } });
    b.querySelector("#qX").onclick = close;
  }

  /* 1) كيبورد: اكتب 1220 */
  document.addEventListener("keydown", (e) => {
    if (box) { if (e.key === "Escape") close(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target || {}, tag = t.tagName || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || t.isContentEditable) { buf = ""; return; }
    const now = Date.now();
    if (/^\d$/.test(e.key)) {
      if (now - bt > 2500) buf = "";
      bt = now; buf = (buf + e.key).slice(-CODE.length);
      if (buf === CODE) { buf = ""; menu(); }
    } else if (e.key.length === 1) buf = "";
  });

  /* 2) تلفون: ضغطة طويلة على عدّاد المصاري */
  const onDown = (e) => {
    if (!e.target.closest || !e.target.closest("#coinPill")) return;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { lpFired = Date.now(); if (navigator.vibrate) try { navigator.vibrate(25); } catch (x) {} pinPad(); }, 1500);
  };
  const onUp = () => clearTimeout(lpTimer);
  document.addEventListener("pointerdown", onDown, true);
  ["pointerup", "pointercancel", "pointerleave", "pointermove"].forEach((ev) => document.addEventListener(ev, onUp, true));
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest("#coinPill")) e.preventDefault(); }, true);
  document.addEventListener("click", (e) => { if (lpFired && Date.now() - lpFired < 900 && e.target.closest && e.target.closest("#coinPill")) { e.stopPropagation(); e.preventDefault(); lpFired = 0; } }, true);

  /* 3) شات: اكتب 1220 وأرسل */
  document.addEventListener("submit", (e) => {
    if (!e.target || e.target.id !== "chatForm") return;
    const inp = document.getElementById("chatIn");
    if (inp && inp.value.trim() === CODE) {
      e.preventDefault(); e.stopImmediatePropagation(); inp.value = "";
      if (OSW.chat && OSW.chat.close) OSW.chat.close();
      menu();
    }
  }, true);
})();
