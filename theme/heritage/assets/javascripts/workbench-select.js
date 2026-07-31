(function () {
  'use strict';

  var states = new WeakMap();
  var sequence = 0;

  function text(key) {
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var copy = german ? {
      search: 'Optionen durchsuchen', empty: 'Keine passenden Optionen', selected: 'Ausgewählt'
    } : {
      search: 'Search options', empty: 'No matching options', selected: 'Selected'
    };
    return copy[key];
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function presentationLabel(select, option) {
    if (!option) return '';
    var original = String(option.textContent || '').replace(/\s+/g, ' ').trim();
    var value = String(option.value || '').trim().toLowerCase();
    if (!value || (normalize(original) !== normalize(value) && original.length > 2)) return original;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var field = String(select.id || select.name || '').toLowerCase();
    var labels = {
      language: {
        de: 'Deutsch', en: 'English', fr: 'Fran\u00e7ais', es: 'Espa\u00f1ol',
        it: 'Italiano', nl: 'Nederlands', pl: 'Polski', pt: 'Portugu\u00eas'
      },
      otp_type: german ? {
        none: 'Deaktiviert', otp: 'Einmalpasswort', totp: 'Authenticator-App'
      } : {
        none: 'Disabled', otp: 'One-time password', totp: 'Authenticator app'
      },
      app_theme: {
        workbench: 'Workbench', default: german ? 'Standard' : 'Default'
      },
      startmodule: german ? {
        dashboard: '\u00dcbersicht', client: 'Kunden', sites: 'Webseiten', mail: 'E-Mail',
        dns: 'DNS', monitor: '\u00dcberwachung', admin: 'System', tools: 'Einstellungen',
        help: 'Support'
      } : {
        dashboard: 'Overview', client: 'Clients', sites: 'Sites', mail: 'Email',
        dns: 'DNS', monitor: 'Monitoring', admin: 'System', tools: 'Settings',
        help: 'Support'
      }
    };
    return labels[field] && labels[field][value] ? labels[field][value] : original;
  }

  function choice(option) {
    return option ? { id: option.value, text: option.textContent, element: option } : null;
  }

  function emit(select, type, detail, cancelable) {
    var values = detail || {};
    var event = new CustomEvent(type, { bubbles: true, cancelable: Boolean(cancelable), detail: values });
    Object.keys(values).forEach(function (key) { event[key] = values[key]; });
    return select.dispatchEvent(event);
  }

  function selectedOptions(select) {
    return Array.prototype.filter.call(select.options, function (option) { return option.selected && option.value !== ''; });
  }

  function label(select) {
    var explicit = select.getAttribute('aria-label');
    if (explicit) return explicit;
    if (select.id) {
      var owner = document.querySelector('label[for="' + CSS.escape(select.id) + '"]');
      if (owner) return owner.textContent.trim();
    }
    return select.name || text('search');
  }

  function renderValue(state) {
    var selected = selectedOptions(state.select);
    state.value.replaceChildren();
    if (!selected.length) {
      var placeholder = state.select.options[state.select.selectedIndex];
      state.value.textContent = placeholder ? presentationLabel(state.select, placeholder) : state.options.placeholder || '';
      state.value.className = 'wb-select__value wb-select__value--placeholder';
    } else if (!state.select.multiple) {
      state.value.textContent = presentationLabel(state.select, selected[0]);
      state.value.className = 'wb-select__value';
    } else {
      state.value.className = 'wb-select__value wb-select__value--multiple';
      selected.forEach(function (option) {
        var chip = document.createElement('span');
        chip.className = 'wb-select__chip';
        chip.textContent = presentationLabel(state.select, option);
        state.value.appendChild(chip);
      });
    }
    state.control.disabled = state.select.disabled;
    state.control.setAttribute('aria-disabled', String(state.select.disabled));
  }

  function optionButton(state, option, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'wb-select__option';
    button.id = state.id + '-option-' + index;
    button.dataset.value = option.value;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(option.selected));
    button.disabled = option.disabled;
    button.textContent = presentationLabel(state.select, option);
    if (option.selected) button.classList.add('is-selected');
    button.addEventListener('click', function () { selectOption(state, option); });
    return button;
  }

  function renderOptions(state) {
    var term = state.search ? normalize(state.search.value) : '';
    var visible = 0;
    state.list.replaceChildren();
    Array.prototype.forEach.call(state.select.children, function (child) {
      if (child.tagName === 'OPTGROUP') {
        var group = document.createElement('div');
        group.className = 'wb-select__group';
        var heading = document.createElement('div');
        heading.className = 'wb-select__group-label';
        heading.textContent = child.label;
        group.appendChild(heading);
        Array.prototype.forEach.call(child.children, function (option) {
          if (term && normalize(presentationLabel(state.select, option)).indexOf(term) < 0) return;
          group.appendChild(optionButton(state, option, visible++));
        });
        if (group.children.length > 1) state.list.appendChild(group);
      } else if (child.tagName === 'OPTION') {
        if (term && normalize(presentationLabel(state.select, child)).indexOf(term) < 0) return;
        state.list.appendChild(optionButton(state, child, visible++));
      }
    });
    if (!visible) {
      var empty = document.createElement('div');
      empty.className = 'wb-select__empty';
      empty.textContent = text('empty');
      state.list.appendChild(empty);
    }
  }

  function viewportClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clearPanelPosition(state) {
    state.panel.style.removeProperty('position');
    state.panel.style.removeProperty('top');
    state.panel.style.removeProperty('right');
    state.panel.style.removeProperty('bottom');
    state.panel.style.removeProperty('left');
    state.panel.style.removeProperty('width');
    state.panel.style.removeProperty('max-width');
    state.panel.style.removeProperty('max-height');
    state.panel.style.removeProperty('transform');
    state.panel.style.removeProperty('transform-origin');
    state.panel.style.removeProperty('--wb-select-overlay-max-height');
  }

  function syncVariantClasses(state) {
    var pageSize = isPageSizeSelect(state.select);
    state.root.classList.toggle('wb-select--compact', Boolean(state.options.compact));
    state.panel.classList.toggle('wb-select__panel--compact', Boolean(state.options.compact));
    state.root.classList.toggle('wb-select--page-size', pageSize);
    state.panel.classList.toggle('wb-select__panel--page-size', pageSize);
    state.select.classList.toggle('wb-page-size-select', pageSize);
  }

  function isPageSizeSelect(select) {
    if (!select || select.tagName !== 'SELECT') return false;
    if (select.multiple || (select.size && Number(select.size) > 1)) return false;
    if (select.name === 'search_limit' || select.classList.contains('search_limit') || select.classList.contains('wb-page-size-select')) return true;
    var name = String(select.name || select.id || '').toLowerCase();
    if (/(^|[_-])(limit|pagesize|page_size|perpage|per_page|items_per_page)([_-]|$)/.test(name)) return true;
    var values = Array.prototype.map.call(select.options || [], function (option) {
      return String(option.value || option.textContent || '').trim();
    }).filter(Boolean);
    if (values.length < 2 || values.length > 8) return false;
    if (!values.every(function (value) { return /^\d{1,3}$/.test(value); })) return false;
    var pageSizes = ['5', '10', '15', '20', '25', '30', '50', '100', '250'];
    if (!values.every(function (value) { return pageSizes.indexOf(value) !== -1; })) return false;
    return values.some(function (value) { return value === '15' || value === '25' || value === '50'; });
  }

  function positionPanel(state) {
    if (!state.open || state.panel.hidden) return;
    var rect = state.control.getBoundingClientRect();
    var gap = 8;
    var margin = 12;
    var pageSize = isPageSizeSelect(state.select);
    var availableWidth = Math.max(220, window.innerWidth - margin * 2);
    var compact = state.root.classList.contains('wb-select--compact');
    var targetWidth = pageSize ? Math.max(rect.width, 108) : (compact ? Math.max(rect.width, 92) : Math.max(rect.width, Math.min(300, availableWidth)));
    var width = Math.min(targetWidth, availableWidth);
    var left = viewportClamp(rect.left, margin, window.innerWidth - width - margin);
    var below = window.innerHeight - rect.bottom - gap - margin;
    var above = rect.top - gap - margin;
    var openAbove = above > below && below < 180;
    var optionCount = state.select.options ? state.select.options.length : 0;
    var naturalPageSizeHeight = Math.max(112, Math.min(240, optionCount * 46 + 22));
    var maxHeight = pageSize
      ? Math.min(naturalPageSizeHeight, Math.max(112, openAbove ? above : below))
      : Math.max(160, Math.min(openAbove ? above : below, Math.floor(window.innerHeight * .58)));
    state.panel.style.position = 'fixed';
    state.panel.style.left = Math.round(left) + 'px';
    state.panel.style.right = 'auto';
    state.panel.style.bottom = 'auto';
    state.panel.style.width = Math.round(width) + 'px';
    state.panel.style.maxWidth = 'calc(100vw - 24px)';
    state.panel.style.maxHeight = Math.round(maxHeight) + 'px';
    state.panel.style.setProperty('--wb-select-overlay-max-height', Math.round(maxHeight) + 'px');
    state.panel.style.top = Math.round(openAbove ? rect.top - gap : rect.bottom + gap) + 'px';
    state.panel.style.transform = openAbove ? 'translateY(-100%)' : 'none';
    state.panel.style.transformOrigin = openAbove ? 'bottom center' : 'top center';
  }

  function close(state, restoreFocus) {
    if (!state.open) return;
    state.open = false;
    state.root.classList.remove('is-open');
    state.root.classList.remove('is-portaled');
    state.panel.hidden = true;
    state.control.setAttribute('aria-expanded', 'false');
    window.removeEventListener('resize', state.boundPosition, true);
    window.removeEventListener('scroll', state.boundPosition, true);
    if (state.panel.parentNode !== state.root) state.root.appendChild(state.panel);
    clearPanelPosition(state);
    if (restoreFocus) state.control.focus();
  }

  function open(state) {
    if (state.select.disabled) return;
    document.querySelectorAll('.wb-select.is-open').forEach(function (root) {
      if (root !== state.root) {
        var other = states.get(root.querySelector('select'));
        if (other) close(other, false);
      }
    });
    state.open = true;
    state.root.classList.add('is-open');
    state.panel.hidden = false;
    state.root.classList.add('is-portaled');
    document.body.appendChild(state.panel);
    state.control.setAttribute('aria-expanded', 'true');
    if (state.search) state.search.value = '';
    renderOptions(state);
    positionPanel(state);
    window.addEventListener('resize', state.boundPosition, true);
    window.addEventListener('scroll', state.boundPosition, true);
    window.setTimeout(function () {
      positionPanel(state);
      if (state.search) state.search.focus();
      else {
        var selected = state.list.querySelector('.wb-select__option.is-selected');
        var first = state.list.querySelector('.wb-select__option:not(:disabled)');
        (selected || first || state.control).focus();
      }
    }, 0);
  }

  function selectOption(state, option) {
    var data = choice(option);
    if (!emit(state.select, 'select2-selecting', { val: option.value, choice: data }, true)) return;
    var wasSelected = option.selected;
    if (state.select.multiple) option.selected = !wasSelected;
    else {
      Array.prototype.forEach.call(state.select.options, function (item) { item.selected = item === option; });
    }
    renderValue(state);
    renderOptions(state);
    emit(state.select, wasSelected && state.select.multiple ? 'select2-removed' : 'select2-selected', { val: option.value, choice: data });
    emit(state.select, wasSelected && state.select.multiple ? 'removed' : 'selected', { val: option.value, choice: data });
    state.select.dispatchEvent(new Event('change', { bubbles: true }));
    if (!state.select.multiple) close(state, true);
    else if (state.search) state.search.focus();
  }

  function enhance(select, options) {
    if (!select || select.tagName !== 'SELECT') return null;
    options = Object.assign({}, options || {});
    if (isPageSizeSelect(select)) {
      options.compact = true;
      options.search = false;
      if (!select.getAttribute('aria-label')) {
        select.setAttribute('aria-label', (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0 ? 'Einträge pro Seite' : 'Items per page');
      }
    }
    var existing = states.get(select);
    if (existing) {
      existing.options = Object.assign(existing.options, options || {});
      syncVariantClasses(existing);
      if (existing.options.search === false && existing.search) {
        existing.search.remove();
        existing.search = null;
      }
      renderValue(existing);
      renderOptions(existing);
      return existing;
    }
    var root = document.createElement('span');
    root.className = 'wb-select';
    var id = 'wb-select-' + (++sequence);
    root.id = id;
    select.parentNode.insertBefore(root, select);
    root.appendChild(select);
    select.classList.add('wb-select__native');

    var control = document.createElement('button');
    control.type = 'button';
    control.className = 'wb-select__control';
    control.setAttribute('role', 'combobox');
    control.setAttribute('aria-haspopup', 'listbox');
    control.setAttribute('aria-expanded', 'false');
    control.setAttribute('aria-controls', id + '-list');
    control.setAttribute('aria-label', label(select));
    var value = document.createElement('span');
    var arrow = document.createElement('span');
    arrow.className = 'wb-select__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    var namespace = 'http://www.w3.org/2000/svg';
    var arrowSvg = document.createElementNS(namespace, 'svg');
    arrowSvg.setAttribute('viewBox', '0 0 16 16');
    arrowSvg.setAttribute('focusable', 'false');
    var arrowPath = document.createElementNS(namespace, 'path');
    arrowPath.setAttribute('d', 'm4 6 4 4 4-4');
    arrowPath.setAttribute('fill', 'none');
    arrowPath.setAttribute('stroke', 'currentColor');
    arrowPath.setAttribute('stroke-width', '1.8');
    arrowPath.setAttribute('stroke-linecap', 'round');
    arrowPath.setAttribute('stroke-linejoin', 'round');
    arrowSvg.appendChild(arrowPath);
    arrow.appendChild(arrowSvg);
    control.appendChild(value);
    control.appendChild(arrow);

    var panel = document.createElement('span');
    panel.className = 'wb-select__panel';
    panel.hidden = true;
    var search = null;
    if (options.search !== false) {
      search = document.createElement('input');
      search.type = 'search';
      search.className = 'wb-select__search';
      search.placeholder = text('search');
      search.setAttribute('aria-label', text('search'));
      panel.appendChild(search);
    }
    var list = document.createElement('span');
    list.className = 'wb-select__list';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    if (select.multiple) list.setAttribute('aria-multiselectable', 'true');
    panel.appendChild(list);
    root.appendChild(control);
    root.appendChild(panel);

    var state = { id: id, select: select, root: root, control: control, value: value, arrow: arrow, panel: panel, search: search, list: list, options: options || {}, open: false };
    state.boundPosition = function () { positionPanel(state); };
    states.set(select, state);
    syncVariantClasses(state);
    control.addEventListener('click', function () { state.open ? close(state, true) : open(state); });
    control.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(state); }
    });
    if (search) {
      search.addEventListener('input', function () { renderOptions(state); });
      search.addEventListener('keydown', function (event) {
        var enabled = Array.prototype.filter.call(list.querySelectorAll('.wb-select__option'), function (item) { return !item.disabled; });
        var current = enabled.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); close(state, true); }
        else if (event.key === 'ArrowDown') { event.preventDefault(); (enabled[Math.min(current + 1, enabled.length - 1)] || enabled[0])?.focus(); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); (enabled[Math.max(current - 1, 0)] || enabled[enabled.length - 1])?.focus(); }
      });
    }
    list.addEventListener('keydown', function (event) {
      var enabled = Array.prototype.filter.call(list.querySelectorAll('.wb-select__option'), function (item) { return !item.disabled; });
      var current = enabled.indexOf(document.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); close(state, true); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); (enabled[current + 1] || enabled[0])?.focus(); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); (enabled[current - 1] || search || state.control)?.focus(); }
    });
    select.addEventListener('change', function () { renderValue(state); renderOptions(state); });
    new MutationObserver(function () { renderValue(state); renderOptions(state); }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['selected', 'disabled', 'label'] });
    renderValue(state);
    renderOptions(state);
    return state;
  }

  function destroy(select) {
    var state = states.get(select);
    if (!state) return;
    state.root.parentNode.insertBefore(select, state.root);
    select.classList.remove('wb-select__native');
    state.root.remove();
    states.delete(select);
  }

  document.addEventListener('pointerdown', function (event) {
    document.querySelectorAll('.wb-select.is-open').forEach(function (root) {
      var state = states.get(root.querySelector('select'));
      if (state && !root.contains(event.target) && !state.panel.contains(event.target)) {
        close(state, false);
      }
    });
  });

  window.workbenchSelect = { enhance: enhance, destroy: destroy, open: open, close: close };
  window.workbenchSelectInstalled = true;
}());
