(function (window, document) {
  'use strict';

  if (window.workbenchGlobalSearchInstalled) {
    return;
  }

  var timer = null;
  var request = null;
  var requestSequence = 0;
  var activeIndex = -1;

  function app() {
    return typeof window.workbenchRuntime === 'function'
      ? window.workbenchRuntime()
      : null;
  }

  function isGermanInterface() {
    return String(document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('de') === 0;
  }

  function tr(de, en) {
    return isGermanInterface() ? de : en;
  }

  function formatResultSummary(count, query) {
    if (isGermanInterface()) {
      return count + ' Treffer für "' + query + '"';
    }
    return count + (count === 1 ? ' result for "' : ' results for "') + query + '"';
  }

  function formatFoundSummary(count) {
    if (isGermanInterface()) {
      return count + ' Treffer gefunden.';
    }
    return count + (count === 1 ? ' result found.' : ' results found.');
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function init() {
    var form = document.getElementById('searchform');
    var input = document.getElementById('globalsearch');
    if (!form || !input || input.dataset.wbSearchReady === 'true') {
      return false;
    }

    input.dataset.wbSearchReady = 'true';
    input.setAttribute('aria-keyshortcuts', '/');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    var resultBox = document.createElement('div');
    resultBox.id = 'workbench-global-search-results';
    resultBox.className = 'wb-global-search-results';
    resultBox.setAttribute('role', 'listbox');
    resultBox.setAttribute('aria-label', input.getAttribute('aria-label') || tr('Suchergebnisse', 'Search results'));
    resultBox.hidden = true;
    form.appendChild(resultBox);
    input.setAttribute('aria-controls', resultBox.id);

    var status = document.createElement('span');
    status.className = 'wb-visually-hidden';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    form.appendChild(status);

    var clear = form.querySelector('.wb-search-clear');
    if (!clear) {
      clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'wb-search-clear';
      clear.setAttribute('aria-label', document.body.getAttribute('data-workbench-search-clear') || tr('Suche leeren', 'Clear search'));
      clear.textContent = '\u00d7';
      input.parentNode.appendChild(clear);
    }
    clear.hidden = true;

    var shortcut = form.querySelector('.wb-search-shortcut');

    function announce(message) {
      status.textContent = '';
      window.requestAnimationFrame(function () {
        status.textContent = message;
      });
    }

    function options() {
      return Array.prototype.slice.call(resultBox.querySelectorAll('[role="option"]'));
    }

    function setActive(index) {
      var items = options();
      if (!items.length) {
        return;
      }

      activeIndex = (index + items.length) % items.length;
      items.forEach(function (item, itemIndex) {
        var active = itemIndex === activeIndex;
        item.classList.toggle('wb-global-search-result--active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      input.setAttribute('aria-activedescendant', items[activeIndex].id);
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function closeResults() {
      resultBox.hidden = true;
      form.classList.remove('wb-global-search-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }

    function openResults() {
      form.classList.add('wb-global-search-open');
      resultBox.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function destination(item) {
      var runtime = app();
      if (item.action === 'capp' && item.module && item.path && runtime && typeof runtime.capp === 'function') {
        return function () {
          runtime.capp(String(item.module), String(item.path));
        };
      }

      if (item.url && /^(?:\/|\.\/|\.\.\/)/.test(item.url)) {
        return function () {
          window.location.assign(item.url);
        };
      }

      return null;
    }

    function appendText(parent, source, query) {
      var text = String(source || '');
      var term = String(query || '').trim();
      if (!term) {
        parent.textContent = text;
        return;
      }

      var escaped = escapeRegExp(term);
      var reg = new RegExp('(' + escaped + ')', 'gi');
      var fragments = text.split(reg);
      if (fragments.length === 1) {
        parent.textContent = text;
        return;
      }

      fragments.forEach(function (fragment) {
        if (!fragment) {
          return;
        }

        if (reg.test(fragment)) {
          var mark = document.createElement('mark');
          mark.textContent = fragment;
          parent.appendChild(mark);
        } else {
          parent.appendChild(document.createTextNode(fragment));
        }

        reg.lastIndex = 0;
      });
    }

    function appendHeader(query, count) {
      var header = document.createElement('div');
      header.className = 'wb-global-search-palette__header';

      var eyebrow = document.createElement('span');
      eyebrow.textContent = tr('Globale Suche', 'Global search');

      var summary = document.createElement('strong');
      if (query) {
        summary.textContent = formatResultSummary(Number(count) || 0, query);
      } else {
        summary.textContent = tr('Suche in Menüs und Objekten', 'Search quickly in menus and objects');
      }

      header.appendChild(eyebrow);
      header.appendChild(summary);
      resultBox.appendChild(header);
    }

    function appendFooter() {
      var footer = document.createElement('div');
      footer.className = 'wb-global-search-palette__footer';
      footer.textContent = tr('Mit Pfeil hoch/runter navigieren, Enter öffnet, Esc schließt.', 'Use up/down, Enter opens, Esc closes.');
      resultBox.appendChild(footer);
    }

    function showMessage(message, state, query) {
      resultBox.replaceChildren();
      appendHeader(query || input.value.trim(), null);

      var row = document.createElement('div');
      row.className = 'wb-global-search-message wb-global-search-message--' + state;
      row.setAttribute('role', state === 'error' ? 'alert' : 'status');
      row.textContent = message;
      resultBox.appendChild(row);

      appendFooter();
      openResults();
      announce(message);
    }

    function showPrompt() {
      resultBox.replaceChildren();
      appendHeader('', null);

      var row = document.createElement('div');
      row.className = 'wb-global-search-message wb-global-search-message--hint';
      row.setAttribute('role', 'status');
      row.textContent = tr(
        'Bitte 2 Zeichen eingeben. Suche nach Kunden, Domains, E-Mails, Servern oder Tickets.',
        'Enter at least two characters. Search for customers, domains, emails, servers or tickets.'
      );
      resultBox.appendChild(row);

      appendFooter();
      openResults();
      announce(row.textContent);
    }

    function render(data) {
      resultBox.replaceChildren();
      var query = input.value.trim();
      var count = 0;
      appendHeader(query, 0);

      (Array.isArray(data) ? data : []).forEach(function (category) {
        var entries = category && Array.isArray(category.cdata) ? category.cdata : [];
        if (!entries.length) {
          return;
        }

        var group = document.createElement('section');
        group.className = 'wb-global-search-group';
        group.setAttribute('role', 'group');

        var header = document.createElement('div');
        header.className = 'wb-global-search-group__header';

        var title = document.createElement('strong');
        title.textContent = (category.cheader && category.cheader.title) || tr('Ergebnisse', 'Results');
        group.setAttribute('aria-label', title.textContent);

        var total = category.cheader && typeof category.cheader.total === 'number'
          ? category.cheader.total
          : entries.length;

        var countBadge = document.createElement('span');
        countBadge.textContent = String(total);
        header.setAttribute('aria-hidden', 'true');

        header.appendChild(title);
        header.appendChild(countBadge);
        group.appendChild(header);

        entries.forEach(function (item) {
          var open = destination(item || {});
          if (!open) {
            return;
          }

          count += 1;
          var option = document.createElement('button');
          option.type = 'button';
          option.id = 'workbench-global-search-option-' + count;
          option.className = 'wb-global-search-result';
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');

          var icon = document.createElement('span');
          icon.className = 'wb-global-search-result__icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = String((title.textContent || '?').trim().charAt(0) || '?').toLocaleUpperCase();

          var content = document.createElement('span');
          content.className = 'wb-global-search-result__content';

          var label = document.createElement('strong');
          appendText(label, item.title || '', query);

          var description = document.createElement('span');
          appendText(description, item.description || '', query);

          var meta = document.createElement('small');
          meta.textContent = title.textContent;

          content.appendChild(label);
          if (description.textContent) {
            content.appendChild(description);
          }
          content.appendChild(meta);

          var arrow = document.createElement('span');
          arrow.className = 'wb-global-search-result__arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';

          option.appendChild(icon);
          option.appendChild(content);
          option.appendChild(arrow);
          option.addEventListener('click', function () {
            closeResults();
            open();
          });

          group.appendChild(option);
        });

        if (group.querySelector('[role="option"]')) {
          resultBox.appendChild(group);
        }
      });

      var items = options();
      items.forEach(function (item, itemIndex) {
        item.setAttribute('aria-setsize', String(items.length));
        item.setAttribute('aria-posinset', String(itemIndex + 1));
      });

      var resultSummary = resultBox.querySelector('.wb-global-search-palette__header strong');
      if (resultSummary) {
        resultSummary.textContent = formatResultSummary(count, query);
      }

      if (!count) {
        showMessage(tr('Keine Treffer gefunden.', 'No matching results.'), 'empty', query);
        return;
      }

      appendFooter();
      openResults();
      setActive(0);
      announce(formatFoundSummary(count));
    }

    function search() {
      var query = input.value.trim();
      var token = ++requestSequence;

      if (query.length < 2) {
        if (request) {
          request.abort();
        }

        if (query.length === 1) {
          showMessage(tr('Noch ein Zeichen eingeben, dann startet die Suche.', 'Enter one more character to start searching.'), 'hint', query);
        } else if (document.activeElement === input) {
          showPrompt();
        } else {
          closeResults();
        }
        return;
      }

      if (request) {
        request.abort();
      }

      input.setAttribute('aria-busy', 'true');
      showMessage(tr('Suche läuft …', 'Searching…'), 'loading', query);

      var runtime = app();
      if (!runtime || typeof runtime.requestJson !== 'function' || typeof runtime.endpoint !== 'function') {
        showMessage(tr('Die Suche ist derzeit nicht verfügbar.', 'Search is temporarily unavailable.'), 'error', query);
        input.removeAttribute('aria-busy');
        return;
      }

      var activeRequest = runtime.requestJson(runtime.endpoint('globalSearch'), {
        query: { type: 'globalsearch', q: query },
        timeout: 15000
      });
      request = activeRequest;

      activeRequest.promise.then(function (payload) {
        if (token === requestSequence) {
          render(payload);
        }
      }).catch(function (error) {
        if (activeRequest && activeRequest.aborted) {
          return;
        }
        if (error && error.name === 'AbortError') {
          return;
        }
        if (token !== requestSequence) {
          return;
        }
        showMessage(tr('Die Suche ist derzeit nicht verfügbar.', 'Search is temporarily unavailable.'), 'error', query);
      }).finally(function () {
        if (token === requestSequence) {
          input.removeAttribute('aria-busy');
        }
      });
    }

    function syncClear(scheduleSearch) {
      var hasValue = Boolean(input.value);
      clear.hidden = !hasValue;
      form.classList.toggle('wb-global-search-has-value', hasValue);
      if (shortcut) {
        shortcut.hidden = hasValue;
      }

      clear.disabled = !hasValue;

      window.clearTimeout(timer);
      if (scheduleSearch !== false) {
        timer = window.setTimeout(search, 250);
      }
    }

    input.addEventListener('input', function () { syncClear(true); });
    input.addEventListener('focus', function () {
      if (!input.value.trim()) {
        showPrompt();
      }
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === 'Home' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActive(0);
      } else if (event.key === 'End' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActive(options().length - 1);
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        var optionsNow = options();
        if (optionsNow[activeIndex]) {
          optionsNow[activeIndex].click();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        window.clearTimeout(timer);
        if (request && typeof request.abort === 'function') {
          request.abort();
        }
        if (resultBox.hidden) {
          input.value = '';
        }
        closeResults();
        syncClear(false);
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var optionsNow = options();
      if (optionsNow.length) {
        optionsNow[Math.max(activeIndex, 0)].click();
      }
    });

    clear.addEventListener('click', function () {
      window.clearTimeout(timer);
      if (request && typeof request.abort === 'function') {
        request.abort();
      }
      input.value = '';
      input.focus();
      syncClear(false);
      showPrompt();
    });

    document.addEventListener('keydown', function (event) {
      var target = event.target;
      var typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        input.focus();
        input.select();
      }
      if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });

    document.addEventListener('pointerdown', function (event) {
      if (!form.contains(event.target)) {
        closeResults();
      }
    });

    document.addEventListener('focusin', function (event) {
      if (!form.contains(event.target)) {
        closeResults();
      }
    });

    syncClear(false);
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.workbenchGlobalSearch = { init: init };
  window.workbenchGlobalSearchInstalled = true;
}(window, document));
