/* Онлайн-запись (демо).
   Данные клиента никуда не отправляются и не сохраняются:
   после «отправки» показывается сводка, а поля формы очищаются. */

(function () {
  "use strict";

  /* ---------- Справочники ---------- */

  const SERVICES = [
    { id: "cut-w",    name: "Женская стрижка",       price: "от 2 500 ₽", min: 60 },
    { id: "cut-m",    name: "Мужская стрижка",       price: "от 2 500 ₽", min: 45 },
    { id: "styling",  name: "Укладка",               price: "от 2 000 ₽", min: 45 },
    { id: "hairdo",   name: "Причёска",              price: "от 3 000 ₽", min: 90 },
    { id: "color",    name: "Окрашивание",           price: "от 6 000 ₽", min: 180 },
    { id: "care",     name: "Лечение волос",         price: "3 500 ₽",    min: 60 },
    { id: "botox",    name: "Ботокс для волос",      price: "5 500 ₽",    min: 120 },
    { id: "spa",      name: "Спа-уход MORAN",        price: "5 500 ₽",    min: 60 }
  ];

  const MASTERS = [
    { id: "any",     name: "Любой мастер", role: "Подберём свободного", services: null },
    { id: "ashkhen", name: "Ашхен",        role: "Стрижки, укладки, причёски", services: ["cut-w", "cut-m", "styling", "hairdo", "care"] },
    { id: "anna",    name: "Анна",         role: "Окрашивание и уход",          services: ["color", "care", "botox", "spa", "styling"] }
  ];

  const OPEN = 10 * 60;   // 10:00
  const CLOSE = 18 * 60;  // 18:00
  const STEP = 30;        // шаг слотов, минут
  const DAYS = 14;        // на сколько дней вперёд можно записаться

  const DOW = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const MONTHS_FULL = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  /* ---------- Состояние ---------- */

  const state = { step: 1, service: null, master: null, date: null, time: null };

  /* ---------- Элементы ---------- */

  const form = document.getElementById("bookingForm");
  if (!form) return;

  const $ = function (id) { return document.getElementById(id); };

  const serviceBox = $("serviceChoices");
  const masterBox = $("masterChoices");
  const dateBox = $("dateChoices");
  const slotBox = $("slotChoices");
  const btnNext = $("bookingNext");
  const btnBack = $("bookingBack");
  const bar = $("bookingBar");
  const picked = $("bookingPicked");
  const nameInput = $("clientName");
  const phoneInput = $("clientPhone");
  const commentInput = $("clientComment");
  const consentPd = $("consentPd");
  const consentRules = $("consentRules");

  /* ---------- Утилиты ---------- */

  function byId(list, id) {
    return list.find(function (x) { return x.id === id; }) || null;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmtTime(min) {
    return pad(Math.floor(min / 60)) + ":" + pad(min % 60);
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function humanDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.getDate() + " " + MONTHS_FULL[d.getMonth()] + ", " + DOW[d.getDay()];
  }

  // Детерминированная «занятость», чтобы расписание выглядело живым
  function isBusy(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) >>> 0;
    }
    return h % 100 < 35;
  }

  function choiceButton(item, meta, selected, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.setAttribute("aria-pressed", String(selected));
    b.innerHTML =
      '<span class="choice__name"></span><span class="choice__meta"></span>';
    b.querySelector(".choice__name").textContent = item.name;
    b.querySelector(".choice__meta").textContent = meta;
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------- Рендер шагов ---------- */

  function renderServices() {
    serviceBox.innerHTML = "";
    SERVICES.forEach(function (s) {
      serviceBox.appendChild(
        choiceButton(s, s.price + " · ~" + s.min + " мин", state.service === s.id, function () {
          state.service = s.id;
          // если выбранный мастер не делает услугу — сбрасываем
          const m = byId(MASTERS, state.master);
          if (m && m.services && m.services.indexOf(s.id) === -1) state.master = null;
          state.time = null;
          renderServices();
          update();
        })
      );
    });
  }

  function renderMasters() {
    masterBox.innerHTML = "";
    MASTERS.forEach(function (m) {
      const can = !m.services || !state.service || m.services.indexOf(state.service) !== -1;
      if (!can) return;
      masterBox.appendChild(
        choiceButton(m, m.role, state.master === m.id, function () {
          state.master = m.id;
          state.time = null;
          renderMasters();
          update();
        })
      );
    });
  }

  function renderDates() {
    dateBox.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = isoDate(d);

      const b = document.createElement("button");
      b.type = "button";
      b.className = "date";
      b.setAttribute("aria-pressed", String(state.date === iso));
      b.setAttribute("aria-label", humanDate(iso));
      b.innerHTML =
        '<span class="date__dow">' + (i === 0 ? "сег" : DOW[d.getDay()]) + "</span>" +
        '<span class="date__day">' + d.getDate() + "</span>" +
        '<span class="date__month">' + MONTHS[d.getMonth()] + "</span>";

      b.addEventListener("click", function () {
        state.date = iso;
        state.time = null;
        renderDates();
        renderSlots();
        update();
      });

      dateBox.appendChild(b);
    }
  }

  function renderSlots() {
    slotBox.innerHTML = "";

    if (!state.date) {
      slotBox.innerHTML = '<p class="slots__empty">Выберите день — покажем свободное время.</p>';
      return;
    }

    const service = byId(SERVICES, state.service);
    const now = new Date();
    const isToday = state.date === isoDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes() + 60; // минимум за час
    let free = 0;

    for (let t = OPEN; t + service.min <= CLOSE; t += STEP) {
      const busy = isBusy(state.date + state.master + t) || (isToday && t < nowMin);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = fmtTime(t);
      b.disabled = busy;
      b.setAttribute("aria-pressed", String(state.time === t));
      if (busy) b.setAttribute("aria-label", fmtTime(t) + " — занято");
      if (!busy) free++;

      b.addEventListener("click", function () {
        state.time = t;
        renderSlots();
        update();
      });

      slotBox.appendChild(b);
    }

    if (!free) {
      slotBox.innerHTML = '<p class="slots__empty">На этот день свободного времени нет, выберите другой.</p>';
    }
  }

  /* ---------- Маска телефона ---------- */

  function phoneDigits(value) {
    let d = value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (d && !d.startsWith("7")) d = "7" + d;
    return d.slice(0, 11);
  }

  function formatPhone(d) {
    if (!d) return "";
    let out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return out;
  }

  phoneInput.addEventListener("input", function () {
    phoneInput.value = formatPhone(phoneDigits(phoneInput.value));
  });

  /* ---------- Проверка контактов ---------- */

  function setError(input, el, msg) {
    $(el).textContent = msg;
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validateContacts() {
    let ok = true;

    if (nameInput.value.trim().length < 2) {
      setError(nameInput, "nameError", "Напишите, как к вам обращаться");
      ok = false;
    } else {
      setError(nameInput, "nameError", "");
    }

    if (phoneDigits(phoneInput.value).length !== 11) {
      setError(phoneInput, "phoneError", "Нужен номер из 11 цифр");
      ok = false;
    } else {
      setError(phoneInput, "phoneError", "");
    }

    if (!consentPd.checked || !consentRules.checked) {
      setError(null, "consentError", "Без согласия на обработку данных и правил записи заявку оформить нельзя");
      ok = false;
    } else {
      setError(null, "consentError", "");
    }

    return ok;
  }

  // после первой неудачной попытки проверяем поля на лету
  let triedSubmit = false;

  [nameInput, phoneInput, consentPd, consentRules].forEach(function (el) {
    el.addEventListener("input", function () {
      if (triedSubmit) validateContacts();
    });
    el.addEventListener("change", function () {
      if (triedSubmit) validateContacts();
    });
  });

  /* ---------- Навигация по шагам ---------- */

  function canGoNext() {
    if (state.step === 1) return !!state.service;
    if (state.step === 2) return !!state.master;
    if (state.step === 3) return state.time !== null;
    return true;
  }

  function pickedText() {
    const parts = [];
    const s = byId(SERVICES, state.service);
    const m = byId(MASTERS, state.master);
    if (s) parts.push(s.name);
    if (m) parts.push(m.name);
    if (state.date) parts.push(humanDate(state.date));
    if (state.time !== null) parts.push(fmtTime(state.time));
    return parts.length ? parts.join(" · ") : "Выберите услугу";
  }

  function update() {
    form.querySelectorAll(".step").forEach(function (el) {
      el.classList.toggle("is-active", Number(el.dataset.step) === state.step);
    });

    form.querySelectorAll(".steps__item").forEach(function (el, i) {
      el.classList.toggle("is-active", i + 1 === state.step);
      el.classList.toggle("is-done", i + 1 < state.step);
    });

    bar.hidden = state.step === 5;
    btnBack.hidden = state.step === 1;
    btnNext.textContent = state.step === 4 ? "Записаться" : "Дальше";
    btnNext.disabled = !canGoNext();
    picked.textContent = pickedText();
  }

  function goTo(step) {
    state.step = step;
    if (step === 2) renderMasters();
    if (step === 3) { renderDates(); renderSlots(); }
    update();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  btnNext.addEventListener("click", function () {
    if (state.step < 4) {
      goTo(state.step + 1);
      return;
    }
    triedSubmit = true;
    if (validateContacts()) finish();
  });

  btnBack.addEventListener("click", function () {
    if (state.step > 1) goTo(state.step - 1);
  });

  /* ---------- Завершение (без отправки) ---------- */

  function finish() {
    const s = byId(SERVICES, state.service);
    const m = byId(MASTERS, state.master);
    const rows = [
      ["Услуга", s.name + " (" + s.price + ")"],
      ["Мастер", m.name],
      ["Когда", humanDate(state.date) + ", " + fmtTime(state.time)],
      ["Имя", nameInput.value.trim()],
      ["Телефон", maskPhone(phoneDigits(phoneInput.value))]
    ];

    const summary = $("summary");
    summary.innerHTML = "";
    rows.forEach(function (r) {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = r[0];
      dd.textContent = r[1];
      summary.appendChild(dt);
      summary.appendChild(dd);
    });

    // стираем введённые данные — ничего не храним
    form.reset();
    triedSubmit = false;
    goTo(5);
  }

  function maskPhone(d) {
    return "+7 (" + d.slice(1, 4) + ") ***-**-" + d.slice(9, 11);
  }

  $("bookingRestart").addEventListener("click", function () {
    state.service = state.master = state.date = null;
    state.time = null;
    $("summary").innerHTML = "";
    renderServices();
    goTo(1);
  });

  /* ---------- Ссылки «Записаться к мастеру» ---------- */

  document.querySelectorAll("[data-master]").forEach(function (link) {
    link.addEventListener("click", function () {
      state.master = link.dataset.master;
      const m = byId(MASTERS, state.master);
      if (state.service && m.services.indexOf(state.service) === -1) state.service = null;
      renderServices();
      state.step = 1;
      update();
      picked.textContent = "Мастер: " + m.name + " — выберите услугу";
    });
  });

  /* ---------- Старт ---------- */

  renderServices();
  update();
})();
