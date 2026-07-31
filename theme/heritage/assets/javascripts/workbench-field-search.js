(function(window, document) {
  'use strict';

  if (window.workbenchFieldSearch) return;

  function language() {
    return typeof window.workbenchLanguage === 'function'
      ? window.workbenchLanguage()
      : String(document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
  }

  function localized(german, english) {
    return language() === 'de' ? german : english;
  }

  function defaults() {
    return {
    dataSrc: '',
    timeout: 500,
    minChars: 2,
    cssPrefix: 'gs-',
    fillSearchField: false,
    fillSearchFieldWith: 'title',
    ResultsTextPrefix: '',
    resultsLimit: localized('$ von % Ergebnissen', '$ of % results'),
    noResultsText: localized('Keine Ergebnisse.', 'No results.'),
    noResultsLimit: localized('0 Ergebnisse', '0 results'),
    loadingText: localized('Vorschläge werden gesucht.', 'Searching for suggestions.'),
    errorText: localized('Vorschläge konnten nicht geladen werden.', 'Suggestions could not be loaded.'),
    resultText: localized('{count} Vorschlag verfügbar.', '{count} suggestion available.'),
    resultsText: localized('{count} Vorschläge verfügbar.', '{count} suggestions available.'),
    searchFieldWatermark: '',
    displayEmptyCategories: false
    };
  }
  var sequence = 0;
  var states = new WeakMap();

  function runtime() {
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  }

  function mergeOptions(options) {
    return Object.assign({}, defaults(), options || {});
  }

  function isAbort(error) {
    return error && (error.name === 'AbortError' || error.code === 20);
  }

  function hide(state) {
    state.list.hidden = true;
    state.input.setAttribute('aria-expanded', 'false');
    state.input.removeAttribute('aria-activedescendant');
    state.activeIndex = -1;
  }

  function show(state) {
    state.list.hidden = false;
    state.input.setAttribute('aria-expanded', 'true');
  }

  function setBusy(state, busy) {
    state.input.classList.toggle(state.options.cssPrefix + 'loading', busy);
    state.input.classList.toggle('wb-field-search__input--loading', busy);
    state.input.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function announce(state, message) {
    state.live.textContent = '';
    window.requestAnimationFrame(function() {
      if (states.get(state.input) === state) state.live.textContent = message;
    });
  }

  function clearList(state) {
    state.optionsList = [];
    state.activeIndex = -1;
    state.list.replaceChildren();
  }

  function statusRow(state, message, limit, kind) {
    var item = document.createElement('li');
    item.className = state.options.cssPrefix + 'cheader wb-field-search__status wb-field-search__status--' + kind;
    item.setAttribute('role', 'presentation');
    item.setAttribute('aria-hidden', 'true');
    var title = document.createElement('p');
    title.className = state.options.cssPrefix + 'cheader-title';
    title.textContent = (state.options.ResultsTextPrefix ? state.options.ResultsTextPrefix + ': ' : '') + message;
    item.appendChild(title);
    if (limit) {
      var count = document.createElement('p');
      count.className = state.options.cssPrefix + 'cheader-limit';
      count.textContent = limit;
      item.appendChild(count);
    }
    state.list.appendChild(item);
  }

  function safeUrl(value) {
    if (!value || value === '#' || value.indexOf('java' + 'script:') === 0) return '';
    try {
      var url = new URL(value, window.location.href);
      return url.origin === window.location.origin ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function choose(state, item) {
    if (state.options.fillSearchField) {
      var value = item[state.options.fillSearchFieldWith];
      if (value !== undefined && value !== null) {
        state.input.value = String(value);
        state.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      var href = safeUrl(item.url);
      if (href) window.location.assign(href);
    }
    state.input.dispatchEvent(new CustomEvent('workbench:search-select', {
      bubbles: true,
      detail: { item: item }
    }));
    hide(state);
  }

  function addOption(state, item) {
    var row = document.createElement('li');
    var optionId = state.list.id + '-option-' + state.optionsList.length;
    row.id = optionId;
    row.className = state.options.cssPrefix + 'cdata wb-field-search__option';
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');
    row.tabIndex = -1;

    var content = document.createElement('p');
    if (item.title !== undefined) {
      var title = document.createElement('span');
      title.className = state.options.cssPrefix + 'cdata-title';
      title.textContent = String(item.title);
      content.appendChild(title);
    }
    if (item.description !== undefined) {
      var description = document.createElement('span');
      description.className = 'wb-field-search__description';
      description.textContent = String(item.description);
      content.appendChild(description);
    }
    row.appendChild(content);
    row.addEventListener('pointerdown', function(event) { event.preventDefault(); });
    row.addEventListener('click', function() { choose(state, item); });
    row.addEventListener('pointermove', function() {
      activate(state, state.optionsList.findIndex(function(option) { return option.node === row; }));
    });
    state.optionsList.push({ node: row, item: item });
    state.list.appendChild(row);
  }

  function render(state, payload) {
    clearList(state);
    var categories = payload && typeof payload === 'object' ? Object.keys(payload).map(function(key) { return payload[key]; }) : [];
    var hasResults = categories.some(function(category) {
      return category && Array.isArray(category.cdata) && category.cdata.length > 0;
    });
    if (!hasResults) {
      statusRow(state, state.options.noResultsText, state.options.noResultsLimit, 'empty');
      announce(state, state.options.noResultsText);
      show(state);
      return;
    }

    var resultCount = 0;
    categories.forEach(function(category) {
      if (!category || !Array.isArray(category.cdata)) return;
      if (!state.options.displayEmptyCategories && category.cdata.length === 0) return;
      var header = category.cheader || {};
      var limit = Number.isFinite(Number(header.limit)) ? Number(header.limit) : category.cdata.length;
      var visible = Math.min(limit, category.cdata.length);
      resultCount += visible;
      var total = header.total === undefined ? category.cdata.length : header.total;
      statusRow(
        state,
        header.title === undefined ? '' : String(header.title),
        state.options.resultsLimit.replace('%', String(total)).replace('$', String(visible)),
        'category'
      );
      category.cdata.slice(0, limit).forEach(function(item) { addOption(state, item || {}); });
    });
    announce(
      state,
      (resultCount === 1 ? state.options.resultText : state.options.resultsText).replace('{count}', String(resultCount))
    );
    show(state);
  }

  function activate(state, index) {
    if (!state.optionsList.length) return;
    var next = Math.max(0, Math.min(index, state.optionsList.length - 1));
    state.optionsList.forEach(function(option, optionIndex) {
      option.node.classList.toggle('is-active', optionIndex === next);
      option.node.setAttribute('aria-selected', optionIndex === next ? 'true' : 'false');
    });
    state.activeIndex = next;
    state.input.setAttribute('aria-activedescendant', state.optionsList[next].node.id);
    state.optionsList[next].node.scrollIntoView({ block: 'nearest' });
  }

  function request(state) {
    var api = runtime();
    var query = state.input.value;
    if (query.length < state.options.minChars) {
      hide(state);
      return;
    }
    if (!api || typeof api.requestJson !== 'function') {
      clearList(state);
      statusRow(state, state.options.errorText, '', 'error');
      announce(state, state.options.errorText);
      show(state);
      return;
    }
    if (state.request && typeof state.request.abort === 'function') state.request.abort();
    setBusy(state, true);
    announce(state, state.options.loadingText);
    state.request = api.requestJson(state.options.dataSrc, {
      query: { q: query },
      timeout: 30000,
      cache: 'no-store'
    });
    var current = state.request;
    current.promise.then(function(payload) {
      if (state.request !== current) return;
      render(state, payload);
    }, function(error) {
      if (state.request !== current || isAbort(error)) return;
      clearList(state);
      statusRow(state, state.options.errorText, '', 'error');
      announce(state, state.options.errorText);
      show(state);
      state.input.dispatchEvent(new CustomEvent('workbench:search-error', { bubbles: true, detail: { error: error } }));
    }).then(function() {
      if (state.request === current) setBusy(state, false);
    });
  }

  function schedule(state) {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(function() { request(state); }, Math.max(0, Number(state.options.timeout) || 0));
  }

  function destroy(input) {
    var state = states.get(input);
    if (!state) return false;
    window.clearTimeout(state.timer);
    if (state.request && typeof state.request.abort === 'function') state.request.abort();
    state.listeners.forEach(function(listener) { input.removeEventListener(listener.type, listener.handler); });
    state.container.parentNode.insertBefore(input, state.container);
    state.container.remove();
    input.classList.remove('wb-field-search__input', 'wb-field-search__input--loading');
    ['role', 'aria-autocomplete', 'aria-controls', 'aria-expanded', 'aria-activedescendant', 'aria-busy'].forEach(function(name) {
      input.removeAttribute(name);
    });
    if (state.originalDescribedBy) input.setAttribute('aria-describedby', state.originalDescribedBy);
    else input.removeAttribute('aria-describedby');
    states.delete(input);
    return true;
  }

  function enhance(input, options) {
    if (!input || input.nodeName !== 'INPUT') return null;
    if (states.has(input)) destroy(input);
    var settings = mergeOptions(options);
    var container = document.createElement('div');
    var list = document.createElement('ul');
    var live = document.createElement('div');
    var id = 'wb-field-search-' + (++sequence);
    container.className = settings.cssPrefix + 'container wb-field-search';
    list.id = id + '-listbox';
    list.className = settings.cssPrefix + 'resultbox wb-field-search__results';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    live.id = id + '-status';
    live.className = 'sr-only wb-field-search__live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    var originalDescribedBy = input.getAttribute('aria-describedby') || '';
    input.parentNode.insertBefore(container, input);
    container.appendChild(input);
    container.appendChild(list);
    container.appendChild(live);
    input.autocomplete = 'off';
    input.classList.add('wb-field-search__input');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-describedby', [originalDescribedBy, live.id].filter(Boolean).join(' '));

    var state = { input: input, container: container, list: list, live: live, originalDescribedBy: originalDescribedBy, options: settings, optionsList: [], activeIndex: -1, timer: 0, request: null, listeners: [] };
    states.set(input, state);
    function listen(type, handler) {
      input.addEventListener(type, handler);
      state.listeners.push({ type: type, handler: handler });
    }
    listen('input', schedule.bind(null, state));
    listen('focus', function() {
      if (input.value === settings.searchFieldWatermark) input.value = '';
      if (input.value.length >= settings.minChars) schedule(state);
    });
    listen('blur', function() { window.setTimeout(function() { hide(state); }, 100); });
    listen('keydown', function(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (list.hidden) schedule(state);
        else activate(state, state.activeIndex + 1);
      } else if (event.key === 'ArrowUp' && !list.hidden) {
        event.preventDefault();
        activate(state, state.activeIndex < 0 ? state.optionsList.length - 1 : state.activeIndex - 1);
      } else if (event.key === 'Enter' && !list.hidden && state.activeIndex >= 0) {
        event.preventDefault();
        choose(state, state.optionsList[state.activeIndex].item);
      } else if (event.key === 'Escape') {
        hide(state);
      }
    });
    return state;
  }

  window.workbenchFieldSearch = { enhance: enhance, destroy: destroy };
  window.workbenchFieldSearchInstalled = true;
})(window, document);
