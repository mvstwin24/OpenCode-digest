// ====================================================================
// Битрикс24: гид по автоматизации — логика поиска, фильтров и анимаций
// Всё работает на клиенте: карточки уже в HTML, JS их фильтрует.
// ====================================================================

(function () {
  "use strict";

  // --- Элементы страницы ---
  const FEATURED_TAG = "наши внедрения";
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const tagFilters = document.getElementById("tagFilters");
  const cardsGrid = document.getElementById("cardsGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");

  // Все карточки, которые есть в разметке
  const cards = Array.from(cardsGrid.querySelectorAll(".card"));

  // Теги, выбранные пользователем (можно несколько сразу)
  const activeTags = new Set();

  // Дополнительная защита: убираем из поискового запроса всё лишнее.
  // Пользовательский текст не попадает в DOM напрямую,
  // а только через textContent и экранированную подсветку.
  const escapeHtml = function (value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // --- 1. Собираем кнопки-фильтры из тегов карточек ---
  const getAllTags = function () {
    const tags = new Set();
    cards.forEach(function (card) {
      card
        .getAttribute("data-tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach(function (tag) {
          tags.add(tag);
        });
    });

    const list = Array.from(tags).sort();

    // «Наши внедрения» всегда стоит первым в списке фильтров
    const featuredIndex = list.indexOf(FEATURED_TAG);
    if (featuredIndex > -1) {
      const tag = list.splice(featuredIndex, 1)[0];
      list.unshift(tag);
    }

    return list;
  };

  const buildTagFilters = function () {
    const tags = getAllTags();
    tags.forEach(function (tag) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip" + (tag === FEATURED_TAG ? " is-featured" : "");
      button.dataset.tag = tag;
      button.textContent = tag;
      button.addEventListener("click", function () {
        toggleTag(tag);
      });
      tagFilters.appendChild(button);
    });
  };

  // --- 2. Включение/выключение фильтра по тегу ---
  const toggleTag = function (tag) {
    if (activeTags.has(tag)) {
      activeTags.delete(tag);
    } else {
      activeTags.add(tag);
    }

    // Обновляем подсветку всех совпадающих кнопок
    document.querySelectorAll("[data-tag]").forEach(function (el) {
      el.classList.toggle("is-active", activeTags.has(el.dataset.tag));
    });

    applyFilters();
  };

  // --- 3. Поисковый запрос ---
  const getQuery = function () {
    return searchInput.value.trim().toLowerCase();
  };

  // Подсвечиваем найденное слово в строке. Значение заранее экранируется.
  const highlight = function (text, query) {
    if (!query) return text;
    const escaped = escapeHtml(text);
    const index = escaped.toLowerCase().indexOf(query);
    if (index === -1) return escaped;

    const before = escaped.slice(0, index);
    const match = escapeHtml(text.slice(index, index + query.length));
    const after = escaped.slice(index + query.length);
    return before + "<mark>" + match + "</mark>" + after;
  };

  // --- 4. Фильтрация карточек ---
  const filteredCards = function () {
    const query = getQuery();

    return cards.filter(function (card) {
      const title = card.getAttribute("data-title").toLowerCase();
      const description = card.getAttribute("data-description").toLowerCase();
      const tags = card.getAttribute("data-tags").toLowerCase();

      const matchesQuery =
        !query || title.includes(query) || description.includes(query) || tags.includes(query);

      const matchesTags =
        activeTags.size === 0 ||
        Array.from(activeTags).every((tag) => tags.split(",").includes(tag));

      return matchesQuery && matchesTags;
    });
  };

  // --- 5. Показываем результат с «каскадной» анимацией появления ---
  const applyFilters = function () {
    const visible = filteredCards();

    cards.forEach(function (card) {
      const show = visible.includes(card);
      card.classList.toggle("is-hidden", !show);
      card.classList.remove("card-anim");
    });

    // Насильно перезапускаем анимацию для каждой показанной карточки
    void cardsGrid.offsetWidth;
    visible.forEach(function (card, index) {
      card.style.animationDelay = index * 60 + "ms";
      card.classList.add("card-anim");
    });

    // Счётчик и пустое состояние
    const total = cards.length;
    resultCount.textContent =
      visible.length === total
        ? "Все материалы: " + total
        : "Найдено материалов: " + visible.length + " из " + total;
    emptyState.hidden = visible.length !== 0;

    // Перерисовываем подсветку совпадений в видимых карточках
    const query = getQuery();
    visible.forEach(function (card) {
      const title = card.querySelector(".card__title");
      const description = card.querySelector(".card__description");
      title.innerHTML = highlight(title.dataset.raw, query);
      description.innerHTML = highlight(description.dataset.raw, query);
    });
  };

  // --- 6. Подготовка карточек: сохраняем «чистый» текст для подсветки ---
  const stashRawText = function () {
    cards.forEach(function (card) {
      const title = card.querySelector(".card__title");
      const description = card.querySelector(".card__description");
      title.dataset.raw = title.textContent.trim();
      description.dataset.raw = description.textContent.trim();
    });
  };

  // --- 7. События ---
  const onSearch = function () {
    searchClear.hidden = searchInput.value.length === 0;
    applyFilters();
  };

  searchInput.addEventListener("input", onSearch);

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    onSearch();
    searchInput.focus();
  });

  // Клик по «Наши внедрения» в шапке: скролл к карточкам + включение фильтра
  const featuredLink = document.querySelector("[data-featured-link]");
  if (featuredLink) {
    featuredLink.addEventListener("click", function () {
      if (!activeTags.has(FEATURED_TAG)) {
        toggleTag(FEATURED_TAG);
      }
    });
  }

  // Клик по тегу прямо на карточке включает тот же фильтр
  document.addEventListener("click", function (event) {
    const tagButton = event.target.closest("[data-tag]");
    if (tagButton && tagButton.classList.contains("tag")) {
      toggleTag(tagButton.dataset.tag);
    }
  });

  // «Свечение» карточки следует за курсором (используется в CSS через --mx/--my)
  cardsGrid.addEventListener("pointermove", function (event) {
    const card = event.target.closest(".card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", event.clientX - rect.left + "px");
    card.style.setProperty("--my", event.clientY - rect.top + "px");
  });

  // --- 8. Старт ---
  stashRawText();
  buildTagFilters();
  applyFilters();
})();