(function () {
  'use strict';

  var tokenPattern = /(?:yyyy|yy|mm|dd|hh|ii|ss)/g;

  function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function parts(format) {
    format = String(format || 'yyyy-mm-dd');
    var tokens = [];
    var source = '^';
    var cursor = 0;
    format.replace(tokenPattern, function (token, offset) {
      source += escapePattern(format.slice(cursor, offset));
      source += token === 'yyyy' ? '(\\d{4})' : '(\\d{1,2})';
      tokens.push(token);
      cursor = offset + token.length;
      return token;
    });
    source += escapePattern(format.slice(cursor)) + '$';
    return { tokens: tokens, expression: new RegExp(source) };
  }

  function parse(value, format) {
    var contract = parts(format);
    var match = contract.expression.exec(String(value || '').trim());
    if (!match) return null;
    var result = { yyyy: 0, mm: 1, dd: 1, hh: 0, ii: 0, ss: 0 };
    contract.tokens.forEach(function (token, index) {
      var number = Number(match[index + 1]);
      result[token === 'yy' ? 'yyyy' : token] = token === 'yy' ? 2000 + number : number;
    });
    var date = new Date(result.yyyy, result.mm - 1, result.dd, result.hh, result.ii, result.ss);
    if (date.getFullYear() !== result.yyyy || date.getMonth() !== result.mm - 1 || date.getDate() !== result.dd || date.getHours() !== result.hh || date.getMinutes() !== result.ii || date.getSeconds() !== result.ss) return null;
    return result;
  }

  function pad(value, length) {
    return String(value).padStart(length || 2, '0');
  }

  function format(partsValue, pattern) {
    var values = {
      yyyy: pad(partsValue.yyyy, 4),
      yy: pad(partsValue.yyyy % 100, 2),
      mm: pad(partsValue.mm),
      dd: pad(partsValue.dd),
      hh: pad(partsValue.hh),
      ii: pad(partsValue.ii),
      ss: pad(partsValue.ss)
    };
    return String(pattern).replace(tokenPattern, function (token) { return values[token]; });
  }

  function fromNative(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value || '');
    if (!match) return null;
    return { yyyy: Number(match[1]), mm: Number(match[2]), dd: Number(match[3]), hh: Number(match[4] || 0), ii: Number(match[5] || 0), ss: Number(match[6] || 0) };
  }

  function toNative(value, includeTime, includeSeconds) {
    if (!value) return '';
    var date = pad(value.yyyy, 4) + '-' + pad(value.mm) + '-' + pad(value.dd);
    if (!includeTime) return date;
    return date + 'T' + pad(value.hh) + ':' + pad(value.ii) + (includeSeconds ? ':' + pad(value.ss) : '');
  }

  function labelFor(input, includeTime) {
    var language = (document.documentElement.lang || '').toLowerCase();
    if (language.indexOf('de') === 0) return includeTime ? 'Datum und Uhrzeit wählen' : 'Datum wählen';
    return includeTime ? 'Choose date and time' : 'Choose date';
  }

  function svgNode() {
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var outline = document.createElementNS(namespace, 'path');
    outline.setAttribute('d', 'M7 2v3M17 2v3M3.5 9h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z');
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', 'currentColor');
    outline.setAttribute('stroke-width', '1.8');
    outline.setAttribute('stroke-linecap', 'round');
    var days = document.createElementNS(namespace, 'path');
    days.setAttribute('d', 'M7.5 13h2v2h-2zM11 13h2v2h-2zM14.5 13h2v2h-2z');
    days.setAttribute('fill', 'currentColor');
    svg.appendChild(outline);
    svg.appendChild(days);
    return svg;
  }

  function enhance(input) {
    if (!input || input.dataset.workbenchDateTime === 'true') return input;
    var includeTime = input.dataset.inputElement === 'datetime';
    var pattern = input.dataset.dateFormat || (includeTime ? 'yyyy-mm-dd hh:ii' : 'yyyy-mm-dd');
    var includeSeconds = pattern.indexOf('ss') >= 0;
    var wrapper = document.createElement('span');
    wrapper.className = 'wb-date-time-control';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    var nativeInput = document.createElement('input');
    nativeInput.type = includeTime ? 'datetime-local' : 'date';
    nativeInput.className = 'wb-date-time-control__native';
    nativeInput.tabIndex = -1;
    nativeInput.setAttribute('aria-hidden', 'true');
    if (includeSeconds) nativeInput.step = '1';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'wb-date-time-control__trigger';
    button.setAttribute('aria-label', labelFor(input, includeTime));
    button.appendChild(svgNode());
    wrapper.appendChild(nativeInput);
    wrapper.appendChild(button);

    function syncNative() {
      var parsed = parse(input.value, pattern);
      nativeInput.value = parsed ? toNative(parsed, includeTime, includeSeconds) : '';
      input.classList.toggle('wb-date-time-control__text--invalid', Boolean(input.value.trim() && !parsed));
    }

    button.addEventListener('click', function () {
      syncNative();
      if (typeof nativeInput.showPicker === 'function') nativeInput.showPicker();
      else { nativeInput.focus(); nativeInput.click(); }
    });
    nativeInput.addEventListener('change', function () {
      var parsed = fromNative(nativeInput.value);
      if (!parsed) return;
      input.value = format(parsed, pattern);
      input.classList.remove('wb-date-time-control__text--invalid');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
    });
    input.addEventListener('input', syncNative);
    input.addEventListener('change', syncNative);
    input.dataset.workbenchDateTime = 'true';
    input.dataset.workbenchDateTimeFormat = pattern;
    syncNative();
    return input;
  }

  function enhanceAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches('input[data-input-element="date"],input[data-input-element="datetime"]')) enhance(scope);
    scope.querySelectorAll('input[data-input-element="date"],input[data-input-element="datetime"]').forEach(enhance);
  }

  document.addEventListener('workbench:navigation-complete', function () { enhanceAll(document.getElementById('pageContent')); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { enhanceAll(document); }, { once: true });
  else enhanceAll(document);

  window.workbenchDateTime = { enhance: enhance, enhanceAll: enhanceAll, parse: parse, format: format, toNative: toNative, fromNative: fromNative };
  window.workbenchDateTimeInstalled = true;
}());
