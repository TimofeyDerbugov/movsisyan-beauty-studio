/* Общие скрипты страницы: меню, галерея, карта, cookie */

(function () {
  "use strict";

  /* ---------- Мобильное меню ---------- */

  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", function () {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Галерея ----------
     Фото подгружаются из открытой карточки студии на Яндекс Картах. */

  const CDN = "https://avatars.mds.yandex.net/get-altay/";

  const photos = [
    { id: "5236021/2a0000017beb85ba547473740cfcb02c9d8d", alt: "Холодный блонд, длинные прямые волосы" },
    { id: "5245944/2a0000017beb839522ccabec7ccd0e0c8ab9", alt: "Медное окрашивание, каре" },
    { id: "4352895/2a0000017af92c8f5bbfcc9f01f725c4bfd3", alt: "Блонд с мягкими волнами" },
    { id: "4341149/2a0000017beb84402f0bf029657bd4e6c5d0", alt: "Тёмное каре с гладким срезом" },
    { id: "13265642/2a000001965bf468ab26ee47f916f94fadce", alt: "Длинные волосы с объёмными волнами" },
    { id: "5099617/2a0000017af92b186b0a093509a140e5f4d9", alt: "Пепельный блонд с лёгкими волнами" },
    { id: "5245944/2a0000017beb82cc6205a24b3171c2931e9c", alt: "Глубокий винный оттенок" },
    { id: "15283141/2a000001953737fec8facb6802540aa42d0f", alt: "Светлые локоны после окрашивания" },
    { id: "4341149/2a0000017beb856c95e878ad90ad5a87b863", alt: "Каре в шоколадном оттенке" },
    { id: "5598654/2a0000017caf655b9eeee67dd58a967e71d6", alt: "Короткое тёмное каре" },
    { id: "5236021/2a0000017b605b226bcd96628ddcb5e61fc7", alt: "Плавный переход цвета на длинных волосах" },
    { id: "4324073/2a00000179818dec03e5123d459a69070ed2", alt: "Каре средней длины" }
  ];

  const gallery = document.getElementById("gallery");

  if (gallery) {
    gallery.innerHTML = photos
      .map(function (p) {
        return (
          '<figure><img src="' + CDN + p.id + '/XL" alt="' + p.alt +
          '" loading="lazy" decoding="async"></figure>'
        );
      })
      .join("");
  }

  /* ---------- Карта: грузим только по клику ---------- */

  const mapBtn = document.getElementById("mapLoad");
  const map = document.getElementById("map");

  if (mapBtn && map) {
    mapBtn.addEventListener("click", function () {
      map.innerHTML =
        '<iframe title="Студия на карте" loading="lazy" ' +
        'src="https://yandex.ru/map-widget/v1/?ll=36.605687%2C55.123221&z=16&pt=36.605687,55.123221,pm2rdm">' +
        "</iframe>";
    });
  }

  /* ---------- Cookie-уведомление ---------- */

  const cookie = document.getElementById("cookie");
  const cookieOk = document.getElementById("cookieOk");
  const KEY = "mbs-cookie-ok";

  function readFlag() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function saveFlag() {
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {
      /* хранилище недоступно — просто скрываем плашку */
    }
  }

  if (cookie && cookieOk) {
    if (!readFlag()) {
      cookie.hidden = false;
    }

    cookieOk.addEventListener("click", function () {
      saveFlag();
      cookie.hidden = true;
    });
  }
})();
