/* Generated from heritage-js-bundles.json; edit the modular sources, not this file. */

/* source: heritage-date-time.js */
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
    if (!input || input.dataset.heritageDateTime === 'true') return input;
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
    input.dataset.heritageDateTime = 'true';
    input.dataset.heritageDateTimeFormat = pattern;
    syncNative();
    return input;
  }

  function enhanceAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches('input[data-input-element="date"],input[data-input-element="datetime"]')) enhance(scope);
    scope.querySelectorAll('input[data-input-element="date"],input[data-input-element="datetime"]').forEach(enhance);
  }

  document.addEventListener('heritage:navigation-complete', function () { enhanceAll(document.getElementById('pageContent')); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { enhanceAll(document); }, { once: true });
  else enhanceAll(document);

  window.heritageDateTime = { enhance: enhance, enhanceAll: enhanceAll, parse: parse, format: format, toNative: toNative, fromNative: fromNative };
  window.heritageDateTimeInstalled = true;
}());

/* source: heritage-native-interactions.js */
(function () {
  'use strict';

  var activeTooltipControl = null;
  var tooltipNode = null;
  var tooltipId = 'heritage-native-tooltip';

  function emitNative(element, name, detail, cancelable) {
    if (!element) return false;
    return element.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      cancelable: cancelable === true,
      detail: detail || {}
    }));
  }

  function selectorFor(trigger) {
    var value = trigger && (trigger.getAttribute('data-target') || trigger.getAttribute('href')) || '';
    var hash = value.indexOf('#');
    return hash >= 0 ? value.slice(hash) : '';
  }

  function triggersFor(target) {
    if (!target || !target.id) return [];
    return Array.from(document.querySelectorAll('[data-heritage-collapse]')).filter(function (trigger) {
      return selectorFor(trigger) === '#' + target.id;
    });
  }

  function updateTriggers(target, expanded) {
    triggersFor(target).forEach(function (trigger) {
      trigger.classList.toggle('collapsed', !expanded);
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (!trigger.getAttribute('aria-controls') && target.id) trigger.setAttribute('aria-controls', target.id);
    });
  }

  function setCollapse(target, expanded, relatedTarget) {
    if (!target) return false;
    var current = target.classList.contains('in');
    var detail = { expanded: expanded, relatedTarget: relatedTarget || null };
    if (current === expanded) {
      target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      updateTriggers(target, expanded);
      return true;
    }
    if (!emitNative(target, expanded ? 'heritage:collapse-before-open' : 'heritage:collapse-before-close', detail, true)) return false;
    target.classList.toggle('in', expanded);
    target.hidden = !expanded;
    target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    updateTriggers(target, expanded);
    emitNative(target, expanded ? 'heritage:collapse-open' : 'heritage:collapse-close', detail, false);
    return true;
  }

  function closeAccordionPeers(trigger, target) {
    var parentSelector = trigger.getAttribute('data-parent');
    if (!parentSelector) return;
    var parent;
    try { parent = document.querySelector(parentSelector); } catch (error) { parent = null; }
    if (!parent) return;
    parent.querySelectorAll('.collapse.in, .wb-collapse.in').forEach(function (peer) {
      if (peer !== target) setCollapse(peer, false, trigger);
    });
  }

  function toggleCollapse(trigger) {
    var selector = selectorFor(trigger);
    var target;
    try { target = selector ? document.querySelector(selector) : null; } catch (error) { target = null; }
    if (!target) return false;
    var expanded = !target.classList.contains('in');
    if (expanded) closeAccordionPeers(trigger, target);
    return setCollapse(target, expanded, trigger);
  }

  function dismissAlert(control) {
    var alert = control && control.closest('.alert');
    var detail = { relatedTarget: control || null };
    if (!alert) return false;
    if (!emitNative(alert, 'heritage:alert-before-dismiss', detail, true)) return false;
    alert.remove();
    emitNative(alert, 'heritage:alert-dismiss', detail, false);
    return true;
  }

  function setModal(element, visible, relatedTarget) {
    if (!element || element.getAttribute('role') !== 'dialog' || !window.heritageDialog) return false;
    return visible ? window.heritageDialog.open(element, relatedTarget) : window.heritageDialog.close(element, true);
  }

  function ensureTooltipNode() {
    if (tooltipNode && tooltipNode.isConnected) return tooltipNode;
    tooltipNode = document.createElement('div');
    tooltipNode.id = tooltipId;
    tooltipNode.className = 'wb-native-tooltip';
    tooltipNode.setAttribute('role', 'tooltip');
    tooltipNode.hidden = true;
    document.body.appendChild(tooltipNode);
    return tooltipNode;
  }

  function tooltipText(element, action) {
    return String(
      element.dataset.heritageTooltipText ||
      element.getAttribute('data-original-title') ||
      element.getAttribute('title') ||
      action && action.title ||
      ''
    ).replace(/\s+/g, ' ').trim();
  }

  function positionTooltip(control, tooltip) {
    var rect = control.getBoundingClientRect();
    var gap = 9;
    var margin = 10;
    var left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.offsetWidth - margin));
    var top = rect.top - tooltip.offsetHeight - gap;
    var placement = 'top';
    if (top < margin) {
      top = rect.bottom + gap;
      placement = 'bottom';
    }
    tooltip.style.left = Math.round(left) + 'px';
    tooltip.style.top = Math.round(Math.max(margin, top)) + 'px';
    tooltip.dataset.placement = placement;
  }

  function showTooltip(control) {
    if (!control || control.dataset.heritageNativeTooltip !== 'true') return false;
    var value = tooltipText(control);
    if (!value) return false;
    var tooltip = ensureTooltipNode();
    activeTooltipControl = control;
    tooltip.textContent = value;
    tooltip.hidden = false;
    control.setAttribute('aria-describedby', tooltipId);
    window.requestAnimationFrame(function() {
      if (activeTooltipControl === control && !tooltip.hidden) positionTooltip(control, tooltip);
    });
    return true;
  }

  function hideTooltip(control) {
    if (control && activeTooltipControl && control !== activeTooltipControl) return false;
    if (activeTooltipControl) {
      var previous = activeTooltipControl.dataset.heritageTooltipDescribedBy || '';
      if (previous) activeTooltipControl.setAttribute('aria-describedby', previous);
      else activeTooltipControl.removeAttribute('aria-describedby');
    }
    activeTooltipControl = null;
    if (tooltipNode) tooltipNode.hidden = true;
    return true;
  }

  function initializeTooltip(element, action) {
    if (!element) return false;
    if (action === 'destroy') {
      hideTooltip(element);
      if (element.dataset.heritageTooltipText && !element.getAttribute('title')) element.setAttribute('title', element.dataset.heritageTooltipText);
      delete element.dataset.heritageTooltipText;
      delete element.dataset.heritageTooltipDescribedBy;
      delete element.dataset.heritageNativeTooltip;
      return true;
    }
    var title = tooltipText(element, action);
    if (!title) return false;
    if (!element.dataset.heritageTooltipDescribedBy) element.dataset.heritageTooltipDescribedBy = element.getAttribute('aria-describedby') || '';
    element.dataset.heritageTooltipText = title;
    element.setAttribute('data-original-title', title);
    element.removeAttribute('title');
    element.dataset.heritageNativeTooltip = 'true';
    return true;
  }

  function synchronize(root) {
    var host = root && root.querySelectorAll ? root : document;
    host.querySelectorAll('[data-dismiss="alert"], [data-bs-dismiss="alert"]').forEach(function (trigger) {
      trigger.setAttribute('data-heritage-dismiss', 'alert');
      trigger.removeAttribute('data-dismiss');
      trigger.removeAttribute('data-bs-dismiss');
    });
    host.querySelectorAll('.wb-row-action[title]').forEach(function(element) {
      element.setAttribute('data-heritage-tooltip', 'true');
    });
    host.querySelectorAll('[data-heritage-tooltip]').forEach(function (element) {
      initializeTooltip(element);
    });
    host.querySelectorAll('.collapse, .wb-collapse').forEach(function (target) {
      var expanded = target.classList.contains('in');
      target.hidden = !expanded;
      target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      updateTriggers(target, expanded);
    });
  }

  document.addEventListener('click', function (event) {
    var alertControl = event.target.closest('[data-heritage-dismiss="alert"]');
    if (alertControl) {
      event.preventDefault();
      dismissAlert(alertControl);
      return;
    }
    var collapseControl = event.target.closest('[data-heritage-collapse]');
    if (collapseControl) {
      event.preventDefault();
      toggleCollapse(collapseControl);
    }
  });

  document.addEventListener('pointerover', function(event) {
    var control = event.target.closest('[data-heritage-native-tooltip="true"]');
    if (control) showTooltip(control);
  });

  document.addEventListener('pointerout', function(event) {
    var control = event.target.closest('[data-heritage-native-tooltip="true"]');
    if (control && !control.contains(event.relatedTarget) && !control.contains(document.activeElement)) hideTooltip(control);
  });

  document.addEventListener('focusin', function(event) {
    var control = event.target.closest('[data-heritage-native-tooltip="true"]');
    if (control) showTooltip(control);
  });

  document.addEventListener('focusout', function(event) {
    var control = event.target.closest('[data-heritage-native-tooltip="true"]');
    if (control && !control.contains(event.relatedTarget)) hideTooltip(control);
  });

  document.addEventListener('heritage:navigation-complete', function (event) {
    hideTooltip(activeTooltipControl);
    synchronize(event.detail && event.detail.container || document.getElementById('pageContent'));
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && activeTooltipControl) hideTooltip(activeTooltipControl);
  });

  window.addEventListener('resize', function() {
    if (activeTooltipControl && tooltipNode && !tooltipNode.hidden) positionTooltip(activeTooltipControl, tooltipNode);
  });

  window.addEventListener('scroll', function() {
    if (!activeTooltipControl) return;
    if (activeTooltipControl.contains(document.activeElement) && tooltipNode && !tooltipNode.hidden) {
      positionTooltip(activeTooltipControl, tooltipNode);
    } else {
      hideTooltip(activeTooltipControl);
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { synchronize(document); }, { once: true });
  } else {
    synchronize(document);
  }

  window.heritageInteractions = {
    collapse: setCollapse,
    toggleCollapse: toggleCollapse,
    dismissAlert: dismissAlert,
    modal: setModal,
    tooltip: initializeTooltip,
    synchronize: synchronize
  };
  window.heritageInteractionsInstalled = true;
}());

/* source: heritage-http.js */
(function(window) {
  'use strict';

  if (window.heritageHttp) return;

  function HttpError(message, status, url) {
    this.name = 'WorkbenchHttpError';
    this.message = message;
    this.status = status || 0;
    this.url = url || '';
  }
  HttpError.prototype = Object.create(Error.prototype);
  HttpError.prototype.constructor = HttpError;

  function normalizeFetchError(error, url) {
    if (error && error.name === 'WorkbenchHttpError') return error;
    if (error && error.name === 'AbortError') return error;
    if (error instanceof TypeError) return new HttpError('Network request failed.', 0, url && url.href || '');
    return error;
  }

  function shouldRetry(error, handle) {
    if (handle && handle.aborted) return false;
    if (!error) return false;
    if (error.name === 'AbortError') return false;
    if (error.name === 'WorkbenchHttpError' && error.status === 0) return true;
    return error instanceof TypeError;
  }

  function fetchWithRetry(url, init, handle, retries) {
    var attempt = 0;
    function run() {
      attempt += 1;
      return window.fetch(url.href, init).catch(function(error) {
        if (attempt <= retries && shouldRetry(error, handle)) {
          return new Promise(function(resolve) {
            window.setTimeout(resolve, 180 * attempt);
          }).then(run);
        }
        throw error;
      });
    }
    return run();
  }

  function sameOriginUrl(input, query) {
    var url = new URL(input, window.location.href);
    if (url.origin !== window.location.origin) {
      throw new HttpError('Cross-origin Workbench requests are blocked.', 0, url.href);
    }
    if (query) {
      var values = typeof query === 'string' ? new URLSearchParams(query) : new URLSearchParams();
      if (typeof query !== 'string') {
        Object.keys(query).forEach(function(key) {
          if (query[key] !== undefined && query[key] !== null) values.append(key, String(query[key]));
        });
      }
      values.forEach(function(value, key) { url.searchParams.append(key, value); });
    }
    return url;
  }

  function get(input, options) {
    options = options || {};
    var url = sameOriginUrl(input, options.query);
    var controller = window.AbortController ? new window.AbortController() : null;
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    var init = {
      method: 'GET',
      credentials: 'same-origin',
      cache: options.cache || 'no-store',
      headers: { 'Accept': options.accept || 'text/html' },
      signal: controller ? controller.signal : undefined
    };
    handle.promise = fetchWithRetry(url, init, handle, options.retries === undefined ? 1 : Number(options.retries) || 0).then(function(response) {
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return options.response === 'json' ? response.json() : response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (handle.aborted) throw new HttpError('Request was superseded.', 0, url.href);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function postForm(form, input, options) {
    options = options || {};
    if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
    var url = sameOriginUrl(input);
    var controller = window.AbortController ? new window.AbortController() : null;
    var body = new URLSearchParams();
    new FormData(form).forEach(function(value, key) {
      if (typeof value === 'string') body.append(key, value);
    });
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    var init = {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body.toString(),
      signal: controller ? controller.signal : undefined
    };
    // Mutating requests are never retried implicitly. A lost response does not
    // prove that the server rejected the first write, so repeating it could
    // create duplicate records or execute an action twice.
    handle.promise = fetchWithRetry(url, init, handle, options.retries === undefined ? 0 : Number(options.retries) || 0).then(function(response) {
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (handle.aborted) throw new HttpError('Request was superseded.', 0, url.href);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function multipart(body, input, options) {
    options = options || {};
    if (!(body instanceof window.FormData)) throw new TypeError('A FormData body is required.');
    var url = sameOriginUrl(input);
    var controller = window.AbortController ? new window.AbortController() : null;
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 120000);
    handle.promise = window.fetch(url.href, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body,
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      if (options.response === 'json') {
        return response.json().then(function(payload) { return { ok: response.ok, status: response.status, payload: payload }; });
      }
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function postMultipart(form, input, options) {
    if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
    return multipart(new FormData(form), input, options);
  }

  window.heritageHttp = {
    getText: function(input, options) { return get(input, options); },
    getJson: function(input, options) {
      options = Object.assign({}, options || {}, { response: 'json', accept: 'application/json' });
      return get(input, options);
    },
    postForm: postForm,
    postMultipart: postMultipart,
    postMultipartJson: function(body, input, options) {
      return multipart(body, input, Object.assign({}, options || {}, { response: 'json' }));
    },
    HttpError: HttpError
  };
})(window);

/* source: heritage-core.js */
(function(window, document) {
  'use strict';

  function toArray(value) {
    return Array.prototype.slice.call(value || []);
  }

  function extend(target) {
    target = target || {};
    toArray(arguments).slice(1).forEach(function(source) {
      Object.keys(source || {}).forEach(function(key) { target[key] = source[key]; });
    });
    return target;
  }

  function matches(element, selector) {
    return Boolean(element && element.matches && element.matches(selector));
  }

  function closest(element, selector) {
    return element && element.closest ? element.closest(selector) : null;
  }

  function query(root, selector) {
    return (root || document).querySelector(selector);
  }

  function queryAll(root, selector) {
    return toArray((root || document).querySelectorAll(selector));
  }

  function htmlEscape(value) {
    return String(value || '').replace(/[&<>"']/g, function(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function cssEscape(value) {
    value = String(value || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return value.replace(/["\\]/g, '\\$&');
  }

  function svgLockIcon() {
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var body = document.createElementNS(namespace, 'rect');
    body.setAttribute('x', '5');
    body.setAttribute('y', '10');
    body.setAttribute('width', '14');
    body.setAttribute('height', '10');
    body.setAttribute('rx', '2');
    var shackle = document.createElementNS(namespace, 'path');
    shackle.setAttribute('d', 'M8 10V7a4 4 0 0 1 8 0v3');
    svg.appendChild(body);
    svg.appendChild(shackle);
    return svg;
  }

  var heritageEndpoints = {
    sitesJson: 'sites/ajax_get_json.php',
    sitesIpOptions: 'sites/ajax_get_ip.php',
    mailJson: 'mail/ajax_get_json.php',
    dnsJson: '/dns/ajax_get_json.php',
    globalSearch: '/dashboard/ajax_get_json.php'
  };

  function heritageEndpoint(name, cacheBust) {
    var endpoint = heritageEndpoints[name] || String(name || '');
    if (!cacheBust) return endpoint;
    return endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + Math.round(new Date().getTime());
  }

  function legacyApi() {
    return window.ISPConfig || null;
  }

  function runtimeApi() {
    return window.heritageApp || legacyApi();
  }

  window.heritageRuntime = function() {
    return runtimeApi();
  };

  function callRuntime(name, args) {
    var api = runtimeApi();
    if (!api || typeof api[name] !== 'function') return null;
    return api[name].apply(api, args || []);
  }

  function requestRuntimeJson(url, options) {
    var api = runtimeApi();
    if (!api || typeof api.requestJson !== 'function') throw new TypeError('Workbench JSON runtime is not available.');
    return api.requestJson(url, options || {});
  }

  function reportRuntimeError(message) {
    callRuntime('reportError', [message]);
  }

  function navigateRuntime(target, params) {
    return callRuntime('navigateTo', [target, params || null]);
  }

  function activateRuntimeFragment(host) {
    callRuntime('activateFragmentScripts', [host]);
  }

  function resetRuntimeFormChanged() {
    callRuntime('resetFormChanged');
  }

  function endpointWithQuery(endpoint, key, value) {
    if (!endpoint || !key || value === undefined || value === null || value === '') return endpoint || '';
    var separator = endpoint.indexOf('?') >= 0 ? '&' : '?';
    return endpoint + separator + encodeURIComponent(key) + '=' + encodeURIComponent(String(value));
  }

  function endpointFromControl(control, fallbackName) {
    var endpointName = control && control.getAttribute('data-endpoint-name');
    if (endpointName) return heritageEndpoint(endpointName);
    var endpoint = control && control.getAttribute('data-endpoint');
    if (endpoint) return endpoint;
    return fallbackName ? heritageEndpoint(fallbackName) : '';
  }

  function endpointWithQueryTemplate(endpoint, template, control) {
    var query = controlUrl(template || '', control);
    if (!query) return endpoint || '';
    return (endpoint || '') + ((endpoint || '').indexOf('?') >= 0 ? '&' : '?') + query.replace(/^\?/, '');
  }

  function setHtml(host, markup) {
    if (!host) return;
    host.innerHTML = markup || '';
    normalizeWorkbenchContentContracts(host);
    activateRuntimeFragment(host);
  }

  function serializeForm(form) {
    return new URLSearchParams(new FormData(form)).toString();
  }

  function trigger(element, name) {
    if (!element) return;
    element.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
  }

  var HERITAGE_CONTENT_CONTRACTS = {
    load: {
      native: 'data-heritage-load-content',
      legacy: 'data-load-content',
      selector: 'a[data-heritage-load-content],button[data-heritage-load-content],a[data-load-content],button[data-load-content]'
    },
    template: {
      native: 'data-heritage-load-content-template',
      legacy: 'data-load-content-template'
    },
    target: {
      native: 'data-heritage-load-content-into',
      legacy: 'data-load-content-into',
      selector: '[data-heritage-load-content-into],[data-load-content-into]'
    },
    module: {
      native: 'data-heritage-module',
      legacy: 'data-capp',
      selector: 'a[data-heritage-module],button[data-heritage-module],a[data-capp],button[data-capp]'
    }
  };

  function heritageContractValue(element, contract) {
    if (!element || !contract) return null;
    return element.getAttribute(contract.native) || element.getAttribute(contract.legacy);
  }

  function mirrorAttribute(root, selector, sourceAttribute, targetAttribute) {
    queryAll(root || document, selector).forEach(function(element) {
      if (element.hasAttribute(targetAttribute)) return;
      var value = element.getAttribute(sourceAttribute);
      if (value !== null && value !== '') element.setAttribute(targetAttribute, value);
    });
  }

  function normalizeWorkbenchContentContracts(root) {
    root = root || document;
    mirrorAttribute(root, '[' + HERITAGE_CONTENT_CONTRACTS.load.legacy + ']', HERITAGE_CONTENT_CONTRACTS.load.legacy, HERITAGE_CONTENT_CONTRACTS.load.native);
    mirrorAttribute(root, '[' + HERITAGE_CONTENT_CONTRACTS.template.legacy + ']', HERITAGE_CONTENT_CONTRACTS.template.legacy, HERITAGE_CONTENT_CONTRACTS.template.native);
    mirrorAttribute(root, '[' + HERITAGE_CONTENT_CONTRACTS.target.legacy + ']', HERITAGE_CONTENT_CONTRACTS.target.legacy, HERITAGE_CONTENT_CONTRACTS.target.native);
    mirrorAttribute(root, '[' + HERITAGE_CONTENT_CONTRACTS.module.legacy + ']', HERITAGE_CONTENT_CONTRACTS.module.legacy, HERITAGE_CONTENT_CONTRACTS.module.native);
    return root;
  }

  function controlUrl(template, control) {
    var value = control ? control.value || '' : '';
    return String(template || '').replace(/\{value\}/g, encodeURIComponent(value));
  }

  function checkRelatedRadio(control) {
    var selector = control && control.getAttribute('data-check-radio-on-focus');
    var form = control && control.form;
    var option = selector ? query(form || document, selector) : null;
    if (option && option.type === 'radio') option.checked = true;
  }

  function handleRedirect(responseText) {
    if (typeof responseText !== 'string') return false;
    if (responseText.indexOf('WORKBENCH_RELOAD:') > -1) {
      document.location.reload();
      return true;
    }
    if (responseText.indexOf('HEADER_REDIRECT:') > -1) {
      navigateRuntime(responseText.split(':')[1]);
      return true;
    }
    if (responseText.indexOf('URL_REDIRECT:') > -1) {
      document.location.href = responseText.substr(responseText.indexOf('URL_REDIRECT:') + 'URL_REDIRECT:'.length);
      return true;
    }
    if (responseText.indexOf('LOGIN_REDIRECT:') > -1) {
      document.location.href = './index.php';
      return true;
    }
    return false;
  }

  function scrollToTop() {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (error) { window.scrollTo(0, 0); }
  }

  function copyTextToClipboard(value, control) {
    value = String(value || '').trim();
    if (!value) return;

    function markDone() {
      if (!control) return;
      control.setAttribute('data-heritage-copy-state', 'done');
      window.setTimeout(function() {
        control.removeAttribute('data-heritage-copy-state');
      }, 1400);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(markDone, function() {});
      return;
    }

    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      markDone();
    } catch (error) {}
    document.body.removeChild(textarea);
  }

  function setFieldValue(id, value) {
    var field = document.getElementById(id);
    if (!field) return;
    field.value = value || '';
    trigger(field, 'input');
    trigger(field, 'change');
  }

  function initSslClientDataHelpers(root) {
    queryAll(root || document, '[data-ssl-client-helper]').forEach(function(helper) {
      if (helper.getAttribute('data-heritage-initialized') === 'true') return;
      helper.setAttribute('data-heritage-initialized', 'true');
      var idFieldName = helper.getAttribute('data-record-field') || 'id';
      var idField = query(document, 'input[name="' + cssEscape(idFieldName) + '"]');
      if (idField && Number(idField.value) > 0) {
        helper.hidden = false;
        helper.style.display = '';
      }
    });
  }

  function resetSslClientData() {
    ['ssl_organisation', 'ssl_locality', 'ssl_state', 'ssl_organisation_unit'].forEach(function(id) {
      setFieldValue(id, '');
    });
    var sslCountry = document.getElementById('ssl_country');
    if (sslCountry && sslCountry.options.length) setFieldValue('ssl_country', sslCountry.options[0].value);
  }

  function loadSslClientData(control) {
    var idFieldName = control.getAttribute('data-record-field') || 'id';
    var idField = query(document, 'input[name="' + cssEscape(idFieldName) + '"]');
    var webId = idField ? idField.value : '';
    var endpoint = endpointFromControl(control, 'sitesJson');
    var request = requestRuntimeJson(endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + Math.round(new Date().getTime()), {
      query: {
        web_id: webId,
        type: control.getAttribute('data-ssl-request-type') || 'getclientssldata'
      },
      timeout: 30000
    });
    request.promise.then(function(data) {
      data = data || {};
      setFieldValue('ssl_organisation', data.company_name);
      setFieldValue('ssl_locality', data.city);
      setFieldValue('ssl_country', data.country);
      setFieldValue('ssl_state', data.state);
      setFieldValue('ssl_organisation_unit', data.organisation_unit || data.organization_unit || 'IT');
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('SSL client data could not be loaded.');
    });
    return request;
  }

  function setVisible(selector, visible) {
    queryAll(document, selector).forEach(function(element) {
      element.hidden = !visible;
      element.style.display = visible ? '' : 'none';
    });
  }

  function splitList(value, separator) {
    return String(value || '').split(separator || ',').map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }

  function syncVisibilityRules(control) {
    var rules = control && control.getAttribute('data-heritage-visibility-rules');
    if (!rules) return false;
    var value = String(control.value || '');
    splitList(rules, ';').forEach(function(rule) {
      var parts = rule.split('=');
      var selector = (parts.shift() || '').trim();
      var allowed = splitList(parts.join('='), '|');
      if (!selector) return;
      try {
        setVisible(selector, allowed.indexOf(value) !== -1);
      } catch (error) {
        if (window.console && console.warn) console.warn('Invalid Workbench visibility selector:', selector, error);
      }
    });
    return true;
  }

  function syncDeclaredVisibility(control) {
    var targetId = control && control.getAttribute('data-heritage-sync-visibility');
    var target = targetId ? document.getElementById(targetId) : null;
    if (!target) return false;
    var expected = control.getAttribute('data-visible-value') || '';
    var visible = String(control.value || '') === expected;
    target.hidden = !visible;
    target.style.display = visible ? '' : 'none';
    return true;
  }

  function syncDatabaseTypeFields(control) {
    var targets = control && control.getAttribute('data-heritage-database-type-toggle');
    if (!targets) return false;
    var hide = String(control.value || '') === 'postgresql';
    targets.split(',').forEach(function(id) {
      var field = document.getElementById(id.trim());
      var group = field ? closest(field, '.form-group') : null;
      if (!group) return;
      group.hidden = hide;
      group.style.display = hide ? 'none' : '';
    });
    return true;
  }

  function initDisabledHiddenClones(root) {
    queryAll(root || document, 'select[data-heritage-disabled-clone-hidden]').forEach(function(select) {
      if (select.getAttribute('data-heritage-hidden-clone-initialized') === 'true') return;
      var originalName = select.getAttribute('name') || '';
      if (!originalName) return;
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = originalName;
      hidden.value = select.value || '';
      select.setAttribute('data-heritage-hidden-clone-initialized', 'true');
      select.name = originalName + '_disabled';
      if (select.id) select.id = select.id + '_disabled';
      select.insertAdjacentElement('afterend', hidden);
    });
  }

  function initConfirmUncheck(root) {
    queryAll(root || document, '[data-heritage-confirm-uncheck]').forEach(function(marker) {
      if (marker.getAttribute('data-heritage-confirm-initialized') === 'true') return;
      var field = document.getElementById(marker.getAttribute('data-heritage-confirm-uncheck') || '');
      if (!field) return;
      marker.setAttribute('data-heritage-confirm-initialized', 'true');
      field.addEventListener('click', function(event) {
        if (field.checked) return;
        if (window.confirm(marker.getAttribute('data-confirm-message') || '')) return;
        event.preventDefault();
      });
    });
  }

  function generateWorkbenchPassword(length) {
    var size = Math.max(8, Number(length || 16));
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%+=?';
    var values = new Uint32Array(size);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      for (var fallbackIndex = 0; fallbackIndex < size; fallbackIndex += 1) values[fallbackIndex] = Math.floor(Math.random() * chars.length);
    }
    var passwordValue = '';
    for (var index = 0; index < size; index += 1) passwordValue += chars[values[index] % chars.length];
    return passwordValue;
  }

  function initDefaultPasswords(root) {
    queryAll(root || document, '[data-heritage-default-password]').forEach(function(input) {
      if (input.getAttribute('data-heritage-default-password-initialized') === 'true') return;
      input.setAttribute('data-heritage-default-password-initialized', 'true');
      if (input.value) return;
      input.value = generateWorkbenchPassword(input.getAttribute('data-heritage-default-password'));
    });
  }

  function isMasterTemplateEditable(region) {
    var masterId = region.getAttribute('data-template-master-control') || 'template_master';
    var master = document.getElementById(masterId);
    return master ? master.value === '0' : true;
  }

  function isMasterTemplateLockExempt(region, field) {
    var selector = region.getAttribute('data-template-lock-exempt') || '';
    if (!selector || !field || !field.matches) return false;
    return field.matches(selector) || !!closest(field, selector);
  }

  function handleMasterTemplateLock(region, event, alertUser) {
    if (isMasterTemplateEditable(region)) return;
    var field = closest(event.target, 'input, select, textarea, button');
    if (!field || !region.contains(field) || isMasterTemplateLockExempt(region, field)) return;
    event.preventDefault();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    else event.stopPropagation();
    if (alertUser && window.ISPConfig && typeof window.ISPConfig.notify === 'function') {
      window.ISPConfig.notify(
        region.getAttribute('data-template-lock-message') || (
          typeof window.heritageLanguage === 'function' && window.heritageLanguage() === 'de'
            ? 'Dieses Formular wird durch eine Mastervorlage gesteuert.'
            : 'This form is controlled by a master template.'
        ),
        'warning'
      );
    }
    if (field.blur) field.blur();
  }

  function initMasterTemplateLocks(root) {
    queryAll(root || document, '[data-heritage-master-template-lock]').forEach(function(region) {
      if (region.getAttribute('data-heritage-master-template-lock-initialized') === 'true') return;
      region.setAttribute('data-heritage-master-template-lock-initialized', 'true');
      region.addEventListener('click', function(event) {
        handleMasterTemplateLock(region, event, true);
      }, true);
      region.addEventListener('focusin', function(event) {
        handleMasterTemplateLock(region, event, false);
      }, true);
    });
  }

  function setExpanded(element, expanded) {
    if (!element) return;
    element.classList.toggle('in', expanded);
    element.classList.toggle('show', expanded);
    element.hidden = !expanded;
    element.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  }

  function bindCheckboxDisclosure(sourceId, targetId, afterChange) {
    var source = document.getElementById(sourceId);
    var target = document.getElementById(targetId);
    if (!source || !target) return null;

    var update = function() {
      setExpanded(target, source.checked);
      if (typeof afterChange === 'function') afterChange();
    };

    if (source.getAttribute('data-heritage-disclosure-initialized') !== 'true') {
      source.setAttribute('data-heritage-disclosure-initialized', 'true');
      source.addEventListener('change', update);
    }
    update();
    return update;
  }

  function syncPasswordValidation(control) {
    if (!control || !control.getAttribute) return;
    var contract = control.getAttribute('data-heritage-password-check') || '';
    if (!contract) return;
    var parts = contract.split(':');
    var passwordId = parts[0] || control.id || 'password';
    var repeatId = parts[1] || 'repeat_password';
    if (control.getAttribute('data-heritage-password-strength') === 'true' && typeof window.pass_check === 'function') {
      window.pass_check(control.value || '');
    }
    if (typeof window.checkPassMatch === 'function') {
      window.checkPassMatch(passwordId, repeatId);
    }
  }

  function initStaticSelectMirrors(root) {
    queryAll(root || document, 'select[data-heritage-static-select-mirror]').forEach(function(select) {
      if (select.getAttribute('data-heritage-static-select-initialized') === 'true') return;
      var name = select.getAttribute('name') || '';
      if (!name) return;
      var selected = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
      var label = selected ? selected.textContent : select.value;
      var text = document.createElement('p');
      text.className = 'form-control-static workbench-static-field';
      text.textContent = label || select.value || '';
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = select.value || '';
      select.setAttribute('data-heritage-static-select-initialized', 'true');
      select.insertAdjacentElement('beforebegin', text);
      select.insertAdjacentElement('beforebegin', hidden);
      select.remove();
    });
  }

  function setInputByName(name, value) {
    var input = query(document, 'input[name="' + cssEscape(name) + '"]');
    if (!input) return;
    input.value = value || '';
  }

  function replaceSelectOptions(select, data) {
    if (!select) return;
    var currentValue = select.value;
    select.replaceChildren();
    var empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '';
    select.appendChild(empty);
    Object.keys(data || {}).forEach(function(key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = data[key];
      option.selected = currentValue === key;
      select.appendChild(option);
    });
    trigger(select, 'change');
  }

  function updateTooltipText(id, value) {
    var element = document.getElementById(id);
    if (!element) return;
    element.setAttribute('data-original-title', value || '');
    element.setAttribute('title', value || '');
  }

  function setOptionVisible(select, value, visible) {
    if (!select) return;
    var option = query(select, 'option[value="' + cssEscape(value) + '"]');
    if (!option) return;
    option.hidden = !visible;
    option.disabled = !visible;
    option.style.display = visible ? '' : 'none';
  }

  function normalizeSelectValue(select, allowed, fallback) {
    if (!select) return;
    if (select.value === '' || allowed.indexOf(select.value) !== -1) return;
    select.value = fallback || 'no';
  }

  function setLastTabVisible(visible) {
    var lastTab = query(document, '.tabbox_tabs ul li:last-child');
    if (!lastTab) return;
    lastTab.hidden = !visible;
    lastTab.style.display = visible ? '' : 'none';
  }

  function requestSitesJson(queryData) {
    return requestRuntimeJson(heritageEndpoint('sitesJson', true), { query: queryData || {}, timeout: 30000 });
  }

  function applyRedirectServerType(redirectType, serverType, allowApacheProxy) {
    var nginxValues = ['last', 'break', 'redirect', 'permanent', 'proxy'];
    var apacheValues = ['R', 'L', 'R,L', 'R=301,L'];
    var isNginx = serverType === 'nginx';
    nginxValues.forEach(function(value) { setOptionVisible(redirectType, value, isNginx || (allowApacheProxy && value === 'proxy')); });
    apacheValues.forEach(function(value) { setOptionVisible(redirectType, value, !isNginx); });
    normalizeSelectValue(redirectType, isNginx ? nginxValues.concat(['no']) : apacheValues.concat(allowApacheProxy ? ['no', 'proxy'] : ['no']), 'no');
  }

  function updateProxyTabFromRedirect() {
    var redirectType = document.getElementById('redirect_type');
    setLastTabVisible(!!redirectType && redirectType.value === 'proxy');
  }

  function syncChilddomainRedirect(control) {
    var redirectType = document.getElementById('redirect_type');
    if (!redirectType) return null;
    updateProxyTabFromRedirect();
    var request = requestSitesJson({ web_id: control.value || '', type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      var typeRequest = requestSitesJson({ server_id: serverId, type: 'getservertype' });
      typeRequest.promise.then(function(data) {
        applyRedirectServerType(redirectType, data && data.servertype, false);
        updateProxyTabFromRedirect();
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function syncProxyVisibility(control) {
    var webId = control && control.value ? control.value : '';
    var request = requestSitesJson({ web_id: webId, type: 'getredirecttype' });
    request.promise.then(function(data) {
      setVisible('.proxy', data && data.redirecttype === 'proxy');
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function syncVhostRedirect(control) {
    var webId = control && control.value ? control.value : '';
    var redirectType = document.getElementById('redirect_type');
    if (!redirectType) return null;
    var request = requestSitesJson({ web_id: webId, type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      var typeRequest = requestSitesJson({ server_id: serverId, type: 'getservertype' });
      typeRequest.promise.then(function(data) {
        var isNginx = data && data.servertype === 'nginx';
        applyRedirectServerType(redirectType, data && data.servertype, true);
        setVisible('.nginx', isNginx);
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function updatePmMode(pm) {
    setVisible('.pm_static', pm === 'static');
    setVisible('.pm_dynamic', pm === 'dynamic');
    setVisible('.pm_ondemand', pm === 'ondemand');
  }

  function syncVhostAdvanced(control) {
    var webId = control && control.value ? control.value : '';
    var request = requestSitesJson({ web_id: webId, type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      requestSitesJson({ server_id: serverId, type: 'getservertype' }).promise.then(function(data) {
        var isNginx = data && data.servertype === 'nginx';
        setVisible('.nginx', isNginx);
        setVisible('.apache', !isNginx);
      });
      requestSitesJson({ web_id: webId, type: 'getphptype' }).promise.then(function(data) {
        setVisible('.phpfpm', data && data.phptype === 'php-fpm');
        setVisible('.php', data && data.phptype !== 'no');
      });
      requestSitesJson({ web_id: webId, type: 'getredirecttype' }).promise.then(function(data) {
        setVisible('.proxy', data && data.redirecttype === 'proxy');
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function vhostMainContext(control) {
    return {
      control: control,
      clientGroupField: document.getElementById('client_group_id'),
      serverDisabled: document.getElementById('server_id_disabled'),
      serverField: document.getElementById('server_id'),
      phpField: document.getElementById('php'),
      parentDomainField: document.getElementById('parent_domain_id'),
      domainField: document.getElementById('domain'),
      webFolderDomain: document.getElementById('web_folder_domain'),
      serverPhpField: document.getElementById('server_php_id'),
      directiveSnippets: document.getElementById('directive_snippets_id')
    };
  }

  function getVhostServerId(ctx) {
    var stored = ctx.control ? ctx.control.getAttribute('data-current-server-id') : '';
    if (stored) return stored;
    var disabledServerId = ctx.serverDisabled ? ctx.serverDisabled.value : '';
    if (Number(disabledServerId) > 0) return disabledServerId;
    return ctx.serverField ? ctx.serverField.value : '';
  }

  function setVhostServerId(ctx, value) {
    if (ctx.control) ctx.control.setAttribute('data-current-server-id', value || '');
  }

  function updateVhostPhpDependentFields(ctx) {
    var phpValue = ctx.phpField ? ctx.phpField.value : '';
    var showServerPhp = phpValue === 'fast-cgi' || phpValue === 'php-fpm';
    setVisible('.server_php_id', showServerPhp);
    setVisible('#server_php_id_txt', showServerPhp);
    setVisible('#fastcgi_php_fallback_version_txt', false);
  }

  function retireLegacyPhpOptions(root) {
    queryAll(root || document, 'select#php').forEach(function(select) {
      ['cgi', 'suphp', 'hhvm'].forEach(function(value) {
        var option = Array.prototype.find.call(select.options, function(candidate) {
          return String(candidate.value || '').toLowerCase() === value;
        });
        if (!option) return;
        if (option.selected) {
          option.textContent = option.textContent + ' \u2013 Legacy, Migration erforderlich';
          option.dataset.heritageMigrationOnly = 'true';
          select.dataset.heritageLegacyPhp = value;
          return;
        }
        option.remove();
      });
    });
  }

  function adjustVhostMain(ctx, noFormChange) {
    var request = requestSitesJson({ server_id: getVhostServerId(ctx), type: 'getservertype' });
    request.promise.then(function(data) {
      var isNginx = data && data.servertype === 'nginx';
      if (ctx.control) ctx.control.setAttribute('data-current-server-type', isNginx ? 'nginx' : 'apache');
      setVisible('.apache', !isNginx);
      setVisible('.nginx', isNginx);
      if (ctx.phpField) {
        if (isNginx && ctx.phpField.value !== 'no' && ctx.phpField.value !== 'php-fpm' && ctx.phpField.value !== 'hhvm') {
          ctx.phpField.value = 'php-fpm';
        }
        ['fast-cgi', 'mod'].forEach(function(value) {
          setOptionVisible(ctx.phpField, value, !isNginx);
        });
      }
      updateVhostPhpDependentFields(ctx);
      if (noFormChange) resetRuntimeFormChanged();
    });
    return request;
  }

  function reloadVhostServerId(ctx, noFormChange) {
    var parentWebId = ctx.parentDomainField ? ctx.parentDomainField.value : '';
    var request = requestSitesJson({ web_id: parentWebId, type: 'getserverid' });
    request.promise.then(function(data) {
      if (data && data.serverid) setVhostServerId(ctx, data.serverid);
      adjustVhostMain(ctx, noFormChange);
      if (noFormChange) reloadVhostServerPhpVersions(ctx, noFormChange);
    });
    return request;
  }

  function rerenderWorkbenchSelect(elem) {
    var select = document.getElementById(elem);
    if (select) callRuntime('enhanceSelect', [select, {}]);
  }

  function reloadVhostWebIp(ctx) {
    var serverId = getVhostServerId(ctx);
    var clientGroupId = ctx.clientGroupField ? ctx.clientGroupField.value : '';
    callRuntime('loadOptionInto', ['ip_address', heritageEndpoint('sitesIpOptions') + '?ip_type=IPv4&server_id=' + encodeURIComponent(serverId || '') + '&client_group_id=' + encodeURIComponent(clientGroupId || ''), rerenderWorkbenchSelect]);
    callRuntime('loadOptionInto', ['ipv6_address', heritageEndpoint('sitesIpOptions') + '?ip_type=IPv6&server_id=' + encodeURIComponent(serverId || '') + '&client_group_id=' + encodeURIComponent(clientGroupId || ''), rerenderWorkbenchSelect]);
  }

  function reloadVhostDirectiveSnippets(ctx) {
    if (!ctx.directiveSnippets) return null;
    var currentValue = ctx.directiveSnippets.value;
    var request = requestSitesJson({ server_id: getVhostServerId(ctx), type: 'getdirectivesnippet' });
    request.promise.then(function(data) {
      ctx.directiveSnippets.replaceChildren();
      var emptyOption = document.createElement('option');
      emptyOption.value = '0';
      emptyOption.textContent = '-';
      ctx.directiveSnippets.appendChild(emptyOption);
      var group = document.createElement('optgroup');
      group.label = (ctx.control && ctx.control.getAttribute('data-directive-snippet-label')) || '';
      (data && data.snippets ? data.snippets : []).forEach(function(snippet) {
        var option = document.createElement('option');
        option.value = snippet.directive_snippets_id;
        option.textContent = snippet.name;
        option.selected = String(currentValue) === String(snippet.directive_snippets_id);
        group.appendChild(option);
      });
      ctx.directiveSnippets.appendChild(group);
      trigger(ctx.directiveSnippets, 'change');
    });
    return request;
  }

  function reloadVhostServerPhpVersions(ctx, noFormChange) {
    if (!ctx.serverPhpField) return null;
    var currentValue = ctx.serverPhpField.value;
    var request = requestSitesJson({
      server_id: getVhostServerId(ctx),
      php_type: ctx.phpField ? ctx.phpField.value : '',
      type: 'getserverphp',
      client_group_id: ctx.clientGroupField ? ctx.clientGroupField.value : ''
    });
    request.promise.then(function(data) {
      ctx.serverPhpField.replaceChildren();
      (data && data.phpversion ? data.phpversion : []).forEach(function(entry) {
        var key = Object.getOwnPropertyNames(entry)[0];
        var option = document.createElement('option');
        option.value = key;
        option.textContent = entry[key];
        if (ctx.control && ctx.control.value) option.selected = String(currentValue) === String(key);
        ctx.serverPhpField.appendChild(option);
      });
      trigger(ctx.serverPhpField, 'change');
      if (noFormChange) resetRuntimeFormChanged();
    });
    return request;
  }

  function updateVhostWebFolderDomain(ctx) {
    if (!ctx.webFolderDomain) return;
    ctx.webFolderDomain.textContent = ctx.domainField && ctx.domainField.value ? ctx.domainField.value : '[DOMAIN]';
  }

  function applyVhostReadonlyGuard() {
    queryAll(document, 'div.panel_web_domain fieldset input, div.panel_web_domain fieldset select, div.panel_web_domain fieldset button').forEach(function(element) {
      if (element.id === 'directive_snippets_id') return;
      ['click', 'mousedown'].forEach(function(eventName) {
        element.addEventListener(eventName, function(event) { event.preventDefault(); });
      });
      element.addEventListener('focus', function() { element.blur(); });
    });
  }

  function initVhostMain(control) {
    if (!control || control.getAttribute('data-vhost-main-initialized') === 'true') return null;
    control.setAttribute('data-vhost-main-initialized', 'true');
    var ctx = vhostMainContext(control);
    setVhostServerId(ctx, getVhostServerId(ctx));

    if (ctx.serverField && (!ctx.serverDisabled || Number(ctx.serverDisabled.value) <= 0)) {
      ctx.serverField.addEventListener('change', function() {
        setVhostServerId(ctx, ctx.serverField.value);
        adjustVhostMain(ctx, false);
        reloadVhostWebIp(ctx);
        reloadVhostServerPhpVersions(ctx, false);
        reloadVhostDirectiveSnippets(ctx);
      });
    }
    if (ctx.clientGroupField) {
      ctx.clientGroupField.addEventListener('change', function() {
        reloadVhostWebIp(ctx);
        reloadVhostServerPhpVersions(ctx, false);
      });
    }
    if (ctx.phpField) {
      ctx.phpField.addEventListener('change', function() {
        reloadVhostServerPhpVersions(ctx, false);
        updateVhostPhpDependentFields(ctx);
      });
    }
    if (ctx.parentDomainField) {
      ctx.parentDomainField.addEventListener('change', function() {
        reloadVhostServerId(ctx, false);
      });
    }
    if (ctx.domainField) {
      ctx.domainField.addEventListener('change', function() { updateVhostWebFolderDomain(ctx); });
      ctx.domainField.addEventListener('keyup', function() { updateVhostWebFolderDomain(ctx); });
    }
    var moreFolderDirectiveSnippets = document.getElementById('more_folder_directive_snippets');
    if (moreFolderDirectiveSnippets) {
      moreFolderDirectiveSnippets.addEventListener('click', function() {
        var nextHidden = query(document, '.folder_directive_snippets.hidden');
        if (nextHidden) nextHidden.classList.remove('hidden');
      });
    }
    if (control.getAttribute('data-vhost-readonly-tab') === 'true') applyVhostReadonlyGuard();

    adjustVhostMain(ctx, true);
    reloadVhostServerPhpVersions(ctx, true);
    updateVhostWebFolderDomain(ctx);
    if (getVhostServerId(ctx) === '') return reloadVhostServerId(ctx, false);
    return null;
  }

  function createDkimRecord(control) {
    function value(id) {
      var field = document.getElementById(id);
      return field ? field.value : '';
    }
    var request = requestRuntimeJson(heritageEndpoint('mailJson', true), {
      query: {
        domain_id: value('domain'),
        dkim_public: value('dkim_public'),
        dkim_selector: value('dkim_selector'),
        type: 'create_dkim'
      },
      timeout: 30000
    });
    request.promise.then(function(data) {
      data = data || {};
      var dkimText = 'v=DKIM1; t=s; p=' + String(data.dns_record || '').replace(/(\r\n|\n|\r)/gm, '');
      var dns = data.dkim_selector + '._domainkey.' + data.domain + '. 3600   IN\tTXT\t"' + dkimText + '"';
      setFieldValue('dkim_selector', data.dkim_selector);
      setFieldValue('dkim_public', data.dkim_public);
      setFieldValue('dkim_private', data.dkim_private);
      setFieldValue('dns_record', dns);
      var dkim = document.getElementById('dkim');
      if (dkim) {
        dkim.checked = true;
        trigger(dkim, 'change');
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('DKIM data could not be generated.');
    });
    return request;
  }

  function runDependentJsonSync(control) {
    var mode = control && control.getAttribute('data-json-sync');
    if (!mode) return null;
    if (mode === 'sites-childdomain-redirect') return syncChilddomainRedirect(control);
    if (mode === 'sites-proxy-visibility') return syncProxyVisibility(control);
    if (mode === 'sites-vhost-redirect') return syncVhostRedirect(control);
    if (mode === 'sites-vhost-advanced') return syncVhostAdvanced(control);
    if (mode === 'sites-vhost-main') return initVhostMain(control);
    var endpoint = endpointFromControl(control, '');
    var requestType = control.getAttribute('data-request-type') || '';
    if (!endpoint || !requestType) return null;
    var queryData = { type: requestType };
    if (mode === 'dns-caa') queryData.ca_id = control.value || '';
    else queryData.web_id = control.value || '';
    var request = requestRuntimeJson(endpoint + '?' + Math.round(new Date().getTime()), { query: queryData, timeout: 30000 });
    request.promise.then(function(data) {
      data = data || {};
      if (mode === 'dns-caa') {
        setVisible('.wildcard', data.ca_wildcard === 'Y');
        setVisible('.critical', data.ca_critical === '1');
        setInputByName('ca_issue', data.ca_issue);
        setInputByName('ca_critical', data.ca_critical);
      } else if (mode === 'cron-placeholders') {
        updateTooltipText('php_cli_binary', data.php_cli_binary);
        updateTooltipText('docroot_client', data.docroot_client);
        updateTooltipText('domain', data.domain || control.getAttribute('data-domain-not-selected') || '');
        var existing = query(document, '.wb-jail-symbol, .jail-symbol');
        if (data.cron_type === 'chrooted') {
          if (!existing) {
            var marker = document.createElement('span');
            marker.className = 'wb-jail-symbol';
            marker.title = control.getAttribute('data-jailed-title') || '';
            marker.appendChild(svgLockIcon());
            control.insertAdjacentElement('afterend', marker);
          }
        } else {
          queryAll(document, '.wb-jail-symbol, .jail-symbol').forEach(function(element) { element.remove(); });
        }
      } else if (mode === 'database-users') {
        String(control.getAttribute('data-json-option-targets') || '').split(',').forEach(function(id) {
          replaceSelectOptions(document.getElementById(id.trim()), data);
        });
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function initDependentJsonSync(root) {
    queryAll(root || document, '[data-json-sync]').forEach(function(control) {
      if (control.getAttribute('data-json-sync-initialized') === 'true') return;
      control.setAttribute('data-json-sync-initialized', 'true');
      if (control.getAttribute('data-json-sync') === 'sites-childdomain-redirect') {
        var redirectType = document.getElementById('redirect_type');
        if (redirectType && redirectType.getAttribute('data-proxy-tab-initialized') !== 'true') {
          redirectType.setAttribute('data-proxy-tab-initialized', 'true');
          redirectType.addEventListener('change', updateProxyTabFromRedirect);
        }
      }
      runDependentJsonSync(control);
    });
    queryAll(root || document, '[data-pm-mode-control]').forEach(function(control) {
      if (control.getAttribute('data-pm-mode-initialized') === 'true') return;
      control.setAttribute('data-pm-mode-initialized', 'true');
      updatePmMode(control.value);
      control.addEventListener('change', function() { updatePmMode(control.value); });
    });
  }

  function initDeclaredVisibility(root) {
    queryAll(root || document, '[data-heritage-sync-visibility]').forEach(syncDeclaredVisibility);
    queryAll(root || document, '[data-heritage-visibility-rules]').forEach(syncVisibilityRules);
    queryAll(root || document, '[data-heritage-database-type-toggle]').forEach(syncDatabaseTypeFields);
    retireLegacyPhpOptions(root);
    initStaticSelectMirrors(root);
    initDefaultPasswords(root);
    initDisabledHiddenClones(root);
    initConfirmUncheck(root);
    initMasterTemplateLocks(root);
  }

  function initDeclarativeFieldSearch(root) {
    var language = typeof window.heritageLanguage === 'function'
      ? window.heritageLanguage()
      : String(document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
    var german = language === 'de';
    queryAll(root || document, '[data-heritage-field-search]').forEach(function(input) {
      var endpointName = input.getAttribute('data-search-endpoint') || '';
      var endpoint = endpointName ? heritageEndpoint(endpointName) : (input.getAttribute('data-search-src') || input.getAttribute('data-src') || '');
      endpoint = endpointWithQuery(endpoint, 'type', input.getAttribute('data-search-type') || '');
      if (!endpoint) return;
      ISPConfig.enhanceSearch(input, {
        dataSrc: endpoint,
        resultsLimit: input.getAttribute('data-search-results-limit') || (german ? '$ von % Ergebnissen' : '$ of % results'),
        ResultsTextPrefix: input.getAttribute('data-search-results-prefix') || '',
        noResultsText: input.getAttribute('data-search-no-results') || (german ? 'Keine Ergebnisse.' : 'No results.'),
        noResultsLimit: input.getAttribute('data-search-no-results-limit') || (german ? '0 Ergebnisse' : '0 results'),
        minChars: Number(input.getAttribute('data-search-min-chars') || 0),
        cssPrefix: input.getAttribute('data-search-css-prefix') || 'df-',
        fillSearchField: input.getAttribute('data-search-fill-field') !== 'false',
        fillSearchFieldWith: input.getAttribute('data-search-fill-with') || 'fill_text',
        searchFieldWatermark: input.getAttribute('data-search-watermark') || '',
        resultBoxPosition: input.getAttribute('data-search-result-position') || ''
      });
    });
  }

  function requestFallback(url, options, responseType) {
    options = options || {};
    var controller = window.AbortController ? new AbortController() : null;
    var method = options.method || 'GET';
    var target = new URL(url, window.location.href);
    if (target.origin !== window.location.origin) throw new Error('Cross-origin request blocked.');
    if (options.query) {
      var values = typeof options.query === 'string' ? new URLSearchParams(options.query) : new URLSearchParams();
      if (typeof options.query !== 'string') {
        Object.keys(options.query).forEach(function(key) {
          if (options.query[key] !== undefined && options.query[key] !== null) values.append(key, String(options.query[key]));
        });
      }
      values.forEach(function(value, key) { target.searchParams.append(key, value); });
    }
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    handle.promise = fetch(target.href, {
      method: method,
      credentials: 'same-origin',
      cache: options.cache || 'no-store',
      redirect: 'follow',
      headers: extend({
        Accept: responseType === 'json' ? 'application/json' : 'text/html'
      }, options.headers || {}),
      body: options.body || null,
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      if (!response.ok) {
        var error = new Error('HTTP ' + response.status);
        error.name = 'RequestError';
        error.status = response.status;
        throw error;
      }
      return responseType === 'json' ? response.json() : response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (error && error.name === 'AbortError') handle.aborted = true;
      throw error;
    });
    return handle;
  }


  var ISPConfig = window.ISPConfig = {
    pageFormChanged: false,
    tabChangeWarningTxt: '',
    tabChangeDiscardTxt: '',
    tabChangeWarning: false,
    tabChangeDiscard: false,
    requestsRunning: 0,
    indicatorCompleted: false,
    registeredHooks: [],
    new_tpl_add_id: 0,
    dataLogTimer: 0,
    options: {
      useLoadIndicator: false,
      useComboBox: false
    },

    setOption: function(key, value) {
      ISPConfig.options[key] = value;
    },

    setOptions: function(options) {
      extend(ISPConfig.options, options || {});
    },

    reportError: function(message) {
      if (window.console && console.warn) console.warn(message);
      if (window.heritageFeedback && typeof window.heritageFeedback.report === 'function') {
        return window.heritageFeedback.report(message);
      }
      return null;
    },

    notify: function(message, state) {
      if (window.heritageFeedback && typeof window.heritageFeedback.show === 'function') {
        return window.heritageFeedback.show(message, state || 'info');
      }
      if (window.console && console.info) console.info(message);
      return null;
    },


    registerHook: function(name, callback) {
      if (!ISPConfig.registeredHooks[name]) ISPConfig.registeredHooks[name] = [];
      ISPConfig.registeredHooks[name].push(callback);
    },

    callHook: function(name, params) {
      (ISPConfig.registeredHooks[name] || []).forEach(function(callback) {
        callback(name, params);
      });
    },

    enhanceTooltip: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.heritageInteractions) window.heritageInteractions.tooltip(element, options);
      });
      return elements;
    },

    enhanceSelect: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.heritageSelect) window.heritageSelect.enhance(element, options || {});
      });
      return elements;
    },

    enhanceSearch: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.heritageFieldSearch) window.heritageFieldSearch.enhance(element, options || {});
      });
      return elements;
    },

    enhanceDateTime: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.heritageDateTime) window.heritageDateTime.enhance(element, options || {});
      });
      return elements;
    },

    closeDialog: function(selector) {
      var element = query(document, selector);
      if (element && window.heritageDialog) return window.heritageDialog.close(element, true);
      if (element) element.hidden = true;
      return Boolean(element);
    },

    requestRead: function(url, options, responseType) {
      options = options || {};
      if (window.heritageHttp) {
        return responseType === 'json' ? window.heritageHttp.getJson(url, options) : window.heritageHttp.getText(url, options);
      }
      return requestFallback(url, options, responseType === 'json' ? 'json' : 'text');
    },

    requestText: function(url, options) {
      return ISPConfig.requestRead(url, options, 'text');
    },

    requestJson: function(url, options) {
      return ISPConfig.requestRead(url, options, 'json');
    },

    endpoint: function(name, options) {
      options = options || {};
      return heritageEndpoint(name, options.cacheBust === true);
    },

    normalizeWorkbenchContentContracts: function(root) {
      return normalizeWorkbenchContentContracts(root || document);
    },

    replaceServerFragment: function(host, markup) {
      setHtml(host, markup);
      return host;
    },

    navigateTo: function(pagename, params) {
      ISPConfig.beginRequest();
      // Robust routing: mirror the current page into the address bar (real URL,
      // no '#') so a reload/bookmark restores exactly this page instead of the
      // server session module. Uses the theme's shared urlFor so the clean-path
      // (mod_rewrite) vs. ?wb= query-fallback choice stays consistent.
      if (pagename && window.history && window.history.replaceState) {
        try {
          var wbUrl = (typeof ISPConfig.heritageUrlFor === 'function')
            ? ISPConfig.heritageUrlFor(pagename)
            : (window.location.pathname + '?wb=' + String(pagename).replace(/#/g, '%23').replace(/&/g, '%26').replace(/\?/g, '%3F'));
          window.history.replaceState({ heritageContent: pagename }, '', wbUrl);
        } catch (e) {}
      }
      var request = ISPConfig.requestText(pagename, { query: params || null, timeout: 30000 });
      request.promise.then(function(responseText) {
        if (handleRedirect(responseText)) return;
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(pagename, params || null);
        ISPConfig.pageFormChanged = false;
        window.clearTimeout(ISPConfig.dataLogTimer);
        ISPConfig.dataLogNotification();
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Navigation request was not successful.');
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    submitPageForm: function(formname, target, confirmation) {
      var successMessage = arguments[3];
      if (confirmation && !window.confirm(confirmation)) return false;
      var form = document.getElementById(formname || 'pageForm');
      if (!form) return false;
      var serialized = serializeForm(form);
      ISPConfig.beginRequest();
      var request = ISPConfig.requestForm(form, target, { timeout: 30000 });
      request.promise.then(function(responseText) {
        if (successMessage) ISPConfig.notify(successMessage, 'success');
        if (handleRedirect(responseText)) return;
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(target, serialized);
        ISPConfig.pageFormChanged = false;
        window.clearTimeout(ISPConfig.dataLogTimer);
        ISPConfig.dataLogNotification();
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) {
          ISPConfig.reportError('Form request was not successful.');
        }
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    switchTabDecision: function(tab, target, force, decision) {
      var idInput = query(document, 'form#pageForm [name="id"]');
      var id = idInput ? idInput.value : '';
      if (decision === 'save') return ISPConfig.submitPageForm('pageForm', target);
      if (decision === 'discard') return ISPConfig.navigateTo(target, { next_tab: tab, id: id });
      if (!force && id && ISPConfig.tabChangeWarning === 'y' && ISPConfig.pageFormChanged === true) {
        if (window.confirm(ISPConfig.tabChangeWarningTxt)) ISPConfig.submitPageForm('pageForm', target);
        else ISPConfig.navigateTo(target, { next_tab: tab, id: id });
        return;
      }
      if (id) ISPConfig.navigateTo(target, { next_tab: tab, id: id });
      else ISPConfig.submitPageForm('pageForm', target);
    },

    switchTab: function(tab, target, force) {
      return ISPConfig.switchTabDecision(tab, target, force, null);
    },

    refreshContentInto: function(elementid, pagename) {
      var host = document.getElementById(elementid);
      if (!host) return null;
      var request = ISPConfig.requestText(pagename, { timeout: 30000 });
      request.promise.then(function(responseText) { setHtml(host, responseText); });
      return request;
    },

    requestForm: function(form, url, options) {
      options = options || {};
      if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
      if (window.heritageHttp) return window.heritageHttp.postForm(form, url, options);
      return requestFallback(url, {
        method: 'POST',
        timeout: options.timeout || 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: serializeForm(form)
      }, 'text');
    },

    resetFormChanged: function() {
      ISPConfig.pageFormChanged = false;
    },

    beginRequest: function() {
      ISPConfig.requestsRunning += 1;
      document.body.classList.add('wb-request-active');
      document.body.dataset.heritageRequestCount = String(ISPConfig.requestsRunning);
      var host = document.getElementById('pageContent');
      if (host) host.setAttribute('aria-busy', 'true');
    },

    endRequest: function() {
      ISPConfig.requestsRunning = Math.max(0, ISPConfig.requestsRunning - 1);
      document.body.dataset.heritageRequestCount = String(ISPConfig.requestsRunning);
      if (ISPConfig.requestsRunning > 0) return;
      document.body.classList.remove('wb-request-active');
      var host = document.getElementById('pageContent');
      if (host) host.setAttribute('aria-busy', 'false');
    },

    showLoadIndicator: function() {
      return ISPConfig.beginRequest();
    },

    hideLoadIndicator: function() {
      return ISPConfig.endRequest();
    },

    onAfterSideNavLoaded: function() {
      if (ISPConfig.options.useComboBox === true) {
        ISPConfig.enhanceSelect(queryAll(document.getElementById('sidebar'), 'select:not(.chosen-select)'), {
          placeholder: '',
          selectOnBlur: true,
          allowClear: true
        });
      }
    },

    onAfterContentLoad: function(url, data) {
      var host = document.getElementById('pageContent') || document;
      normalizeWorkbenchContentContracts(host);
      if (ISPConfig.options.useComboBox === true) {
        ISPConfig.enhanceSelect(queryAll(host, 'select:not(.chosen-select)'), {
          placeholder: '',
          selectOnBlur: true,
          allowClear: true
        });
      }
      ISPConfig.enhanceSearch(queryAll(host, '.searchField'), {});
      initDeclarativeFieldSearch(host);
      initDeclaredVisibility(host);
      ISPConfig.enhanceDateTime(queryAll(host, 'input[data-input-element="date"]'), { pickTime: false, format: 'DD.MM.YYYY' });
      ISPConfig.enhanceDateTime(queryAll(host, 'input[data-input-element="datetime"]'), { pickTime: true, format: 'DD.MM.YYYY HH:mm' });
      ISPConfig.enhanceTooltip(queryAll(host, '[data-heritage-tooltip]'), {});
      initSslClientDataHelpers(host);
      initDependentJsonSync(host);
      var autofocus = query(host, 'input[autofocus]');
      if (autofocus) autofocus.focus();
      queryAll(host, 'input[type="password"]').forEach(function(field) {
        field.readOnly = true;
        field.addEventListener('click', function() { field.readOnly = false; }, { once: true });
        field.addEventListener('focus', function() { field.readOnly = false; }, { once: true });
      });
      ISPConfig.callHook('onAfterContentLoad', { url: url, data: data ? '&' + data : '' });
    },

    submitForm: function(formname, target, confirmation) {
      return ISPConfig.submitPageForm(formname || 'pageForm', target, confirmation, arguments[3]);
    },

    submitUploadForm: function(formname, target) {
      var form = document.getElementById(formname);
      if (!form || !window.heritageHttp) return false;
      var request = window.heritageHttp.postMultipart(form, target, { timeout: 120000 });
      request.promise.then(function(markup) {
        var parsed = new DOMParser().parseFromString(markup, 'text/html');
        ['errorMsg', 'OKMsg'].forEach(function(id) {
          var existing = document.getElementById(id);
          if (existing) existing.remove();
          var incoming = parsed.getElementById(id);
          if (incoming) form.prepend(incoming.cloneNode(true));
        });
        queryAll(form, 'input[name="_csrf_key"], input[name="_csrf_id"]').forEach(function(input) { input.remove(); });
        queryAll(parsed, 'input[name="_csrf_key"], input[name="_csrf_id"]').forEach(function(input) {
          form.prepend(input.cloneNode(true));
        });
      }).catch(function(error) {
        if (!request.aborted) ISPConfig.reportError('Upload request was not successful.');
      });
      return request;
    },

    capp: function(module, redirect) {
      ISPConfig.beginRequest();
      var request = ISPConfig.requestText('capp.php', {
        query: { mod: module, redirect: redirect === undefined ? null : redirect },
        timeout: 30000
      });
      request.promise.then(function(responseText) {
        handleRedirect(responseText);
        ISPConfig.loadMenus({ module: module });
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Module request was not successful. ' + module);
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    loadContent: function(pagename) {
      return ISPConfig.navigateTo(pagename, arguments[1] || null);
    },

    loadContentRefresh: function(pagename) {
      var refresh = document.getElementById('refreshinterval');
      if (!refresh || Number(refresh.value) <= 0) return null;
      var request = ISPConfig.requestText(pagename, { query: 'refresh=' + refresh.value, timeout: 30000 });
      request.promise.then(function(responseText) {
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(pagename, 'refresh=' + refresh.value);
        ISPConfig.pageFormChanged = false;
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Refresh request was not successful.');
      });
      window.setTimeout(function() { ISPConfig.loadContentRefresh(pagename); }, Number(refresh.value) * 1000 * 60);
      return request;
    },

    loadInitContent: function() {
      var host = document.getElementById('pageContent');
      var startpage = host && host.getAttribute('data-startpage') || 'dashboard/dashboard.php';
      ISPConfig.navigateTo(startpage);
      ISPConfig.loadMenus();
      ISPConfig.keepalive();
      ISPConfig.dataLogNotification();
    },

    loadMenus: function(options) {
      options = options || {};
      var side = ISPConfig.requestText('nav.php', { query: 'nav=side', timeout: 30000 });
      var top = ISPConfig.requestText('nav.php', { query: 'nav=top', timeout: 30000 });
      side.promise.then(function(markup) {
        setHtml(document.getElementById('sidebar'), markup);
        ISPConfig.onAfterSideNavLoaded();
        ISPConfig.loadPushyMenu();
      }).catch(function(error) {
        if (!side.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Side navigation request was not successful.');
      });
      top.promise.then(function(markup) {
        setHtml(document.getElementById('topnav-container'), markup);
        ISPConfig.loadPushyMenu();
      }).catch(function(error) {
        if (!top.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Top navigation request was not successful.');
      });
      return [side, top];
    },

    loadPushyMenu: function() {},

    changeTab: function(tab, target, force) {
      return ISPConfig.switchTab(tab, target, force);
    },

    confirm_action: function(link, confirmation) {
      if (!window.confirm(confirmation)) return false;
      return ISPConfig.navigateTo(link);
    },

    loadContentInto: function(elementid, pagename) {
      return ISPConfig.refreshContentInto(elementid, pagename);
    },

    loadOptionInto: function(elementid, pagename, callback) {
      var select = document.getElementById(elementid);
      if (!select) return null;
      var request = ISPConfig.requestText(pagename, { timeout: 30000 });
      request.promise.then(function(responseText) {
        select.replaceChildren();
        responseText.split('#').forEach(function(value) {
          var option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
        if (typeof callback === 'function') callback(elementid, pagename);
      });
      return request;
    },

    keepalive: function() {
      var request = ISPConfig.requestText('keepalive.php', { timeout: 30000 });
      request.promise.then(function() {
        window.setTimeout(function() { ISPConfig.keepalive(); }, 1000000);
      }).catch(function() {
        ISPConfig.reportError('Session expired. Please login again.');
      });
      return request;
    },

    dataLogNotification: function() {
      var request = ISPConfig.requestJson('datalogstatus.php', { timeout: 30000 });
      request.promise.then(function(payload) {
        var entries = payload && payload.entries ? payload.entries : [];
        var count = Number(payload && payload.count || 0);
        var notification = query(document, '.notification');
        var textNode = query(document, '.notification_text');
        var dialog = document.getElementById('datalogModal');
        var modalBody = dialog && query(dialog, '.modal-body, .wb-dialog__body ul');
        if (modalBody) {
          modalBody.replaceChildren();
          Object.keys(entries).forEach(function(key) {
            var val = entries[key];
            var item = document.createElement('li');
            var label = document.createElement('strong');
            label.textContent = val.text + ':';
            item.appendChild(label);
            item.appendChild(document.createTextNode(' ' + val.count));
            modalBody.appendChild(item);
          });
        }
        if (textNode) textNode.textContent = String(count);
        if (notification) notification.style.display = count > 0 ? '' : 'none';
        if (count <= 0) ISPConfig.closeDialog('#datalogModal');
        ISPConfig.dataLogTimer = window.setTimeout(function() { ISPConfig.dataLogNotification(); }, count > 0 ? 2000 : 5000);
      }).catch(function() {
        var notification = query(document, '.notification');
        if (notification) notification.style.display = 'none';
      });
      return request;
    },

    addAdditionalTemplate: function() {
      var input = document.getElementById('template_additional');
      var select = document.getElementById('tpl_add_select');
      var list = query(document, '#template_additional_list ul');
      if (!input || !select || !list) return;
      var parts = String(select.value || '').split('|', 2);
      var addTplId = parts[0];
      var addTplText = parts[1] || '';
      if (!(Number(addTplId) > 0)) {
        ISPConfig.notify(
          (typeof window.heritageLanguage === 'function' && window.heritageLanguage() === 'de')
            ? 'Keine zusätzliche Vorlage ausgewählt.'
            : 'No additional template selected.',
          'warning'
        );
        return;
      }
      ISPConfig.new_tpl_add_id += 1;
      var key = 'n' + ISPConfig.new_tpl_add_id;
      var values = input.value ? input.value.split('/') : [];
      values.push(key + ':' + addTplId);
      input.value = values.join('/');
      var item = document.createElement('li');
      item.setAttribute('rel', key);
      item.appendChild(document.createTextNode(addTplText + ' '));
      var remove = document.createElement('a');
      remove.href = '#';
      remove.className = 'wb-template-remove';
      remove.setAttribute('data-heritage-template-remove', 'true');
      remove.setAttribute('aria-label', 'Remove template');
      var glyph = document.createElement('span');
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '\u00d7';
      remove.appendChild(glyph);
      remove.addEventListener('click', function(event) {
        event.preventDefault();
        ISPConfig.delAdditionalTemplate(key);
      });
      item.appendChild(remove);
      list.appendChild(item);
    },

    delAdditionalTemplate: function(tplId) {
      var input = document.getElementById('template_additional');
      if (!input) return;
      if (tplId) {
        var item = query(document, '#template_additional_list ul li[rel="' + cssEscape(tplId) + '"]');
        if (item) item.remove();
        input.value = (input.value || '').split('/').filter(function(value) {
          return value.split(':', 2)[0] !== tplId;
        }).join('/');
      }
    }
  };

  var heritageApp = window.heritageApp = window.heritageApp || {};

  [
    'setOption',
    'setOptions',
    'reportError',
    'registerHook',
    'callHook',
    'requestRead',
    'requestText',
    'requestJson',
    'requestForm',
    'navigateTo',
    'submitPageForm',
    'submitForm',
    'submitUploadForm',
    'switchTab',
    'refreshContentInto',
    'loadOptionInto',
    'loadContentRefresh',
    'loadInitContent',
    'loadMenus',
    'loadPushyMenu',
    'replaceServerFragment',
    'capp',
    'keepalive',
    'dataLogNotification',
    'beginRequest',
    'endRequest',
    'showLoadIndicator',
    'hideLoadIndicator',
    'normalizeWorkbenchContentContracts',
    'activateFragmentScripts',
    'onAfterContentLoad',
    'onAfterSideNavLoaded',
    'enhanceTooltip',
    'enhanceSelect',
    'enhanceSearch',
    'enhanceDateTime',
    'closeDialog',
    'resetFormChanged',
    'endpoint'
  ].forEach(function(name) {
    heritageApp[name] = function() {
      return ISPConfig[name].apply(ISPConfig, arguments);
    };
  });

  [
    'pageFormChanged',
    'tabChangeWarningTxt',
    'tabChangeDiscardTxt',
    'tabChangeWarning',
    'tabChangeDiscard',
    'requestsRunning',
    'heritageActiveModule',
    'dataLogTimer',
    'options',
    'registeredHooks'
  ].forEach(function(name) {
    Object.defineProperty(heritageApp, name, {
      configurable: true,
      enumerable: true,
      get: function() { return ISPConfig[name]; },
      set: function(value) { ISPConfig[name] = value; }
    });
  });

  window.password = function(length) {
    length = Number(length || 16);
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!$%&?';
    var result = '';
    var values = new Uint32Array(length);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(values);
    for (var i = 0; i < length; i += 1) {
      var index = values[i] ? values[i] % alphabet.length : Math.floor(Math.random() * alphabet.length);
      result += alphabet.charAt(index);
    }
    return result;
  };

  window.generatePassword = function(passwordFieldID, repeatPasswordFieldID) {
    var generated = window.password(16);
    var field = document.getElementById(passwordFieldID);
    var repeat = document.getElementById(repeatPasswordFieldID);
    if (field) {
      field.type = 'text';
      field.readOnly = false;
      field.value = generated;
      trigger(field, 'input');
      trigger(field, 'change');
    }
    if (repeat) {
      repeat.type = 'text';
      repeat.readOnly = false;
      repeat.value = generated;
      trigger(repeat, 'input');
      trigger(repeat, 'change');
    }
    if (typeof window.pass_check === 'function') window.pass_check(generated);
    if (typeof window.checkPassMatch === 'function') window.checkPassMatch(passwordFieldID, repeatPasswordFieldID);
    return generated;
  };

  window.pass_check = function(value) {
    var score = 0;
    value = String(value || '');
    if (value.length >= 8) score += 25;
    if (/[a-z]/.test(value)) score += 15;
    if (/[A-Z]/.test(value)) score += 15;
    if (/[0-9]/.test(value)) score += 15;
    if (/[^A-Za-z0-9]/.test(value)) score += 20;
    if (value.length >= 14) score += 10;
    score = Math.min(100, score);
    queryAll(document, '.progress .progress-bar, #passBar').forEach(function(bar) {
      bar.style.width = score + '%';
      bar.setAttribute('aria-valuenow', String(score));
    });
    return score;
  };

  window.checkPassMatch = function(firstId, secondId) {
    var first = document.getElementById(firstId);
    var second = document.getElementById(secondId);
    if (!first || !second) return false;
    var matchesPasswords = first.value === second.value;
    second.setCustomValidity(matchesPasswords ? '' : 'Passwords do not match.');
    return matchesPasswords;
  };

  function syncEmailDomainInput(input, deferred) {
    var apply = function() {
      if (!input || String(input.value || '').indexOf('@') < 0) return;
      var parts = String(input.value || '').split('@');
      var domain = parts.pop();
      var localPart = parts.join('@');
      var domainSelect = document.getElementById('email_domain');
      if (domainSelect) {
        domainSelect.value = domain;
        trigger(domainSelect, 'change');
      }
      input.value = localPart;
      trigger(input, 'input');
    };
    if (deferred) window.setTimeout(apply, 4);
    else apply();
  }

  window.processEmailAddressInput = function(input) {
    syncEmailDomainInput(input, true);
  };

  window.updateEmailDomain = function(input) {
    syncEmailDomainInput(input, false);
  };

  window.AR_ResetDates = function() {
    var autoresponder = document.getElementById('autoresponder');
    if (autoresponder && autoresponder.checked) return;
    ['autoresponder_start_date', 'autoresponder_end_date'].forEach(function(id) {
      var field = document.getElementById(id) || query(document, '[name="' + cssEscape(id) + '"]');
      if (field) {
        field.value = '';
        trigger(field, 'input');
        trigger(field, 'change');
      }
    });
  };

  document.addEventListener('input', function(event) {
    if (event.target && event.target.hasAttribute && event.target.hasAttribute('data-heritage-password-check')) {
      syncPasswordValidation(event.target);
    }
  });

  document.addEventListener('keyup', function(event) {
    if (event.target && event.target.hasAttribute && event.target.hasAttribute('data-heritage-password-check')) {
      syncPasswordValidation(event.target);
    }
  });

  document.addEventListener('change', function(event) {
    var target = event.target;
    if (!target) return;
    var changeAction = target.getAttribute('data-heritage-change-action');
    if (changeAction === 'hide-ok-message') {
      var message = document.getElementById(target.getAttribute('data-target') || 'OKMsg');
      if (message) {
        message.hidden = true;
        message.style.display = 'none';
        message.style.visibility = 'hidden';
      }
    }
    if (target.hasAttribute('data-email-domain-sync')) syncEmailDomainInput(target, false);
    if (target.hasAttribute('data-autoresponder-reset')) window.AR_ResetDates();
    var hideOkMessage = target.getAttribute('data-hide-ok-message');
    if (hideOkMessage) {
      var okMessage = document.getElementById(hideOkMessage);
      if (okMessage) {
        okMessage.hidden = true;
        okMessage.style.display = 'none';
      }
    }
    var submitOnChange = target.getAttribute('data-submit-on-change');
    if (submitOnChange) {
      event.preventDefault();
      ISPConfig.submitPageForm(target.getAttribute('data-submit-form') || 'pageForm', submitOnChange);
      return;
    }
    var refreshContent = target.getAttribute('data-load-content-refresh');
    if (refreshContent) {
      event.preventDefault();
      ISPConfig.loadContentRefresh(refreshContent);
      return;
    }
    var optionTarget = target.getAttribute('data-load-option-into');
    var optionTemplate = target.getAttribute('data-load-option-template');
    var optionEndpoint = target.getAttribute('data-load-option-endpoint');
    var optionQuery = target.getAttribute('data-load-option-query');
    if (optionTarget && (optionTemplate || optionEndpoint)) {
      event.preventDefault();
      ISPConfig.loadOptionInto(optionTarget, optionTemplate ? controlUrl(optionTemplate, target) : endpointWithQueryTemplate(heritageEndpoint(optionEndpoint), optionQuery, target));
      return;
    }
    var contentTemplate = heritageContractValue(target, HERITAGE_CONTENT_CONTRACTS.template);
    if (contentTemplate) {
      event.preventDefault();
      ISPConfig.navigateTo(controlUrl(contentTemplate, target));
      return;
    }
    if (target.hasAttribute('data-json-sync')) {
      runDependentJsonSync(target);
    }
    if (target.hasAttribute('data-heritage-sync-visibility')) {
      syncDeclaredVisibility(target);
    }
    if (target.hasAttribute('data-heritage-visibility-rules')) {
      syncVisibilityRules(target);
    }
    if (target.hasAttribute('data-heritage-database-type-toggle')) {
      syncDatabaseTypeFields(target);
    }
    if (matches(target, 'select') && query(document, '#pageForm .table #Filter') && !target.classList.contains('disableChangeEvent')) {
      event.preventDefault();
      trigger(query(document, '#pageForm .table #Filter'), 'click');
    }
    if (matches(target, 'select, input, textarea') && !target.classList.contains('no-page-form-change')) {
      ISPConfig.pageFormChanged = true;
    }
  });

  document.addEventListener('paste', function(event) {
    var target = event.target;
    if (target && target.hasAttribute && target.hasAttribute('data-email-domain-sync')) syncEmailDomainInput(target, true);
  });

  document.addEventListener('focusin', function(event) {
    checkRelatedRadio(event.target);
  });

  document.addEventListener('click', function(event) {
    var loadControl = closest(event.target, HERITAGE_CONTENT_CONTRACTS.load.selector);
    var loadIntoControl = closest(event.target, HERITAGE_CONTENT_CONTRACTS.target.selector);
    var moduleControl = closest(event.target, HERITAGE_CONTENT_CONTRACTS.module.selector);
    var submitControl = closest(event.target, 'a[data-submit-form],button[data-submit-form]');
    var passwordControl = closest(event.target, '[data-generate-password]');
    var confirmControl = closest(event.target, '[data-confirm-action]');
    var copyControl = closest(event.target, '[data-copy-email-address],[data-copy-composed-value],[data-copy-value]');
    var sslClientDataControl = closest(event.target, '[data-ssl-client-data-action]');
    var tabControl = closest(event.target, '[data-change-tab]');
    var heritageActionControl = closest(event.target, '[data-heritage-action]');
    var noopControl = closest(event.target, '[data-heritage-noop]');
    var sortHeader = closest(event.target, 'th[data-column]');
    var placeholder = closest(event.target, '.addPlaceholder');
    var placeholderContent = closest(event.target, '.addPlaceholderContent');
    var additionalTemplateRemove = closest(event.target, '#template_additional_list [data-heritage-template-remove]');
    var checkFields = closest(event.target, '[data-check-fields] > input[type="checkbox"]');
    var uncheckFields = closest(event.target, '[data-uncheck-fields] > input[type="checkbox"]');

    checkRelatedRadio(event.target);

    if (loadControl || loadIntoControl || moduleControl || submitControl || passwordControl || confirmControl || copyControl || sslClientDataControl || tabControl || heritageActionControl || noopControl || sortHeader || placeholder || placeholderContent || additionalTemplateRemove) {
      event.preventDefault();
      if (ISPConfig.requestsRunning > 0 && !passwordControl && !copyControl && !sslClientDataControl && !heritageActionControl && !noopControl && !placeholder && !placeholderContent && !additionalTemplateRemove) return;
      if (!passwordControl && !copyControl && !sslClientDataControl && !heritageActionControl && !noopControl && !placeholder && !placeholderContent && !additionalTemplateRemove) scrollToTop();
    }

    if (noopControl) {
      return;
    }

    if (additionalTemplateRemove) {
      var templateItem = closest(additionalTemplateRemove, 'li');
      if (templateItem) ISPConfig.delAdditionalTemplate(templateItem.getAttribute('rel'));
      return;
    }

    if (passwordControl) {
      window.generatePassword(
        passwordControl.getAttribute('data-password-field') || 'password',
        passwordControl.getAttribute('data-repeat-password-field') || 'repeat_password'
      );
      return;
    }

    if (confirmControl) {
      var confirmAction = confirmControl.getAttribute('data-confirm-action');
      if (confirmAction) ISPConfig.confirm_action(confirmAction, confirmControl.getAttribute('data-confirm-message') || '');
      return;
    }

    if (copyControl) {
      if (copyControl.hasAttribute('data-copy-email-address')) {
        var localField = document.getElementById(copyControl.getAttribute('data-local-field') || 'email_local_part');
        var domainField = document.getElementById(copyControl.getAttribute('data-domain-field') || 'email_domain');
        copyTextToClipboard((localField ? localField.value : '') + '@' + (domainField ? domainField.value : ''), copyControl);
        return;
      }
      if (copyControl.hasAttribute('data-copy-composed-value')) {
        var prefix = document.getElementById(copyControl.getAttribute('data-copy-source-prefix') || '');
        var source = document.getElementById(copyControl.getAttribute('data-copy-source-value') || '');
        copyTextToClipboard((prefix ? prefix.innerText || prefix.textContent || '' : '') + (source ? source.value || source.textContent || '' : ''), copyControl);
        return;
      }
      copyTextToClipboard(copyControl.getAttribute('data-copy-value') || '', copyControl);
      return;
    }

    if (sslClientDataControl) {
      var sslAction = sslClientDataControl.getAttribute('data-ssl-client-data-action');
      if (sslAction === 'reset') resetSslClientData();
      if (sslAction === 'load') loadSslClientData(sslClientDataControl);
      return;
    }

    if (tabControl) {
      ISPConfig.switchTab(
        tabControl.getAttribute('data-change-tab'),
        tabControl.getAttribute('data-tab-target') || tabControl.getAttribute('data-form-action'),
        tabControl.getAttribute('data-tab-force') === 'true'
      );
      return;
    }

    if (heritageActionControl) {
      var heritageAction = heritageActionControl.getAttribute('data-heritage-action');
      if (heritageAction === 'add-additional-template') ISPConfig.addAdditionalTemplate();
      if (heritageAction === 'reset-autoresponder-dates') window.AR_ResetDates();
      if (heritageAction === 'create-dkim') createDkimRecord(heritageActionControl);
      if (heritageAction === 'set-hidden-submit') {
        var fieldName = heritageActionControl.getAttribute('data-hidden-field');
        var fieldValue = heritageActionControl.getAttribute('data-hidden-value') || '1';
        var field = fieldName ? query(document, '[name="' + cssEscape(fieldName) + '"]') : null;
        if (field) {
          field.value = fieldValue;
          trigger(field, 'input');
        }
        ISPConfig.submitPageForm(heritageActionControl.getAttribute('data-submit-form') || 'pageForm', heritageActionControl.getAttribute('data-form-action'));
      }
      return;
    }

    if (loadIntoControl) {
      var targetId = heritageContractValue(loadIntoControl, HERITAGE_CONTENT_CONTRACTS.target);
      var targetContent = heritageContractValue(loadIntoControl, HERITAGE_CONTENT_CONTRACTS.load);
      if (targetId && targetContent) ISPConfig.refreshContentInto(targetId, targetContent);
      return;
    }

    if (loadControl) {
      var content = heritageContractValue(loadControl, HERITAGE_CONTENT_CONTRACTS.load);
      if (content) ISPConfig.navigateTo(content);
      return;
    }

    if (moduleControl) {
      var module = heritageContractValue(moduleControl, HERITAGE_CONTENT_CONTRACTS.module);
      if (module) ISPConfig.capp(module);
      return;
    }

    if (submitControl) {
      var action = submitControl.getAttribute('data-form-action');
      var form = submitControl.getAttribute('data-submit-form');
      if (submitControl.getAttribute('data-form-upload') === 'true') ISPConfig.submitUploadForm(form, action);
      else ISPConfig.submitPageForm(form, action);
      return;
    }

    if (sortHeader && query(document, '#pageForm .table #Filter') && sortHeader.getAttribute('data-sortable') !== 'false') {
      var filter = document.getElementById('Filter');
      var target = filter && filter.getAttribute('data-form-action');
      var formName = filter && filter.getAttribute('data-submit-form');
      if (target && formName) {
        target += (target.indexOf('?') >= 0 ? '&' : '?') + 'orderby=' + encodeURIComponent(sortHeader.getAttribute('data-column'));
        ISPConfig.submitPageForm(formName, target);
      }
      return;
    }

    if (placeholder) {
      var field = query(placeholder.parentNode, 'input, textarea');
      if (field) field.value += placeholder.textContent;
    }

    if (placeholderContent) {
      var destination = query(placeholderContent.parentNode, 'input, textarea');
      if (destination) destination.value += placeholderContent.textContent;
    }

    if (checkFields && checkFields.checked) {
      String(checkFields.parentNode.getAttribute('data-check-fields') || '').split(',').forEach(function(name) {
        queryAll(document, 'input[type="checkbox"][name="' + cssEscape(name.trim()) + '"]').forEach(function(box) { box.checked = true; });
      });
    }

    if (uncheckFields && !uncheckFields.checked) {
      String(uncheckFields.parentNode.getAttribute('data-uncheck-fields') || '').split(',').forEach(function(name) {
        queryAll(document, 'input[type="checkbox"][name="' + cssEscape(name.trim()) + '"]').forEach(function(box) { box.checked = false; });
      });
    }
  });

  document.addEventListener('keypress', function(event) {
    if (event.key !== 'Enter') return;
    if (query(document, '#pageForm .table #Filter') && !event.target.classList.contains('ui-autocomplete-input')) {
      event.preventDefault();
      trigger(query(document, '#pageForm .table #Filter'), 'click');
      return;
    }
    if (event.target.localName !== 'textarea' && matches(event.target, 'input, select') && query(document, '.tab-content button.formbutton-success:not([disabled])')) {
      event.preventDefault();
      trigger(query(document, '.tab-content button.formbutton-success:not([disabled])'), 'click');
    }
  });

  document.addEventListener('submit', function(event) {
    if (event.target && event.target.id === 'searchform') event.preventDefault();
    if (event.target && event.target.id === 'pageForm' && query(document, '#pageForm .table #Filter')) event.preventDefault();
  });

  document.addEventListener('DOMContentLoaded', function() {
    initSslClientDataHelpers(document);
    queryAll(document, '.progress .progress-bar').forEach(function(bar) {
      bar.style.width = (bar.getAttribute('aria-valuenow') || '0') + '%';
    });
  });
})(window, document);

/* source: heritage-field-search.js */
(function(window, document) {
  'use strict';

  if (window.heritageFieldSearch) return;

  function language() {
    return typeof window.heritageLanguage === 'function'
      ? window.heritageLanguage()
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
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
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
    state.input.dispatchEvent(new CustomEvent('heritage:search-select', {
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
      state.input.dispatchEvent(new CustomEvent('heritage:search-error', { bubbles: true, detail: { error: error } }));
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

  window.heritageFieldSearch = { enhance: enhance, destroy: destroy };
  window.heritageFieldSearchInstalled = true;
})(window, document);

/* source: heritage-message-acknowledgement.js */
(function (window, document) {
  'use strict';

  if (window.heritageMessageAcknowledgement) return;

  function acknowledge(alert) {
    var url = alert && alert.getAttribute('data-heritage-ack-url');
    if (!url || alert.dataset.heritageAckState === 'pending' || alert.dataset.heritageAckState === 'complete') return false;
    if (!window.heritageHttp) return false;

    alert.dataset.heritageAckState = 'pending';
    var request = window.heritageHttp.getText(url, { accept: 'text/plain', timeout: 10000 });
    request.promise.then(function () {
      alert.dataset.heritageAckState = 'complete';
      alert.dispatchEvent(new CustomEvent('heritage:message-acknowledged', { detail: { url: url } }));
    }).catch(function (error) {
      alert.dataset.heritageAckState = 'error';
      alert.dispatchEvent(new CustomEvent('heritage:message-acknowledgement-error', {
        detail: { url: url, error: error }
      }));
    });
    return true;
  }

  function enhance(scope) {
    var host = scope && scope.querySelectorAll ? scope : document;
    host.querySelectorAll('[data-heritage-ack-url]').forEach(function (alert) {
      if (alert.dataset.heritageAckBound === 'true') return;
      alert.dataset.heritageAckBound = 'true';
      alert.addEventListener('heritage:alert-dismiss', function () { acknowledge(alert); }, { once: true });
    });
  }

  window.heritageMessageAcknowledgement = { enhance: enhance, acknowledge: acknowledge };
  window.heritageMessageAcknowledgementInstalled = true;
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
})(window, document);

/* source: heritage-loading.js */
(function(window, document) {
  'use strict';

  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || legacy.heritageLoadingInstalled) return;

  var originalCapp = legacy.capp;
  var content = function() { return document.getElementById('pageContent'); };
  var moduleItems = [];
  var messages = {};
  var moduleTransitionTimer = null;
  var moduleSlowTimer = null;
  var requestSlowTimer = null;

  function localized(german, english) {
    var language = typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : (document.documentElement.lang || '');
    return String(language).toLowerCase().indexOf('de') === 0 ? german : english;
  }

  try {
    var messageSource = document.getElementById('heritage-content-messages');
    messages = JSON.parse(messageSource ? messageSource.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function finishModuleTransition() {
    if (moduleTransitionTimer !== null) {
      window.clearTimeout(moduleTransitionTimer);
      moduleTransitionTimer = null;
    }
    if (moduleSlowTimer !== null) {
      window.clearTimeout(moduleSlowTimer);
      moduleSlowTimer = null;
    }
    document.body.classList.remove('wb-module-transition-active');
    moduleItems.forEach(function(item) {
      item.removeAttribute('aria-busy');
      item.removeAttribute('data-heritage-delayed');
      item.classList.remove('wb-module-transition-source');
      var state = item.querySelector('.wb-module-transition');
      if (state) state.remove();
    });
    moduleItems = [];
  }

  function startModuleTransition(module) {
    finishModuleTransition();
    document.body.classList.add('wb-module-transition-active');
    moduleItems = Array.prototype.filter.call(document.querySelectorAll('[data-capp]'), function(item) {
      return item.getAttribute('data-capp') === String(module);
    });
    moduleItems.forEach(function(item) {
      item.setAttribute('aria-busy', 'true');
      item.classList.add('wb-module-transition-source');
      var state = document.createElement('span');
      state.className = 'wb-module-transition';
      state.setAttribute('role', 'status');
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = messages.module_switching || localized('Modul wird gewechselt', 'Switching module');
      state.appendChild(sr);
      item.appendChild(state);
    });
    // Match the content-state request timeout so the transition indicator does
    // not disappear while the underlying module request is still active.
    moduleTransitionTimer = window.setTimeout(finishModuleTransition, 30000);
    moduleSlowTimer = window.setTimeout(function() {
      moduleItems.forEach(function(item) {
        item.setAttribute('data-heritage-delayed', 'true');
        var label = item.querySelector('.wb-module-transition .sr-only');
        if (label) label.textContent = localized('Modul wird weiterhin geladen', 'Module is still loading');
      });
    }, 7000);
  }

  var moduleRequest = null;

  legacy.capp = function(module, redirect) {
    var api = runtime();
    startModuleTransition(module);
    legacy.heritageActiveModule = module;
    if (!api || typeof api.requestText !== 'function') return originalCapp.apply(this, arguments);
    if (moduleRequest && moduleRequest.readyState !== 4) moduleRequest.abort();
    try {
      var request = api.requestText('capp.php', {
        query: { mod: module, redirect: redirect === undefined ? null : redirect },
        timeout: 30000
      });
      moduleRequest = request;
      request.promise.then(function(responseText) {
        if (responseText.indexOf('HEADER_REDIRECT:') > -1) {
          api.navigateTo(responseText.split(':')[1]);
        } else if (responseText.indexOf('URL_REDIRECT:') > -1) {
          document.location.href = responseText.substr(responseText.indexOf('URL_REDIRECT:') + 'URL_REDIRECT:'.length);
          return;
        }
        var menus = api.loadMenus({ module: module });
        if (Array.isArray(menus)) {
          Promise.all(menus.map(function(request) { return request.promise.catch(function() {}); })).then(finishModuleTransition);
        } else {
          finishModuleTransition();
        }
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) {
          finishModuleTransition();
          api.reportError('Module request was not successful. ' + module);
        }
      });
      return request;
    } catch (error) {
      finishModuleTransition();
      throw error;
    }
  };

  document.addEventListener('heritage:navigation-complete', function() {
    if (moduleItems.length) finishModuleTransition();
  });

  legacy.beginRequest = function() {
    if (legacy.options.useLoadIndicator !== true) return;
    legacy.requestsRunning += 1;
    document.body.classList.add('wb-request-active');
    document.body.dataset.heritageRequestCount = String(legacy.requestsRunning);
    var region = content();
    if (!region) return;
    region.setAttribute('aria-busy', 'true');
    var status = region.querySelector(':scope > .wb-request-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'wb-request-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      status.textContent = messages.processing || localized('Anfrage wird verarbeitet', 'Processing request');
      region.prepend(status);
    }
    if (legacy.requestsRunning === 1) {
      if (requestSlowTimer !== null) window.clearTimeout(requestSlowTimer);
      requestSlowTimer = window.setTimeout(function() {
        requestSlowTimer = null;
        var current = content();
        var currentStatus = current && current.querySelector(':scope > .wb-request-status');
        if (!currentStatus || legacy.requestsRunning < 1) return;
        currentStatus.setAttribute('data-heritage-delayed', 'true');
        currentStatus.textContent = localized('Die Anfrage dauert etwas länger. Sie wird weiterhin verarbeitet.', 'This request is taking a little longer. It is still being processed.');
      }, 7000);
    }
  };

  legacy.endRequest = function() {
    legacy.requestsRunning = Math.max(0, legacy.requestsRunning - 1);
    document.body.dataset.heritageRequestCount = String(legacy.requestsRunning);
    if (legacy.requestsRunning > 0) return;
    if (requestSlowTimer !== null) {
      window.clearTimeout(requestSlowTimer);
      requestSlowTimer = null;
    }
    document.body.classList.remove('wb-request-active');
    var region = content();
    if (!region) return;
    region.setAttribute('aria-busy', 'false');
    var status = region.querySelector(':scope > .wb-request-status');
    if (status) status.remove();
  };

  legacy.showLoadIndicator = function() {
    return legacy.beginRequest();
  };

  legacy.hideLoadIndicator = function() {
    return legacy.endRequest();
  };

  legacy.heritageLoadingInstalled = true;
})(window, document);

/* source: heritage-content-states.js */
(function(window, document) {
  'use strict';

  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || legacy.heritageContentStatesInstalled) return;

  var sequence = 0;
  var retryRequests = {};
  var messages = {};
  var contentRequest = null;
  var contentStateTimer = null;
  var contentStateDelay = 140;
  var historyKey = 'heritageContent';
  var isGerman = (typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : (document.documentElement.lang || '')).toLowerCase().indexOf('de') === 0;

  function localized(german, english) {
    return isGerman ? german : english;
  }

  function isGenericActionLabel(value) {
    return /^(?:(?:Aktion|Action)\s*\d*|Weitere Aktion|More action|Aktionen|Actions)$/i.test(String(value || '').replace(/\s+/g, ' ').trim());
  }

  function inferRowActionLabel(control, flags) {
    var source = [
      control.className,
      control.getAttribute('href'),
      control.getAttribute('data-load-content'),
      control.getAttribute('data-heritage-load-content'),
      control.getAttribute('data-confirm-action'),
      control.getAttribute('name'),
      control.getAttribute('value')
    ].join(' ').toLowerCase();

    if (flags.isDanger || /delete|remove|drop|purge|destroy|loeschen|entfernen/.test(source)) return localized('Löschen', 'Delete');
    if (flags.isLogin || /loginas|login_as|login-as|impersonat|anmelden/.test(source)) return localized('Als Benutzer anmelden', 'Log in as user');
    if (flags.isEdit || /(?:^|[\\/_-])edit(?:[.\\/_?-]|$)|bearbeiten/.test(source)) return localized('Bearbeiten', 'Edit');
    if (/download|export|backup_download|icon-download/.test(source)) return localized('Herunterladen', 'Download');
    if (/copy|duplicate|clone|dupliz/.test(source)) return localized('Duplizieren', 'Duplicate');
    if (/restore|rollback|wiederherstell/.test(source)) return localized('Wiederherstellen', 'Restore');
    if (/enable|activate|aktivieren/.test(source)) return localized('Aktivieren', 'Enable');
    if (/disable|deactivate|deaktivieren/.test(source)) return localized('Deaktivieren', 'Disable');
    if (/stat|monitor|traffic|usage|quota|chart/.test(source)) return localized('Statistik anzeigen', 'View statistics');
    if (/preview|vorschau/.test(source)) return localized('Vorschau öffnen', 'Open preview');
    if (/link|open|visit|external|icon-link/.test(source)) return localized('Öffnen', 'Open');
    if (/add|create|new|hinzufuegen|erstellen|icon-add/.test(source)) return localized('Hinzufügen', 'Add');
    return localized('Weitere Optionen öffnen', 'Open more options');
  }

  try {
    var messageSource = document.getElementById('heritage-content-messages');
    messages = JSON.parse(messageSource ? messageSource.textContent : '{}');
  } catch (error) {
    messages = {};
  }
  var messageDefaults = {
    loading: localized('Inhalt wird geladen', 'Loading content'),
    loading_description: localized('Die angeforderte Ansicht wird vorbereitet.', 'The requested view is being prepared.'),
    empty: localized('Kein Inhalt verfügbar', 'No content available'),
    empty_title: localized('Noch keine Einträge', 'No entries yet'),
    empty_description: localized('Hier gibt es aktuell nichts anzuzeigen.', 'There is currently nothing to display here.'),
    error: localized('Inhalt konnte nicht geladen werden', 'Content could not be loaded'),
    error_description: localized('Verbindung prüfen und erneut versuchen.', 'Check the connection and try again.'),
    retry: localized('Erneut versuchen', 'Try again'),
    refreshing: localized('Daten werden aktualisiert', 'Refreshing data'),
    refresh_error: localized('Daten konnten nicht aktualisiert werden', 'Data could not be refreshed')
  };
  Object.keys(messageDefaults).forEach(function(name) {
    if (!messages[name]) messages[name] = messageDefaults[name];
  });

  function announceNavigationComplete(pagename, error) {
    document.dispatchEvent(new CustomEvent('heritage:navigation-complete', {
      detail: { page: pagename, error: error || null }
    }));
  }

  function announceContentReady(host, pageName, context) {
    document.dispatchEvent(new CustomEvent('heritage:content-ready', {
      detail: { root: host || document, page: pageName || '', context: context || null }
    }));
  }

  function text(value) {
    var node = document.createElement('div');
    node.textContent = value || '';
    return node.innerHTML;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function element(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = value;
    return node;
  }

  function iconElement(className, value) {
    var node = element('span', className, value);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function emptyStateNode(modifier, title, description) {
    var state = element('div', 'wb-empty-state wb-empty-state--' + modifier);
    var content = element('div', 'wb-empty-state__content');
    content.appendChild(element('strong', 'wb-empty-state__title', title));
    content.appendChild(element('span', 'wb-empty-state__description', description || ''));
    state.appendChild(iconElement('wb-empty-state__icon'));
    state.appendChild(content);
    return state;
  }

  function moduleAttribute(control) {
    return control ? (control.getAttribute('data-heritage-module') || control.getAttribute('data-capp') || '') : '';
  }

  function pageFromUrl() {
    var page = '';
    try { page = new URLSearchParams(window.location.search).get('wb') || ''; } catch (e) { page = ''; }
    // Only accept a plausible module page path (dashboard/dashboard.php,
    // monitor/show_sys_state.php?state=system, ...), never an arbitrary value.
    return /^[a-z0-9_-]+\/[a-z0-9_./-]+\.php(?:\?.*)?$/i.test(page) ? page : '';
  }
  function urlFor(page) {
    // Real, reload-safe, bookmarkable query URL kept entirely inside the theme
    // (no shared-core or server changes). Only sub-query/anchor separators are
    // escaped so URLSearchParams round-trips the value.
    return window.location.pathname + '?wb=' + String(page).replace(/#/g, '%23').replace(/&/g, '%26').replace(/\?/g, '%3F');
  }
  // Expose so the core runtime (navigateTo) uses the same URL form.
  if (legacy) legacy.heritageUrlFor = urlFor;

  function installNavigationHistory() {
    if (!window.history || !window.history.pushState || document.documentElement.dataset.heritageHistoryReady) return;
    document.documentElement.dataset.heritageHistoryReady = 'true';
    var content = document.getElementById('pageContent');
    // Robust routing: the current page lives in the address-bar hash, so reload
    // or bookmark restores it instead of falling back to the server session
    // module (which made every reload land on the last full-loaded module).
    var initial = pageFromUrl() || (content && content.getAttribute('data-startpage')) || 'dashboard/dashboard.php';
    if (!window.history.state || !window.history.state[historyKey]) window.history.replaceState({ heritageContent: initial }, '', urlFor(initial));
    document.addEventListener('click', function(event) {
      var trigger = event.target.closest('a[data-heritage-module],button[data-heritage-module],a[data-capp],button[data-capp]');
      if (!trigger) return;
      var target = moduleAttribute(trigger);
      if (!target || trigger.getAttribute('data-submit-form') || trigger.getAttribute('data-form-action')) return;
      var current = window.history.state && window.history.state[historyKey];
      if (current !== target) window.history.pushState({ heritageContent: target }, '', urlFor(target));
    });
    window.addEventListener('popstate', function(event) {
      var target = event.state && event.state[historyKey];
      if (!target) return;
      var api = runtime();
      if (api) api.navigateTo(target);
    });
  }

  // Shared native GET transport for Workbench navigation. It deliberately
  // retains the small jqXHR-compatible handle expected by legacy callers.
  function requestHtml(url, data, timeout) {
    var api = runtime();
    if (!api || typeof api.requestText !== 'function') throw new Error('Workbench runtime requestText is unavailable.');
    return api.requestText(url || '', { query: data || null, timeout: timeout || 30000 });
  }

  function isSupersededRequest(request, error) {
    if (request && request.aborted) return true;
    if (error && error.name === 'AbortError') return true;
    if (error && error.name === 'WorkbenchHttpError' && /superseded|aborted|ersetzt/i.test(error.message || '')) return true;
    return false;
  }

  function decorateNavigation(host) {
    if (!host) return;
    host.querySelectorAll('a, button').forEach(function(control) {
      if (control.classList.contains('active')) control.setAttribute('aria-current', 'page');
      else if (control.getAttribute('aria-current') === 'page') control.removeAttribute('aria-current');
    });
  }

  function decoratePageContext(host, pageName) {
    if (!host) return;
    var dashboardPage = /(?:^|\/)dashboard\/dashboard\.php(?:$|\?)/.test(normalizePageName(pageName)) ||
      Boolean(host.querySelector(':scope > .wb-dashlet, :scope > .dashboard-modules-wrapper, :scope > ul.modules'));
    var hasTable = !dashboardPage && Boolean(host.querySelector(':scope > .table-wrapper > table.table, :scope > table.table, .table-wrapper > table.table, table.table'));
    var shellForm = host.closest('form#pageForm, form.form-horizontal');
    var hasForm = !dashboardPage && (Boolean(host.querySelector('form#pageForm, .form-horizontal .form-group')) ||
      Boolean(shellForm && host.querySelector('.form-group, .pnl_formsarea, .tab-content')) ||
      /(?:_edit|_add|user_settings)\.php(?:$|\?)/.test(pageName || ''));
    var body = document.body;
    body.classList.toggle('wb-list-page', hasTable);
    body.classList.toggle('wb-form-page', hasForm);
    applyFormProfiles(body, host, pageName, hasForm);
  }

  function normalizePageName(pageName) {
    return String(pageName || '').replace(/&amp;/gi, '&').replace(/^\.?\//, '').toLowerCase();
  }

  function applyFormProfiles(body, host, pageName, hasForm) {
    var route = normalizePageName(pageName);
    var profiles = [];
    var addProfile = function(profile) {
      if (profiles.indexOf(profile) === -1) profiles.push(profile);
    };
    Array.prototype.forEach.call(body.classList, function(className) {
      if (className.indexOf('wb-form-profile--') === 0) body.classList.remove(className);
    });
    if (!hasForm) {
      delete body.dataset.heritageFormProfiles;
      return;
    }
    if (route.indexOf('billing/') === 0 || host.querySelector('.wb-billing-product, [data-billing-scope]')) addProfile('billing');
    if (route.indexOf('admin/system_config_edit.php') === 0) addProfile('system-config');
    if (host.querySelector('#smtp_host, #smtp_port, #smtp_user, #smtp_pass, #smtp_crypt, #default_mailserver')) addProfile('system-mail');
    if (route.indexOf('admin/server_config') === 0 || host.querySelector('#maildir_path, #nginx_vhost_conf_dir, #apache_vhost_conf_dir, #jailkit_chroot_home')) addProfile('server-config');
    if (route.indexOf('admin/extension_') === 0 || host.querySelector('[data-load-content*="extension_"], [data-form-action*="extension_"]')) addProfile('extension');
    if (route.indexOf('client/client_edit.php') === 0 || route.indexOf('client/reseller_edit.php') === 0 || host.querySelector('.panel_client, [id^="limit_"], [name^="limit_"]')) addProfile('limits');
    if (host.querySelector('input[type="file"]')) addProfile('uploads');
    if (host.querySelector('input[type="password"], input[name*="pass"], input[id*="pass"]')) addProfile('secrets');
    if (host.querySelector('.content-tab-wrapper > .wb-form-tabs > li:nth-child(8), .tab-content > .tab-pane:nth-child(8)')) addProfile('deep-tabs');
    if (host.querySelector('.panel-group, .panel-collapse, .panel-heading, .well')) addProfile('legacy-panels');
    if (host.querySelector('.select2-container, .chosen-container, select[multiple], select[size]')) addProfile('legacy-selects');
    if (host.querySelector('.input-group, .input-append, .input-prepend, .btn-group')) addProfile('compound-controls');
    if (host.querySelector('textarea[name*="config"], textarea[id*="config"], textarea[name*="directive"], textarea[id*="directive"], textarea[name*="conf"], textarea[id*="conf"]')) addProfile('technical-text');
    if (host.querySelector('input[name*="ssl"], input[id*="ssl"], textarea[name*="ssl"], textarea[id*="ssl"], input[name*="cert"], input[id*="cert"], textarea[name*="cert"], textarea[id*="cert"]')) addProfile('certificate');
    if (host.querySelector('.formtable, table.table, .table-wrapper, .table-responsive')) addProfile('embedded-tables');
    if (host.querySelector('.fieldset, fieldset, .fieldset-container, legend, .fieldset-legend')) addProfile('fieldsets');
    if (host.querySelector('[readonly], [disabled], .form-control-static, .readonly, .disabled')) addProfile('locked-values');
    if (host.querySelector('.help-block, .help-inline, .description, .hint, small, .form-text')) addProfile('help-rich');
    if (host.scrollWidth > host.clientWidth + 24 || host.querySelector('textarea[cols], table[width], input[size]')) addProfile('wide-content');
    profiles.forEach(function(profile) {
      body.classList.add('wb-form-profile--' + profile);
    });
    body.dataset.heritageFormProfiles = profiles.join(' ');
  }

  function moduleFromPageName(pageName) {
    var value = String(pageName || '').replace(/&amp;/gi, '&').replace(/^\.?\//, '').toLowerCase();
    if (!value || value.indexOf('dashboard/') === 0) return 'dashboard';
    if (value.indexOf('login/') === 0) return '';
    return value.split('/')[0] || '';
  }

  function moduleLabelFromPageName(pageName) {
    var moduleName = moduleFromPageName(pageName);
    if (!moduleName) return '';
    var direct = document.querySelector('#main-navigation a[data-heritage-module="' + moduleName + '"] .title, #main-navigation a[data-heritage-module="' + moduleName + '"], #main-navigation a[data-capp="' + moduleName + '"] .title, #main-navigation a[data-capp="' + moduleName + '"]');
    var label = direct && direct.textContent.replace(/\s+/g, ' ').trim();
    if (label) return label;
    var labels = {
      admin: 'System',
      billing: 'Fakturierung',
      client: 'Kunden',
      dashboard: '\u00dcbersicht',
      dns: 'DNS',
      help: 'Support',
      mail: 'E-Mail',
      monitor: '\u00dcberwachung',
      sites: 'Webseiten',
      tools: 'Einstellungen'
    };
    return labels[moduleName] || moduleName;
  }

  function decoratePageChrome(host, pageName) {
    if (!host) return;
    var header = host.querySelector(':scope > .page-header');
    if (header) {
      header.classList.add('wb-page-header');
      if (!document.body.classList.contains('wb-dashboard-page')) {
        var title = header.querySelector(':scope > h1');
        var moduleLabel = moduleLabelFromPageName(pageName);
        if (title && moduleLabel && moduleLabel.toLowerCase() !== title.textContent.trim().toLowerCase() && !header.querySelector(':scope > .wb-page-header__eyebrow')) {
          var eyebrow = document.createElement('span');
          eyebrow.className = 'wb-page-header__eyebrow';
          eyebrow.textContent = moduleLabel;
          header.insertBefore(eyebrow, title);
        }
        var meta = host.querySelector(':scope > .wb-page-meta');
        if (!meta) {
          meta = document.createElement('div');
          meta.className = 'wb-page-meta';
          header.insertAdjacentElement('afterend', meta);
        }
        var notices = host.querySelector(':scope > .wb-page-notices');
        if (!notices) {
          notices = document.createElement('section');
          notices.className = 'wb-page-notices';
          notices.setAttribute('aria-live', 'polite');
          meta.insertAdjacentElement('afterend', notices);
        }
      }
      Array.prototype.forEach.call(header.querySelectorAll(':scope > .btn, :scope > button, :scope > a.btn'), function(action) {
        action.classList.add('wb-page-header__action');
      });
      var description = header.nextElementSibling;
      if (description && description.classList.contains('wb-page-meta')) description = description.nextElementSibling;
      if (description && description.tagName === 'P' && !description.classList.contains('fieldset-legend')) {
        description.classList.add('wb-page-description');
        var metaTarget = host.querySelector(':scope > .wb-page-meta');
        if (metaTarget) metaTarget.appendChild(description);
      }
      var metaTarget = host.querySelector(':scope > .wb-page-meta');
      Array.prototype.forEach.call(host.querySelectorAll(':scope > .wb-form-state, :scope > .wb-submit-feedback'), function(status) {
        if (metaTarget) metaTarget.appendChild(status);
      });
      var noticeTarget = host.querySelector(':scope > .wb-page-notices');
      Array.prototype.forEach.call(host.querySelectorAll(':scope > #errormsg, :scope > #warningmsg, :scope > #infomsg, :scope > .alert'), function(notice) {
        if (noticeTarget) noticeTarget.appendChild(notice);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .fieldset-legend'), function(legend) {
      legend.classList.add('wb-section-heading');
    });
  }

  function decorateInformationArchitecture(host) {
    if (!host) return;
    var header = host.querySelector(':scope > .wb-page-header, :scope > .page-header');
    if (header) {
      var directActions = Array.prototype.slice.call(header.querySelectorAll(':scope > .wb-page-header__action, :scope > .btn, :scope > button, :scope > a.btn'));
      var actionGroup = header.querySelector(':scope > .wb-page-header__actions');
      if (directActions.length && !actionGroup) {
        actionGroup = document.createElement('div');
        actionGroup.className = 'wb-page-header__actions';
        actionGroup.setAttribute('role', 'group');
        actionGroup.setAttribute('aria-label', (header.querySelector('h1')?.textContent || localized('Seite', 'Page')) + ' ' + localized('Aktionen', 'actions'));
        directActions.forEach(function(action) {
          action.classList.add('wb-page-header__action');
          actionGroup.appendChild(action);
        });
        header.appendChild(actionGroup);
      }
      var title = header.querySelector('h1');
      if (title) {
        host.setAttribute('data-heritage-page-title', title.textContent.replace(/\s+/g, ' ').trim());
        title.setAttribute('tabindex', '-1');
      }
    }

    Array.prototype.forEach.call(host.querySelectorAll('#errormsg, #warningmsg, #infomsg, #OKMsg, .alert'), function(notice) {
      notice.classList.add('wb-notice');
      var kind = notice.matches('#errormsg, .alert-danger, .alert-error') ? 'danger' :
        notice.matches('#warningmsg, .alert-warning') ? 'warning' :
        notice.matches('#OKMsg, .alert-success') ? 'success' : 'info';
      notice.classList.add('wb-notice--' + kind);
      notice.setAttribute('role', kind === 'danger' ? 'alert' : 'status');
      if (!notice.querySelector(':scope > .wb-notice__icon')) {
        var icon = document.createElement('span');
        icon.className = 'wb-notice__icon';
        icon.setAttribute('aria-hidden', 'true');
        notice.insertBefore(icon, notice.firstChild);
      }
    });

    Array.prototype.forEach.call(host.querySelectorAll('dl'), function(list) {
      list.classList.add('wb-definition-list');
      Array.prototype.forEach.call(list.querySelectorAll(':scope > dt'), function(term) { term.classList.add('wb-definition-list__term'); });
      Array.prototype.forEach.call(list.querySelectorAll(':scope > dd'), function(value) { value.classList.add('wb-definition-list__value'); });
    });
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .panel, :scope > .well'), function(card) {
      card.classList.add('wb-content-card');
    });
    Array.prototype.forEach.call(host.querySelectorAll('pre:not(.wb-code-output), .codeview:not(.wb-code-output)'), function(output) {
      output.classList.add('wb-code-output');
    });
    Array.prototype.forEach.call(host.querySelectorAll('.label, .badge'), function(status) {
      if (status.closest('#main-navigation, #sidebar, #heritage-mobile-navigation')) return;
      status.classList.add('wb-status-chip');
      if (!status.getAttribute('role')) status.setAttribute('role', 'status');
    });
    Array.prototype.forEach.call(host.querySelectorAll('.wb-section-heading'), function(heading) {
      if (!heading.getAttribute('role')) heading.setAttribute('role', 'heading');
      if (!heading.getAttribute('aria-level')) heading.setAttribute('aria-level', '2');
    });
  }

  function decorateTableFilters(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.table-wrapper > table > thead > tr:nth-child(2)'), function(row) {
      if (row.getAttribute('data-heritage-filter-row') === 'true') return;
      row.setAttribute('data-heritage-filter-row', 'true');
      var headerCells = Array.prototype.slice.call(row.parentElement ? row.parentElement.querySelectorAll('tr:first-child > th, tr:first-child > td') : []);
      Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) {
        control.setAttribute('data-heritage-filter', 'true');
        if (!control.getAttribute('aria-label')) {
          var name = control.getAttribute('name') || '';
          var cell = control.closest('th, td');
          var cellIndex = cell ? Array.prototype.indexOf.call(row.children, cell) : -1;
          var header = cellIndex >= 0 ? headerCells[cellIndex] : null;
          var label = (header ? header.textContent : '').replace(/\s+/g, ' ').trim();
          if (!label) label = name.replace(/^search_/, '').replace(/_/g, ' ').trim();
          if (label) control.setAttribute('aria-label', 'Filter ' + label);
        }
        if (control.tagName === 'INPUT' && !control.getAttribute('placeholder')) {
          control.setAttribute('placeholder', localized('Suchen …', 'Search…'));
        }
        if (control.tagName === 'SELECT' && control.options.length && !control.options[0].textContent.trim()) {
          control.options[0].textContent = localized('Alle', 'All');
        }
      });
      var cell = row.lastElementChild;
      if (!cell) return;
      var wrapper = row.closest('.table-wrapper');
      var toolbar = null;
      var toggle = null;
      var summary = null;
      if (wrapper && wrapper.parentNode && !wrapper.parentNode.querySelector(':scope > .wb-filter-toolbar')) {
        var toolbar = document.createElement('div');
        toolbar.className = 'wb-filter-toolbar';
        toolbar.setAttribute('role', 'search');
        var toolbarTitle = document.createElement('strong');
        toolbarTitle.className = 'wb-filter-toolbar__title';
        toolbarTitle.textContent = document.body.getAttribute('data-heritage-filter-toggle') || localized('Filter', 'Filters');
        var toggle = document.createElement('button');
        toggle.type = 'button'; toggle.className = 'wb-filter-toggle';
        var showLabel = document.body.getAttribute('data-heritage-filter-show') || localized('Filter anzeigen', 'Show filters');
        var hideLabel = document.body.getAttribute('data-heritage-filter-hide') || localized('Filter ausblenden', 'Hide filters');
        toggle.appendChild(iconElement('wb-filter-toggle__icon'));
        toggle.appendChild(element('span', 'wb-filter-toggle__label'));
        toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', 'wb-filter-row-' + Math.random().toString(36).slice(2));
        row.id = toggle.getAttribute('aria-controls'); row.hidden = true;
        function syncToggle() {
          var label = row.hidden ? showLabel : hideLabel;
          toggle.setAttribute('aria-expanded', row.hidden ? 'false' : 'true');
          toggle.setAttribute('aria-label', label);
          toggle.title = label;
          toggle.querySelector('.wb-filter-toggle__label').textContent = label;
          wrapper.classList.toggle('wb-filter-panel-open', !row.hidden);
        }
        toggle.addEventListener('click', function() {
          row.hidden = !row.hidden;
          syncToggle();
          if (!row.hidden) {
            var firstFilter = row.querySelector('input, select');
            if (firstFilter) firstFilter.focus();
          }
        });
        var summary = document.createElement('span');
        summary.className = 'wb-filter-summary';
        summary.setAttribute('role', 'status');
        summary.setAttribute('aria-live', 'polite');
        toolbar.appendChild(toolbarTitle);
        toolbar.appendChild(summary);
        toolbar.appendChild(toggle);
        wrapper.parentNode.insertBefore(toolbar, wrapper);
        syncToggle();
      } else if (wrapper && wrapper.parentNode) {
        toolbar = wrapper.parentNode.querySelector(':scope > .wb-filter-toolbar');
        toggle = toolbar ? toolbar.querySelector('.wb-filter-toggle') : null;
        summary = toolbar ? toolbar.querySelector('.wb-filter-summary') : null;
      }
      var reset = document.createElement('button');
      reset.type = 'button'; reset.className = 'wb-filter-reset';
      var resetLabel = document.body.getAttribute('data-heritage-filter-reset') || localized('Filter zurücksetzen', 'Reset filters');
      var resetActiveLabel = document.body.getAttribute('data-heritage-filter-reset-active') || localized('Filter zurücksetzen (%s)', 'Reset filters (%s)');
      reset.textContent = resetLabel; reset.setAttribute('aria-label', resetLabel);
      function syncFilterCount() {
        var count = Array.prototype.filter.call(row.querySelectorAll('input, select'), function(control) { return control.tagName === 'SELECT' ? control.selectedIndex > 0 : Boolean(control.value); }).length;
        var label = count ? resetActiveLabel.replace('%s', count) : resetLabel;
        reset.textContent = resetLabel;
        reset.setAttribute('aria-label', label);
        reset.disabled = count === 0;
        if (summary) summary.textContent = count ? label : '';
        if (toolbar) {
          toolbar.classList.toggle('wb-filter-toolbar--active', count > 0);
          toolbar.classList.toggle('wb-filter-toolbar--idle', count === 0);
        }
        if (count && row.hidden) {
          row.hidden = false;
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', hideLabel);
            toggle.title = hideLabel;
            toggle.querySelector('.wb-filter-toggle__label').textContent = hideLabel;
          }
          if (wrapper) wrapper.classList.add('wb-filter-panel-open');
        }
      }
      Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) { control.addEventListener('input', syncFilterCount); control.addEventListener('change', syncFilterCount); });
      reset.addEventListener('click', function() {
        Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) {
          if (control.tagName === 'SELECT') control.selectedIndex = 0; else control.value = '';
          control.dispatchEvent(new Event('input', { bubbles: true })); control.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
      syncFilterCount();
      if (toolbar) toolbar.insertBefore(reset, toggle);
      row.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape' || !toggle) return;
        row.hidden = true;
        wrapper.classList.remove('wb-filter-panel-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', showLabel);
        toggle.title = showLabel;
        toggle.querySelector('.wb-filter-toggle__label').textContent = showLabel;
        toggle.focus();
      });
    });
  }

  function decorateListCommandBar(host) {
    if (!host || !document.body.classList.contains('wb-list-page') || host.querySelector(':scope > .wb-list-command-bar')) return;
    var tableWrapper = host.querySelector(':scope > .table-wrapper, :scope > .wb-table-workspace');
    if (!tableWrapper) return;
    host.classList.add('wb-table-workspace');
    tableWrapper.classList.add('wb-table-viewport');
    var bar = document.createElement('section');
    var meta = document.createElement('div');
    var actions = document.createElement('div');
    var result = document.createElement('span');
    var resultTemplate = document.body.dataset.heritageListVisibleResults || localized('{count} Einträge auf dieser Seite', '{count} items on this page');
    var dataRows = Array.prototype.filter.call(tableWrapper.querySelectorAll('table > tbody > tr'), function(row) {
      return !row.classList.contains('tbl_row_noresults') && !row.hasAttribute('data-heritage-summary-row');
    });
    bar.className = 'wb-list-command-bar';
    bar.setAttribute('aria-label', host.querySelector(':scope > .page-header h1')?.textContent.trim() || localized('Listenaktionen', 'List actions'));
    meta.className = 'wb-list-command-bar__meta';
    actions.className = 'wb-list-command-bar__actions';
    result.className = 'wb-list-result-count';
    result.setAttribute('role', 'status');
    result.textContent = resultTemplate.replace('{count}', dataRows.length);
    bar.dataset.heritageListRows = String(dataRows.length);
    bar.classList.toggle('wb-list-command-bar--empty', dataRows.length === 0);
    meta.appendChild(result);
    bar.appendChild(meta);
    bar.appendChild(actions);

    /* Native Workbench templates may publish their primary action next to the
     * table so the controller contract stays untouched. Consolidate that
     * source toolbar into the generated command bar instead of rendering two
     * competing headers above one dataset. */
    var sourceToolbar = tableWrapper.querySelector(':scope > .wb-list-toolbar');
    if (sourceToolbar) {
      Array.prototype.forEach.call(sourceToolbar.querySelectorAll('button, a'), function(action) {
        if (action.matches('.formbutton-success, .btn-success, .btn-primary, [data-heritage-primary-action]')) {
          action.classList.add('wb-list-command-bar__primary');
        }
        actions.appendChild(action);
      });
      sourceToolbar.remove();
    }

    Array.prototype.forEach.call(host.querySelectorAll(':scope > button.formbutton-success, :scope > a.formbutton-success, :scope > .buttons > .formbutton-success'), function(action) {
      var originalParent = action.parentElement;
      var actionLegend = originalParent === host ? action.previousElementSibling : originalParent.previousElementSibling;
      if (actionLegend && (actionLegend.classList.contains('fieldset-legend') || actionLegend.classList.contains('wb-list-section-heading'))) actionLegend.hidden = true;
      action.classList.add('wb-list-command-bar__primary');
      actions.appendChild(action);
      if (originalParent !== host && !originalParent.children.length) originalParent.remove();
    });
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .wb-dns-zone-actions, :scope > .wb-list-actions'), function(actionGroup) {
      var actionLegend = actionGroup.previousElementSibling;
      if (actionLegend && (actionLegend.classList.contains('fieldset-legend') || actionLegend.classList.contains('wb-list-section-heading'))) actionLegend.hidden = true;
      actionGroup.classList.add('wb-list-command-bar__action-group');
      actions.appendChild(actionGroup);
    });
    var filterToolbar = host.querySelector(':scope > .wb-filter-toolbar');
    if (filterToolbar) actions.appendChild(filterToolbar);
    var pageSize = Array.prototype.find.call(tableWrapper.querySelectorAll('select'), function(select) {
      if (select.name === 'search_limit' || select.classList.contains('search_limit') || select.classList.contains('wb-page-size-select')) return true;
      var name = String(select.name || select.id || '').toLowerCase();
      if (/(^|[_-])(limit|pagesize|page_size|perpage|per_page|items_per_page)([_-]|$)/.test(name)) return true;
      if (select.multiple || (select.size && Number(select.size) > 1)) return false;
      var values = Array.prototype.map.call(select.options || [], function(option) {
        return String(option.value || option.textContent || '').trim();
      }).filter(Boolean);
      var pageSizes = ['5', '10', '15', '20', '25', '30', '50', '100', '250'];
      return values.length >= 2 && values.length <= 8 &&
        values.every(function(value) { return /^\d{1,3}$/.test(value) && pageSizes.indexOf(value) !== -1; }) &&
        values.some(function(value) { return value === '15' || value === '25' || value === '50'; });
    });
    if (pageSize && !host.querySelector(':scope > .wb-list-page-size')) {
      var pageSizeCell = pageSize.closest('td, th');
      var pageSizeGroup = document.createElement('div');
      var pageSizeLabel = document.createElement('span');
      var pageSizeState = window.heritageSelect ? window.heritageSelect.enhance(pageSize, { compact: true, search: false }) : null;
      var pageSizeShell = pageSize.closest('.wb-select--page-size') || (pageSizeState && pageSizeState.root) || pageSize;
      pageSizeGroup.className = 'wb-list-page-size';
      pageSizeGroup.setAttribute('role', 'group');
      pageSizeGroup.setAttribute('aria-label', pageSize.getAttribute('aria-label') || localized('Einträge pro Seite', 'Items per page'));
      pageSizeLabel.className = 'wb-list-page-size__label';
      pageSizeLabel.textContent = pageSize.getAttribute('aria-label') || (((document.documentElement.lang || '').toLowerCase().indexOf('de') === 0) ? 'Pro Seite' : 'Per page');
      pageSizeGroup.appendChild(pageSizeLabel);
      pageSizeGroup.appendChild(pageSizeShell);
      pageSize.setAttribute('data-heritage-toolbar-control', 'true');
      if (pageSizeCell) {
        pageSizeCell.classList.add('wb-page-size-source-cell');
        pageSizeCell.setAttribute('aria-hidden', 'true');
        if (!pageSizeCell.textContent.replace(/\s+/g, '').trim()) pageSizeCell.hidden = true;
      }
      actions.insertBefore(pageSizeGroup, actions.firstChild);
    }

    var pageTitle = host.querySelector(':scope > .page-header h1');
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .fieldset-legend, :scope > .wb-list-section-heading'), function(legend) {
      var duplicatesTitle = pageTitle && legend.textContent.trim() === pageTitle.textContent.trim();
      if (duplicatesTitle || legend.classList.contains('wb-list-section-heading')) {
        legend.hidden = true;
        legend.setAttribute('aria-hidden', 'true');
      }
    });
    tableWrapper.parentNode.insertBefore(bar, tableWrapper);
  }

  function decorateDataTables(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.table-wrapper > table.table, .wb-table-workspace > table.table'), function(table) {
      if (table.getAttribute('data-heritage-table') === 'true') return;
      table.setAttribute('data-heritage-table', 'true');
      table.classList.add('wb-data-table');
      var tableViewport = table.closest('.table-wrapper');
      if (tableViewport) {
        tableViewport.classList.add('wb-table-viewport');
        tableViewport.setAttribute('data-heritage-table-viewport', 'true');
        if (tableViewport.parentElement && document.body.classList.contains('wb-list-page')) tableViewport.parentElement.classList.add('wb-table-workspace');
      }
      var headerNodes = Array.prototype.slice.call(table.querySelectorAll('thead > tr:first-child > th, thead > tr:first-child > td'));
      var headers = headerNodes.map(function(header) {
        var label = (header.textContent || header.getAttribute('aria-label') || header.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        var column = (header.getAttribute('data-column') || '').replace(/^search_/, '').replace(/[_-]+/g, ' ').trim();
        if (!label && column) label = column.replace(/\b\w/g, function(letter) { return letter.toUpperCase(); });
        return label;
      });
      var statusKinds = headers.map(function(label, index) {
        var normalized = String(label || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
        var dataColumn = String(headerNodes[index] && headerNodes[index].getAttribute('data-column') || '').toLowerCase().trim();
        if (/^(aktiv|active|enabled)$/.test(normalized)) return 'active';
        if (/^(gesperrt|locked|blocked)$/.test(normalized)) return 'locked';
        if (/^(remote|remotezugriff|remote zugriff|remote access)$/.test(normalized)) return 'remote';
        if (/^(?:mail|web|dns|file|db)_server$/.test(dataColumn)) return 'service';
        if (/^disable(?:smtp|deliver|imap|pop3)$/.test(dataColumn)) return 'disabled';
        if (/^(?:customer_viewable|backup_encrypted)$/.test(dataColumn)) return 'boolean';
        return '';
      });
      statusKinds.forEach(function(kind, index) {
        if (!kind) return;
        var fullLabel = kind === 'remote' ? localized('Remotezugriff', 'Remote access') : headers[index];
        if (kind === 'remote') headers[index] = 'Remote';
        var visibleLabel = headerNodes[index] && (headerNodes[index].querySelector('a, button') || headerNodes[index]);
        if (visibleLabel) {
          visibleLabel.textContent = '';
          var icon = document.createElement('span');
          icon.className = 'wb-status-header-icon wb-status-header-icon--' + kind;
          icon.setAttribute('aria-hidden', 'true');
          visibleLabel.appendChild(icon);
        }
        headerNodes[index].setAttribute('aria-label', fullLabel);
        headerNodes[index].setAttribute('title', fullLabel);
      });
      table.classList.toggle('wb-data-table--compact-status-columns', statusKinds.some(Boolean));
      headerNodes.forEach(function(header, index) {
        var html = header.innerHTML || '';
        var sortable = Boolean(header.querySelector('a[href], a[data-load-content], [data-sort], [data-order]')) ||
          /(?:order|orderby|order_by|sort|sortierung)/i.test(html) ||
          /[\u2191\u2193\u2195]/.test(header.textContent || '');
        header.classList.add('wb-table-header');
        header.classList.toggle('wb-table-header--sortable', sortable);
        header.classList.toggle('wb-table-header--actions', index === headerNodes.length - 1);
        header.classList.toggle('wb-table-header--status', Boolean(statusKinds[index]));
        if (statusKinds[index]) header.setAttribute('data-heritage-status-kind', statusKinds[index]);
        if (headers[index]) header.setAttribute('data-heritage-label', headers[index]);
        if (sortable && !header.getAttribute('aria-sort')) header.setAttribute('aria-sort', 'none');
      });
      table.setAttribute('data-heritage-columns', String(headers.length));
      table.style.setProperty('--wb-table-columns', String(Math.max(headers.length, 1)));
      table.classList.toggle('wb-data-table--wide', headers.length >= 6);
      var body = table.querySelector('tbody');
      if (!body) return;
      var dataRowCount = Array.prototype.filter.call(body.querySelectorAll(':scope > tr'), function(row) {
        return !row.classList.contains('tbl_row_noresults') && !row.hasAttribute('data-heritage-summary-row');
      }).length;
      var paginationLabel = document.body.dataset.heritagePagination || localized('Seitennavigation', 'Pagination');
      var resultTemplate = document.body.dataset.heritageListVisibleResults || localized('{count} Einträge auf dieser Seite', '{count} items on this page');
      var wrapper = table.closest('.table-wrapper') || table.parentElement;
      var footerBar = wrapper && wrapper.nextElementSibling && wrapper.nextElementSibling.classList.contains('wb-list-footer') ? wrapper.nextElementSibling : null;
      if (wrapper && wrapper.parentNode && !footerBar) {
        footerBar = document.createElement('section');
        footerBar.className = 'wb-list-footer';
        wrapper.insertAdjacentElement('afterend', footerBar);
      }
      if (wrapper) wrapper.classList.add('wb-table-viewport--finalized');
      if (wrapper && wrapper.parentElement) wrapper.parentElement.classList.add('wb-table-workspace--finalized');
      var footerSummary = null;
      var paginationSlot = null;
      if (footerBar) {
        footerBar.classList.add('wb-table-footer');
        footerBar.dataset.heritageListFooter = 'true';
        footerBar.setAttribute('aria-label', paginationLabel);
        footerSummary = footerBar.querySelector(':scope > .wb-list-footer__summary');
        if (!footerSummary) {
          footerSummary = document.createElement('span');
          footerSummary.className = 'wb-list-footer__summary';
          footerBar.appendChild(footerSummary);
        }
        footerSummary.textContent = resultTemplate.replace('{count}', dataRowCount);
        paginationSlot = footerBar.querySelector(':scope > .wb-list-footer__pagination');
        if (!paginationSlot) {
          paginationSlot = document.createElement('div');
          paginationSlot.className = 'wb-list-footer__pagination';
          footerBar.appendChild(paginationSlot);
        }
        paginationSlot.hidden = true;
      }
      table.classList.toggle('wb-data-table--empty', dataRowCount === 0);
      table.classList.toggle('wb-data-table--compact', headers.length <= 4);
      table.classList.toggle('wb-data-table--dense', dataRowCount > 20);
      if (tableViewport) tableViewport.classList.toggle('wb-table-viewport--empty', dataRowCount === 0);
      var emptyStateSurface = null;
      var emptyStateRow = null;
      Array.prototype.forEach.call(body.querySelectorAll(':scope > tr'), function(row) {
        var cells = row.querySelectorAll(':scope > td, :scope > th');
        if (row.classList.contains('tbl_row_noresults')) {
          row.classList.add('wb-table-empty-row');
          row.setAttribute('role', 'status');
          var emptyCell = cells[0];
          if (emptyCell && !emptyCell.querySelector('.wb-empty-state')) {
            emptyCell.colSpan = Math.max(headers.length, 1);
            var serverMessage = (emptyCell.textContent || '').replace(/\s+/g, ' ').trim();
            var emptyState = emptyStateNode('table', serverMessage || messages.empty_title || messages.empty, messages.empty_description || '');
            var primaryAction = host.querySelector('.wb-list-command-bar__primary');
            if (primaryAction && !primaryAction.closest('.wb-list-command-bar')) {
              var actionLabel = (primaryAction.value || primaryAction.textContent || primaryAction.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
              if (actionLabel) {
                var emptyAction = document.createElement('button');
                emptyAction.type = 'button';
                emptyAction.className = 'wb-empty-state__action wb-empty-state__action--primary';
                emptyAction.textContent = actionLabel;
                emptyAction.addEventListener('click', function() { primaryAction.click(); });
                emptyState.appendChild(emptyAction);
              }
            }
            if (primaryAction && primaryAction.closest('.wb-list-command-bar')) {
              emptyState.dataset.heritagePrimaryActionDocked = 'true';
            }
            emptyCell.textContent = '';
            emptyCell.appendChild(emptyState);
            emptyStateSurface = emptyState;
            emptyStateRow = row;
          }
          return;
        }
        row.classList.add('wb-table-data-row');
        row.setAttribute('tabindex', '-1');
        Array.prototype.forEach.call(cells, function(cell, index) {
          if (headers[index]) cell.setAttribute('data-heritage-label', headers[index]);
          var cellText = (cell.textContent || '').replace(/\s+/g, ' ').trim();
          var hasInteractive = Boolean(cell.querySelector('a, button, input, select, textarea'));
          cell.classList.toggle('wb-table-cell--empty', !cellText && !hasInteractive);
          cell.classList.toggle('wb-table-cell--numeric', /^[-+]?\d+(?:[.,]\d+)?(?:\s*[%a-z]+)?$/i.test(cellText));
          cell.classList.toggle('wb-table-cell--status', /^(yes|no|ja|nein|active|inactive|enabled|disabled|aktiv|inaktiv)$/i.test(cellText));
          var statusKind = statusKinds[index];
          if (statusKind && /^(?:0|1|yes|no|ja|nein|active|inactive|enabled|disabled|aktiv|inaktiv)$/i.test(cellText)) {
            var enabled = /^(?:1|yes|ja|active|enabled|aktiv)$/i.test(cellText);
            var fullStatusLabel = headerNodes[index] && (headerNodes[index].getAttribute('aria-label') || headerNodes[index].getAttribute('title')) || headers[index] || '';
            var stateLabel = statusKind === 'locked'
              ? (enabled ? localized('Gesperrt', 'Locked') : localized('Nicht gesperrt', 'Not locked'))
              : statusKind === 'active' || statusKind === 'remote'
                ? (enabled ? localized('Aktiv', 'Active') : localized('Inaktiv', 'Inactive'))
                : fullStatusLabel + ': ' + (enabled ? localized('Ja', 'Yes') : localized('Nein', 'No'));
            var statusTarget = cell.querySelector('a, button') || cell;
            var indicator = document.createElement('span');
            indicator.className = 'wb-status-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            if (statusTarget !== cell) {
              statusTarget.textContent = '';
              statusTarget.setAttribute('aria-label', stateLabel);
              statusTarget.setAttribute('title', stateLabel);
              statusTarget.appendChild(indicator);
            } else {
              cell.textContent = '';
              cell.setAttribute('aria-label', stateLabel);
              cell.setAttribute('title', stateLabel);
              cell.appendChild(indicator);
            }
            cell.classList.add('wb-table-cell--status', 'wb-table-cell--compact-status');
            cell.setAttribute('data-heritage-status-kind', statusKind);
            cell.setAttribute('data-heritage-status-state', enabled ? 'on' : 'off');
          }
          if (index === 0) cell.classList.add('wb-table-cell--identity');
          if (index === cells.length - 1 || cell.classList.contains('wb-table-align-end') || cell.classList.contains('text-right')) {
            cell.classList.add('wb-table-actions');
            cell.setAttribute('data-heritage-label', document.body.dataset.heritageTableActions || localized('Aktionen', 'Actions'));
          }
        });

        var primaryLink = Array.prototype.find.call(cells, function(cell) {
          return !cell.classList.contains('wb-table-actions') && cell.querySelector('a[data-capp], a[href]');
        });
        primaryLink = primaryLink && primaryLink.querySelector('a[data-capp], a[href]');
        if (primaryLink) {
          primaryLink.classList.add('wb-record-link');
          primaryLink.closest('td, th').classList.add('wb-table-cell--primary');
          row.setAttribute('data-heritage-record', (primaryLink.textContent || '').replace(/\s+/g, ' ').trim());
        }

        Array.prototype.forEach.call(row.querySelectorAll(':scope > .wb-table-actions'), function(cell) {
          var controls = cell.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
          if (!controls.length) return;
          var group = cell.querySelector(':scope > .wb-row-actions');
          if (!group) {
            group = document.createElement('div');
            group.className = 'wb-row-actions';
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', cell.getAttribute('data-heritage-label') || localized('Aktionen', 'Actions'));
            cell.insertBefore(group, cell.firstChild);
            while (group.nextSibling) group.appendChild(group.nextSibling);
          }
          controls = group.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
          cell.setAttribute('data-heritage-action-count', String(controls.length));
          Array.prototype.forEach.call(controls, function(control, controlIndex) {
            var visibleLabel = control.tagName === 'INPUT' ? control.value : control.textContent;
            var label = control.getAttribute('aria-label') || control.title || (visibleLabel || '').replace(/\s+/g, ' ').trim();
            var hadGenericLabel = isGenericActionLabel(label);
            if (hadGenericLabel) label = '';
            var isDanger = control.classList.contains('formbutton-danger') || control.classList.contains('btn-danger');
            var isLogin = /loginas|login_as|cid=|Anmelden als|Login as/i.test(control.className + ' ' + control.getAttribute('href') + ' ' + label);
            var isEdit = /edit|bearbeiten/i.test(control.className + ' ' + control.getAttribute('href') + ' ' + label);
            control.classList.add('wb-row-action');
            control.classList.toggle('wb-row-action--danger', isDanger);
            control.classList.toggle('wb-row-action--login', isLogin);
            control.classList.toggle('wb-row-action--edit', isEdit);
            if (!isDanger && controlIndex === 0) control.classList.add('wb-row-action--primary');
            if (!label) {
              label = inferRowActionLabel(control, {
                isDanger: isDanger,
                isLogin: isLogin,
                isEdit: isEdit
              });
            }
            if (hadGenericLabel || !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
            if (hadGenericLabel || !control.title) control.title = label;
            if (hadGenericLabel || isGenericActionLabel(control.getAttribute('data-original-title'))) control.setAttribute('data-original-title', label);
            if (control.getAttribute('style') && /url\(/i.test(control.getAttribute('style'))) control.dataset.heritageLegacyInlineIcon = 'true';
          });
        });
      });
      if (statusKinds.some(Boolean)) {
        var oldStatusColgroup = table.querySelector(':scope > colgroup[data-heritage-status-columns]');
        if (oldStatusColgroup) oldStatusColgroup.remove();
        var statusColgroup = document.createElement('colgroup');
        statusColgroup.setAttribute('data-heritage-status-columns', 'true');
        headerNodes.forEach(function(header, index) {
          var firstCell = body.querySelector(':scope > tr:not(.tbl_row_noresults) > :is(td, th):nth-child(' + (index + 1) + ')');
          var headerColumn = String(header.getAttribute('data-column') || '').toLowerCase().trim();
          var hidden = window.getComputedStyle(header).display === 'none' || (firstCell && (
            window.getComputedStyle(firstCell).display === 'none' ||
            firstCell.classList.contains('hg-table-column--identity') ||
            (index === 0 && /(?:^|_)id$/.test(headerColumn))
          ));
          if (index === headerNodes.length - 1) hidden = false;
          if (hidden) return;
          var column = document.createElement('col');
          if (statusKinds[index]) {
            column.className = 'wb-table-col--status';
            column.style.width = '68px';
          } else if (index === headerNodes.length - 1) {
            column.className = 'wb-table-col--actions';
            column.style.width = '120px';
          }
          statusColgroup.appendChild(column);
        });
        table.insertBefore(statusColgroup, table.querySelector('thead, tbody, tfoot'));
      }
      if (dataRowCount === 0 && wrapper && emptyStateSurface && emptyStateRow) {
        emptyStateSurface.classList.add('wb-empty-state--detached');
        wrapper.appendChild(emptyStateSurface);
        emptyStateRow.hidden = true;
        emptyStateRow.removeAttribute('role');
      }
      var paging = table.querySelector('.pagination');
      if (paging) {
        var pageLabel = document.body.dataset.heritagePaginationPage || localized('Seite {page}', 'Page {page}');
        var summaryTemplate = document.body.dataset.heritagePaginationSummary || localized('Seite {current} von {total}', 'Page {current} of {total}');
        var paginationNav = paging.closest('nav');
        var numberedLinks = Array.prototype.filter.call(paging.querySelectorAll('li > a, li > span'), function(control) {
          return /^\d+$/.test(control.textContent.trim());
        });
        var activeControl = paging.querySelector('li.active > a, li.active > span');
        var currentPage = activeControl && /^\d+$/.test(activeControl.textContent.trim()) ? Number(activeControl.textContent.trim()) : 1;
        var totalPages = numberedLinks.reduce(function(maximum, control) {
          return Math.max(maximum, Number(control.textContent.trim()));
        }, currentPage);
        paging.setAttribute('aria-label', paginationLabel);
        if (paginationNav) paginationNav.setAttribute('aria-label', paginationLabel);
        Array.prototype.forEach.call(paging.querySelectorAll(':scope > li'), function(item) {
          var control = item.querySelector(':scope > a, :scope > span');
          if (!control) return;
          var number = /^\d+$/.test(control.textContent.trim()) ? Number(control.textContent.trim()) : 0;
          if (item.classList.contains('active')) control.setAttribute('aria-current', 'page');
          if (item.classList.contains('disabled')) {
            item.setAttribute('aria-disabled', 'true');
            control.setAttribute('tabindex', '-1');
          }
          if (number) {
            item.classList.add('wb-pagination-page');
            control.setAttribute('aria-label', pageLabel.replace('{page}', number));
            if (number !== 1 && number !== totalPages && Math.abs(number - currentPage) > 1) item.classList.add('wb-pagination-page--peripheral');
          }
        });
        var pagingCell = paging.closest('td');
        var pagingRow = paging.closest('tr');
        if (footerBar) {
          footerBar.classList.add('wb-table-footer');
          footerBar.dataset.heritageListFooter = 'true';
          footerBar.setAttribute('aria-label', paginationLabel);
          footerSummary.textContent = summaryTemplate.replace('{current}', currentPage).replace('{total}', totalPages);
          paginationSlot.hidden = false;
          paginationSlot.appendChild(paginationNav || paging);
          if (pagingRow && pagingRow.parentNode) pagingRow.parentNode.removeChild(pagingRow);
          if (pagingCell) {
            pagingCell.classList.remove('wb-table-pagination');
            pagingCell.removeAttribute('colspan');
            Array.prototype.forEach.call(pagingCell.querySelectorAll('.wb-table-pagination__summary'), function(oldSummary) {
              oldSummary.parentNode.removeChild(oldSummary);
            });
          }
        }
      }
    });
  }

  function decorateOperationalStates(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.panel-body, .tab-pane.active, .wb-content-card'), function(region) {
      if (region.querySelector('form, table, input, select, textarea, button, a, img, canvas, svg, .wb-empty-state')) return;
      if ((region.textContent || '').replace(/\s+/g, ' ').trim()) return;
      region.classList.add('wb-empty-region');
      var state = emptyStateNode('region', messages.empty_title || messages.empty, messages.empty_description || '');
      state.setAttribute('role', 'status');
      region.appendChild(state);
    });
  }

  function normalizePageSizeControls(host) {
    if (!host || !window.heritageSelect) return;
    Array.prototype.forEach.call(host.querySelectorAll('select[name="search_limit"], select.search_limit, select.wb-page-size-select'), function(select) {
      window.heritageSelect.enhance(select, { compact: true, search: false });
    });
  }

  function normalizeResidualLegacyFragments(host) {
    if (!host) return;

    Array.prototype.forEach.call(host.querySelectorAll('.panel, .well, .content-box, .box, .pnl_formsarea, .tab-content, .tab-pane'), function(surface) {
      if (surface.closest('#topnav-container, #sidebar, #heritage-mobile-navigation')) return;
      surface.classList.add('wb-owned-surface');
      if (surface.matches('.tab-content, .tab-pane')) surface.classList.add('wb-owned-surface--tabs');
      if (surface.matches('.panel, .well, .content-box, .box, .pnl_formsarea')) surface.classList.add('wb-owned-surface--card');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.dropdown-menu, .popover, .modal-content, .ui-datepicker, .ui-dialog, .select2-drop, .chosen-drop'), function(overlay) {
      if (overlay.closest('#topnav-container, #sidebar, #heritage-mobile-navigation')) return;
      overlay.classList.add('wb-owned-overlay');
      if (overlay.matches('.select2-drop, .chosen-drop')) overlay.classList.add('wb-owned-enhanced-select__panel');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.input-group, .input-append, .input-prepend, .btn-group, .btn-toolbar'), function(cluster) {
      if (cluster.closest('#topnav-container, #sidebar, #heritage-mobile-navigation, .wb-header-actions')) return;
      cluster.classList.add('wb-owned-control-cluster');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.table-responsive, .table-wrapper'), function(region) {
      region.classList.add('wb-owned-scroll-region');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-container, .select2-container-multi, .chosen-container, .chosen-container-single, .chosen-container-multi'), function(container) {
      if (container.closest('#topnav-container, #sidebar, #heritage-mobile-navigation')) return;
      container.classList.add('wb-owned-enhanced-select');
      Array.prototype.forEach.call(container.querySelectorAll('.select2-choice, .select2-choices, .chosen-single, .chosen-choices'), function(control) {
        control.classList.add('wb-owned-enhanced-select__control');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-chosen, .select2-search-choice, .chosen-single span, .chosen-choices li.search-choice'), function(value) {
        value.classList.add('wb-owned-enhanced-select__value');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-arrow, .chosen-single div'), function(arrow) {
        arrow.classList.add('wb-owned-enhanced-select__arrow');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-search input, .chosen-search input, .chosen-choices li.search-field input'), function(input) {
        input.classList.add('wb-owned-enhanced-select__search');
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-results, .chosen-results'), function(list) {
      list.classList.add('wb-owned-enhanced-select__results');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-result-label, .select2-results li, .chosen-results li'), function(option) {
      option.classList.add('wb-owned-enhanced-select__option');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-highlighted, .chosen-results li.highlighted'), function(option) {
      option.classList.add('wb-owned-enhanced-select__option--active');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.help-block, .help-inline, .description, .hint, .text-muted, small, label, legend, .control-label'), function(textNode) {
      if (textNode.closest('#topnav-container, #sidebar, #heritage-mobile-navigation')) return;
      textNode.classList.add('wb-owned-readable-text');
    });

    Array.prototype.forEach.call(host.querySelectorAll('[style]'), function(node) {
      var style = node.getAttribute('style') || '';
      var scrubbed = scrubResidualInlineStyle(node, style);
      if (/(?:^|;)\s*(?:width|min-width|max-width)\s*:\s*(?:\d{3,}|1000|auto)/i.test(style)) {
        node.classList.add('wb-residual-inline-geometry');
      }
      if (/(?:^|;)\s*(?:color|background(?:-color)?)\s*:/i.test(style)) {
        node.classList.add('wb-residual-inline-colour');
      }
      if (/(?:^|;)\s*background(?:-color)?\s*:\s*(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(style)) {
        node.classList.add('wb-residual-bright-surface');
      }
      if (scrubbed) node.classList.add('wb-residual-inline-scrubbed');
    });

    Array.prototype.forEach.call(host.querySelectorAll('table.table, table.formtable'), function(table) {
      var wrapper = table.closest('.table-wrapper, .table-responsive, .wb-field-group--embedded-table');
      if (wrapper) return;
      var shell = document.createElement('div');
      shell.className = 'table-wrapper wb-table-wrapper--runtime';
      table.parentNode.insertBefore(shell, table);
      shell.appendChild(table);
    });

    Array.prototype.forEach.call(host.querySelectorAll('input[type="submit"], input[type="button"], button, a.btn, .btn'), function(control) {
      var label = (control.value || control.textContent || control.getAttribute('aria-label') || control.title || '').replace(/\s+/g, ' ').trim();
      if (label && !control.getAttribute('aria-label') && /^(?:\+|>|<|»|«|→|←)$/.test(label)) {
        control.setAttribute('aria-label', document.body.dataset.heritageGenericAction || localized('Aktion ausführen', 'Perform action'));
      }
      if (/^(?:reset filters|filter zurücksetzen|filter zur\u00fccksetzen)$/i.test(label)) control.classList.add('wb-control--filter-reset');
      if (/^(?:show filters|filter anzeigen|filter einblenden)$/i.test(label)) control.classList.add('wb-control--filter-toggle');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.pagination, .pager'), function(pagination) {
      pagination.classList.add('wb-pagination');
      var nav = pagination.closest('nav');
      if (nav && !nav.getAttribute('aria-label')) nav.setAttribute('aria-label', document.body.dataset.heritagePagination || localized('Seitennavigation', 'Pagination'));
    });
  }

  function scrubResidualInlineStyle(node, style) {
    if (!node || !style || node.dataset.heritagePreserveInlineStyle === 'true') return false;
    if (/^(?:canvas|svg|path|circle|rect|line|polyline|polygon|img|picture|source|video|meter|progress)$/i.test(node.tagName || '')) return false;
    if (node.closest('[data-heritage-preserve-style="true"], .wb-chart-card, .wb-sparkline, .wb-stat-visual, .wb-logo, #logo, .notification_text')) return false;
    if (node.closest('#topnav-container, #heritage-mobile-navigation, .wb-app-navigation, .wb-header-actions')) return false;

    var properties = [];
    var legacyPaint = /(?:^|;)\s*(?:color|background(?:-color)?|font(?:-family|-size)?|line-height)\s*:/i.test(style);
    var legacyGeometry = /(?:^|;)\s*(?:width|min-width|max-width)\s*:\s*(?:auto|100%|\d{3,}px|\d{2,}em|\d{3,})/i.test(style);
    if (legacyPaint) properties.push('color', 'background', 'background-color', 'font-family', 'font-size', 'line-height');
    if (legacyGeometry) properties.push('width', 'min-width', 'max-width');
    if (!properties.length) return false;

    node.dataset.heritageOriginalInlineStyle = node.dataset.heritageOriginalInlineStyle || style;
    properties.forEach(function(property) {
      try { node.style.removeProperty(property); } catch (error) {}
    });
    if (!node.getAttribute('style')) node.removeAttribute('style');
    return true;
  }

  function runEnhancementStep(label, callback) {
    try {
      callback();
    } catch (error) {
      if (window.console && console.warn) console.warn('Workbench enhancement skipped: ' + label, error);
      var api = runtime();
      if (api && api.reportError) api.reportError('Workbench enhancement skipped: ' + label);
    }
  }

  function enhanceLoadedContent(host, pageName, params, context) {
    if (!host) return;
    runEnhancementStep('localization', function() {
      if (typeof window.heritageLocalize === 'function') window.heritageLocalize(host);
    });
    runEnhancementStep('page context', function() { decoratePageContext(host, pageName); });
    runEnhancementStep('page chrome', function() { decoratePageChrome(host, pageName); });
    runEnhancementStep('information architecture', function() { decorateInformationArchitecture(host); });
    runEnhancementStep('legacy fragments before controls', function() { normalizeResidualLegacyFragments(host); });
    runEnhancementStep('table filters', function() { decorateTableFilters(host); });
    runEnhancementStep('page size controls', function() { normalizePageSizeControls(host); });
    runEnhancementStep('list command bar', function() { decorateListCommandBar(host); });
    runEnhancementStep('data tables', function() { decorateDataTables(host); });
    runEnhancementStep('forms', function() { decorateForms(host, context); });
    runEnhancementStep('action controls', function() { decorateActionControls(document); });
    runEnhancementStep('operational states', function() { decorateOperationalStates(host); });
    runEnhancementStep('legacy fragments after controls', function() { normalizeResidualLegacyFragments(host); });
    runEnhancementStep('icons', function() { if (window.heritageIcons) window.heritageIcons.render(host); });
    runEnhancementStep('navigation shell', function() {
      if (!window.heritageNavigation) return;
      window.heritageNavigation.syncShellLayout();
      window.heritageNavigation.render();
      if (window.heritageNavigation.syncActiveNavigationState) window.heritageNavigation.syncActiveNavigationState(pageName || '');
    });
    runEnhancementStep('dashboard layout', function() { if (window.heritageDashboardLayout) window.heritageDashboardLayout.enhance(); });
    runEnhancementStep('dashboard metrics', function() { if (window.heritageDashboardMetrics) window.heritageDashboardMetrics.enhance(host); });
    runEnhancementStep('statistics', function() { if (window.heritageStatistics) window.heritageStatistics.enhance(pageName); });
    runEnhancementStep('monitoring', function() { if (window.heritageMonitoring) window.heritageMonitoring.enhance(host); });
    if (params !== undefined) {
      runEnhancementStep('after content hooks', function() {
        var api = runtime();
        if (api && typeof api.onAfterContentLoad === 'function') api.onAfterContentLoad(pageName, params || null);
      });
    }
  }

  function schedulePostRenderEnhancement(host, pageName) {
    if (!host || host.dataset.heritagePostRenderScheduled === 'true') return;
    host.dataset.heritagePostRenderScheduled = 'true';
    var run = function() {
      host.dataset.heritagePostRenderScheduled = 'false';
      if (!document.contains(host)) return;
      enhanceLoadedContent(host, pageName);
      announceContentReady(host, pageName || '', { source: 'post-render' });
      announceNavigationComplete(pageName || '');
    };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function() { window.requestAnimationFrame(run); });
    } else {
      window.setTimeout(run, 50);
    }
  }

  function makeFormSummaryItem(label, value, modifier) {
    var item = document.createElement('span');
    item.className = 'wb-form-section-summary__item' + (modifier ? ' wb-form-section-summary__item--' + modifier : '');
    item.setAttribute('aria-label', label + ': ' + value);

    var count = document.createElement('strong');
    count.textContent = String(value);

    var caption = document.createElement('span');
    caption.textContent = label;

    item.appendChild(count);
    item.appendChild(caption);
    return item;
  }

  function summarizeFormSections(scope) {
    if (!scope) return;
    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
      var groups = Array.prototype.slice.call(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)'));
      if (!groups.length) return;

      var controls = Array.prototype.slice.call(section.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      var required = groups.filter(function(group) {
        return group.classList.contains('wb-field-group--required') ||
          !!group.querySelector('[required], [aria-required="true"], .required, .req, label.required');
      }).length;
      var invalid = groups.filter(function(group) {
        return group.classList.contains('has-error') ||
          group.getAttribute('aria-invalid') === 'true' ||
          !!group.querySelector('[aria-invalid="true"], .has-error, .text-danger, .alert-danger, .error, .invalid-feedback');
      }).length;
      var disabled = controls.filter(function(control) {
        return control.disabled || (control.readOnly && control.type !== 'password');
      }).length;

      section.setAttribute('data-heritage-section-fields', String(groups.length));
      section.setAttribute('data-heritage-section-required', String(required));
      section.setAttribute('data-heritage-section-invalid', String(invalid));
      section.setAttribute('data-heritage-section-locked', String(disabled));
      section.classList.toggle('wb-form-section--has-errors', invalid > 0);
      section.classList.toggle('wb-form-section--has-required', required > 0);

      var summary = section.querySelector(':scope > .wb-form-section-summary');
      if (!summary) {
        summary = document.createElement('div');
        summary.className = 'wb-form-section-summary';
        summary.setAttribute('aria-label', document.body.dataset.heritageFormSectionSummary || localized('Zusammenfassung des Formularabschnitts', 'Form section summary'));
        var heading = section.querySelector(':scope > .wb-form-section-heading, :scope > legend, :scope > .fieldset-legend');
        if (heading && heading.parentNode === section) {
          if (heading.nextSibling) section.insertBefore(summary, heading.nextSibling);
          else section.appendChild(summary);
        } else {
          section.insertBefore(summary, section.firstChild);
        }
      }

      while (summary.firstChild) summary.removeChild(summary.firstChild);
      if (required > 0) summary.appendChild(makeFormSummaryItem('Pflicht', required, 'required'));
      if (invalid > 0) summary.appendChild(makeFormSummaryItem('Prüfen', invalid, 'invalid'));
      if (disabled > 0) summary.appendChild(makeFormSummaryItem('Gesperrt', disabled, 'locked'));
      summary.hidden = !summary.childElementCount;
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-panel'), function(panel) {
      var count = panel.getAttribute('data-heritage-panel-fields') || '0';
      var invalid = panel.querySelectorAll('.has-error, [aria-invalid="true"], .text-danger, .alert-danger, .error').length;
      var trigger = panel.querySelector('.wb-form-panel-trigger');
      panel.classList.toggle('wb-form-panel--has-errors', invalid > 0);
      panel.setAttribute('data-heritage-panel-invalid', String(invalid));
      if (trigger) {
        trigger.setAttribute('data-heritage-panel-fields', count);
        trigger.setAttribute('data-heritage-panel-invalid', String(invalid));
        trigger.classList.toggle('wb-form-panel-trigger--has-errors', invalid > 0);
      }
    });
  }

  function stableFormId(prefix, index) {
    return prefix + '-' + String(index).replace(/[^a-z0-9_-]/gi, '-');
  }

  function labelText(label) {
    return label ? (label.textContent || '').replace(/\s+/g, ' ').replace(/\s*:\s*$/, '').trim() : '';
  }

  function hasRequiredCue(group, label, controls) {
    if (label && (label.classList.contains('required') || /\*/.test(label.textContent || ''))) return true;
    if (group.querySelector('.required, .req, [data-required="true"]')) return true;
    return controls.some(function(control) {
      return control.required || control.getAttribute('aria-required') === 'true';
    });
  }

  function classifyFieldGroup(group, label, controls) {
    var kinds = [];
    controls.forEach(function(control) {
      var tag = control.tagName.toLowerCase();
      var type = (control.getAttribute('type') || tag).toLowerCase();
      var controlName = String(control.getAttribute('name') || '').toLowerCase();
      var controlId = String(control.id || '').toLowerCase();
      var controlValue = String(control.getAttribute('value') || '').toLowerCase();
      kinds.push(type);
      control.classList.add('wb-field-control');
      control.setAttribute('data-heritage-control-kind', type);
      if (label && control.id && !label.getAttribute('for')) label.setAttribute('for', control.id);
      if (control.disabled) group.classList.add('wb-field-group--disabled');
      if (control.readOnly) group.classList.add('wb-field-group--readonly');
      if (type === 'checkbox' || type === 'radio') group.classList.add('wb-field-group--choice');
      if (type === 'password') group.classList.add('wb-field-group--secret');
      if (type === 'file') group.classList.add('wb-field-group--file');
      if (type === 'color') group.classList.add('wb-field-group--color');
      if (type === 'number') group.classList.add('wb-field-group--number');
      if (tag === 'select') group.classList.add('wb-field-group--select');
      if (tag === 'textarea') group.classList.add('wb-field-group--textarea');
      if (/^smtp_(user|pass)$/.test(controlName) || /^smtp_(user|pass)$/.test(controlId)) group.classList.add('wb-field-group--mail-credential');
      if (/^limit_/.test(controlName) || /^limit_/.test(controlId)) group.classList.add('wb-field-group--limit-value');
      if (/(_path|_dir|config_dir|conf_dir|root_dir|log_dir|vhost_conf_dir)$/.test(controlName) || /(_path|_dir|config_dir|conf_dir|root_dir|log_dir|vhost_conf_dir)$/.test(controlId) || (type === 'text' && controlValue.indexOf('/') !== -1)) group.classList.add('wb-field-group--path-value');
      if (/(ssl|cert|csr|key|ca_bundle|private_key)/.test(controlName) || /(ssl|cert|csr|key|ca_bundle|private_key)/.test(controlId)) group.classList.add('wb-field-group--certificate');
      if (tag === 'textarea' && /(config|directive|snippet|conf|custom|template)/.test(controlName + ' ' + controlId)) group.classList.add('wb-field-group--technical-text');
      if (control.matches('[readonly], [disabled]')) control.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
    });
    if (group.querySelector('.select2-container, .select2-container-multi')) group.classList.add('wb-field-group--enhanced-select');
    if (controls.length === 1 && kinds[0] === 'checkbox') {
      group.classList.add('wb-field-group--boolean');
      controls[0].setAttribute('role', 'switch');
      controls[0].setAttribute('aria-checked', controls[0].checked ? 'true' : 'false');
      if (!controls[0].getAttribute('data-heritage-boolean-bound')) {
        controls[0].setAttribute('data-heritage-boolean-bound', 'true');
        controls[0].addEventListener('change', function() {
          controls[0].setAttribute('aria-checked', controls[0].checked ? 'true' : 'false');
        });
      }
    }
    if (group.querySelector('.input-group, .input-append, .input-prepend')) group.classList.add('wb-field-group--compound');
    if (group.querySelector('button, .btn, input[type="button"], input[type="submit"]')) group.classList.add('wb-field-group--with-action');
        if (group.classList.contains('has-error') || group.querySelector('[aria-invalid="true"], .text-danger, .invalid-feedback, .confirmpassworderror')) group.classList.add('wb-field-group--invalid');
        if (group.classList.contains('has-warning') || group.querySelector('.text-warning, .alert-warning')) group.classList.add('wb-field-group--warning');
        if (group.classList.contains('has-success') || group.querySelector('.text-success, .confirmpasswordok')) group.classList.add('wb-field-group--success');
        if (group.querySelector('.alert, .alert-info, .alert-warning, .alert-danger, .alert-success, .box_error, .box_warning, .box_success')) group.classList.add('wb-field-group--notice');
        if (group.querySelector('.help-block, .help-inline, .description, .hint, small, .form-text')) group.classList.add('wb-field-group--with-help');
        if (group.querySelector('.form-control-static, output, code, pre')) group.classList.add('wb-field-group--static-value');
        if (group.querySelector('table, .table-wrapper, .table-responsive')) group.classList.add('wb-field-group--embedded-table');
    if (kinds.length) group.setAttribute('data-heritage-field-kinds', kinds.join(' '));
  }

  function inferSectionTitle(section, scope) {
    var heading = section.querySelector(':scope > legend, :scope > .fieldset-legend, :scope > .panel-heading, :scope > h2, :scope > h3, :scope > h4');
    if (heading && heading.textContent.trim()) return heading.textContent.replace(/\s+/g, ' ').trim();
    if (section.id && scope) {
      var tab = scope.querySelector('.content-tab-wrapper > .wb-form-tabs a[href="#' + section.id.replace(/"/g, '\\"') + '"]');
      if (tab && tab.textContent.trim()) return tab.textContent.replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  function finalizeFormSections(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
      var groups = Array.prototype.slice.call(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)'));
      var controls = section.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
      var notices = section.querySelectorAll('.alert, .box_error, .box_warning, .box_success, .wb-field-group--notice').length;
      var title = inferSectionTitle(section, scope);
      section.classList.toggle('wb-form-section--empty', groups.length === 0 && controls === 0);
      section.classList.toggle('wb-form-section--compact', groups.length > 0 && groups.length <= 3);
      section.classList.toggle('wb-form-section--large', groups.length > 12);
      section.classList.toggle('wb-form-section--notice-heavy', notices > 0);
      section.setAttribute('data-heritage-section-controls', String(controls));
      section.setAttribute('data-heritage-section-notices', String(notices));
      if (title) section.setAttribute('data-heritage-section-title', title);
    });
  }

  function wireFormHelp(group, controls, formIndex, groupIndex) {
    var helps = Array.prototype.slice.call(group.querySelectorAll('.help-block, .form-text, .formHint, .hint, .description, small'));
    helps.forEach(function(help, helpIndex) {
      help.classList.add('wb-field-help');
      if (!help.id) help.id = stableFormId('wb-field-help-' + formIndex + '-' + groupIndex, helpIndex + 1);
    });
    if (!helps.length || controls.length !== 1) return;
    var ids = helps.map(function(help) { return help.id; }).filter(Boolean).join(' ');
    if (ids && !controls[0].getAttribute('aria-describedby')) controls[0].setAttribute('aria-describedby', ids);
  }

  function decorateFormActions(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.right, .form-actions, .buttonHolder'), function(actions) {
      if (!actions.querySelector('.btn, button, input[type="button"], input[type="submit"]')) return;
      actions.classList.add('wb-form-actions');
      actions.setAttribute('role', 'group');
      actions.setAttribute('aria-label', document.body.dataset.heritageFormActions || localized('Formularaktionen', 'Form actions'));
      var hasDangerAction = false;
      Array.prototype.forEach.call(actions.querySelectorAll('.btn, button, input[type="button"], input[type="submit"], a.formbutton-success, a.formbutton-default, a.formbutton-danger'), function(action) {
        var tone = 'secondary';
        var actionText = (action.textContent || action.value || action.getAttribute('title') || '').toLowerCase();
        if (action.classList.contains('formbutton-danger') || action.classList.contains('btn-danger') || /delete|remove|löschen|loeschen|storno|cancel invoice/.test(actionText)) tone = 'danger';
        else if (action.classList.contains('formbutton-success') || action.classList.contains('btn-success') || action.classList.contains('btn-primary') || /save|speichern|create|erstellen|hinzufügen|hinzufuegen|import|upload/.test(actionText)) tone = 'primary';
        if (tone === 'danger') hasDangerAction = true;
        action.classList.add('wb-form-action', 'wb-form-action--' + tone);
        action.setAttribute('data-heritage-form-action-tone', tone);
      });
      actions.classList.toggle('wb-form-actions--has-danger', hasDangerAction);
    });
  }

  function actionControlText(control) {
    return (control.textContent || control.value || control.getAttribute('aria-label') || control.getAttribute('title') || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function inferActionControlTone(control) {
    var explicitTone = String(control.getAttribute('data-heritage-action-tone') || '').toLowerCase();
    if (['primary', 'secondary', 'danger', 'warning', 'info'].indexOf(explicitTone) !== -1) return explicitTone;
    if (control.classList.contains('wb-dns-zone-actions__secondary')) return 'secondary';
    var textValue = actionControlText(control);
    var href = String(control.getAttribute('href') || control.getAttribute('data-capp') || control.getAttribute('data-form-action') || '').toLowerCase();
    var className = String(control.className || '').toLowerCase();
    var signal = [textValue, href, className].join(' ');
    if (
      control.classList.contains('wb-row-action--danger') ||
      control.classList.contains('wb-form-action--danger') ||
      control.classList.contains('formbutton-danger') ||
      control.classList.contains('btn-danger') ||
      control.hasAttribute('data-confirm-action') ||
      /delete|remove|drop|purge|destroy|disable|löschen|loeschen|entfernen|storno|gutschrift|cancel invoice|abbrechen rechnung/.test(signal)
    ) return 'danger';
    if (
      control.classList.contains('btn-warning') ||
      /warning|warnung|reset|zurücksetzen|zuruecksetzen|restart|reload|erneut/.test(signal)
    ) return 'warning';
    if (
      control.classList.contains('btn-info') ||
      /info|details|anzeigen|show|preview|vorschau|prüfen|pruefen|testen/.test(signal)
    ) return 'info';
    if (
      control.classList.contains('wb-row-action--primary') ||
      control.classList.contains('wb-form-action--primary') ||
      control.classList.contains('formbutton-success') ||
      control.classList.contains('btn-success') ||
      control.classList.contains('btn-primary') ||
      control.hasAttribute('data-submit-form') ||
      control.hasAttribute('data-form-upload') ||
      /save|speichern|create|erstellen|hinzufügen|hinzufuegen|add|neu|new|import|upload|start|connect|verbinden|login|anmelden|apply|anwenden|generate|erzeugen/.test(signal)
    ) return 'primary';
    return 'secondary';
  }

  function decorateActionControls(host) {
    if (!host) return;
    var controls = host.querySelectorAll('#pageContent .btn, #pageContent button:not(.close):not(.wb-dialog__backdrop), #pageContent input[type="button"], #pageContent input[type="submit"], #pageContent a.formbutton-success, #pageContent a.formbutton-default, #pageContent a.formbutton-danger');
    Array.prototype.forEach.call(controls, function(control) {
      if (control.closest('.select2-container, .chosen-container, .mce-container, .mce-tinymce')) return;
      var tone = inferActionControlTone(control);
      var visibleText = actionControlText(control);
      var iconOnly = control.classList.contains('formbutton-narrow') ||
        control.classList.contains('btn-icon') ||
        control.classList.contains('wb-icon-button') ||
        (!visibleText && Boolean(control.querySelector('span, i, svg, img')));
      control.classList.add('wb-action-control', 'wb-action-control--' + tone);
      control.setAttribute('data-heritage-action-tone', tone);
      control.classList.toggle('wb-action-control--icon', iconOnly);
      if (!control.getAttribute('aria-label') && !visibleText) {
        control.setAttribute('aria-label', control.getAttribute('title') || document.body.dataset.heritageTableActions || localized('Aktion', 'Action'));
      }
    });
  }

  function finalizeFormControls(scope) {
    if (!scope) return;
    scope.dataset.heritageFormFinalized = 'true';

    Array.prototype.forEach.call(scope.querySelectorAll('.input-group, .input-append, .input-prepend'), function(deck) {
      deck.classList.add('wb-form-control-deck');
      Array.prototype.forEach.call(deck.querySelectorAll('.input-group-addon, .add-on, .input-group-btn, .btn, button, input[type="button"], input[type="submit"]'), function(part) {
        part.classList.add('wb-form-control-deck__item');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--file'), function(group) {
      var body = group.querySelector('.wb-field-body') || group;
      body.classList.add('wb-upload-dropzone');
      Array.prototype.forEach.call(group.querySelectorAll('input[type="file"]'), function(input) {
        input.classList.add('wb-upload-dropzone__input');
        input.setAttribute('data-heritage-file-ready', 'true');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--color'), function(group) {
      var body = group.querySelector('.wb-field-body') || group;
      body.classList.add('wb-color-control-deck');
      Array.prototype.forEach.call(group.querySelectorAll('input[type="color"]'), function(input) {
        input.classList.add('wb-color-control-deck__swatch');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--technical-text textarea, textarea[name*="config"], textarea[id*="config"], textarea[name*="directive"], textarea[id*="directive"], textarea[name*="snippet"], textarea[id*="snippet"], textarea[name*="template"], textarea[id*="template"]'), function(textarea) {
      textarea.classList.add('wb-code-input');
      textarea.setAttribute('spellcheck', 'false');
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-actions .btn, .wb-form-actions button, .wb-form-actions input[type="button"], .wb-form-actions input[type="submit"], .wb-form-actions a.formbutton-success, .wb-form-actions a.formbutton-default, .wb-form-actions a.formbutton-danger'), function(action) {
      var tone = action.getAttribute('data-heritage-form-action-tone') || 'secondary';
      action.classList.add('wb-form-action-control', 'wb-form-action-control--' + tone);
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group'), function(group) {
      var body = group.querySelector('.wb-field-body');
      if (!body) return;
      if (group.classList.contains('wb-field-group--compound')) body.classList.add('wb-field-body--compound');
      if (group.classList.contains('wb-field-group--select')) body.classList.add('wb-field-body--select');
      if (group.classList.contains('wb-field-group--textarea')) body.classList.add('wb-field-body--textarea');
      if (group.classList.contains('wb-field-group--secret')) body.classList.add('wb-field-body--secret');
      if (group.classList.contains('wb-field-group--readonly') || group.classList.contains('wb-field-group--disabled')) body.classList.add('wb-field-body--locked');
    });

    var strengthBar = scope.querySelector('#passBar');
    var strengthInput = scope.querySelector('[data-heritage-password-strength="true"]');
    if (strengthBar && strengthInput) {
      var strengthGroup = strengthBar.closest('.wb-field-group');
      var strengthText = scope.querySelector('#passText');
      var syncStrengthVisibility = function() {
        var hasPassword = String(strengthInput.value || '').length > 0;
        if (strengthGroup) {
          strengthGroup.hidden = !hasPassword;
          strengthGroup.classList.add('wb-field-group--password-strength');
        }
        strengthBar.setAttribute('role', 'progressbar');
        strengthBar.setAttribute('aria-valuemin', '0');
        strengthBar.setAttribute('aria-valuemax', '100');
        if (strengthText) strengthText.setAttribute('aria-live', 'polite');
      };
      if (!strengthInput.getAttribute('data-heritage-strength-visibility-bound')) {
        strengthInput.setAttribute('data-heritage-strength-visibility-bound', 'true');
        strengthInput.addEventListener('input', syncStrengthVisibility);
        strengthInput.addEventListener('change', syncStrengthVisibility);
      }
      syncStrengthVisibility();
    }
  }

  function decorateForms(host, context) {
    if (!host) return;
    var forms = Array.prototype.slice.call(host.querySelectorAll('form#pageForm, form.form-horizontal'));
    var shellForm = host.closest('form#pageForm, form.form-horizontal');
    if (shellForm && forms.indexOf(shellForm) === -1) forms.push(shellForm);
    forms.forEach(function(form) {
      form.classList.add('wb-modern-form');
      var fieldCount = 0;
      var scope = form === shellForm ? host : form;
      Array.prototype.forEach.call(scope.querySelectorAll('.tab-pane, fieldset, .pnl_formsarea'), function(section, sectionIndex) {
        section.classList.add('wb-form-section');
        section.setAttribute('data-heritage-section-index', String(sectionIndex + 1));
        if (section.tagName === 'FIELDSET') section.classList.add('wb-form-fieldset');
        var legend = section.querySelector(':scope > legend, :scope > .fieldset-legend');
        if (legend) legend.classList.add('wb-form-section-heading');
      });
      // also decorate native .wb-field-group templates (Bootstrap-free forms),
      // not only legacy Bootstrap .form-group. Static NodeList + idempotent add =>
      // no double processing; legacy .form-group templates behave exactly as before.
      Array.prototype.forEach.call(scope.querySelectorAll('.form-group, .wb-field-group'), function(group, groupIndex) {
        group.classList.add('wb-field-group');
        var label = group.querySelector(':scope > label, :scope > .control-label');
        var controls = Array.prototype.slice.call(group.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        if (label) {
          label.classList.add('wb-field-label');
          var readableLabel = labelText(label);
          if (readableLabel) group.setAttribute('data-heritage-field-label', readableLabel);
        }
        if (!label) group.classList.add('wb-field-group--unlabelled');
        if (!controls.length) group.classList.add('wb-field-group--content');
        if (!controls.length && !group.textContent.trim() && !group.querySelector('button, a, [role], [id]:not(input)')) {
          group.classList.add('wb-field-group--empty');
          group.setAttribute('aria-hidden', 'true');
        }
        if (controls.length === 1) group.classList.add('wb-field-group--single');
        if (hasRequiredCue(group, label, controls)) group.classList.add('wb-field-group--required');
        classifyFieldGroup(group, label, controls);
        var fieldBodies = [];
        Array.prototype.forEach.call(group.children, function(child) {
          if (child === label) return;
          if (child.matches('[class*="col-"], .controls, .input-group, .input-append, .input-prepend, .checkbox, .radio, .select2-container, .select2-container-multi')) {
            child.classList.add('wb-field-body');
            fieldBodies.push(child);
          }
        });
        if (!fieldBodies.length && controls.length) {
          controls.forEach(function(control) {
            var parent = control.parentElement;
            if (parent && parent !== group && parent.parentElement === group) {
              parent.classList.add('wb-field-body');
              if (fieldBodies.indexOf(parent) === -1) fieldBodies.push(parent);
            }
          });
        }
        if (fieldBodies.length > 1) group.classList.add('wb-field-group--multi-body');
        fieldBodies.forEach(function(body, bodyIndex) {
          body.setAttribute('data-heritage-field-body-index', String(bodyIndex + 1));
          if (!body.querySelector('input:not([type="hidden"]), select, textarea, button, a') && body.textContent.trim()) {
            body.classList.add('wb-field-affix');
            group.classList.add('wb-field-group--with-affix');
          }
        });
        Array.prototype.forEach.call(controls, function(control) {
          fieldCount += 1;
          if (group.classList.contains('wb-field-group--required')) control.setAttribute('aria-required', 'true');
        });
        wireFormHelp(group, controls, forms.indexOf(form) + 1, groupIndex + 1);
      });
      form.setAttribute('data-heritage-field-count', String(fieldCount));
      form.classList.toggle('wb-modern-form--dense', fieldCount > 12);
      form.classList.toggle('wb-modern-form--long', fieldCount > 20);
      form.classList.toggle('wb-modern-form--huge', fieldCount > 38);
      var tabCount = scope.querySelectorAll('.content-tab-wrapper > .wb-form-tabs > li').length;
      form.classList.toggle('wb-modern-form--tabbed', tabCount > 1);
      form.setAttribute('data-heritage-tab-count', String(tabCount));
      form.classList.toggle('wb-modern-form--has-upload', !!scope.querySelector('.wb-field-group--file'));
      form.classList.toggle('wb-modern-form--has-secrets', !!scope.querySelector('.wb-field-group--secret'));
      form.classList.toggle('wb-modern-form--has-choices', !!scope.querySelector('.wb-field-group--choice'));
      Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
        section.setAttribute('data-heritage-section-fields', String(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)').length));
      });
      finalizeFormSections(scope);
      Array.prototype.forEach.call(scope.querySelectorAll('.panel-group, .wb-limit-sections, .wb-form-sections'), function(accordion) {
        accordion.classList.add('wb-form-accordion');
        Array.prototype.forEach.call(accordion.querySelectorAll(':scope > .panel, :scope > .wb-limit-section, :scope > .wb-form-section'), function(panel) {
          panel.classList.add('wb-form-panel');
          var body = panel.querySelector('.panel-body, .panel-collapse, .wb-limit-section__content, .wb-limit-section__body, .wb-form-section__content, .wb-form-section__body');
          var heading = panel.querySelector(':scope > .panel-heading, :scope > .wb-limit-section__header, :scope > .wb-form-section__header');
          var trigger = heading && heading.querySelector('a[href^="#"], button[data-target]');
          var count = body ? body.querySelectorAll('.form-group').length : 0;
          panel.setAttribute('data-heritage-panel-fields', String(count));
          if (heading) heading.classList.add('wb-form-panel-heading');
          if (trigger) {
            trigger.classList.add('wb-form-panel-trigger');
            var target = trigger.getAttribute('href') || trigger.getAttribute('data-target') || '';
            if (target.charAt(0) === '#') trigger.setAttribute('aria-controls', target.slice(1));
            trigger.setAttribute('aria-expanded', trigger.classList.contains('collapsed') ? 'false' : 'true');
            if (!trigger.querySelector('.wb-form-panel-count')) {
              var counter = document.createElement('span');
              counter.className = 'wb-form-panel-count';
              counter.textContent = String(count);
              counter.setAttribute('aria-hidden', 'true');
              trigger.appendChild(counter);
            }
          }
        });
        if (accordion.dataset.heritageAccordionState !== 'true') {
          accordion.dataset.heritageAccordionState = 'true';
          var synchronizeAccordionState = function(event) {
            var targetId = event.target && event.target.id;
            if (!targetId) return;
            Array.prototype.forEach.call(accordion.querySelectorAll('.wb-form-panel-trigger'), function(trigger) {
              var target = trigger.getAttribute('href') || trigger.getAttribute('data-target') || '';
              if (target === '#' + targetId) trigger.setAttribute('aria-expanded', event.type === 'heritage:collapse-open' ? 'true' : 'false');
            });
          };
          accordion.addEventListener('heritage:collapse-open', synchronizeAccordionState);
          accordion.addEventListener('heritage:collapse-close', synchronizeAccordionState);
        }
      });
      summarizeFormSections(scope);
      decorateFormActions(scope);
      finalizeFormControls(scope);

      function updateConditionalRows() {
        Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--unlabelled.wb-field-group--content'), function(group) {
          var conditionalNodes = Array.prototype.slice.call(group.querySelectorAll('[style*="display"], [hidden]'));
          if (!conditionalNodes.length) return;
          var visible = conditionalNodes.some(function(node) {
            if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
            var style = window.getComputedStyle ? window.getComputedStyle(node) : node.style;
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          group.classList.toggle('wb-field-group--dormant', !visible);
          group.setAttribute('aria-hidden', visible ? 'false' : 'true');
        });
      }
      updateConditionalRows();
      if (form._heritageConditionalObserver) form._heritageConditionalObserver.disconnect();
      if (window.MutationObserver) {
        form._heritageConditionalObserver = new MutationObserver(updateConditionalRows);
        form._heritageConditionalObserver.observe(scope, { subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'aria-hidden'] });
      }
    });
    if (window.heritageAccessibility) window.heritageAccessibility.enhance(host);
    if (window.heritageValidation) window.heritageValidation.enhance(host, {
      focus: Boolean(context && context.focus === true)
    });
    if (window.heritageFormState) window.heritageFormState.enhance();
    if (window.heritageFeedback) window.heritageFeedback.enhance(host);
    if (window.heritageMessageAcknowledgement) window.heritageMessageAcknowledgement.enhance(host);
  }

  document.addEventListener('click', function(event) {
    var trigger = event.target.closest('#main-navigation a[data-heritage-module], #heritage-mobile-navigation a[data-heritage-module], #main-navigation a[data-capp], #heritage-mobile-navigation a[data-capp]');
    if (!trigger) return;
    var moduleName = moduleAttribute(trigger);
    if (!moduleName) return;
    var api = runtime();
    if (api) api.heritageActiveModule = moduleName;
    document.querySelectorAll('#main-navigation a[aria-current="page"]').forEach(function(link) { link.removeAttribute('aria-current'); });
    document.querySelectorAll('#main-navigation a[data-heritage-module], #main-navigation a[data-capp]').forEach(function(link) {
      if (moduleAttribute(link) === moduleName) link.setAttribute('aria-current', 'page');
    });
  });

  function errorDiagnostic(error, pageName) {
    var parts = [];
    if (pageName) parts.push('page=' + pageName);
    if (error && error.name) parts.push('name=' + error.name);
    if (error && error.status !== undefined) parts.push('status=' + error.status);
    if (error && error.message) parts.push('message=' + error.message);
    if (error && error.url) parts.push('url=' + error.url);
    return parts.join(' | ');
  }

  function contentStateNode(kind, token, diagnostic, retryArgs) {
    var state;
    if (kind === 'loading') {
      state = element('div', 'wb-content-state wb-content-state--loading');
      state.setAttribute('role', 'status');
      state.appendChild(iconElement('wb-content-state__spinner'));
      state.appendChild(element('strong', 'wb-content-state__title', messages.loading));
      state.appendChild(element('span', 'wb-content-state__description', messages.loading_description || ''));
      var skeleton = iconElement('wb-content-state__skeleton');
      skeleton.appendChild(document.createElement('i'));
      skeleton.appendChild(document.createElement('i'));
      skeleton.appendChild(document.createElement('i'));
      state.appendChild(skeleton);
      return state;
    }
    if (kind === 'empty') {
      state = element('div', 'wb-content-state wb-content-state--empty');
      state.setAttribute('role', 'status');
      state.appendChild(iconElement('wb-content-state__icon'));
      state.appendChild(element('strong', 'wb-content-state__title', messages.empty_title || messages.empty));
      state.appendChild(element('span', 'wb-content-state__description', messages.empty_description || ''));
      return state;
    }
    state = element('div', 'wb-content-state wb-content-state--error');
    state.setAttribute('role', 'alert');
    state.appendChild(iconElement('wb-content-state__icon', '!'));
    state.appendChild(element('strong', 'wb-content-state__title', messages.error));
    state.appendChild(element('span', 'wb-content-state__description', messages.error_description || ''));
    var detail = element('span', 'wb-visually-hidden', diagnostic || '');
    detail.setAttribute('data-heritage-error-detail', 'true');
    state.appendChild(detail);
    if (token) {
      var retry = element('button', 'wb-content-state__retry', messages.retry);
      retry.type = 'button';
      retry.setAttribute('data-heritage-retry', token);
      retry.setAttribute('data-heritage-retry-owner', '94');
      retry.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        retryContentRequest(token, retryArgs);
      });
      state.appendChild(retry);
    }
    return state;
  }

  function retryContentRequest(token, explicitArgs) {
    var args = explicitArgs || retryRequests[token];
    delete retryRequests[token];
    // Retry the content-state facade itself. The runtime app's compatibility
    // loadContent method delegates to navigateTo and would bypass the retry
    // token lifecycle installed below.
    if (legacy && typeof legacy.loadContent === 'function' && args) {
      legacy.loadContent.apply(legacy, args);
    }
  }

  function renderContentState(host, kind, token, diagnostic, retryArgs) {
    if (!host) return;
    clearNode(host);
    host.appendChild(contentStateNode(kind, token, diagnostic, retryArgs));
  }

  function clearScheduledContentState() {
    if (contentStateTimer === null) return;
    window.clearTimeout(contentStateTimer);
    contentStateTimer = null;
  }

  function scheduleLoadingContentState(host, token) {
    clearScheduledContentState();
    contentStateTimer = window.setTimeout(function() {
      contentStateTimer = null;
      if (token !== sequence || !host || host.getAttribute('aria-busy') !== 'true') return;
      renderContentState(host, 'loading');
    }, contentStateDelay);
  }

  function activateFragmentScripts(host) {
    if (!host || !host.querySelectorAll) return 0;
    var activated = 0;
    Array.prototype.slice.call(host.querySelectorAll('script')).forEach(function(original) {
      var source = original.getAttribute('src');
      if (source) {
        var resolved;
        try { resolved = new URL(source, document.baseURI); } catch (error) { resolved = null; }
        if (!resolved || resolved.origin !== window.location.origin) {
          original.remove();
          return;
        }
      }
      var replacement = document.createElement('script');
      Array.prototype.forEach.call(original.attributes, function(attribute) {
        replacement.setAttribute(attribute.name, attribute.value);
      });
      if (source) replacement.async = false;
      else replacement.textContent = original.textContent || '';
      original.parentNode.replaceChild(replacement, original);
      activated += 1;
    });
    return activated;
  }

  legacy.activateFragmentScripts = activateFragmentScripts;

  legacy.loadContent = function(pagename) {
    var api = runtime();
    var args = arguments;
    var token = ++sequence;
    var host = document.getElementById('pageContent');
    var params = arguments[1];
    retryRequests[token] = Array.prototype.slice.call(args);
    if (!api || !host) return null;

    clearScheduledContentState();
    if (contentRequest && contentRequest.readyState !== 4) contentRequest.abort();
    if (window.heritageMonitoring) window.heritageMonitoring.destroy(host);
    host.setAttribute('aria-busy', 'true');
    scheduleLoadingContentState(host, token);
    var request = requestHtml(pagename, params || null, 30000);
    contentRequest = request;
    request.promise.then(function(response) {
        if (token !== sequence || request.aborted) return;
        clearScheduledContentState();
        if (response.indexOf('HEADER_REDIRECT:') > -1) {
          delete retryRequests[token];
          api.navigateTo(response.split(':')[1]);
          return;
        }
        if (response.indexOf('URL_REDIRECT:') > -1) {
          delete retryRequests[token];
          document.location.href = response.substr(response.indexOf('URL_REDIRECT:') + 'URL_REDIRECT:'.length);
          return;
        }
        host.setAttribute('aria-busy', 'false');
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        var loadedModule = moduleFromPageName(pagename);
        if (loadedModule) {
          api.heritageActiveModule = loadedModule;
          syncPrimaryModule(document.querySelector('#topnav-container'), loadedModule);
          syncPrimaryModule(document.querySelector('#heritage-mobile-navigation'), loadedModule);
        }
        enhanceLoadedContent(host, pagename, params || null);
        announceContentReady(host, pagename, { source: 'navigation', params: params || null });
        schedulePostRenderEnhancement(host, pagename);
        api.pageFormChanged = false;
        clearTimeout(api.dataLogTimer);
        api.dataLogNotification();
        delete retryRequests[token];
        if (!host.textContent.trim()) renderContentState(host, 'empty');
        announceNavigationComplete(pagename);
      }).catch(function(error) {
        if (isSupersededRequest(request, error) || token !== sequence) {
          if (token === sequence) {
            clearScheduledContentState();
            host.setAttribute('aria-busy', 'false');
          }
          delete retryRequests[token];
          return;
        }
        clearScheduledContentState();
        host.setAttribute('aria-busy', 'false');
        renderContentState(host, 'error', token, errorDiagnostic(error, pagename), Array.prototype.slice.call(args));
        api.reportError('Navigation request was not successful.');
        announceNavigationComplete(pagename, error);
      });
    return request;
  };

  // Confirmed links include historical GET actions. Their backend contract is
  // unchanged, but the accepted request uses the bounded native controller.
  legacy.confirm_action = function(link, confirmation) {
    var api = runtime();
    if (!api) return false;
    if (!window.confirm(confirmation)) return false;
    document.body.classList.add('wb-confirmed-action-active');
    var request = legacy.loadContent(link);
    if (request && request.promise) request.promise.finally(function() {
      document.body.classList.remove('wb-confirmed-action-active');
    });
    return request;
  };

  var menuSequence = 0;
  var menuRequests = [];
  var menuCache = { top: null, side: Object.create(null) };

  function resolvedMenuRequest(response) {
    return { readyState: 4, aborted: false, abort: function() {}, promise: Promise.resolve(response) };
  }

  function syncPrimaryModule(host, moduleName) {
    if (!host || !moduleName) return;
    host.querySelectorAll('.active, [aria-current="page"]').forEach(function(node) {
      node.classList.remove('active');
      node.removeAttribute('aria-current');
    });
    host.querySelectorAll('[data-heritage-module], [data-capp]').forEach(function(link) {
      var active = moduleAttribute(link) === String(moduleName);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      var item = link.closest('li');
      if (item) item.classList.toggle('active', active);
    });
  }

  function loadMenu(target, data, afterLoad, token, cacheKey, activeModule) {
    var host = document.querySelector(target);
    if (!host) return resolvedMenuRequest('');
    host.setAttribute('aria-busy', 'true');
    var cached = cacheKey === 'top' ? menuCache.top : menuCache.side[cacheKey];
    var request = typeof cached === 'string' ? resolvedMenuRequest(cached) : requestHtml('nav.php', data, 30000);
    request.promise = request.promise.then(function(response) {
        if (token !== menuSequence) return;
        // regression fix: `var api` was declared below but referenced
        // here first; hoisting made it undefined, so every menu response threw
        // "fragment renderer is not available" and the nav silently failed.
        var api = runtime();
        if (cacheKey === 'top') menuCache.top = response;
        else if (cacheKey) menuCache.side[cacheKey] = response;
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        if (cacheKey === 'top') syncPrimaryModule(host, activeModule);
        decorateNavigation(host);
        if (window.heritageIcons) window.heritageIcons.render(host);
        afterLoad();
        if (api && typeof api.loadPushyMenu === 'function') api.loadPushyMenu();
        if (window.heritageIcons) window.heritageIcons.render(document.querySelector('#heritage-mobile-navigation'));
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError') && token === menuSequence) {
          var api = runtime();
          if (api) api.reportError('Navigation menu request was not successful.');
        }
      }).then(function() {
        if (token === menuSequence) host.setAttribute('aria-busy', 'false');
      });
    return request;
  }

  legacy.loadMenus = function(options) {
    var api = runtime();
    options = options || {};
    var moduleName = options.module || (api && api.heritageActiveModule) || '';
    if (moduleName && api) api.heritageActiveModule = moduleName;
    menuSequence += 1;
    var token = menuSequence;
    menuRequests.forEach(function(request) {
      if (request && request.readyState !== 4) request.abort();
    });
    menuRequests = [
      loadMenu('#sidebar', 'nav=side', function() { var current = runtime(); if (current) current.onAfterSideNavLoaded(); }, token, moduleName ? 'side:' + moduleName : '', moduleName),
      loadMenu('#topnav-container', 'nav=top', function() {}, token, 'top', moduleName)
    ];
    return menuRequests;
  };

  legacy.loadInitContent = function() {
    var api = runtime();
    if (!api) return;
    installNavigationHistory();
    var content = document.getElementById('pageContent');
    var startpage = pageFromUrl() || (content && content.getAttribute('data-startpage')) || 'dashboard/dashboard.php';
    api.heritageActiveModule = String(startpage).split('/')[0] || 'dashboard';
    api.navigateTo(startpage);
    api.loadMenus({ module: api.heritageActiveModule });
    api.keepalive();
    window.setTimeout(function() {
      try {
        var username = document.querySelector('form#pageForm input[name="username"]');
        if (username) username.focus();
      } catch (error) {}
    }, 1000);
  };

  var refreshSequence = 0;
  var refreshRequest = null;
  var refreshTimer = null;

  function refreshState(kind) {
    document.querySelectorAll('.wb-refresh-state').forEach(function(state) { state.remove(); });
    var role = kind === 'error' ? 'alert' : 'status';
    var label = kind === 'error' ? messages.refresh_error : messages.refreshing;
    var host = document.getElementById('pageContent');
    if (!host) return;
    var state = element('div', 'wb-refresh-state wb-refresh-state--' + kind);
    state.setAttribute('role', role);
    state.appendChild(kind === 'error' ? iconElement('wb-refresh-state__icon', '!') : iconElement('wb-refresh-state__spinner'));
    state.appendChild(element('span', '', label));
    host.insertBefore(state, host.firstChild);
  }

  legacy.loadContentRefresh = function(pagename) {
    var api = runtime();
    var intervalControl = document.getElementById('refreshinterval');
    var interval = Number(intervalControl && intervalControl.value || 0);
    refreshSequence += 1;
    var token = refreshSequence;

    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (refreshRequest && refreshRequest.readyState !== 4) refreshRequest.abort();
    refreshRequest = null;

    if (interval <= 0) {
      document.querySelectorAll('.wb-refresh-state').forEach(function(state) { state.remove(); });
      return;
    }

    refreshState('loading');
    var request = requestHtml(pagename, 'refresh=' + interval, 30000);
    refreshRequest = request;
    request.promise.then(function(response) {
        if (token !== refreshSequence || request.aborted) return;
        var host = document.getElementById('pageContent');
        if (window.heritageMonitoring) window.heritageMonitoring.destroy(host);
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        enhanceLoadedContent(host, pagename, 'refresh=' + interval);
        announceContentReady(host, pagename, { source: 'refresh', params: 'refresh=' + interval });
        schedulePostRenderEnhancement(host, pagename);
        if (api) api.pageFormChanged = false;
      }).catch(function(error) {
        if (isSupersededRequest(request, error) || token !== refreshSequence) return;
        refreshState('error');
        if (api) api.reportError('Refresh request was not successful. ' + pagename);
      });

    refreshTimer = window.setTimeout(function() {
      var current = runtime();
      if (current) current.loadContentRefresh(pagename);
    }, interval * 1000 * 60);
  };

  document.addEventListener('click', function(event) {
    var trigger = event.target.closest('.wb-content-state__retry');
    if (!trigger) return;
    event.preventDefault();
    var token = trigger.getAttribute('data-heritage-retry');
    retryContentRequest(token);
  });

  legacy.heritageEnhanceContent = function(rootOrPageName, pageName, context) {
    var host = rootOrPageName && rootOrPageName.nodeType ? rootOrPageName : document.getElementById('pageContent');
    var resolvedPage = rootOrPageName && rootOrPageName.nodeType ? pageName : rootOrPageName;
    if (!host) return false;
    enhanceLoadedContent(host, resolvedPage || '', undefined, context || {});
    announceContentReady(host, resolvedPage || '', context || { source: 'manual-enhance' });
    return true;
  };

  window.heritageContentStates = window.heritageContentStates || {};
  window.heritageContentStates.enhance = function(root, pageName, context) {
    return (legacy && typeof legacy.heritageEnhanceContent === 'function')
      ? legacy.heritageEnhanceContent(root || document.getElementById('pageContent'), pageName || '', context || { source: 'external-enhance' })
      : false;
  };

  legacy.registerHook('onAfterContentLoad', function(name, params) {
    if (params && params.__workbenchEnhanced) return;
    if (legacy && typeof legacy.heritageEnhanceContent === 'function') {
      legacy.heritageEnhanceContent(params && params.url ? params.url : name || '', '', { source: 'legacy-after-content-hook' });
    }
  });

  legacy.heritageContentStatesInstalled = true;
})(window, document);

/* source: heritage-background.js */
(function(window, document) {
  'use strict';

  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof app.requestText !== 'function' || typeof app.requestJson !== 'function' || legacy.heritageBackgroundInstalled) return;

  var contentRequests = {};
  var keepaliveTimer = null;
  var keepaliveRequest = null;
  var datalogRequest = null;
  var datalogStarted = false;

  function scheduleDatalog(delay) {
    var api = runtime();
    if (!api) return;
    window.clearTimeout(api.dataLogTimer);
    api.dataLogTimer = null;
    if (!datalogStarted || document.hidden) return;
    api.dataLogTimer = window.setTimeout(function() { api.dataLogNotification(); }, delay);
  }

  legacy.loadContentInto = function(elementId, pageName) {
    var api = runtime();
    var host = document.getElementById(elementId);
    if (!api || !host) return null;
    if (contentRequests[elementId] && contentRequests[elementId].readyState !== 4) contentRequests[elementId].abort();
    host.setAttribute('aria-busy', 'true');
    var request = api.requestText(pageName, { timeout: 30000 });
    contentRequests[elementId] = request;
    request.promise.then(function(responseText) {
      if (contentRequests[elementId] !== request) return;
      if (typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
      api.replaceServerFragment(host, responseText);
      if (window.heritageContentStates && typeof window.heritageContentStates.enhance === 'function') {
        window.heritageContentStates.enhance(host, pageName, { source: 'partial-content' });
      } else {
        if (window.heritageAccessibility) window.heritageAccessibility.enhance(host);
        if (window.heritageIcons) window.heritageIcons.render(host);
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Partial content request was not successful.');
    }).finally(function() {
      if (contentRequests[elementId] === request) host.setAttribute('aria-busy', 'false');
    });
    return request;
  };

  legacy.loadOptionInto = function(elementId, pageName, callback) {
    var api = runtime();
    var select = document.getElementById(elementId);
    if (!api || !select) return null;
    var key = 'option:' + elementId;
    if (contentRequests[key] && contentRequests[key].readyState !== 4) contentRequests[key].abort();
    select.setAttribute('aria-busy', 'true');
    var request = api.requestText(pageName, { timeout: 30000 });
    contentRequests[key] = request;
    request.promise.then(function(responseText) {
      if (contentRequests[key] !== request) return;
      select.replaceChildren();
      responseText.split('#').forEach(function(value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
      if (typeof callback === 'function') callback(elementId, pageName);
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Option request was not successful.');
    }).finally(function() {
      if (contentRequests[key] === request) select.removeAttribute('aria-busy');
    });
    return request;
  };

  legacy.keepalive = function() {
    var api = runtime();
    if (!api) return null;
    if (keepaliveTimer) window.clearTimeout(keepaliveTimer);
    if (keepaliveRequest && keepaliveRequest.readyState !== 4) return keepaliveRequest;
    keepaliveRequest = api.requestText('keepalive.php', { timeout: 30000 });
    keepaliveRequest.promise.then(function() {
      keepaliveTimer = window.setTimeout(function() { api.keepalive(); }, 1000000);
    }).catch(function(error) {
      if (!keepaliveRequest.aborted && (!error || error.name !== 'AbortError')) api.reportError('Session expired. Please login again.');
    });
    return keepaliveRequest;
  };

  function renderDatalog(payload) {
    var trigger = document.querySelector('.notification');
    var counter = trigger && trigger.querySelector('.notification_text');
    var dialog = document.getElementById('datalogModal');
    var list = dialog && dialog.querySelector('.wb-dialog__body ul');
    var count = Number(payload && payload.count || 0);
    if (!trigger || !counter || !list) return;
    list.replaceChildren();
    if (count > 0) {
      var entries = payload && payload.entries ? payload.entries : [];
      (Array.isArray(entries) ? entries : Object.keys(entries).map(function(key) { return entries[key]; })).forEach(function(entry) {
        var item = document.createElement('li');
        var label = document.createElement('strong');
        label.textContent = String(entry.text || '') + ':';
        item.append(label, document.createTextNode(' ' + String(entry.count || 0)));
        list.appendChild(item);
      });
      counter.textContent = String(count);
      trigger.style.display = '';
      scheduleDatalog(2000);
    } else {
      counter.textContent = '0';
      if (window.heritageDialog && dialog && window.heritageDialog.isOpen(dialog)) {
        var empty = document.createElement('li');
        empty.textContent = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0 ? 'Keine ausstehenden Änderungen.' : 'No pending changes.';
        list.appendChild(empty);
        trigger.style.display = '';
      } else {
        trigger.style.display = 'none';
      }
      scheduleDatalog(5000);
    }
  }

  legacy.dataLogNotification = function() {
    var api = runtime();
    if (!api) return null;
    datalogStarted = true;
    window.clearTimeout(api.dataLogTimer);
    api.dataLogTimer = null;
    if (document.hidden) return null;
    if (datalogRequest && datalogRequest.readyState !== 4) return datalogRequest;
    var request = api.requestJson('datalogstatus.php', { timeout: 30000 });
    datalogRequest = request;
    request.promise.then(renderDatalog).catch(function(error) {
      if (request.aborted || (error && error.name === 'AbortError')) return;
      var trigger = document.querySelector('.notification');
      if (trigger) trigger.style.display = 'none';
      api.reportError('Notification temporarily unavailable.');
      scheduleDatalog(10000);
    }).finally(function() {
      if (datalogRequest === request) datalogRequest = null;
    });
    return request;
  };

  document.addEventListener('visibilitychange', function() {
    if (!datalogStarted) return;
    if (document.hidden) {
      var api = runtime();
      if (api) {
        window.clearTimeout(api.dataLogTimer);
        api.dataLogTimer = null;
      }
      if (datalogRequest && datalogRequest.readyState !== 4) datalogRequest.abort();
      datalogRequest = null;
      return;
    }
    var visibleApi = runtime();
    if (visibleApi) visibleApi.dataLogNotification();
  });

  window.addEventListener('pagehide', function() {
    var api = runtime();
    if (api) window.clearTimeout(api.dataLogTimer);
    if (datalogRequest && datalogRequest.readyState !== 4) datalogRequest.abort();
  });

  legacy.heritageBackgroundInstalled = true;
})(window, document);

/* source: heritage-icons.js */
(function(window, document) {
  'use strict';

  if (window.heritageIconsInstalled) return;

  var paths = {
    calendar: '<path d="M7 2v3M17 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/>',
    billing: '<path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2V3Zm4 5h8M8 12h8M8 16h5"/>',
    lens: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    bulb: '<path d="M9 18h6M10 22h4M8.5 15.5A7 7 0 1 1 15.5 15.5C14.6 16.2 14 17 14 18h-4c0-1-.6-1.8-1.5-2.5Z"/>',
    tools: '<path d="M14 6a4 4 0 0 0-5-4l2 3-3 3-3-2a4 4 0 0 0 5 5L20 21l2-2-10-10a4 4 0 0 0 2-3Z"/>',
    admin: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-5"/>',
    sites: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    monitor: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.2 2.2c-1.2.8-1.7 1.3-1.7 2.8M12 18h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    dns: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M12 8v4M7.5 16l4.5-4 4.5 4"/>',
    client: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 5v1"/>',
    edit: '<path d="m4 16-1 5 5-1L19 9l-4-4L4 16ZM13 7l4 4"/>',
    filter: '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
    action: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
    dbadmin: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    loginas: '<path d="M10 17l5-5-5-5M15 12H3M14 3h7v18h-7"/>',
    delete: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    signal: '<path d="M4 20v-4M9 20v-8M14 20V8M19 20V4"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l2 2M14 9l2 2"/>',
    clone: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  var aliases = { mailuser: 'mail', add: 'plus', remove: 'close', th: 'grid', login: 'loginas' };
  var legacy = {
    'glyphicon-remove-circle': 'close', 'glyphicon-remove': 'close',
    'glyphicon-calendar': 'calendar', 'glyphicon-signal': 'signal',
    'glyphicon-arrow-right': 'arrow-right', 'glyphicon-arrow-left': 'arrow-left',
    'glyphicon-th': 'grid', 'glyphicon-time': 'time',
    'fa-times': 'close', 'fa-calendar': 'calendar', 'fa-clock-o': 'time',
    'fa-arrow-right': 'arrow-right', 'fa-arrow-left': 'arrow-left',
    'fa-lock': 'lock', 'fa-key': 'key', 'fa-clone': 'clone', 'fa-link': 'link'
  };
  var messages = {};
  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) { messages = {}; }

  function svgIcon(name) {
    var parsed = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + paths[name] + '</svg>', 'image/svg+xml');
    return document.importNode(parsed.documentElement, true);
  }

  function accessibleName(node, name) {
    var control = node.closest('a,button');
    if (!control || control.getAttribute('aria-label') || control.getAttribute('title')) return;
    var visibleText = Array.prototype.filter.call(control.childNodes, function(child) {
      return child.nodeType === 3 && child.textContent.trim();
    }).map(function(child) { return child.textContent.trim(); }).join(' ');
    if (visibleText) return;
    var language = typeof window.heritageLanguage === 'function'
      ? window.heritageLanguage()
      : String(document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
    var fallback = language === 'de'
      ? {delete:'Löschen',filter:'Filtern',edit:'Bearbeiten',loginas:'Als Benutzer anmelden',dbadmin:'Datenbankverwaltung öffnen',link:'Link öffnen',signal:'Statistiken öffnen',close:'Schließen',calendar:'Kalender öffnen',clone:'Kopieren',key:'Schlüssel',lock:'Gesperrt','arrow-left':'Zurück','arrow-right':'Weiter'}
      : {delete:'Delete',filter:'Filter',edit:'Edit',loginas:'Log in as user',dbadmin:'Open database administration',link:'Open link',signal:'Open statistics',close:'Close',calendar:'Open calendar',clone:'Copy',key:'Key',lock:'Locked','arrow-left':'Previous','arrow-right':'Next'};
    var label = messages['icon_' + name.replace(/-/g, '_')] || fallback[name];
    if (label) control.setAttribute('aria-label', label);
  }

  function render(root) {
    var nodes = (root || document).querySelectorAll('.icon:not(.wb-svg-icon),.glyphicon:not(.wb-svg-icon),.fa:not(.wb-svg-icon)');
    Array.prototype.forEach.call(nodes, function(node) {
      var name = '';
      Array.prototype.some.call(node.classList, function(className) {
        if (legacy[className]) {
          name = legacy[className];
          return true;
        }
        if (className.indexOf('icon-') === 0 && paths[className.slice(5)]) {
          name = className.slice(5);
          return true;
        }
        if (className.indexOf('icon-') === 0 && aliases[className.slice(5)]) {
          name = aliases[className.slice(5)];
          return true;
        }
        return false;
      });
      if (!name) return;
      node.classList.add('wb-svg-icon');
      node.setAttribute('data-heritage-icon', name);
      node.replaceChildren(svgIcon(name));
      accessibleName(node, name);
    });
  }

  render(document);
  var runtime = typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  if (runtime && runtime.registerHook) {
    runtime.registerHook('onAfterContentLoad', function() {
      render(document.getElementById('pageContent'));
    });
  }

  window.heritageIcons = { render: render, names: Object.keys(paths) };
  window.heritageIconsInstalled = true;
})(window, document);

/* source: heritage-feedback.js */
(function (window, document) {
  'use strict';

  if (window.heritageFeedbackInstalled) return;

  var icons = {
    success: '<path d="m5 12 4 4L19 6"/>',
    danger: '<path d="M12 8v5M12 17h.01"/><path d="M10.3 3.8 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/>',
    warning: '<path d="M12 8v5M12 17h.01"/><path d="M10.3 3.8 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };

  function svgFromMarkup(markup) {
    var parsed = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false">' + markup + '</svg>', 'image/svg+xml');
    var svg = document.importNode(parsed.documentElement, true);
    svg.setAttribute('aria-hidden', 'true');
    return svg;
  }

  function tone(alert) {
    if (alert.classList.contains('alert-success')) return 'success';
    if (alert.classList.contains('alert-danger')) return 'danger';
    if (alert.classList.contains('alert-warning')) return 'warning';
    return 'info';
  }

  function localized(german, english) {
    var language = typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : (document.documentElement.lang || '');
    return String(language).toLowerCase().indexOf('de') === 0 ? german : english;
  }

  function structureContent(alert) {
    var content = alert.querySelector(':scope > .wb-feedback__content');
    if (content) return content;
    content = document.createElement('div');
    content.className = 'wb-feedback__content';
    Array.prototype.slice.call(alert.childNodes).forEach(function(node) {
      if (node.nodeType === 1 && node.matches('.close, [data-heritage-dismiss], .wb-feedback__icon, .wb-feedback__action')) return;
      content.appendChild(node);
    });
    alert.appendChild(content);
    return content;
  }

  function enhanceAlert(alert) {
    if (alert.dataset.heritageFeedback === 'true') return;
    if (alert.closest && alert.closest('.wb-login-form-surface')) return;
    var state = tone(alert);
    alert.dataset.heritageFeedback = 'true';
    alert.dataset.heritageTone = state;
    alert.setAttribute('data-heritage-feedback', state);
    alert.classList.add('wb-feedback');
    alert.setAttribute('role', state === 'danger' || state === 'warning' ? 'alert' : 'status');
    alert.setAttribute('aria-live', state === 'danger' || state === 'warning' ? 'assertive' : 'polite');
    alert.setAttribute('aria-atomic', 'true');
    structureContent(alert);
    var icon = document.createElement('span');
    icon.className = 'wb-feedback__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.appendChild(svgFromMarkup(icons[state]));
    alert.prepend(icon);
    var dismiss = alert.querySelector(':scope > .close, :scope > [data-heritage-dismiss]');
    if (dismiss) {
      if (dismiss.tagName === 'BUTTON' && !dismiss.getAttribute('type')) dismiss.setAttribute('type', 'button');
      if (!dismiss.getAttribute('aria-label') || /^(?:close|schlie(?:ß|ss)en)$/i.test(dismiss.getAttribute('aria-label'))) {
        dismiss.setAttribute('aria-label', localized('Schließen', 'Close'));
      }
      dismiss.setAttribute('title', localized('Meldung schließen', 'Dismiss notification'));
    }
  }

  function enhanceDialog(dialog) {
    dialog.classList.add('wb-dialog--enhanced');
    dialog.setAttribute('data-heritage-dialog', 'true');
    var dangerAction = dialog.querySelector('.wb-dialog__action--danger, .btn-danger, [data-heritage-tab-confirm-action="discard"]');
    var primaryAction = dialog.querySelector('.wb-dialog__action--primary, .btn-primary, [data-heritage-tab-confirm-action="save"]');
    dialog.setAttribute('data-heritage-dialog-tone', dangerAction ? 'warning' : (primaryAction ? 'action' : 'neutral'));
    var body = dialog.querySelector('.wb-dialog__body');
    if (body && !dialog.getAttribute('aria-describedby')) {
      var description = body.querySelector('p, .wb-dialog__supporting-text');
      if (description) {
        if (!description.id) description.id = (dialog.id || 'heritage-dialog') + '-description';
        dialog.setAttribute('aria-describedby', description.id);
      }
    }
    var footer = dialog.querySelector('.wb-dialog__footer');
    if (footer) {
      footer.setAttribute('role', 'group');
      footer.setAttribute('aria-label', localized('Dialogaktionen', 'Dialog actions'));
      Array.prototype.forEach.call(footer.querySelectorAll('button, a'), function (action) {
        var kind = action.matches('.wb-dialog__action--primary, .btn-primary') ? 'primary' :
          (action.matches('.wb-dialog__action--danger, .btn-danger') ? 'danger' : 'secondary');
        action.setAttribute('data-heritage-dialog-action', kind);
      });
    }
    var list = dialog.querySelector('.wb-dialog__body > ul');
    if (list) {
      list.classList.add('wb-dialog__activity-list');
      Array.prototype.forEach.call(list.children, function (item) { item.classList.add('wb-dialog__activity-item'); });
    }
  }

  function enhance(root) {
    var host = root && root.querySelectorAll ? root : document;
    if (host.matches && host.matches('.alert')) enhanceAlert(host);
    Array.prototype.forEach.call(host.querySelectorAll('.alert'), enhanceAlert);
    if (host.matches && host.matches('.wb-dialog')) enhanceDialog(host);
    Array.prototype.forEach.call(host.querySelectorAll('.wb-dialog'), enhanceDialog);
  }

  function dismissGenerated(alert) {
    if (!alert) return;
    if (alert.heritageDismissController && alert.heritageDismissController.timer) {
      window.clearTimeout(alert.heritageDismissController.timer);
    }
    alert.remove();
  }

  function scheduleGeneratedDismiss(alert, toneName) {
    if (!alert || ['success', 'info'].indexOf(toneName) === -1) return;
    var duration = toneName === 'success' ? 7000 : 10000;
    alert.setAttribute('data-heritage-auto-dismiss', 'true');
    alert.style.setProperty('--hg-feedback-duration', duration + 'ms');
    var controller = alert.heritageDismissController || {};
    if (controller.timer) window.clearTimeout(controller.timer);
    controller.timer = null;
    controller.remaining = duration;

    controller.pause = function() {
      if (!controller.timer) return;
      window.clearTimeout(controller.timer);
      controller.timer = null;
      controller.remaining = Math.max(500, controller.remaining - (Date.now() - controller.started));
      alert.setAttribute('data-heritage-dismiss-paused', 'true');
    };
    controller.resume = function() {
      if (controller.timer || !alert.isConnected) return;
      alert.removeAttribute('data-heritage-dismiss-paused');
      controller.started = Date.now();
      controller.timer = window.setTimeout(function() { dismissGenerated(alert); }, controller.remaining);
    };

    if (!controller.bound) {
      alert.addEventListener('pointerenter', controller.pause);
      alert.addEventListener('pointerleave', controller.resume);
      alert.addEventListener('focusin', controller.pause);
      alert.addEventListener('focusout', function() {
        window.setTimeout(function() {
          if (!alert.contains(document.activeElement)) controller.resume();
        }, 0);
      });
      controller.bound = true;
    }
    alert.heritageDismissController = controller;
    controller.resume();
  }

  function actionControl(options) {
    if (!options || !options.actionLabel || (!options.actionHref && typeof options.onAction !== 'function')) return null;
    var control = document.createElement(options.actionHref ? 'a' : 'button');
    control.className = 'wb-feedback__action';
    control.textContent = String(options.actionLabel);
    if (options.actionHref) control.href = new URL(options.actionHref, document.baseURI).href;
    else {
      control.type = 'button';
      control.addEventListener('click', function(event) {
        event.preventDefault();
        options.onAction(event);
      });
    }
    return control;
  }

  function show(message, state, options) {
    var text = String(message || '').trim();
    if (!text) return null;
    var host = document.getElementById('pageContent');
    if (!host) return null;
    var stack = host.querySelector(':scope > .wb-feedback-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'wb-feedback-stack';
      stack.setAttribute('aria-label', localized('Meldungen', 'Notifications'));
      stack.setAttribute('data-heritage-feedback-stack', 'true');
      stack.setAttribute('role', 'region');
      host.prepend(stack);
    }

    var toneName = ['success', 'danger', 'warning', 'info'].indexOf(state) > -1 ? state : 'info';
    var duplicate = Array.prototype.find.call(stack.querySelectorAll('[data-heritage-generated-feedback]'), function(item) {
      return item.getAttribute('data-heritage-feedback-message') === text &&
        item.getAttribute('data-heritage-feedback-tone') === toneName;
    });
    if (duplicate) {
      if (!duplicate.querySelector(':scope > .wb-feedback__action')) {
        var duplicateAction = actionControl(options);
        var duplicateDismiss = duplicate.querySelector(':scope > [data-heritage-dismiss]');
        if (duplicateAction) duplicate.insertBefore(duplicateAction, duplicateDismiss || null);
      }
      stack.prepend(duplicate);
      scheduleGeneratedDismiss(duplicate, toneName);
      return duplicate;
    }
    var alert = document.createElement('div');
    alert.className = 'alert alert-' + toneName;
    alert.setAttribute('data-heritage-generated-feedback', 'true');
    alert.setAttribute('data-heritage-feedback-message', text);
    alert.setAttribute('data-heritage-feedback-tone', toneName);
    var content = document.createElement('p');
    content.textContent = text;
    var action = actionControl(options);
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'close';
    dismiss.setAttribute('data-heritage-dismiss', 'alert');
    dismiss.setAttribute('aria-label', localized('Schließen', 'Close'));
    dismiss.textContent = '×';
    alert.appendChild(content);
    if (action) alert.appendChild(action);
    alert.appendChild(dismiss);
    stack.prepend(alert);
    enhanceAlert(alert);
    scheduleGeneratedDismiss(alert, toneName);

    Array.prototype.slice.call(stack.querySelectorAll('[data-heritage-generated-feedback]')).slice(3).forEach(function(oldAlert) {
      dismissGenerated(oldAlert);
    });
    return alert;
  }

  function connectivityFeedback(online) {
    var host = document.getElementById('pageContent');
    if (!host) return null;
    var current = host.querySelector('[data-heritage-connectivity-feedback]');
    if (current) current.remove();
    if (online) {
      var restored = show(localized('Verbindung wiederhergestellt.', 'Connection restored.'), 'success');
      if (restored) restored.setAttribute('data-heritage-connectivity-feedback', 'online');
      return restored;
    }
    var offline = show(
      localized('Keine Netzwerkverbindung. Lesevorgänge können nach dem Wiederherstellen der Verbindung erneut versucht werden.', 'No network connection. Read operations can be retried after the connection is restored.'),
      'warning'
    );
    if (offline) offline.setAttribute('data-heritage-connectivity-feedback', 'offline');
    return offline;
  }

  function runtimeMessage(message) {
    var text = String(message || '').trim();
    var messages = [
      [/^Navigation request was not successful\./, 'Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.', 'The page could not be loaded. Please try again.'],
      [/^Form request was not successful\./, 'Das Formular konnte nicht gesendet werden. Bitte versuchen Sie es erneut.', 'The form could not be submitted. Please try again.'],
      [/^Save request was not successful\./, 'Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.', 'The changes could not be saved. Please try again.'],
      [/^Upload request was not successful\./, 'Die Datei konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.', 'The file could not be uploaded. Please try again.'],
      [/^Module request was not successful\./, 'Das Modul konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.', 'The module could not be opened. Please try again.'],
      [/^Refresh request was not successful\./, 'Die Ansicht konnte nicht aktualisiert werden.', 'The view could not be refreshed.'],
      [/^(?:(?:Side|Top) navigation|Navigation menu) request was not successful\./, 'Die Navigation konnte nicht vollständig geladen werden.', 'The navigation could not be loaded completely.'],
      [/^Session expired\./, 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', 'Your session has expired. Please sign in again.'],
      [/^Workbench enhancement skipped:/, 'Ein Teil dieser Ansicht konnte nicht vollständig dargestellt werden.', 'Part of this view could not be displayed completely.']
    ];
    for (var index = 0; index < messages.length; index += 1) {
      if (messages[index][0].test(text)) return localized(messages[index][1], messages[index][2]);
    }
    return localized('Die Aktion konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.', 'The action could not be completed. Please try again.');
  }

  function hasAuthoritativeError(host) {
    return Boolean(host && host.querySelector(
      '.wb-content-state--error, ' +
      '.wb-submit-feedback[data-state="failed"], ' +
      '.alert-danger:not([data-heritage-generated-feedback])'
    ));
  }

  function report(message) {
    var host = document.getElementById('pageContent');
    if (!host || hasAuthoritativeError(host)) return null;
    if (window.navigator && window.navigator.onLine === false) return connectivityFeedback(false);
    if (/^Session expired\./.test(String(message || ''))) {
      return show(runtimeMessage(message), 'danger', {
        actionLabel: localized('Neu anmelden', 'Sign in again'),
        actionHref: 'index.php'
      });
    }
    return show(runtimeMessage(message), 'danger');
  }

  function start() {
    enhance(document);
    window.addEventListener('offline', function() { connectivityFeedback(false); });
    window.addEventListener('online', function() { connectivityFeedback(true); });
    if (window.navigator && window.navigator.onLine === false) connectivityFeedback(false);
    var page = document.getElementById('pageContent');
    if (page && window.MutationObserver) {
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          Array.prototype.forEach.call(record.addedNodes, function (node) {
            if (node.nodeType === 1) enhance(node);
          });
        });
      }).observe(page, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.heritageFeedback = { enhance: enhance, show: show, report: report, connectivity: connectivityFeedback };
  window.heritageFeedbackInstalled = true;
}(window, document));

/* source: heritage-navigation.js */
(function () {
  'use strict';

  var button = document.querySelector('.menu-btn');
  var panel = document.querySelector('#heritage-mobile-navigation');
  var overlay = document.querySelector('.wb-navigation-overlay');
  var closeButton = panel && panel.querySelector('.wb-mobile-navigation__close');
  var content = panel && panel.querySelector('.wb-mobile-navigation__content');
  var pendingModule = null;
  var currentPageTarget = '';
  var userCollapsedModule = '';
  var collapsedModules = {};
  var desktopQuery = window.matchMedia('(min-width: 721px)');
  var dashboardTarget = 'dashboard/dashboard.php';
  var cachedPrimaryNavigation = [];
  var legacy = window.ISPConfig;

  function runtime() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  if (!button || !panel || !overlay || !closeButton || !content || !legacy || !runtime()) return;

  function focusableElements() {
    return Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  function cloneLink(source, className) {
    var link = source.cloneNode(true);
    link.removeAttribute('id');
    link.classList.add(className);
    return link;
  }

  function applyCompactPrimaryLabel(link) {
    var module = linkModule(link);
    var labels = isGermanInterface() ? {
      dashboard: 'Start',
      sites: 'Web',
      billing: 'Rechnungen',
      monitor: 'Status'
    } : {
      dashboard: 'Home',
      sites: 'Web',
      billing: 'Billing',
      monitor: 'Status'
    };
    var label = labels[module];
    var node = label && link.querySelector('.title');
    if (!node) return;
    node.textContent = label;
    link.setAttribute('aria-label', label);
    link.setAttribute('title', label);
  }

  function linkContentTarget(link) {
    return link ? (link.getAttribute('data-heritage-load-content') || link.getAttribute('data-load-content') || link.getAttribute('href') || '') : '';
  }

  function setLinkContentTarget(link, target) {
    if (!link) return;
    link.setAttribute('data-heritage-load-content', target);
    link.removeAttribute('data-load-content');
  }

  function linkModule(link) {
    return link ? (link.getAttribute('data-heritage-module') || link.getAttribute('data-capp') || '') : '';
  }

  function setLinkModule(link, module) {
    if (!link) return;
    link.setAttribute('data-heritage-module', module);
    link.removeAttribute('data-capp');
  }

  function navigationRoute(link) {
    var target = linkContentTarget(link);
    return target.split('#')[0].split('?')[0].replace(/^\/+/, '').toLowerCase();
  }

  function canonicalNavigationTarget(target) {
    var value = String(target || '').replace(/&amp;/gi, '&').split('#')[0].trim();
    if (!value) return '';
    try {
      var url = new URL(value, window.location.origin + '/');
      var route = url.pathname.replace(/^\/+/, '').toLowerCase();
      var parameters = Array.from(url.searchParams.entries()).sort(function (left, right) {
        var keyOrder = left[0].localeCompare(right[0]);
        return keyOrder || left[1].localeCompare(right[1]);
      });
      var query = new URLSearchParams();
      parameters.forEach(function (parameter) { query.append(parameter[0].toLowerCase(), parameter[1].toLowerCase()); });
      return route + (query.toString() ? '?' + query.toString() : '');
    } catch (error) {
      return value.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
    }
  }

  function normalizeModule(value) {
    return String(value || '').toLowerCase().trim();
  }

  function normalizePageModule(value) {
    var canonical = canonicalNavigationTarget(value);
    return moduleFromTarget(canonical);
  }

  function setWorkbenchModule(module, options) {
    if (!runtime()) return '';
    var nextModule = normalizeModule(module);
    if (!nextModule) return '';
    runtime().heritageActiveModule = nextModule;
    if (options && options.resetUserCollapsed) {
      userCollapsedModule = '';
      collapsedModules = {};
    }
    if (options && options.preserveCollapsed !== true && nextModule !== 'dashboard') {
      delete collapsedModules[nextModule];
    }
    return nextModule;
  }

  function moduleIsCollapsed(module) {
    return Boolean(module && collapsedModules[module]);
  }

  function setModuleCollapsed(module, collapsed) {
    if (!module) return;
    var next = Boolean(collapsed);
    if (module === 'dashboard') {
      return;
    }
    if (next) {
      collapsedModules[module] = true;
      userCollapsedModule = module;
    } else {
      delete collapsedModules[module];
      if (userCollapsedModule === module) userCollapsedModule = '';
    }
  }

  function resolveActiveModule(target, fallback) {
    var canonical = canonicalNavigationTarget(target || currentPageTarget);
    var moduleFromPage = normalizeModule(normalizePageModule(canonical));
    if (moduleFromPage) return moduleFromPage;
    var runtimeModule = normalizeModule((runtime() && runtime().heritageActiveModule) || '');
    if (runtimeModule) return runtimeModule;
    if (fallback) return normalizeModule(fallback);
    if (canonical === '' && currentPageTarget === dashboardTarget) return 'dashboard';
    if (canonical.indexOf('dashboard') === 0 || canonical.indexOf('index.php') === 0 || canonical === dashboardTarget) return 'dashboard';
    return '';
  }

  function navigationTarget(link) {
    return canonicalNavigationTarget(linkContentTarget(link));
  }

  function moduleFromTarget(target) {
    var canonical = canonicalNavigationTarget(target);
    var route = canonical.split('?')[0];
    if (!route || route === 'index.php' || route === dashboardTarget) return 'dashboard';
    var moduleName = route.split('/')[0] || '';
    return moduleName || (route.indexOf('dashboard') === 0 ? 'dashboard' : '');
  }

  function navigationTargetMatches(actual, expected) {
    var actualTarget = canonicalNavigationTarget(actual);
    var expectedTarget = canonicalNavigationTarget(expected);
    var actualParts = actualTarget.split('?');
    var expectedParts = expectedTarget.split('?');
    if (actualParts[0] !== expectedParts[0]) return false;
    var actualParameters = new URLSearchParams(actualParts[1] || '');
    var expectedParameters = new URLSearchParams(expectedParts[1] || '');
    return Array.from(expectedParameters.entries()).every(function (parameter) {
      return actualParameters.get(parameter[0]) === parameter[1];
    });
  }

  var navigationPairs = [
    { list: 'help/support_message_list.php', create: 'help/support_message_edit.php', de: 'Nachrichten', createDe: 'Nachricht erstellen' },
    { list: 'help/faq_sections_list.php', create: 'help/faq_sections_edit.php', de: 'Kategorien', createDe: 'Kategorie erstellen' },
    { list: 'help/faq_manage_questions_list.php', create: 'help/faq_edit.php', de: 'Fragen', createDe: 'Frage erstellen' },
    { list: 'client/client_circle_list.php', create: 'client/client_circle_edit.php', de: 'Kundenkreise', createDe: 'Kundenkreis erstellen' },
    { list: 'client/client_list.php', create: 'client/client_edit.php', de: 'Kunden', createDe: 'Kunde erstellen' },
    { list: 'client/client_template_list.php', create: 'client/client_template_edit.php', de: 'Kundenvorlagen', createDe: 'Kundenvorlage erstellen' },
    { list: 'client/message_template_list.php', create: 'client/message_template_edit.php', de: 'E-Mail-Templates', createDe: 'E-Mail-Template erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=domain', create: 'sites/web_vhost_domain_edit.php?type=domain', de: 'Webseiten', createDe: 'Webseite erstellen' },
    { list: 'sites/web_childdomain_list.php?type=subdomain', create: 'sites/web_childdomain_edit.php?type=subdomain', de: 'Subdomains', createDe: 'Subdomain erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=subdomain', create: 'sites/web_vhost_domain_edit.php?type=subdomain', de: 'Subdomains (vHost)', createDe: 'vHost-Subdomain erstellen' },
    { list: 'sites/web_childdomain_list.php?type=aliasdomain', create: 'sites/web_childdomain_edit.php?type=aliasdomain', de: 'Aliasdomains', createDe: 'Aliasdomain erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=aliasdomain', create: 'sites/web_vhost_domain_edit.php?type=aliasdomain', de: 'Aliasdomains (vHost)', createDe: 'vHost-Aliasdomain erstellen' },
    { list: 'sites/database_list.php', create: 'sites/database_edit.php', de: 'Datenbanken', createDe: 'Datenbank erstellen' },
    { list: 'sites/database_user_list.php', create: 'sites/database_user_edit.php', de: 'DB-Benutzer', createDe: 'DB-Benutzer erstellen' },
    { list: 'sites/ftp_user_list.php', create: 'sites/ftp_user_edit.php', de: 'FTP-Benutzer', createDe: 'FTP-Benutzer erstellen' },
    { list: 'sites/webdav_user_list.php', create: 'sites/webdav_user_edit.php', de: 'WebDAV-Benutzer', createDe: 'WebDAV-Benutzer erstellen' },
    { list: 'sites/web_folder_list.php', create: 'sites/web_folder_edit.php', de: 'Gesch\u00fctzte Ordner', createDe: 'Gesch\u00fctzten Ordner erstellen' },
    { list: 'sites/web_folder_user_list.php', create: 'sites/web_folder_user_edit.php', de: 'Ordner-Benutzer', createDe: 'Ordner-Benutzer erstellen' },
    { list: 'sites/shell_user_list.php', create: 'sites/shell_user_edit.php', de: 'SSH/SFTP-Benutzer', createDe: 'SSH/SFTP-Benutzer erstellen' },
    { list: 'sites/cron_list.php', create: 'sites/cron_edit.php', de: 'Cronjobs', createDe: 'Cronjob erstellen' }
  ];

  var fallbackNavigationGroups = {
    help: [
      { titleDe: 'Support', pairs: ['help/support_message_list.php'] },
      { titleDe: 'FAQ', pairs: ['help/faq_sections_list.php', 'help/faq_manage_questions_list.php'] }
    ],
    client: [
      { titleDe: 'Kunden', pairs: ['client/client_list.php'] },
      { titleDe: 'Reseller', pairs: ['client/reseller_list.php'] },
      { titleDe: 'Benachrichtigungen', pairs: ['client/client_circle_list.php'] },
      { titleDe: 'Vorlagen', pairs: ['client/client_template_list.php', 'client/message_template_list.php'] }
    ],
    sites: [
      { titleDe: 'Webseiten', pairs: ['sites/web_vhost_domain_list.php?type=domain', 'sites/web_childdomain_list.php?type=subdomain', 'sites/web_childdomain_list.php?type=aliasdomain'] },
      { titleDe: 'Datenbanken', pairs: ['sites/database_list.php', 'sites/database_user_list.php'] },
      { titleDe: 'Web-Zugriff', pairs: ['sites/ftp_user_list.php', 'sites/webdav_user_list.php', 'sites/web_folder_list.php', 'sites/web_folder_user_list.php'] },
      { titleDe: 'Kommandozeile', pairs: ['sites/shell_user_list.php', 'sites/cron_list.php'] }
    ]
  };

  // Resource destinations use plural nouns consistently. Action labels remain
  // singular and are exposed through the adjacent + control.
  var pluralNavigationLabels = {
    'admin/directive_snippets_list.php': 'Direktiven-Schnipsel',
    'admin/extension_install_list.php': 'Installierte Erweiterungen',
    'admin/extension_repo_list.php': 'Verfügbare Erweiterungen',
    'admin/firewall_filter_list.php': 'Paketfilter',
    'admin/firewall_forward_list.php': 'Portweiterleitungen',
    'admin/firewall_list.php': 'Firewalls',
    'admin/iptables_list.php': 'IPTables-Regeln',
    'admin/remote_user_list.php': 'Remote-Benutzer',
    'admin/server_config_list.php': 'Serverkonfigurationen',
    'admin/server_ip_list.php': 'Server-IP-Adressen',
    'admin/server_ip_map_list.php': 'Server-IPv4-Zuordnungen',
    'admin/server_list.php': 'Server',
    'admin/server_php_list.php': 'PHP-Versionen',
    'admin/users_list.php': 'ISPConfig-Benutzer',
    'client/client_circle_list.php': 'Kundenkreise',
    'client/client_list.php': 'Kunden',
    'client/client_template_list.php': 'Kundenvorlagen',
    'client/domain_list.php': 'Domains',
    'client/message_template_list.php': 'E-Mail-Templates',
    'client/reseller_list.php': 'Reseller',
    'dns/dns_slave_list.php': 'Sekund\u00e4re DNS-Zonen',
    'dns/dns_soa_list.php': 'DNS-Zonen',
    'dns/dns_template_list.php': 'DNS-Vorlagen',
    'help/faq_list.php': 'FAQ-Eintraege',
    'help/faq_manage_questions_list.php': 'Fragen',
    'help/faq_sections_list.php': 'Kategorien',
    'help/support_message_list.php': 'Nachrichten',
    'mail/mail_alias_list.php': 'E-Mail-Aliase',
    'mail/mail_aliasdomain_list.php': 'Domain-Aliase',
    'mail/mail_blacklist_list.php': 'E-Mail-Blacklists',
    'mail/mail_content_filter_list.php': 'Inhaltsfilter',
    'mail/mail_domain_catchall_list.php': 'E-Mail-Catchalls',
    'mail/mail_domain_list.php': 'E-Mail-Domains',
    'mail/mail_forward_list.php': 'E-Mail-Weiterleitungen',
    'mail/mail_get_list.php': 'Fetchmail-Konten',
    'mail/mail_relay_domain_list.php': 'Relay-Domains',
    'mail/mail_relay_recipient_list.php': 'Relay-Empf\u00e4nger',
    'mail/mail_transport_list.php': 'E-Mail-Routen',
    'mail/mail_user_list.php': 'E-Mail-Postf\u00e4cher',
    'mail/mail_whitelist_list.php': 'E-Mail-Whitelists',
    'mail/spamfilter_blacklist_list.php': 'Spamfilter-Blacklists',
    'mail/spamfilter_config_list.php': 'Serverkonfigurationen',
    'mail/spamfilter_policy_list.php': 'Spamfilter-Richtlinien',
    'mail/spamfilter_users_list.php': 'Spamfilter-Benutzer',
    'mail/spamfilter_whitelist_list.php': 'Spamfilter-Whitelists',
    'mailuser/mail_user_filter_list.php': 'E-Mail-Filter',
    'monitor/datalog_list.php': 'Datenprotokolle',
    'monitor/dataloghistory_list.php': 'Datenprotokoll-Verl\u00e4ufe',
    'monitor/log_list.php': 'Protokolldateien',
    'sites/cron_list.php': 'Cronjobs',
    'sites/database_list.php': 'Datenbanken',
    'sites/database_user_list.php': 'DB-Benutzer',
    'sites/ftp_user_list.php': 'FTP-Benutzer',
    'sites/shell_user_list.php': 'SSH/SFTP-Benutzer',
    'sites/web_childdomain_list.php?type=aliasdomain': 'Aliasdomains',
    'sites/web_childdomain_list.php?type=subdomain': 'Subdomains',
    'sites/web_folder_list.php': 'Gesch\u00fctzte Ordner',
    'sites/web_folder_user_list.php': 'Ordner-Benutzer',
    'sites/web_vhost_domain_list.php?type=aliasdomain': 'Aliasdomains (vHost)',
    'sites/web_vhost_domain_list.php?type=domain': 'Webseiten',
    'sites/web_vhost_domain_list.php?type=subdomain': 'Subdomains (vHost)',
    'sites/webdav_user_list.php': 'WebDAV-Benutzer'
  };

  var legacyNavigationLabels = {
    'datenbank-benutzer': 'DB-Benutzer',
    'db benutzer': 'DB-Benutzer',
    'fragen verwalten': 'Fragen',
    'kategorien verwalten': 'Kategorien',
    'kunde': 'Kunden',
    'kunden bearbeiten': 'Kunden',
    'kundenkreis': 'Kundenkreise',
    'kundenkreis bearbeiten': 'Kundenkreise',
    'nachricht ansehen': 'Nachrichten',
    'nachrichten ansehen': 'Nachrichten',
    'webseite': 'Webseiten',
    'webseiten bearbeiten': 'Webseiten'
  };

  function normalizedLabel(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
  }

  function pairFromSourceLabel(link) {
    var text = normalizedLabel(link && link.textContent);
    if (!text) return null;
    var legacy = legacyNavigationLabels[text] || '';
    var normalizedLegacy = normalizedLabel(legacy);
    return navigationPairs.find(function (pair) {
      return normalizedLabel(pair.de) === text || (normalizedLegacy && normalizedLabel(pair.de) === normalizedLegacy);
    }) || null;
  }

  function explicitPair(link) {
    var target = navigationTarget(link);
    return navigationPairs.find(function (pair) { return navigationTargetMatches(target, pair.list); }) || pairFromSourceLabel(link);
  }

  function createLinkForPair(source, pair, sources) {
    var existing = sources.find(function (candidate) { return navigationTargetMatches(navigationTarget(candidate), pair.create); });
    if (existing) return existing;
    var link = document.createElement('a');
    link.href = '#';
    setLinkContentTarget(link, pair.create);
    link.textContent = isGermanInterface() ? pair.createDe : 'Create new';
    link.dataset.heritageSyntheticCreate = 'true';
    return link;
  }

  function linkForPairTarget(pairTarget, create) {
    var pair = navigationPairs.find(function (candidate) {
      return navigationTargetMatches(pairTarget, candidate.list) ||
        (create && navigationTargetMatches(pairTarget, candidate.create));
    });
    if (!pair) return null;
    var link = document.createElement('a');
    link.href = '#';
    setLinkContentTarget(link, create ? pair.create : pair.list);
    link.dataset.heritageSyntheticNavigation = 'true';
    link.textContent = create ? (isGermanInterface() ? pair.createDe : 'Create new') : (isGermanInterface() ? pair.de : pair.list);
    if (!create) link.dataset.heritageCompactLabel = pair.de;
    return link;
  }

  function primaryNavigationSources() {
    var live = Array.from(document.querySelectorAll('#main-navigation a[data-heritage-module], #main-navigation a[data-capp]')).filter(function (source) {
      return linkModule(source) !== 'vm';
    });
    if (live.length) {
      cachedPrimaryNavigation = live.map(function (source) { return source.cloneNode(true); });
      return live;
    }
    return cachedPrimaryNavigation.filter(function (source) {
      return linkModule(source) !== 'vm';
    }).map(function (source) { return source.cloneNode(true); });
  }

  function isDashboardContent() {
    var pageContent = document.querySelector('#pageContent');
    if (!pageContent) return false;
    // Regression fix: detect the raw dashboard by its shipped .wb-dashlet
    // widgets too. The other markers (.wb-dashboard-layout, ul.modules, ...) are
    // only added by enhance(), which itself requires body.wb-dashboard-page — so
    // without .wb-dashlet here the detection deadlocked and the dashboard stayed
    // unstyled.
    return Boolean(pageContent.querySelector(':scope > .wb-dashlet, ul.modules, .wb-dashboard-layout, .wb-dashboard-hero, .wb-dashboard-overview'));
  }

  function isGermanInterface() {
    var declared = (document.documentElement.lang || '').toLowerCase();
    var primary = document.querySelector('#main-navigation');
    var footer = document.querySelector('.wb-app-navigation__footer');
    return declared.indexOf('de') === 0 || /\u00fcbersicht|kunden|webseiten|\u00fcberwachung|einstellungen/i.test(primary ? primary.textContent : '') || /ispconfig workbench/i.test(footer ? footer.textContent : '');
  }

  function navigationResource(link, suffix) {
    var route = navigationRoute(link);
    var match = route.match(new RegExp('^(.+)' + suffix + '\\.php$'));
    return match ? match[1] : '';
  }

  function isSafeCreateLink(link) {
    var target = linkContentTarget(link);
    var query = target.split('?')[1] || '';
    return Boolean(navigationResource(link, '_edit')) && !query;
  }

  function compactListLabel(link, preferred) {
    var label = link.querySelector('strong') || link;
    var text = label.textContent.trim();
    var legacy = legacyNavigationLabels[text.toLocaleLowerCase()];
    if (legacy && isGermanInterface()) {
      label.textContent = legacy;
      return;
    }
    if (preferred && isGermanInterface()) {
      label.textContent = preferred;
      return;
    }
    if (isGermanInterface()) {
      var target = navigationTarget(link);
      var plural = pluralNavigationLabels[target] || pluralNavigationLabels[target.split('?')[0]];
      if (plural) {
        label.textContent = plural;
        return;
      }
    }
    var compact = text
      .replace(/^(edit|manage|bearbeiten|verwalten)\s+/i, '')
      .replace(/\s+(edit|manage|bearbeiten|verwalten)$/i, '');
    if (compact && compact !== text) label.textContent = compact;
  }

  function appendNavigationItem(groupList, source, createSource) {
    var item = document.createElement('li');
    var row = document.createElement('div');
    var secondaryLink = cloneLink(source, 'wb-mobile-navigation__secondary-link');
    item.dataset.heritageSearchText = (source.textContent + ' ' + (createSource ? createSource.textContent : '')).trim();
    if (isCurrentLink(source)) secondaryLink.setAttribute('aria-current', 'page');
    compactListLabel(secondaryLink, source.dataset.heritageCompactLabel || '');
    if (!createSource) {
      item.appendChild(secondaryLink);
      groupList.appendChild(item);
      return;
    }

    row.className = 'wb-mobile-navigation__secondary-row';
    row.appendChild(secondaryLink);
    var quickAction = cloneLink(createSource, 'wb-mobile-navigation__quick-action');
    var createLabel = createSource.textContent.trim() || 'Create new';
    quickAction.replaceChildren();
    quickAction.setAttribute('aria-label', createLabel);
    quickAction.setAttribute('title', createLabel);
    if (isCurrentLink(createSource)) quickAction.setAttribute('aria-current', 'page');
    var quickIcon = document.createElement('span');
    quickIcon.setAttribute('aria-hidden', 'true');
    quickIcon.textContent = '+';
    quickAction.appendChild(quickIcon);
    quickAction.dataset.heritageQuickAction = 'true';
    row.appendChild(quickAction);
    item.classList.add('wb-mobile-navigation__paired-item');
    item.appendChild(row);
    groupList.appendChild(item);
  }

  function appendSecondaryControl(groupList, source) {
    var select = source.querySelector('select');
    if (!select) return;
    var item = document.createElement('li');
    var label = document.createElement('label');
    var control = select.cloneNode(true);
    item.className = 'wb-mobile-navigation__secondary-control';
    item.dataset.heritageSearchText = select.textContent.trim();
    label.className = 'wb-visually-hidden';
    label.textContent = isGermanInterface() ? 'Server ausw\u00e4hlen' : 'Select server';
    control.removeAttribute('id');
    control.removeAttribute('onchange');
    control.classList.add('wb-mobile-navigation__server-select');
    control.setAttribute('aria-label', label.textContent);
    control.addEventListener('change', function () {
      var api = runtime();
      if (api && typeof api.navigateTo === 'function') {
        api.navigateTo('monitor/show_sys_state.php?state=server&server=' + encodeURIComponent(control.value));
      }
      if (!desktopQuery.matches) close(false);
    });
    item.appendChild(label);
    item.appendChild(control);
    groupList.appendChild(item);
  }

  function appendSecondaryGroupLabel(group, groupList, header, index, sourceList) {
    if (!header || !header.textContent.trim()) return;
    var label = document.createElement('div');
    var labelText = header.textContent.trim();
    var listId = 'heritage-mobile-secondary-group-' + (index + 1);
    groupList.id = listId;
    label.className = 'wb-mobile-navigation__secondary-label';
    label.setAttribute('role', 'presentation');
    var labelTextNode = document.createElement('span');
    labelTextNode.textContent = labelText;
    var labelRule = document.createElement('i');
    labelRule.setAttribute('aria-hidden', 'true');
    label.appendChild(labelTextNode);
    label.appendChild(labelRule);
    group.appendChild(label);
  }

  function ensureBrand() {
    var header = panel.querySelector('.wb-mobile-navigation__header');
    var source = document.querySelector('#logo');
    if (!header || !source || header.querySelector('.wb-app-navigation__brand-logo')) return;
    var brand = source.cloneNode(true);
    brand.removeAttribute('id');
    brand.className = 'wb-app-navigation__brand-logo';
    brand.removeAttribute('aria-hidden');
    var brandLink = brand.querySelector('a');
    if (brandLink) {
      brandLink.removeAttribute('tabindex');
      setLinkModule(brandLink, 'dashboard');
      brandLink.dataset.heritageDirectDashboard = 'true';
      brandLink.setAttribute('aria-label', 'Overview');
    }
    header.insertBefore(brand, header.firstChild);
  }

  function sidebarMatchesModule(sidebar, activeModule) {
    if (!sidebar || !activeModule) return false;
    return Array.from(sidebar.querySelectorAll('#sub-navigation a, .wb-secondary-navigation__group a')).some(function (link) {
      return moduleFromTarget(navigationTarget(link)) === activeModule;
    });
  }

  function buildSecondaryNavigation(activeModuleOverride) {
    var sidebar = document.querySelector('#sidebar');
    var container = document.createElement('ul');
    var api = runtime();
    var activeModule = String(activeModuleOverride || (api && api.heritageActiveModule) || '');
    var dashboard = activeModule === 'dashboard' && isDashboardContent();
    if (dashboard) return { node: container, count: 0 };
    var useSidebar = sidebarMatchesModule(sidebar, activeModule);
    var links = useSidebar ? Array.from(sidebar.querySelectorAll('#sub-navigation a, .wb-secondary-navigation__group a')) : [];
    container.className = 'wb-mobile-navigation__secondary';
    container.id = 'heritage-mobile-secondary-navigation';
    if (!sidebar) return { node: container, count: 0 };

    var groups = useSidebar ? Array.from(sidebar.querySelectorAll(':scope > header')) : [];
    if (!groups.length) groups = [null];
    groups.forEach(function (header, groupIndex) {
      var sourceList = useSidebar ? (header ? header.nextElementSibling : sidebar.querySelector('#sub-navigation, .wb-secondary-navigation__group')) : null;
      if (!sourceList || sourceList.tagName !== 'UL') return;
      var group = document.createElement('li');
      group.className = 'wb-mobile-navigation__secondary-group';
      var groupList = document.createElement('ul');
      appendSecondaryGroupLabel(group, groupList, header, groupIndex, sourceList);
      var sources = Array.from(sourceList.querySelectorAll(':scope > li > a')).filter(function (source) {
        var target = canonicalNavigationTarget(navigationTarget(source));
        var retired = target.indexOf('mail/mail_mailinglist_') === 0 ||
          target.indexOf('mail/xmpp_') === 0 ||
          target.indexOf('sites/aps_') === 0;
        return !retired && !navigationTargetMatches(target, 'help/version.php');
      });
      var consumed = new Set();
      var pairByList = new Map();
      sources.forEach(function (source) {
        var pair = explicitPair(source);
        if (pair) {
          source.dataset.heritageCompactLabel = pair.de;
          var explicitCreate = createLinkForPair(source, pair, sources);
          pairByList.set(source, explicitCreate);
          if (!explicitCreate.dataset.heritageSyntheticCreate) consumed.add(explicitCreate);
          return;
        }
        var resource = navigationResource(source, '_list');
        if (!resource) return;
        var candidates = sources.filter(function (candidate) {
          return candidate !== source && isSafeCreateLink(candidate) && navigationResource(candidate, '_edit') === resource;
        });
        if (candidates.length === 1) {
          pairByList.set(source, candidates[0]);
          consumed.add(candidates[0]);
        }
      });
      sources.forEach(function (source) {
        if (consumed.has(source)) return;
        appendNavigationItem(groupList, source, pairByList.get(source) || null);
      });
      Array.from(sourceList.querySelectorAll(':scope > li')).filter(function (item) {
        return !item.querySelector(':scope > a') && item.querySelector(':scope > select');
      }).forEach(function (item) { appendSecondaryControl(groupList, item); });
      group.appendChild(groupList);
      container.appendChild(group);
    });
    if (!container.querySelector('.wb-mobile-navigation__secondary-link, .wb-mobile-navigation__secondary-control')) {
      (fallbackNavigationGroups[activeModule] || []).forEach(function (fallbackGroup, groupIndex) {
        var group = document.createElement('li');
        var groupList = document.createElement('ul');
        var header = document.createElement('header');
        group.className = 'wb-mobile-navigation__secondary-group wb-mobile-navigation__secondary-group--fallback';
        header.textContent = isGermanInterface() ? fallbackGroup.titleDe : fallbackGroup.titleDe;
        appendSecondaryGroupLabel(group, groupList, header, groupIndex, groupList);
        fallbackGroup.pairs.forEach(function (pairTarget) {
          var source = linkForPairTarget(pairTarget, false);
          if (!source) return;
          appendNavigationItem(groupList, source, linkForPairTarget(pairTarget, true));
        });
        if (groupList.children.length) {
          group.appendChild(groupList);
          container.appendChild(group);
        }
      });
    }
    return { node: container, count: Math.max(links.length, container.querySelectorAll('.wb-mobile-navigation__secondary-link, .wb-mobile-navigation__secondary-control').length) };
  }

  function isCurrentLink(link) {
    return link.classList.contains('active') || link.getAttribute('aria-current') === 'page';
  }

  function groupContainsTarget(list, canonicalPage) {
    if (!list || !canonicalPage) return false;
    return Array.from(list.querySelectorAll('a')).some(function (link) {
      return navigationTargetMatches(navigationTarget(link), canonicalPage);
    });
  }

  function syncSecondaryGroupExpansion(canonicalPage) {
    var sidebar = document.querySelector('#sidebar');
    if (!sidebar) return;
    Array.from(sidebar.querySelectorAll(':scope > header')).forEach(function (header, index) {
      var list = header.nextElementSibling;
      if (!list || list.tagName !== 'UL') return;
      list.hidden = false;
      header.classList.toggle('wb-secondary-navigation__header--active', groupContainsTarget(list, canonicalPage));
    });
    panel.querySelectorAll('.wb-mobile-navigation__secondary-group').forEach(function (group) {
      var list = group.querySelector(':scope > ul');
      if (!list) return;
      if (groupContainsTarget(list, canonicalPage)) list.hidden = false;
    });
  }

  function syncActiveNavigationState(pageTarget) {
    if (pageTarget) currentPageTarget = pageTarget;
    var canonicalPage = canonicalNavigationTarget(currentPageTarget);
    var api = runtime();
    var activeModule = resolveActiveModule(canonicalPage);
    if (!activeModule && canonicalPage.indexOf('dashboard/') === 0) activeModule = 'dashboard';
    if (activeModule && api) api.heritageActiveModule = activeModule;
    if (activeModule === 'dashboard') {
      collapsedModules = {};
      userCollapsedModule = '';
    }

    document.querySelectorAll('#main-navigation a[data-heritage-module], #main-navigation a[data-capp]').forEach(function (link) {
      var active = activeModule && linkModule(link) === activeModule;
      link.classList.toggle('active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      var item = link.closest('li');
      if (item) item.classList.toggle('active', Boolean(active));
    });

    panel.querySelectorAll('.wb-mobile-navigation__module[data-heritage-module], .wb-mobile-navigation__module[data-capp]').forEach(function (link) {
      var active = activeModule && linkModule(link) === activeModule;
      var submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      link.classList.toggle('active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      if (!submenu) {
        link.classList.remove('wb-has-submenu');
        link.removeAttribute('aria-controls');
        link.removeAttribute('aria-expanded');
      } else if (!active) {
        submenu.hidden = true;
        link.setAttribute('aria-expanded', 'false');
      } else if (active && submenu) {
        var module = linkModule(link);
        var manuallyCollapsed = moduleIsCollapsed(module);
        submenu.hidden = Boolean(manuallyCollapsed);
        link.setAttribute('aria-expanded', manuallyCollapsed ? 'false' : 'true');
      }
    });

    if (!canonicalPage) return;
    document.querySelectorAll('#sidebar a, #heritage-mobile-navigation a:not(.wb-mobile-navigation__module)').forEach(function (link) {
      var active = navigationTargetMatches(navigationTarget(link), canonicalPage);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    syncSecondaryGroupExpansion(canonicalPage);
  }

  function finalizeNavigationState(pageTarget) {
    if (pageTarget) currentPageTarget = pageTarget;
    render();
    syncActiveNavigationState(pageTarget || currentPageTarget || dashboardTarget);
    panel.dataset.heritageNavigationFinalized = 'true';
  }

  function collapseOtherModuleSubmenus(activeLink) {
    panel.querySelectorAll('.wb-mobile-navigation__module.wb-has-submenu[aria-expanded="true"]').forEach(function (module) {
      if (module === activeLink) return;
      module.setAttribute('aria-expanded', 'false');
      var moduleSubmenu = module.closest('li') && module.closest('li').querySelector('.wb-mobile-navigation__secondary');
      if (moduleSubmenu) moduleSubmenu.hidden = true;
    });
  }

  function setModuleSubmenuExpanded(link, expanded) {
    if (!link) return false;
    var submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
    if (!submenu) {
      link.classList.remove('wb-has-submenu');
      link.removeAttribute('aria-controls');
      link.removeAttribute('aria-expanded');
      return false;
    }
    link.classList.add('wb-has-submenu');
    submenu.hidden = expanded === false;
    var module = linkModule(link);
    if (!expanded) {
      setModuleCollapsed(module, true);
    } else {
      setModuleCollapsed(module, false);
    }
    link.setAttribute('aria-expanded', expanded === false ? 'false' : 'true');
    if (expanded) collapseOtherModuleSubmenus(link);
    return true;
  }

  function loadDashboardFromNavigation() {
    var api = runtime();
    setWorkbenchModule('dashboard', { resetUserCollapsed: true });
    currentPageTarget = dashboardTarget;
    pendingModule = null;
    render();
    syncActiveNavigationState(dashboardTarget);
    if (api && typeof api.loadContent === 'function') {
      api.loadContent(dashboardTarget);
    } else if (api && typeof api.capp === 'function') {
      api.capp('dashboard');
    }
  }

  function enhanceSecondaryNavigation() {
    var sidebar = document.querySelector('#sidebar');
    if (!sidebar) return 0;
    var headers = Array.from(sidebar.querySelectorAll(':scope > header'));
    headers.forEach(function (header, index) {
      var list = header.nextElementSibling;
      if (!list || list.tagName !== 'UL') return;
      var groupId = 'heritage-secondary-group-' + (index + 1);
      list.id = groupId;
      list.classList.add('wb-secondary-navigation__group');
      header.classList.add('wb-secondary-navigation__header');
      var canonicalPage = canonicalNavigationTarget(currentPageTarget);
      var active = Boolean(list.querySelector('a.active, a[aria-current="page"]')) || groupContainsTarget(list, canonicalPage);
      var button = header.querySelector(':scope > .wb-secondary-navigation__toggle');
      if (button) button.remove();
      list.hidden = false;
      header.classList.toggle('wb-secondary-navigation__header--active', active);
    });
    sidebar.classList.toggle('wb-secondary-navigation--grouped', headers.length > 0);
    return headers.length;
  }

  function syncShellLayout() {
    var sidebar = document.querySelector('#sidebar');
    var pageContent = document.querySelector('#pageContent');
    if (!sidebar || !pageContent) return false;
    var secondaryNavigation = Boolean(sidebar.querySelector('#sub-navigation'));
    var dashboardPage = isDashboardContent();
    var dashboardNews = Boolean(dashboardPage && !secondaryNavigation && sidebar.textContent.trim());
    var newsWidget = pageContent.querySelector(':scope > .wb-dashlet-news');
    if (dashboardNews && !newsWidget) {
      newsWidget = document.createElement('article');
      newsWidget.className = 'wb-dashlet wb-dashlet-news';
      newsWidget.setAttribute('data-heritage-dashlet', 'news');
      newsWidget.replaceChildren.apply(newsWidget, Array.prototype.map.call(sidebar.childNodes, function(node) {
        return node.cloneNode(true);
      }));
      pageContent.appendChild(newsWidget);
      if (window.heritageDashboardLayout) window.setTimeout(window.heritageDashboardLayout.enhance, 0);
    }
    sidebar.classList.toggle('wb-dashboard-news', dashboardNews);
    sidebar.classList.toggle('wb-secondary-navigation', secondaryNavigation);
    sidebar.hidden = !secondaryNavigation;
    document.body.classList.toggle('wb-dashboard-news-layout', dashboardNews);
    document.body.classList.toggle('wb-dashboard-page', dashboardPage);
    // Regression fix: schedule dashboard enhancement whenever the page is a
    // dashboard, not only in the sidebar-news branch above. enhance() runs after
    // this tick, by which time body.wb-dashboard-page is set, so its host lookup
    // resolves and the widgets get their native layout/decoration.
    if (dashboardPage && window.heritageDashboardLayout) window.setTimeout(window.heritageDashboardLayout.enhance, 0);
    document.body.classList.toggle('wb-content-only-layout', !dashboardNews && !secondaryNavigation);
    return dashboardNews;
  }

  function render() {
    ensureBrand();
    var api = runtime();
    var activeModule = String(pendingModule || (api && api.heritageActiveModule) || '');
    var secondary = buildSecondaryNavigation(activeModule);
    enhanceSecondaryNavigation();
    var primary = primaryNavigationSources();
    var list = document.createElement('ul');
    var activeItem = null;
    var activeLink = null;

    list.className = 'wb-mobile-navigation__modules';
    primary.forEach(function (source) {
      var item = document.createElement('li');
      var link = cloneLink(source, 'wb-mobile-navigation__module');
      applyCompactPrimaryLabel(link);
      if (linkModule(link) === 'dashboard') {
        link.dataset.heritageDirectDashboard = 'true';
        setLinkContentTarget(link, dashboardTarget);
        link.setAttribute('href', '#');
        link.setAttribute('aria-label', isGermanInterface() ? 'Start' : 'Home');
      }
      item.appendChild(link);
      list.appendChild(item);
      if ((activeModule && linkModule(source) === activeModule) || (!activeModule && isCurrentLink(source))) {
        activeItem = item;
        activeLink = link;
      }
    });

    if (secondary.count) {
      (activeItem || list).appendChild(secondary.node);
      if (activeLink) {
        var activeCollapsed = userCollapsedModule && userCollapsedModule === linkModule(activeLink);
        activeLink.classList.add('wb-has-submenu');
        activeLink.setAttribute('aria-controls', secondary.node.id);
        activeLink.setAttribute('aria-expanded', activeCollapsed ? 'false' : 'true');
        secondary.node.hidden = Boolean(activeCollapsed);
      }
    }

    content.replaceChildren(list);
    panel.classList.add('wb-app-navigation');
    document.body.classList.add('wb-app-navigation-enabled');
    if (window.heritageIcons) window.heritageIcons.render(panel);
    syncShellLayout();
    syncActiveNavigationState();
    panel.dataset.heritageNavigationReady = 'true';

    if (isOpen() && pendingModule) {
      var pendingLink = Array.from(panel.querySelectorAll('[data-heritage-module], [data-capp]')).find(function (link) {
        return linkModule(link) === pendingModule;
      });
      var submenuLink = pendingLink && pendingLink.closest('li').querySelector('.wb-mobile-navigation__secondary a');
      window.setTimeout(function () {
        if (submenuLink) {
          submenuLink.focus();
          pendingModule = null;
        } else if (pendingLink) {
          pendingLink.focus();
        }
      }, 0);
    }
    return primary.length + secondary.count;
  }

  function isOpen() {
    return desktopQuery.matches || document.body.classList.contains('wb-navigation-open');
  }

  function syncMode() {
    var desktop = desktopQuery.matches;
    panel.inert = false;
    panel.setAttribute('role', desktop ? 'navigation' : 'dialog');
    panel.setAttribute('aria-modal', desktop ? 'false' : 'true');
    panel.setAttribute('aria-hidden', desktop ? 'false' : (document.body.classList.contains('wb-navigation-open') ? 'false' : 'true'));
    overlay.setAttribute('aria-hidden', desktop ? 'true' : overlay.getAttribute('aria-hidden'));
    document.body.classList.toggle('wb-app-navigation-desktop', desktop);
    if (desktop) {
      document.body.classList.remove('wb-navigation-open');
      button.setAttribute('aria-expanded', 'false');
    } else if (!document.body.classList.contains('wb-navigation-open')) {
      panel.inert = true;
    }
  }

  function focusNavigation() {
    if (!isOpen()) return false;
    closeButton.focus();
    return panel.contains(document.activeElement);
  }

  function open() {
    if (desktopQuery.matches) return;
    render();
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('wb-navigation-open');
    focusNavigation();
    window.setTimeout(focusNavigation, 0);
    window.setTimeout(function () {
      if (!panel.contains(document.activeElement)) focusNavigation();
    }, 250);
  }

  function close(restoreFocus) {
    if (desktopQuery.matches) return;
    document.body.classList.remove('wb-navigation-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    pendingModule = null;
    if (restoreFocus !== false && document.contains(button)) button.focus();
  }

  button.addEventListener('click', function () {
    if (isOpen()) close(true); else open();
  });
  closeButton.addEventListener('click', function () { close(true); });
  overlay.addEventListener('click', function () { close(true); });
  panel.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;

    if (link.dataset.heritageDirectDashboard === 'true') {
      event.preventDefault();
      event.stopPropagation();
      userCollapsedModule = '';
      loadDashboardFromNavigation();
      close(false);
      return;
    }

    if (link.classList.contains('wb-mobile-navigation__module') && linkModule(link)) {
      var submenu = link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      var module = linkModule(link);
      if (link.classList.contains('active') && submenu) {
        event.preventDefault();
        event.stopPropagation();
        var nextExpanded = link.getAttribute('aria-expanded') !== 'true';
        setModuleCollapsed(module, !nextExpanded);
        setModuleSubmenuExpanded(link, nextExpanded);
        if (nextExpanded) {
          pendingModule = module;
          setWorkbenchModule(module, { resetUserCollapsed: false });
        }
        return;
      }
      if (desktopQuery.matches && link.classList.contains('active') && !submenu) {
        event.preventDefault();
        return;
      }
      pendingModule = module;
      setWorkbenchModule(module, { resetUserCollapsed: true });
      var api = runtime();
      syncActiveNavigationState(pendingModule + '/');
      render();
      link = Array.from(panel.querySelectorAll('.wb-mobile-navigation__module[data-heritage-module], .wb-mobile-navigation__module[data-capp]')).find(function (candidate) {
        return linkModule(candidate) === module;
      }) || link;
      submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      if (submenu) setModuleSubmenuExpanded(link, true);
      else setModuleSubmenuExpanded(link, false);
      event.preventDefault();
      event.stopPropagation();
      link.classList.add('wb-module-transition-source');
      if (api && typeof api.capp === 'function') api.capp(pendingModule);
      return;
    }

    var target = linkContentTarget(link);
    if (target && target !== '#') {
      currentPageTarget = target;
      var targetModule = moduleFromTarget(target);
      var api = runtime();
      if (targetModule && api) {
        setWorkbenchModule(targetModule, { resetUserCollapsed: true });
      }
      syncActiveNavigationState(target);
    }
    close(false);
  });
  panel.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var focusable = focusableElements();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) close(true);
  });
  document.addEventListener('click', function (event) {
    var brandLink = event.target.closest('#logo a, .wb-app-navigation__brand-logo a, #main-navigation a[data-heritage-module="dashboard"], #main-navigation a[data-capp="dashboard"]');
    if (!brandLink) return;
    event.preventDefault();
    loadDashboardFromNavigation();
    close(false);
  });
  function handleModeChange() {
    syncMode();
    render();
  }
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleModeChange);
  else desktopQuery.addListener(handleModeChange);

  document.addEventListener('heritage:navigation-complete', function (event) {
    var page = event.detail && event.detail.page;
    if (page) currentPageTarget = page;
    syncShellLayout();
    finalizeNavigationState(page || currentPageTarget);
  });
  document.addEventListener('heritage:content-ready', function (event) {
    var page = event.detail && event.detail.page;
    if (page) currentPageTarget = page;
    // Race fix: navigation-complete can fire before the page fragment is in the
    // DOM, so isDashboardContent() misses the widgets and the dashboard renders
    // undecorated on SPA return. content-ready fires once the fragment is
    // present, so re-run the shell sync here to (re)detect the dashboard and
    // trigger its enhancement reliably.
    syncShellLayout();
    if (!page && !currentPageTarget) return;
    finalizeNavigationState(page || currentPageTarget);
  });

  syncMode();
  legacy.loadPushyMenu = render;
  render();
  window.heritageNavigation = {
    render: render,
    open: open,
    close: close,
    isOpen: isOpen,
    focus: focusNavigation,
    syncActiveNavigationState: syncActiveNavigationState,
    finalizeNavigationState: finalizeNavigationState,
    syncShellLayout: syncShellLayout,
    enhanceSecondaryNavigation: enhanceSecondaryNavigation
  };
  window.heritageNavigationInstalled = true;
}());

/* source: heritage-dashboard-metrics.js */
(function (window, document) {
  'use strict';

  function queryAll(root, selector) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var translations = {
    de: {
      current: 'Aktuell', minimum: 'Minimum', maximum: 'Maximum', average: 'Durchschnitt',
      trend: 'Trend', trendHint: 'Entwicklung seit dem ersten sichtbaren Messpunkt',
      stable: 'stabil', samples: 'Messpunkte', sample: 'Messpunkt', period: 'Zeitraum',
      latestValues: 'letzte Werte', noValues: 'Keine Messwerte',
      unavailable: 'Messwerte nicht verfügbar', analysis: 'Analyse',
      meanShort: 'Mittel', minShort: 'Min', maxShort: 'Max'
    },
    en: {
      current: 'Current', minimum: 'Minimum', maximum: 'Maximum', average: 'Average',
      trend: 'Trend', trendHint: 'Change since the first visible sample',
      stable: 'stable', samples: 'Samples', sample: 'Sample', period: 'Period',
      latestValues: 'latest values', noValues: 'No measurements',
      unavailable: 'Measurements unavailable', analysis: 'Analysis',
      meanShort: 'Average', minShort: 'Min', maxShort: 'Max'
    }
  };

  function text() {
    var language = String(document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
    return translations[language] || translations.en;
  }

  function numberList(values) {
    return Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
  }

  function normalizeLegacyStringTokens(source) {
    return String(source || '').replace(/'((?:\\.|[^'\\])*)'/g, function (match, value) {
      return JSON.stringify(value
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\'));
    });
  }

  function parsePayload(source) {
    try {
      return JSON.parse(String(source || '{}'));
    } catch (nativeError) {
      return JSON.parse(normalizeLegacyStringTokens(source));
    }
  }

  function formatNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-';
  }

  function stats(data) {
    if (!data.length) return null;
    var latest = data[data.length - 1];
    var first = data[0];
    var min = Math.min.apply(Math, data);
    var max = Math.max.apply(Math, data);
    var avg = data.reduce(function (sum, entry) { return sum + entry; }, 0) / data.length;
    var delta = latest - first;
    var trend = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down';
    return { latest: latest, first: first, min: min, max: max, avg: avg, delta: delta, trend: trend, samples: data.length };
  }

  function sparklinePoints(data, width, height, pad, min, max) {
    var span = max - min || 1;
    return data.map(function (entry, index) {
      var x = data.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (data.length - 1));
      var y = height - pad - ((entry - min) / span) * (height - pad * 2);
      return [x, y];
    });
  }

  function detailRow(label, value) {
    var row = document.createElement('div');
    var term = document.createElement('dt');
    var definition = document.createElement('dd');
    term.textContent = label;
    definition.textContent = value;
    row.appendChild(term);
    row.appendChild(definition);
    return row;
  }

  function renderSparkline(host, width, height, label, state, points, area, line, data, labels) {
    var namespace = 'http://www.w3.org/2000/svg';
    host.replaceChildren();
    host.classList.remove('wb-dashboard-sparkline--empty', 'wb-dashboard-sparkline--error');
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('focusable', 'false');
    var title = document.createElementNS(namespace, 'title');
    var copy = text();
    title.textContent = label + ': ' + copy.current + ' ' + formatNumber(state.latest) + ', ' + copy.minimum + ' ' + formatNumber(state.min) + ', ' + copy.maximum + ' ' + formatNumber(state.max);
    var polygon = document.createElementNS(namespace, 'polygon');
    polygon.setAttribute('points', area);
    polygon.setAttribute('class', 'wb-dashboard-sparkline__area');
    var polyline = document.createElementNS(namespace, 'polyline');
    polyline.setAttribute('points', line);
    polyline.setAttribute('class', 'wb-dashboard-sparkline__line');
    svg.appendChild(title);
    svg.appendChild(polygon);
    svg.appendChild(polyline);
    var guide = document.createElementNS(namespace, 'line');
    guide.setAttribute('y1', String(7));
    guide.setAttribute('y2', String(height - 7));
    guide.setAttribute('class', 'wb-dashboard-sparkline__guide');
    guide.hidden = true;
    svg.appendChild(guide);
    var tooltip = document.createElement('output');
    tooltip.className = 'wb-dashboard-sparkline__tooltip';
    tooltip.id = 'wb-metric-tooltip-' + String(host.id || label).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.hidden = true;
    svg.setAttribute('aria-describedby', tooltip.id);

    function activatePoint(point, coordinates, description) {
      queryAll(svg, '.wb-dashboard-sparkline__hit').forEach(function (entry) {
        entry.classList.toggle('is-active', entry === point);
      });
      guide.setAttribute('x1', coordinates[0].toFixed(1));
      guide.setAttribute('x2', coordinates[0].toFixed(1));
      guide.hidden = false;
      tooltip.textContent = description;
      tooltip.style.setProperty('--wb-metric-point-x', ((coordinates[0] / width) * 100).toFixed(2) + '%');
      tooltip.hidden = false;
    }

    function clearPoint(point) {
      if (document.activeElement === point || host.dataset.heritageMetricPinned === point.dataset.heritageMetricIndex) return;
      point.classList.remove('is-active');
      guide.hidden = true;
      tooltip.hidden = true;
    }

    function releasePinnedPoint() {
      delete host.dataset.heritageMetricPinned;
      queryAll(svg, '.wb-dashboard-sparkline__hit').forEach(function (entry) {
        entry.classList.remove('is-active');
      });
      guide.hidden = true;
      tooltip.hidden = true;
    }

    function movePoint(point, offset) {
      var pointNodes = queryAll(svg, '.wb-dashboard-sparkline__hit');
      var current = pointNodes.indexOf(point);
      if (current < 0) return;
      pointNodes[(current + offset + pointNodes.length) % pointNodes.length].focus();
    }

    points.forEach(function (coordinates, index) {
      var point = document.createElementNS(namespace, 'circle');
      var pointLabel = Array.isArray(labels) && labels[index] ? String(labels[index]) : copy.sample + ' ' + (index + 1);
      var description = pointLabel + ': ' + formatNumber(data[index]);
      point.setAttribute('cx', coordinates[0].toFixed(1));
      point.setAttribute('cy', coordinates[1].toFixed(1));
      point.setAttribute('r', index === points.length - 1 ? '3.5' : '2.5');
      point.setAttribute('class', 'wb-dashboard-sparkline__point wb-dashboard-sparkline__hit');
      point.setAttribute('tabindex', '0');
      point.setAttribute('role', 'img');
      point.setAttribute('aria-label', description);
      point.setAttribute('data-heritage-metric-index', String(index));
      var pointTitle = document.createElementNS(namespace, 'title');
      pointTitle.textContent = description;
      point.appendChild(pointTitle);
      point.addEventListener('pointerenter', function () { activatePoint(point, coordinates, description); });
      point.addEventListener('pointerleave', function () { clearPoint(point); });
      point.addEventListener('focus', function () { activatePoint(point, coordinates, description); });
      point.addEventListener('blur', function () { clearPoint(point); });
      point.addEventListener('click', function (event) {
        event.preventDefault();
        if (host.dataset.heritageMetricPinned === String(index)) {
          releasePinnedPoint();
          return;
        }
        host.dataset.heritageMetricPinned = String(index);
        activatePoint(point, coordinates, description);
      });
      point.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          movePoint(point, 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          movePoint(point, -1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          queryAll(svg, '.wb-dashboard-sparkline__hit')[0].focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          var pointNodes = queryAll(svg, '.wb-dashboard-sparkline__hit');
          pointNodes[pointNodes.length - 1].focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          releasePinnedPoint();
          point.focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          point.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      svg.appendChild(point);
    });
    host.addEventListener('pointerleave', function () {
      if (!host.dataset.heritageMetricPinned && !host.contains(document.activeElement)) releasePinnedPoint();
    });
    host.appendChild(svg);
    host.appendChild(tooltip);
  }

  function renderMetric(root, id, series, labels) {
    var node = root.querySelector('#' + id);
    if (!node) return false;
    var card = root.querySelector('[data-heritage-metric-card="' + id + '"]') || node.closest('.wb-dashboard-metric-card');
    var data = numberList(series && series.data);
    var value = root.querySelector('[data-heritage-dashboard-metric-value="' + id + '"]');
    var trend = root.querySelector('[data-heritage-metric-trend="' + id + '"]');
    var meta = root.querySelector('[data-heritage-metric-meta="' + id + '"]');
    var details = root.querySelector('[data-heritage-metric-details="' + id + '"]');
    var toggle = root.querySelector('[data-heritage-metric-toggle="' + id + '"]');
    var label = node.getAttribute('aria-label') || id;
    var copy = text();
    if (toggle) toggle.textContent = label + ' ' + copy.analysis;

    if (!data.length) {
      node.replaceChildren();
      node.classList.add('wb-dashboard-sparkline--empty');
      var emptyState = document.createElement('span');
      emptyState.className = 'wb-dashboard-sparkline__state';
      emptyState.textContent = copy.noValues;
      node.appendChild(emptyState);
      if (value) value.textContent = '-';
      if (trend) trend.textContent = copy.trend + ' -';
      if (meta) meta.textContent = copy.noValues;
      if (details) details.hidden = true;
      if (toggle) toggle.hidden = true;
      if (card) card.dataset.heritageMetricState = 'empty';
      node.setAttribute('role', 'status');
      return false;
    }

    var state = stats(data);
    var width = 260;
    var height = 86;
    var pad = 7;
    var points = sparklinePoints(data, width, height, pad, state.min, state.max);
    var line = points.map(function (point) { return point[0].toFixed(1) + ',' + point[1].toFixed(1); }).join(' ');
    var area = pad + ',' + (height - pad) + ' ' + line + ' ' + (width - pad) + ',' + (height - pad);
    var firstLabel = Array.isArray(labels) && labels.length ? String(labels[0]) : '';
    var lastLabel = Array.isArray(labels) && labels.length ? String(labels[labels.length - 1]) : '';
    var trendText = state.trend === 'flat' ? copy.stable : (state.delta > 0 ? '+' : '') + formatNumber(state.delta);

    if (value) value.textContent = formatNumber(state.latest);
    if (trend) {
      trend.textContent = copy.trend + ' ' + trendText;
      trend.dataset.heritageMetricTrendDirection = state.trend;
      trend.title = copy.trendHint;
    }
    if (meta) meta.textContent = copy.meanShort + ' ' + formatNumber(state.avg) + ' \u00b7 ' + copy.minShort + ' ' + formatNumber(state.min) + ' \u00b7 ' + copy.maxShort + ' ' + formatNumber(state.max);
    if (card) {
      card.dataset.heritageMetricState = 'ready';
      card.dataset.heritageMetricLatest = String(state.latest);
      card.dataset.heritageMetricMin = String(state.min);
      card.dataset.heritageMetricMax = String(state.max);
      card.dataset.heritageMetricAverage = String(state.avg);
      card.dataset.heritageMetricDelta = String(state.delta);
      card.dataset.heritageMetricTrend = state.trend;
      card.dataset.heritageMetricSamples = String(state.samples);
    }

    node.dataset.heritageMetricValues = data.join(',');
    node.dataset.heritageMetricLabel = label;
    node.dataset.heritageMetricLatest = String(state.latest);
    node.title = label + ': ' + formatNumber(state.latest) + (lastLabel ? ' - ' + lastLabel : '');
    renderSparkline(node, width, height, label, state, points, area, line, data, labels);

    if (details) {
      details.replaceChildren(
        detailRow(copy.current, formatNumber(state.latest)),
        detailRow(copy.trend, trendText),
        detailRow(copy.minimum, formatNumber(state.min)),
        detailRow(copy.average, formatNumber(state.avg)),
        detailRow(copy.maximum, formatNumber(state.max)),
        detailRow(copy.samples, state.samples),
        detailRow(copy.period, firstLabel && lastLabel ? firstLabel + ' - ' + lastLabel : copy.latestValues)
      );
    }
    if (toggle) toggle.hidden = false;
    return true;
  }

  function enhance(root) {
    root = root || document;
    queryAll(root, '[data-heritage-dashboard-metrics-data]').forEach(function (payload) {
      if (payload.dataset.heritageDashboardMetricsReady === 'true') return;
      payload.dataset.heritageDashboardMetricsState = 'loading';
      queryAll(root, '[data-heritage-metric-card]').forEach(function (card) {
        card.dataset.heritageMetricState = 'loading';
        card.setAttribute('aria-busy', 'true');
      });
      var data;
      try {
        data = parsePayload(payload.textContent || '{}');
      } catch (error) {
        payload.dataset.heritageDashboardMetricsState = 'error';
        queryAll(root, '.wb-dashboard-sparkline').forEach(function (node) {
          node.replaceChildren();
          node.classList.add('wb-dashboard-sparkline--error');
          var errorState = document.createElement('span');
          errorState.className = 'wb-dashboard-sparkline__state';
          errorState.textContent = text().unavailable;
          node.appendChild(errorState);
          node.setAttribute('role', 'status');
          var card = node.closest('[data-heritage-metric-card]');
          if (card) {
            card.dataset.heritageMetricState = 'error';
            card.removeAttribute('aria-busy');
          }
        });
        payload.removeAttribute('data-heritage-dashboard-metrics-ready');
        document.dispatchEvent(new CustomEvent('heritage:dashboard-metrics-error', {
          detail: { payload: payload, error: error }
        }));
        return;
      }
      var rendered = 0;
      Object.keys(data.series || {}).forEach(function (id) {
        if (renderMetric(root, id, data.series[id], data.labels || [])) rendered += 1;
      });
      payload.dataset.heritageDashboardMetricsState = rendered ? 'rendered' : 'empty';
      payload.dataset.heritageDashboardMetricsRendered = String(rendered);
      payload.dataset.heritageDashboardMetricsReady = 'true';
      queryAll(root, '[data-heritage-metric-card]').forEach(function (card) {
        card.removeAttribute('aria-busy');
      });
      document.dispatchEvent(new CustomEvent('heritage:dashboard-metrics-ready', {
        detail: { payload: payload, rendered: rendered }
      }));
    });
  }

  function toggleDetails(button) {
    var id = button && button.getAttribute('data-heritage-metric-toggle');
    var details = id ? document.querySelector('[data-heritage-metric-details="' + id + '"]') : null;
    if (!details) return;
    var expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    details.hidden = expanded;
  }

  window.heritageDashboardMetrics = { enhance: enhance, parsePayload: parsePayload };
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  document.addEventListener('heritage:content-ready', function (event) { enhance(event.detail && event.detail.root ? event.detail.root : document); });
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-heritage-metric-toggle]') : null;
    if (!button) return;
    event.preventDefault();
    toggleDetails(button);
  });
})(window, document);

/* source: heritage-dashboard-layout.js */
(function () {
  'use strict';

  var STORAGE_KEY = 'ispconfig-workbench.dashboard.layout.v7';
  // V2 retires persisted row-spanning layouts that could turn quota and
  // statistics widgets into a single extremely tall grid track after login.
  // The storage key stays stable; the revision deliberately resets only the
  // incompatible geometry while preserving the public layout contract.
  var LAYOUT_REVISION = 'premium-density-v3';
  var sizes = ['1x1', '1x2', '2x2'];
  var defaults = {
    modules: '2x2',
    metrics: '2x2',
    statistics: '1x2',
    limits: '1x1',
    databasequota: '1x1',
    quota: '1x1',
    mailquota: '1x1',
    donate: '1x1',
    news: '1x1'
  };
  var defaultOrder = {
    modules: 10,
    metrics: 20,
    statistics: 25,
    limits: 30,
    quota: 40,
    mailquota: 50,
    databasequota: 60,
    news: 90,
    donate: 100
  };
  var defaultHidden = {
    donate: true,
    news: true,
    quota: true,
    mailquota: true,
    databasequota: true
  };
  var priority = {
    modules: 'primary',
    metrics: 'primary',
    statistics: 'primary',
    limits: 'operational',
    quota: 'operational',
    mailquota: 'operational',
    databasequota: 'operational',
    news: 'secondary',
    donate: 'secondary'
  };
  var copy = {
    en: {
      moreItems: '{count} more items available', showMore: 'Show more', expandWidget: 'Expand {name}', widget: 'widget',
      overview: 'Dashboard overview', availableModules: 'Available modules', quickDestinations: 'Quick destinations',
      needsAttention: 'Needs attention', attentionDetail: '{critical} critical, {warning} warnings', activeWidgets: 'Active widgets',
      personalLayout: 'Personal browser layout', layoutEditing: 'Layout mode: drag widgets or use the arrow and size controls.',
      layoutSaved: 'Your personal widget layout is saved in this browser.', finishEditing: 'Finish editing',
      customizeDashboard: 'Customize dashboard', showHiddenCount: 'Show hidden widgets ({count})', noHiddenWidgets: 'No hidden widgets',
      layoutControls: '{name} layout controls', dashboardWidget: 'Dashboard widget', moveEarlier: 'Move widget earlier',
      moveLater: 'Move widget later', hide: 'Hide', accountLimitSummary: 'Account limit summary', limitsTracked: 'limits tracked',
      warning: 'warning', warnings: 'warnings', critical: 'critical', showDetails: 'Show details', hideDetails: 'Hide details',
      accountLimitWarnings: 'Account limit warnings', limitsHealthy: 'All account limits are within the configured range.',
      accountLimit: 'Account limit', moreInDetails: '+{count} more in details', dashboardLayoutControls: 'Dashboard layout controls',
      resetLayout: 'Reset layout', showHiddenWidgets: 'Show hidden widgets', openModule: 'Open module', editHint: 'Move and resize',
      dragWidget: 'Drag {name} to reposition', resizeTo: 'Resize {name} to {size}', hideWidget: 'Hide {name}',
      emptyTitle: 'Your dashboard is clear', emptyText: 'All widgets are hidden. Restore the recommended operational view or choose every widget from the toolbar.', restoreWidgets: 'Restore recommended view',
      confirmReset: 'Confirm reset', resetWarning: 'Click again to restore the default widget order and sizes.',
      workspace: 'Operations workspace', workspaceSummary: 'Services, capacity and shortcuts at a glance.',
      destinationCount: '{count} destinations', destinationSingle: '1 destination', metricCount: '{count} live metrics', metricSingle: '1 live metric',
      capacityHealthy: '{count} capacity checks - healthy', capacityAttention: '{count} capacity checks - {attention} notices',
      newsCount: '{count} updates', optionalContent: 'Optional',
      currentValue: 'Current value', systemLoad: 'System load', memoryUsage: 'Memory usage', networkIn: 'Network in', networkOut: 'Network out',
      limitMail: 'Email', limitWeb: 'Web & access', limitDns: 'DNS', limitDatabase: 'Databases', limitClients: 'Customers & users', limitOther: 'Other',
      groupHealthy: 'Within range', groupAttention: '{count} notices', quotaEntries: 'Entries', totalUsage: 'Total usage', quotaHealthy: 'No quota warnings', quotaAttention: '{count} need attention',
      moduleWidget: 'Module', metricWidget: 'Metric', individualModule: 'Single module', individualMetric: 'Live metric',
      sizeCompact: 'Compact', sizeTall: 'Tall', sizeDetail: 'Detail',
      sizeCompactHint: 'Fits one dashboard tile', sizeTallHint: 'More vertical detail', sizeDetailHint: 'Largest dashboard view'
    },
    de: {
      moreItems: '{count} weitere Einträge verfügbar', showMore: 'Mehr anzeigen', expandWidget: '{name} vergrößern', widget: 'Widget',
      overview: 'Dashboard-Übersicht', availableModules: 'Verfügbare Module', quickDestinations: 'Direkteinstiege',
      needsAttention: 'Aufmerksamkeit', attentionDetail: '{critical} kritisch, {warning} Warnungen', activeWidgets: 'Aktive Widgets',
      personalLayout: 'Persönliches Browser-Layout', layoutEditing: 'Layoutmodus: Widgets ziehen oder Pfeil- und Größensteuerung verwenden.',
      layoutSaved: 'Das persönliche Widget-Layout ist in diesem Browser gespeichert.', finishEditing: 'Bearbeitung beenden',
      customizeDashboard: 'Dashboard anpassen', showHiddenCount: 'Ausgeblendete Widgets zeigen ({count})', noHiddenWidgets: 'Keine ausgeblendeten Widgets',
      accountLimit: 'Kontolimit', moreInDetails: '+{count} weitere in den Details', dashboardLayoutControls: 'Dashboard-Layoutsteuerung',
      moveLater: 'Widget nach hinten verschieben', hide: 'Ausblenden', accountLimitSummary: 'Zusammenfassung der Kontolimits', limitsTracked: 'Limits überwacht',
      warning: 'Warnung', warnings: 'Warnungen', critical: 'kritisch', showDetails: 'Details anzeigen', hideDetails: 'Details ausblenden',
      accountLimitWarnings: 'Warnungen zu Kontolimits', limitsHealthy: 'Alle Kontolimits liegen im konfigurierten Bereich.',
      layoutControls: 'Layoutsteuerung für {name}', dashboardWidget: 'Dashboard-Widget', moveEarlier: 'Widget nach vorne verschieben',
      resetLayout: 'Layout zurücksetzen', showHiddenWidgets: 'Ausgeblendete Widgets zeigen', openModule: 'Modul öffnen', editHint: 'Verschieben und skalieren',
      dragWidget: '{name} zum Verschieben ziehen', resizeTo: '{name} auf {size} skalieren', hideWidget: '{name} ausblenden',
      emptyTitle: 'Das Dashboard ist aufgeräumt', emptyText: 'Alle Widgets sind ausgeblendet. Stelle die empfohlene Arbeitsansicht wieder her oder zeige über die Werkzeugleiste bewusst alle Widgets.', restoreWidgets: 'Empfohlene Ansicht wiederherstellen',
      confirmReset: 'Zurücksetzen bestätigen', resetWarning: 'Erneut klicken, um Standardreihenfolge und -größen wiederherzustellen.',
      workspace: 'Arbeitsbereich Betrieb', workspaceSummary: 'Dienste, Kapazitäten und Direkteinstiege auf einen Blick.',
      destinationCount: '{count} Direkteinstiege', destinationSingle: '1 Direkteinstieg', metricCount: '{count} Live-Kennzahlen', metricSingle: '1 Live-Kennzahl',
      capacityHealthy: '{count} Kapazitaetspruefungen - stabil', capacityAttention: '{count} Kapazitaetspruefungen - {attention} Hinweise',
      newsCount: '{count} Meldungen', optionalContent: 'Optional',
      currentValue: 'Aktueller Wert', systemLoad: 'Systemlast', memoryUsage: 'Speicherauslastung', networkIn: 'Netzwerk eingehend', networkOut: 'Netzwerk ausgehend',
      limitMail: 'E-Mail', limitWeb: 'Web & Zugänge', limitDns: 'DNS', limitDatabase: 'Datenbanken', limitClients: 'Kunden & Benutzer', limitOther: 'Sonstige',
      groupHealthy: 'Im grünen Bereich', groupAttention: '{count} Hinweise', quotaEntries: 'Einträge', totalUsage: 'Gesamtnutzung', quotaHealthy: 'Keine Quota-Warnungen', quotaAttention: '{count} benötigen Aufmerksamkeit',
      moduleWidget: 'Modul', metricWidget: 'Kennzahl', individualModule: 'Einzelmodul', individualMetric: 'Live-Kennzahl',
      sizeCompact: 'Kompakt', sizeTall: 'Hoch', sizeDetail: 'Detail',
      sizeCompactHint: 'Passt in eine Dashboard-Kachel', sizeTallHint: 'Mehr vertikale Details', sizeDetailHint: 'Groesste Dashboard-Ansicht'
    }
  };

  function language() {
    var active = typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : String(document.documentElement.lang || 'en');
    return String(active).toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }

  function t(key, values) {
    var text = (copy[language()] && copy[language()][key]) || copy.en[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), String(values[name]));
    });
    return text;
  }

  function readLayout() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return stored && stored.__revision === LAYOUT_REVISION ? stored : {};
    }
    catch (error) { return {}; }
  }

  function writeLayout(layout) {
    try {
      layout.__revision = LAYOUT_REVISION;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    }
    catch (error) { /* Private browsing may disable localStorage. */ }
  }

  function dashlets(host) {
    return Array.prototype.slice.call(host.querySelectorAll(':scope > .wb-dashlet'));
  }

  function normalizeServerDashlets(host) {
    var boundary = host.querySelector(':scope > [data-heritage-dashboard-server-content]');
    if (!boundary) return;
    var widgets = Array.prototype.slice.call(boundary.children).filter(function (node) {
      return node.classList && node.classList.contains('wb-dashlet');
    });
    widgets.forEach(function (node) {
      boundary.insertAdjacentElement('beforebegin', node);
    });
    if (!boundary.children.length && !boundary.textContent.trim()) boundary.remove();
  }

  function makeEl(tag, className, value) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined && value !== null) item.textContent = value;
    return item;
  }

  function hiddenIcon(className, value) {
    var item = makeEl('span', className, value);
    item.setAttribute('aria-hidden', 'true');
    return item;
  }

  function dashboardButton(label, attributes) {
    var button = makeEl('button', '', label);
    button.type = 'button';
    Object.keys(attributes || {}).forEach(function (name) {
      button.setAttribute(name, attributes[name]);
    });
    return button;
  }

  function slug(value) {
    return String(value || 'widget').toLowerCase()
      .replace(/&[a-z0-9#]+;/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'widget';
  }

  function sizeLabel(size) {
    if (size === '1x2') return t('sizeTall');
    if (size === '2x2') return t('sizeDetail');
    return t('sizeCompact');
  }

  function sizeHint(size) {
    if (size === '1x2') return t('sizeTallHint');
    if (size === '2x2') return t('sizeDetailHint');
    return t('sizeCompactHint');
  }

  function setSize(node, size) {
    var safe = sizes.indexOf(size) >= 0 ? size : '1x1';
    node.dataset.heritageSize = safe;
    node.setAttribute('data-heritage-size', safe);
    node.setAttribute('data-heritage-density', safe === '1x1' ? 'compact' : 'expanded');
    if (node.dataset.heritageAtomicSource === 'modules') {
      node.dataset.heritageModuleViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    if (node.dataset.heritageAtomicSource === 'metrics') {
      node.dataset.heritageMetricViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    node.classList.remove('wb-dashlet-size-1x1', 'wb-dashlet-size-1x2', 'wb-dashlet-size-2x2');
    node.classList.add('wb-dashlet-size-' + safe);
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-layout-size]'), function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-heritage-layout-size') === safe ? 'true' : 'false');
    });
    syncDensity(node);
    syncMetricAnalysisVisibility(node, safe);
  }

  function syncMetricAnalysisVisibility(node, size) {
    if (node.dataset.heritageAtomicSource !== 'metrics') return;
    var expanded = size === '2x2';
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-metric-details]'), function (details) {
      details.hidden = !expanded;
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-metric-toggle]'), function (toggle) {
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function densityItems(node) {
    var name = node.dataset.heritageDashlet;
    if (name === 'modules') return Array.prototype.slice.call(node.querySelectorAll('.modules > li'));
    if (name === 'news') return Array.prototype.slice.call(node.querySelectorAll('ul > li'));
    if (name === 'metrics') return Array.prototype.slice.call(node.querySelectorAll('.wb-dashboard-metric-card'));
    if (name === 'statistics') return Array.prototype.slice.call(node.querySelectorAll('.wb-statistics-launcher'));
    if (name === 'quota' || name === 'mailquota' || name === 'databasequota') {
      return Array.prototype.slice.call(node.querySelectorAll('.table-wrapper table > tbody > tr'));
    }
    return [];
  }

  function densityLimit(node) {
    return node.dataset.heritageDashlet === 'modules' ? 4 : node.dataset.heritageDashlet === 'news' ? 3 : node.dataset.heritageDashlet === 'metrics' ? 2 : node.dataset.heritageDashlet === 'statistics' ? 3 : 5;
  }

  function syncDensity(node) {
    var items = densityItems(node);
    var compact = node.dataset.heritageSize === '1x1';
    var limit = densityLimit(node);
    var hiddenCount = 0;
    items.forEach(function (item, index) {
      var hide = compact && index >= limit;
      if (hide) {
        item.hidden = true;
        item.dataset.heritageDensityHidden = 'true';
        hiddenCount += 1;
      } else if (item.dataset.heritageDensityHidden === 'true') {
        item.hidden = false;
        delete item.dataset.heritageDensityHidden;
      }
    });
    var existing = node.querySelector(':scope > .wb-dashlet__density-note');
    if (existing) existing.remove();
    if (!hiddenCount) return;
    var note = document.createElement('div');
    note.className = 'wb-dashlet__density-note';
    note.setAttribute('role', 'status');
    var text = document.createElement('span');
    text.textContent = t('moreItems', { count: hiddenCount });
    note.appendChild(text);
    var expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'wb-dashlet__density-expand';
    expand.textContent = t('showMore');
    expand.setAttribute('aria-label', t('expandWidget', { name: node.getAttribute('aria-label') || t('widget') }));
    expand.addEventListener('click', function () {
      setSize(node, node.dataset.heritageDashlet === 'modules' ? '2x2' : '1x2');
      var host = node.parentElement;
      if (host) save(host);
    });
    note.appendChild(expand);
    node.appendChild(note);
  }

  function hiddenCount(host) {
    return dashlets(host).filter(function (node) { return node.dataset.heritageHidden === 'true'; }).length;
  }

  function decorateModules(node) {
    if (node.dataset.heritageModulesDecorated === 'true') return;
    Array.prototype.forEach.call(node.querySelectorAll('.modules > li'), function (launcher) {
      var title = launcher.querySelector('.title');
      var action = launcher.querySelector('a.button[data-heritage-module], a.button[data-capp]');
      launcher.classList.add('wb-module-launcher');
      if (title && !launcher.querySelector('.wb-module-launcher__meta')) {
        var meta = document.createElement('span');
        meta.className = 'wb-module-launcher__meta';
        meta.textContent = t('openModule');
        title.insertAdjacentElement('afterend', meta);
      }
      if (action) {
        action.classList.add('wb-module-launcher__action');
        action.setAttribute('aria-label', (action.textContent || t('openModule')).replace(/\s+/g, ' ').trim());
      }
    });
    node.dataset.heritageModulesDecorated = 'true';
  }

  function standardModuleTitle(moduleName) {
    var labels = language() === 'de' ? {
      dashboard: '\u00dcbersicht', help: 'Support', client: 'Kunden', sites: 'Webseiten',
      billing: 'Fakturierung', mail: 'E-Mail', dns: 'DNS', monitor: '\u00dcberwachung',
      tools: 'Einstellungen', admin: 'System'
    } : {
      dashboard: 'Overview', help: 'Support', client: 'Clients', sites: 'Sites',
      billing: 'Billing', mail: 'Email', dns: 'DNS', monitor: 'Monitoring',
      tools: 'Settings', admin: 'System'
    };
    return labels[String(moduleName || '').trim().toLowerCase()] || '';
  }

  function splitModuleDashlet(host) {
    var source = host.querySelector(':scope > .wb-dashlet[data-heritage-dashlet="modules"]');
    if (!source || source.dataset.heritageAtomicSplit === 'true') return;
    decorateModules(source);
    var items = Array.prototype.slice.call(source.querySelectorAll('.modules > li.wb-module-launcher'));
    if (!items.length) return;
    var anchor = source;
    items.forEach(function (item, index) {
      var titleNode = item.querySelector('.title');
      var title = titleNode ? titleNode.textContent.replace(/\s+/g, ' ').trim() : t('moduleWidget') + ' ' + (index + 1);
      var moduleLink = item.querySelector('[data-capp]');
      var moduleName = moduleLink ? moduleLink.getAttribute('data-capp') : '';
      var navigationItems = Array.prototype.slice.call(document.querySelectorAll('#heritage-mobile-navigation [data-heritage-module], #main-navigation [data-heritage-module]'));
      var matchingNavigationItems = navigationItems.filter(function (candidate) {
        return candidate.getAttribute('data-heritage-module') === moduleName;
      });
      var completeTitle = matchingNavigationItems.map(function (candidate) {
        var navigationTitle = candidate.querySelector('.title');
        return (navigationTitle ? navigationTitle.textContent : candidate.getAttribute('aria-label') || candidate.textContent || '').replace(/\s+/g, ' ').trim();
      }).sort(function (left, right) { return right.length - left.length; })[0] || standardModuleTitle(moduleName);
      if (completeTitle) {
        var shortenedTitle = title;
        title = completeTitle;
        if (titleNode) titleNode.textContent = completeTitle;
        if (moduleLink && shortenedTitle && moduleLink.textContent.indexOf(shortenedTitle) !== -1) {
          moduleLink.textContent = moduleLink.textContent.replace(shortenedTitle, completeTitle);
        }
      }
      var article = document.createElement('section');
      article.className = 'wb-dashlet wb-dashlet-module-atomic';
      article.dataset.heritageDashlet = 'module-' + slug(title) + '-' + index;
      article.dataset.heritageAtomicSource = 'modules';
      article.dataset.heritageAtomicLabel = t('individualModule');
      article.dataset.heritageDashboardCockpit = 'module';
      article.dataset.heritagePriority = 'primary';
      article.dataset.heritageDefaultOrder = String(10 + index);
      article.setAttribute('data-heritage-cockpit-card', 'module');
      var heading = makeEl('h3', '', title);
      var wrapper = makeEl('div', 'dashboard-modules-wrapper wb-dashboard-atomic-module');
      var list = makeEl('ul', 'modules');
      wrapper.appendChild(list);
      article.appendChild(heading);
      article.appendChild(wrapper);
      list.appendChild(item);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.heritageAtomicSplit = 'true';
    source.remove();
  }

  function decorateDonate(node) {
    if (node.dataset.heritageDonateDecorated === 'true') return;
    var button = node.querySelector('.wb-donate-card__toggle');
    var description = node.querySelector('[data-heritage-donate-description], #description');
    if (!button || !description) {
      node.dataset.heritageDonateDecorated = 'true';
      return;
    }
    if (!description.id) {
      description.id = 'wb-donate-description-' + Math.random().toString(36).slice(2, 8);
    }
    button.setAttribute('aria-controls', description.id);
    description.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      description.hidden = expanded;
    });
    node.dataset.heritageDonateDecorated = 'true';
  }

  function chartInstance(canvas) {
    if (!window.Chart) return null;
    if (typeof window.Chart.getChart === 'function') return window.Chart.getChart(canvas) || null;
    var match = null;
    Object.keys(window.Chart.instances || {}).some(function (key) {
      var chart = window.Chart.instances[key];
      if (chart && chart.canvas === canvas) { match = chart; return true; }
      return false;
    });
    return match;
  }

  function metricFallback(canvas) {
    return { loadchart: t('systemLoad'), memchart: t('memoryUsage'), rxchart: t('networkIn'), txchart: t('networkOut') }[canvas.id] || t('currentValue');
  }

  function metricValue(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '-';
    return number.toLocaleString(language() === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 });
  }

  function metricSource(card) {
    return card.querySelector('canvas, .wb-dashboard-sparkline');
  }

  function metricValuesFromSparkline(source) {
    if (!source || !source.dataset || !source.dataset.heritageMetricValues) return [];
    return source.dataset.heritageMetricValues.split(',').map(Number).filter(Number.isFinite);
  }

  function metricLabelFromSource(source) {
    if (!source) return t('currentValue');
    return source.dataset && source.dataset.heritageMetricLabel || source.getAttribute('aria-label') || metricFallback(source);
  }

  function syncMetricCards(node) {
    Array.prototype.forEach.call(node.querySelectorAll('.wb-dashboard-metric-card'), function (card) {
      var canvas = card.querySelector('canvas');
      var source = metricSource(card);
      var chart = canvas && chartInstance(canvas);
      var dataset = chart && chart.data && chart.data.datasets && chart.data.datasets[0];
      var values = dataset && dataset.data || metricValuesFromSparkline(source);
      var latest = values.length ? values[values.length - 1] : null;
      var label = card.querySelector('.wb-dashboard-metric-card__label');
      var value = card.querySelector('.wb-dashboard-metric-card__value');
      if (label) label.textContent = dataset && dataset.label || metricLabelFromSource(source || canvas || {});
      if (value) value.textContent = metricValue(latest);
      if (!chart) return;
      chart.options = chart.options || {};
      chart.options.plugins = chart.options.plugins || {};
      chart.options.plugins.legend = chart.options.plugins.legend || {};
      chart.options.plugins.legend.display = false;
      Object.keys(chart.options.scales || {}).forEach(function (key) {
        var scale = chart.options.scales[key];
        if (key === 'x') scale.display = false;
        scale.ticks = scale.ticks || {};
        scale.ticks.maxTicksLimit = 3;
      });
      if (dataset) { dataset.pointRadius = 0; dataset.pointHoverRadius = 3; dataset.borderWidth = 1.6; }
      canvas.style.removeProperty('background-color');
      if (typeof chart.update === 'function') chart.update('none');
    });
  }

  function decorateMetrics(node) {
    if (node.dataset.heritageMetricsDecorated === 'true') return;
    var content = node.querySelector(':scope > div');
    if (!content) return;
    var title = content.querySelector(':scope > div:first-child > h3');
    var titleHolder = title && title.parentElement;
    if (title) node.insertBefore(title, content);
    if (titleHolder && !titleHolder.textContent.trim() && !titleHolder.children.length) titleHolder.remove();
    content.classList.add('wb-dashboard-metrics-grid');
    Array.prototype.forEach.call(content.children, function (container) {
      var metric = container.querySelector && container.querySelector(':scope > canvas, :scope > .wb-dashboard-sparkline');
      if (!metric) return;
      container.classList.add('wb-dashboard-metric-card');
      container.style.removeProperty('padding-bottom');
      if (!container.querySelector('.wb-dashboard-metric-card__header')) {
        var header = document.createElement('header');
        header.className = 'wb-dashboard-metric-card__header';
        var label = makeEl('span', 'wb-dashboard-metric-card__label', metricLabelFromSource(metric));
        var value = makeEl('strong', 'wb-dashboard-metric-card__value', '-');
        value.setAttribute('aria-label', t('currentValue'));
        header.appendChild(label);
        header.appendChild(value);
        container.insertBefore(header, metric);
      }
    });
    node.dataset.heritageMetricsDecorated = 'true';
    window.requestAnimationFrame(function () { syncMetricCards(node); });
    window.setTimeout(function () { syncMetricCards(node); }, 120);
  }

  function splitMetricDashlet(host) {
    var source = host.querySelector(':scope > .wb-dashlet[data-heritage-dashlet="metrics"]');
    if (!source || source.dataset.heritageAtomicSplit === 'true') return;
    // Render the declarative metric payload before the source dashlet is split
    // into atomic widgets. Removing the source first also removed its JSON
    // payload, leaving all four charts permanently empty after login.
    if (window.heritageDashboardMetrics && typeof window.heritageDashboardMetrics.enhance === 'function') {
      window.heritageDashboardMetrics.enhance(source);
    }
    decorateMetrics(source);
    var cards = Array.prototype.slice.call(source.querySelectorAll('.wb-dashboard-metric-card'));
    if (!cards.length) return;
    var anchor = source;
    cards.forEach(function (card, index) {
      var metric = metricSource(card);
      var label = card.querySelector('.wb-dashboard-metric-card__label');
      var title = label ? label.textContent.replace(/\s+/g, ' ').trim() : metricLabelFromSource(metric || {});
      var article = document.createElement('section');
      article.className = 'wb-dashlet wb-dashlet-metric-atomic';
      article.dataset.heritageDashlet = 'metric-' + slug(metric && metric.id || title) + '-' + index;
      article.dataset.heritageAtomicSource = 'metrics';
      article.dataset.heritageAtomicLabel = t('individualMetric');
      article.dataset.heritageDashboardCockpit = 'metric';
      article.dataset.heritagePriority = 'primary';
      // Keep the four live metrics together as one visual dashboard group.
      // Operational limit cards follow afterwards and must not split the
      // metric sequence or impose their taller row height between charts.
      article.dataset.heritageDefaultOrder = String(20 + index);
      article.setAttribute('data-heritage-cockpit-card', 'metric');
      var heading = makeEl('h3', '', title);
      var metricHost = makeEl('div', 'wb-dashboard-single-metric');
      article.appendChild(heading);
      article.appendChild(metricHost);
      metricHost.appendChild(card);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.heritageAtomicSplit = 'true';
    source.remove();
    window.requestAnimationFrame(function () {
      dashlets(host).forEach(function (node) {
        if (node.dataset.heritageAtomicSource === 'metrics') syncMetricCards(node);
      });
    });
  }

  function splitAtomicDashlets(host) {
    var unsplitSource = host.querySelector(':scope > .wb-dashlet[data-heritage-dashlet="modules"], :scope > .wb-dashlet[data-heritage-dashlet="metrics"]');
    if (host.dataset.heritageAtomicDashboard === 'true' && !unsplitSource) return;
    if (unsplitSource) delete host.dataset.heritageAtomicDashboard;
    splitModuleDashlet(host);
    splitMetricDashlet(host);
    host.dataset.heritageAtomicDashboard = 'true';
  }

  function decorateHero(header) {
    if (!header || header.dataset.heritageHeroDecorated === 'true') return;
    var title = header.querySelector('h1');
    if (!title) return;
    var eyebrow = document.createElement('span');
    eyebrow.className = 'wb-dashboard-hero__eyebrow';
    eyebrow.textContent = t('workspace');
    title.insertAdjacentElement('beforebegin', eyebrow);
    var summary = document.createElement('p');
    summary.className = 'wb-dashboard-hero__summary';
    summary.textContent = t('workspaceSummary');
    title.insertAdjacentElement('afterend', summary);
    header.classList.add('wb-dashboard-hero');
    header.dataset.heritageHeroDecorated = 'true';
  }

  function syncOverview(host) {
    var header = host.querySelector(':scope > .page-header');
    if (!header) return null;
    decorateHero(header);
    var overview = host.querySelector(':scope > .wb-dashboard-overview');
    if (!overview) {
      overview = document.createElement('section');
      overview.className = 'wb-dashboard-overview';
      overview.setAttribute('aria-label', t('overview'));
      header.insertAdjacentElement('afterend', overview);
    }
    var moduleCount = host.querySelectorAll('.wb-module-launcher').length;
    var warningCount = host.querySelectorAll('.progress-bar-warning').length;
    var criticalCount = host.querySelectorAll('.progress-bar-danger').length;
    var visibleCount = dashlets(host).filter(function(node) { return node.dataset.heritageHidden !== 'true'; }).length;
    var totalCount = dashlets(host).length;
    var attention = warningCount + criticalCount;
    var modulesCard = overviewStat(t('availableModules'), moduleCount, t('quickDestinations'));
    var attentionCard = overviewStat(t('needsAttention'), attention, t('attentionDetail', { critical: criticalCount, warning: warningCount }), attention ? 'wb-dashboard-overview__stat--attention' : 'wb-dashboard-overview__stat--healthy');
    var layoutCard = overviewStat(t('activeWidgets'), visibleCount, t('personalLayout'), '', totalCount);
    overview.dataset.heritageAttention = attention ? 'true' : 'false';
    while (overview.firstChild) overview.removeChild(overview.firstChild);
    (attention ? [attentionCard, modulesCard, layoutCard] : [modulesCard, attentionCard, layoutCard]).forEach(function (card) {
      overview.appendChild(card);
    });
    return overview;
  }

  function overviewStat(label, value, detail, modifier, total) {
    var card = makeEl('article', 'wb-dashboard-overview__stat' + (modifier ? ' ' + modifier : ''));
    var strong = makeEl('strong', '', value);
    if (total !== undefined && total !== null) strong.appendChild(makeEl('em', '', '/' + total));
    card.appendChild(makeEl('span', '', label));
    card.appendChild(strong);
    card.appendChild(makeEl('small', '', detail));
    return card;
  }

  function showAllWidgets(host) {
    dashlets(host).forEach(function (node) {
      node.hidden = false;
      node.dataset.heritageHidden = 'false';
    });
    save(host);
    syncToolbar(host);
  }

  function restoreRecommended(host) {
    dashlets(host).forEach(function (node) {
      var hiddenByDefault = Boolean(defaultHidden[node.dataset.heritageDashlet]);
      node.hidden = hiddenByDefault;
      node.dataset.heritageHidden = hiddenByDefault ? 'true' : 'false';
      setSize(node, defaultSizeFor(node));
    });
    save(host);
    syncToolbar(host);
  }

  function syncEmptyState(host) {
    var visible = dashlets(host).some(function (node) { return node.dataset.heritageHidden !== 'true'; });
    var state = host.querySelector(':scope > .wb-dashboard-empty-state');
    if (visible) {
      if (state) state.remove();
      return;
    }
    if (state) return;
    state = document.createElement('section');
    state.className = 'wb-dashboard-empty-state';
    state.setAttribute('role', 'status');
    var content = makeEl('div');
    content.appendChild(makeEl('h2', '', t('emptyTitle')));
    content.appendChild(makeEl('p', '', t('emptyText')));
    state.appendChild(hiddenIcon('wb-dashboard-empty-state__icon'));
    state.appendChild(content);
    var restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'wb-dashboard-button wb-dashboard-button--primary';
    restore.textContent = t('restoreWidgets');
    restore.addEventListener('click', function () { restoreRecommended(host); });
    state.appendChild(restore);
    var toolbar = host.querySelector(':scope > .wb-dashboard-toolbar');
    (toolbar || host.querySelector(':scope > .wb-dashboard-overview') || host.querySelector(':scope > .page-header')).insertAdjacentElement('afterend', state);
  }

  function syncToolbar(host) {
    var toolbar = host.querySelector(':scope > .wb-dashboard-toolbar');
    if (!toolbar) return;
    var editing = host.classList.contains('wb-dashboard-layout-edit');
    var count = hiddenCount(host);
    var status = toolbar.querySelector('[data-heritage-layout-status]');
    var toggle = toolbar.querySelector('[data-heritage-layout-toggle]');
    var show = toolbar.querySelector('[data-heritage-layout-show-hidden]');
    toolbar.classList.toggle('wb-dashboard-toolbar--editing', editing);
    status.textContent = editing ? t('layoutEditing') : t('layoutSaved');
    toggle.setAttribute('aria-pressed', editing ? 'true' : 'false');
    toggle.textContent = editing ? t('finishEditing') : t('customizeDashboard');
    show.disabled = count === 0;
    show.textContent = count ? t('showHiddenCount', { count: count }) : t('noHiddenWidgets');
    syncOverview(host);
    syncEmptyState(host);
  }

  function save(host) {
    var layout = {};
    dashlets(host).forEach(function (node, index) {
      var name = node.dataset.heritageDashlet;
      if (name) layout[name] = { size: node.dataset.heritageSize || '1x1', order: index, hidden: node.dataset.heritageHidden === 'true' };
    });
    writeLayout(layout);
  }

  function makeControls(node, host) {
    var widgetTitle = node.querySelector(':scope > h2, :scope > h3, :scope > header');
    var widgetHeader = node.querySelector(':scope > .wb-dashlet__header');
    if (!widgetHeader) {
      widgetHeader = document.createElement('div');
      widgetHeader.className = 'wb-dashlet__header';
      node.insertBefore(widgetHeader, node.firstChild);
      if (widgetTitle) widgetHeader.appendChild(widgetTitle);
    }
    if (!widgetHeader.querySelector('.wb-dashlet__type-icon')) {
      var typeIcon = document.createElement('span');
      typeIcon.className = 'wb-dashlet__type-icon';
      typeIcon.setAttribute('aria-hidden', 'true');
      widgetHeader.insertBefore(typeIcon, widgetHeader.firstChild);
    }
    var titleText = widgetTitle ? widgetTitle.textContent.replace(/\s+/g, ' ').trim() : (node.dataset.heritageDashlet || t('dashboardWidget'));
    var dragHandle = document.createElement('span');
    dragHandle.className = 'wb-dashlet__drag-handle';
    dragHandle.setAttribute('role', 'button');
    dragHandle.setAttribute('tabindex', '0');
    dragHandle.setAttribute('aria-label', t('dragWidget', { name: titleText }));
    dragHandle.setAttribute('draggable', 'true');
    for (var dot = 0; dot < 6; dot += 1) dragHandle.appendChild(document.createElement('i'));
    widgetHeader.insertBefore(dragHandle, widgetHeader.firstChild);
    var editHint = document.createElement('span');
    editHint.className = 'wb-dashlet__edit-hint';
    editHint.textContent = t('editHint');
    widgetHeader.appendChild(editHint);
    var controls = document.createElement('div');
    controls.className = 'wb-dashlet__layout-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t('layoutControls', { name: titleText }));
    // Regression fix: inside makeControls the `node` parameter (the dashlet
    // element) shadows the module-level makeEl() element helper, so calling
    // makeEl('span', ...) threw "node is not a function". Build the label inline.
    var layoutLabel = document.createElement('span');
    layoutLabel.className = 'wb-dashlet__layout-label';
    layoutLabel.textContent = t('editHint');
    controls.appendChild(layoutLabel);
    controls.appendChild(dashboardButton('\u2191', { 'data-heritage-layout-move': 'up', 'aria-label': t('moveEarlier') }));
    controls.appendChild(dashboardButton('\u2193', { 'data-heritage-layout-move': 'down', 'aria-label': t('moveLater') }));
    controls.appendChild(dashboardButton('1\u00d71', { 'data-heritage-layout-size': '1x1' }));
    controls.appendChild(dashboardButton('1\u00d72', { 'data-heritage-layout-size': '1x2' }));
    controls.appendChild(dashboardButton('2\u00d72', { 'data-heritage-layout-size': '2x2' }));
    controls.appendChild(dashboardButton(t('hide'), { 'data-heritage-layout-hide': 'true' }));
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-heritage-layout-size]');
      var move = event.target.closest('[data-heritage-layout-move]');
      var hide = event.target.closest('[data-heritage-layout-hide]');
      if (hide) {
        node.dataset.heritageHidden = 'true';
        node.hidden = true;
        save(host);
        syncToolbar(host);
        return;
      }
      if (move) {
        var sibling = move.getAttribute('data-heritage-layout-move') === 'up' ? node.previousElementSibling : node.nextElementSibling;
        if (sibling && sibling.classList.contains('wb-dashlet')) {
          if (move.getAttribute('data-heritage-layout-move') === 'up') node.parentNode.insertBefore(node, sibling);
          else node.parentNode.insertBefore(sibling, node);
          save(host);
        }
        return;
      }
      if (!button) return;
      setSize(node, button.getAttribute('data-heritage-layout-size'));
      save(host);
    });
    widgetHeader.appendChild(controls);
    var moveUp = controls.querySelector('[data-heritage-layout-move="up"]');
    var moveDown = controls.querySelector('[data-heritage-layout-move="down"]');
    var sizeLabels = controls.querySelectorAll('[data-heritage-layout-size]');
    if (moveUp) moveUp.textContent = '\u2191';
    if (moveDown) moveDown.textContent = '\u2193';
    Array.prototype.forEach.call(sizeLabels, function (button) {
      var size = button.getAttribute('data-heritage-layout-size');
      button.textContent = size.replace('x', '\u00d7');
      button.setAttribute('data-heritage-size-code', size.replace('x', '\u00d7'));
      button.setAttribute('data-heritage-size-label', sizeLabel(size));
      button.setAttribute('title', sizeHint(size));
      button.setAttribute('aria-label', t('resizeTo', { name: titleText, size: sizeLabel(size) + ' ' + size.replace('x', '\u00d7') }));
      button.setAttribute('aria-pressed', button.getAttribute('data-heritage-layout-size') === node.dataset.heritageSize ? 'true' : 'false');
    });
    var hideButton = controls.querySelector('[data-heritage-layout-hide]');
    if (hideButton) hideButton.setAttribute('aria-label', t('hideWidget', { name: titleText }));
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'article');
    if (titleText) node.setAttribute('aria-label', titleText);
    syncDensity(node);
    node.addEventListener('keydown', function (event) {
      if (!host.classList.contains('wb-dashboard-layout-edit') || event.target.closest('button, a, input, select, textarea')) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      var sibling = event.key === 'ArrowUp' ? node.previousElementSibling : node.nextElementSibling;
      if (!sibling || !sibling.classList.contains('wb-dashlet')) return;
      if (event.key === 'ArrowUp') node.parentNode.insertBefore(node, sibling);
      else node.parentNode.insertBefore(sibling, node);
      save(host);
      node.focus();
    });
  }

  function limitSummaryItem(className, value, label) {
    var item = makeEl('span', className || '');
    item.appendChild(makeEl('strong', '', value));
    item.appendChild(document.createTextNode(' ' + label));
    return item;
  }

  function decorateDashboardTableLabels(table) {
    if (!table || table.dataset.heritageDashboardLabels === 'true') return;
    var headings = Array.prototype.map.call(table.querySelectorAll('thead th'), function (cell) {
      return cell.textContent.replace(/\s+/g, ' ').trim();
    });
    Array.prototype.forEach.call(table.querySelectorAll('tbody > tr'), function (row) {
      var cells = Array.prototype.slice.call(row.cells || []);
      var rowLabel = cells[0] ? cells[0].textContent.replace(/\s+/g, ' ').trim() : '';
      cells.forEach(function (cell, index) {
        if ((cell.getAttribute('data-heritage-label') || '').trim()) return;
        var label = headings[index] || (index === 0 ? t('accountLimit') : rowLabel);
        if (label) cell.setAttribute('data-heritage-label', label);
      });
    });
    table.dataset.heritageDashboardLabels = 'true';
  }

  function decorateLimits(node) {
    if (node.dataset.heritageLimitsDecorated === 'true') return;
    var table = node.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = table.querySelectorAll('tbody > tr');
    var warning = table.querySelectorAll('.progress-bar-warning').length;
    var critical = table.querySelectorAll('.progress-bar-danger').length;
    var summary = document.createElement('div');
    summary.className = 'wb-limit-summary';
    summary.setAttribute('aria-label', t('accountLimitSummary'));
    summary.appendChild(limitSummaryItem('', rows.length, t('limitsTracked')));
    summary.appendChild(limitSummaryItem('wb-limit-summary__warning', warning, t('warnings')));
    summary.appendChild(limitSummaryItem('wb-limit-summary__critical', critical, t('critical')));
    var detailsToggle = dashboardButton(t('showDetails'), { 'class': 'wb-limit-summary__toggle', 'aria-expanded': 'false' });
    summary.appendChild(detailsToggle);
    var wrapper = table.closest('.table-wrapper');
    (wrapper && wrapper.parentNode || node).insertBefore(summary, wrapper || table);
    var alertRows = Array.prototype.filter.call(rows, function (row) {
      return row.querySelector('.progress-bar-warning, .progress-bar-danger');
    });
    var alerts = document.createElement('div');
    alerts.className = 'wb-limit-alerts';
    alerts.setAttribute('aria-label', t('accountLimitWarnings'));
    if (!alertRows.length) {
      alerts.appendChild(makeEl('span', 'wb-limit-alerts__empty', t('limitsHealthy')));
    } else {
      alertRows.slice(0, 4).forEach(function (row) {
        var bar = row.querySelector('.progress-bar-warning, .progress-bar-danger');
        var label = row.cells && row.cells[0] ? row.cells[0].textContent.trim() : t('accountLimit');
        var severity = bar.classList.contains('progress-bar-danger') ? 'critical' : 'warning';
        var alert = makeEl('span', 'wb-limit-alert wb-limit-alert--' + severity);
        alert.appendChild(makeEl('strong', '', label));
        alert.appendChild(makeEl('em', '', t(severity)));
        alerts.appendChild(alert);
      });
      if (alertRows.length > 4) alerts.appendChild(makeEl('span', 'wb-limit-alerts__more', t('moreInDetails', { count: alertRows.length - 4 })));
    }
    summary.parentNode.insertBefore(alerts, summary.nextSibling);
    var groups = { mail: { total: 0, attention: 0 }, web: { total: 0, attention: 0 }, dns: { total: 0, attention: 0 }, database: { total: 0, attention: 0 }, clients: { total: 0, attention: 0 }, other: { total: 0, attention: 0 } };
    Array.prototype.forEach.call(rows, function (row) {
      var label = row.cells && row.cells[0] ? row.cells[0].textContent.toLowerCase() : '';
      var category = /mail|e-mail|email|postfach|spam|fetchmail/.test(label) ? 'mail' :
        /dns|zone|record/.test(label) ? 'dns' :
        /database|datenbank/.test(label) ? 'database' :
        /web|domain|ftp|shell|cron|php/.test(label) ? 'web' :
        /client|customer|kunde|reseller|user|benutzer/.test(label) ? 'clients' : 'other';
      groups[category].total += 1;
      if (row.querySelector('.progress-bar-warning, .progress-bar-danger')) groups[category].attention += 1;
    });
    var groupLabels = { mail: 'limitMail', web: 'limitWeb', dns: 'limitDns', database: 'limitDatabase', clients: 'limitClients', other: 'limitOther' };
    var groupOverview = document.createElement('div');
    groupOverview.className = 'wb-limit-groups';
    groupOverview.setAttribute('aria-label', t('accountLimitSummary'));
    Object.keys(groups).forEach(function (name) {
      var group = groups[name];
      if (!group.total) return;
      var card = document.createElement('article');
      card.className = 'wb-limit-group' + (group.attention ? ' wb-limit-group--attention' : '');
      var label = document.createElement('span');
      label.textContent = t(groupLabels[name]);
      var value = document.createElement('strong');
      value.textContent = String(group.total);
      var state = document.createElement('small');
      state.textContent = group.attention ? t('groupAttention', { count: group.attention }) : t('groupHealthy');
      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(state);
      groupOverview.appendChild(card);
    });
    summary.parentNode.insertBefore(groupOverview, alerts);
    summary.querySelector('.wb-limit-summary__toggle').addEventListener('click', function (event) {
      var expanded = node.classList.toggle('wb-dashlet-limits--expanded');
      event.currentTarget.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      event.currentTarget.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    node.dataset.heritageLimitsDecorated = 'true';
  }

  function quotaSummaryItem(className, label, value) {
    var item = makeEl('article', className || '');
    item.appendChild(makeEl('span', '', label));
    item.appendChild(makeEl('strong', '', value));
    return item;
  }

  function decorateQuota(node) {
    if (node.dataset.heritageQuotaDecorated === 'true') return;
    var wrapper = node.querySelector('.table-wrapper');
    var table = wrapper && wrapper.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody > tr'));
    var alertRows = rows.filter(function (row) { return row.querySelector('.progress-bar-warning, .progress-bar-danger'); });
    var footerValues = Array.prototype.map.call(table.querySelectorAll('tfoot th'), function (cell) { return cell.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var totalUsage = footerValues.length > 1 ? footerValues[footerValues.length - 1] : '-';
    var summary = document.createElement('div');
    summary.className = 'wb-quota-summary';
    summary.appendChild(quotaSummaryItem('', t('quotaEntries'), rows.length));
    summary.appendChild(quotaSummaryItem('', t('totalUsage'), totalUsage));
    summary.appendChild(quotaSummaryItem(alertRows.length ? 'wb-quota-summary__attention' : 'wb-quota-summary__healthy', alertRows.length ? t('quotaAttention', { count: alertRows.length }) : t('quotaHealthy'), alertRows.length));
    var alerts = document.createElement('div');
    alerts.className = 'wb-quota-alerts';
    alertRows.slice(0, 3).forEach(function (row) {
      var label = row.cells && row.cells[0] ? row.cells[0].textContent.replace(/\s+/g, ' ').trim() : t('quotaEntries');
      var progress = row.querySelector('[role="progressbar"]');
      var item = document.createElement('span');
      item.className = 'wb-quota-alert';
      var name = document.createElement('strong');
      name.textContent = label;
      var value = document.createElement('em');
      value.textContent = progress && progress.getAttribute('aria-valuenow') ? progress.getAttribute('aria-valuenow') + '%' : t('needsAttention');
      item.appendChild(name);
      item.appendChild(value);
      alerts.appendChild(item);
    });
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'wb-quota-details-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = t('showDetails');
    toggle.addEventListener('click', function () {
      var expanded = node.classList.toggle('wb-dashlet-quota-expanded');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    wrapper.parentNode.insertBefore(summary, wrapper);
    if (alertRows.length) wrapper.parentNode.insertBefore(alerts, wrapper);
    wrapper.parentNode.insertBefore(toggle, wrapper);
    node.classList.add('wb-dashlet-quota-collapsed');
    node.dataset.heritageQuotaDecorated = 'true';
  }

  function syncCardState(node) {
    var state = node.querySelector('.progress-bar-danger, .wb-limit-alert--critical') ? 'critical' :
      node.querySelector('.progress-bar-warning, .wb-limit-alert--warning') ? 'warning' : 'neutral';
    node.classList.remove('wb-dashlet-state-neutral', 'wb-dashlet-state-warning', 'wb-dashlet-state-critical');
    node.classList.add('wb-dashlet-state-' + state);
    node.dataset.heritageState = state;
  }

  function syncPrimaryContext(node) {
    var name = node.dataset.heritageDashlet;
    var atomicModule = node.dataset.heritageAtomicSource === 'modules';
    var atomicMetric = node.dataset.heritageAtomicSource === 'metrics';
    if (name !== 'modules' && name !== 'metrics' && name !== 'statistics' && !atomicModule && !atomicMetric) return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    var count = name === 'modules' || atomicModule ? node.querySelectorAll('.wb-module-launcher').length : name === 'statistics' ? node.querySelectorAll('.wb-statistics-launcher').length : node.querySelectorAll('.wb-dashboard-metric-card').length;
    if (atomicModule || atomicMetric) {
      context.textContent = node.dataset.heritageAtomicLabel || t(atomicMetric ? 'individualMetric' : 'individualModule');
      return;
    }
    var singleKey = name === 'metrics' || atomicMetric ? 'metricSingle' : 'destinationSingle';
    var pluralKey = name === 'metrics' || atomicMetric ? 'metricCount' : 'destinationCount';
    context.textContent = count === 1 ? t(singleKey) : t(pluralKey, { count: count });
  }

  function defaultSizeFor(node) {
    var name = node.dataset.heritageDashlet;
    if (node.dataset.heritageAtomicSource === 'modules') return '1x1';
    if (node.dataset.heritageAtomicSource === 'metrics') return '1x1';
    return defaults[name] || '1x1';
  }

  function syncOperationalContext(node) {
    var name = node.dataset.heritageDashlet;
    var operational = name === 'limits' || name === 'quota' || name === 'mailquota' || name === 'databasequota';
    if (!operational) return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context wb-dashlet__context--capacity';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    var count = name === 'limits' ? node.querySelectorAll('.wb-limit-group').length : node.querySelectorAll('.wb-quota-summary > article').length;
    var attention = node.querySelectorAll('.wb-limit-alert--warning, .wb-limit-alert--critical, .wb-quota-alert').length;
    context.dataset.heritageState = attention ? 'attention' : 'healthy';
    context.textContent = t(attention ? 'capacityAttention' : 'capacityHealthy', { count: count, attention: attention });
  }

  function syncSecondaryContext(node) {
    var name = node.dataset.heritageDashlet;
    if (name !== 'news' && name !== 'donate') return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context wb-dashlet__context--secondary';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    context.textContent = name === 'news' ? t('newsCount', { count: node.querySelectorAll('ul > li').length }) : t('optionalContent');
  }

  function enhance() {
    // Self-sufficient + idempotent: enhance is the single authority on the
    // dashboard state. It detects the dashboard by its raw, direct-child
    // .wb-dashlet widgets, sets the gating classes itself, and clears them on
    // non-dashboard pages. This removes the earlier fragile dependency on some
    // other code having set body.wb-dashboard-page first, which caused the
    // SPA-return race where the dashboard rendered undecorated.
    var host = document.getElementById('pageContent');
    if (!host) return false;
    normalizeServerDashlets(host);
    if (!host.querySelector(':scope > .wb-dashlet')) {
      document.body.classList.remove('wb-dashboard-page');
      host.classList.remove('wb-dashboard-layout');
      return false;
    }
    document.body.classList.add('wb-dashboard-page');
    host.classList.add('wb-dashboard-layout');
    splitAtomicDashlets(host);
    var layout = readLayout();
    var nodes = dashlets(host);
    nodes.forEach(function (node, index) {
      var name = node.dataset.heritageDashlet;
      if (node.dataset.heritageDefaultOrder === undefined) node.dataset.heritageDefaultOrder = String(defaultOrder[name] || 500 + index);
      node.dataset.heritagePriority = node.dataset.heritagePriority || priority[name] || 'standard';
    });
    nodes.sort(function (a, b) {
      var ao = layout[a.dataset.heritageDashlet] && layout[a.dataset.heritageDashlet].order;
      var bo = layout[b.dataset.heritageDashlet] && layout[b.dataset.heritageDashlet].order;
      return (typeof ao === 'number' ? ao : Number(a.dataset.heritageDefaultOrder)) - (typeof bo === 'number' ? bo : Number(b.dataset.heritageDefaultOrder));
    }).forEach(function (node) { host.appendChild(node); });
    dashlets(host).forEach(function (node) {
      var name = node.dataset.heritageDashlet;
      setSize(node, layout[name] && layout[name].size || defaultSizeFor(node));
      node.dataset.heritageHidden = layout[name] ? (layout[name].hidden ? 'true' : 'false') : (defaultHidden[name] ? 'true' : 'false');
      node.hidden = node.dataset.heritageHidden === 'true';
      node.draggable = false;
      node.setAttribute('aria-grabbed', 'false');
      if (name === 'limits') decorateLimits(node);
      if (name === 'modules') decorateModules(node);
      if (name === 'donate') decorateDonate(node);
      if (name === 'metrics') decorateMetrics(node);
      if (name === 'quota' || name === 'mailquota' || name === 'databasequota') decorateQuota(node);
      if (!node.querySelector('.wb-dashlet__layout-controls')) makeControls(node, host);
      syncCardState(node);
      syncPrimaryContext(node);
      syncOperationalContext(node);
      syncSecondaryContext(node);
    });
    if (!host.dataset.heritageLayoutDnD) {
      host.dataset.heritageLayoutDnD = 'true';
      var pointerSource = null;
      host.addEventListener('pointerdown', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (!node || !host.classList.contains('wb-dashboard-layout-edit') || !event.target.closest('.wb-dashlet__drag-handle')) return;
        pointerSource = node;
        node.classList.add('wb-dashlet--dragging');
        node.setPointerCapture(event.pointerId);
      });
      host.addEventListener('pointerup', function (event) {
        if (!pointerSource) return;
        var target = document.elementFromPoint(event.clientX, event.clientY);
        var destination = target && target.closest('.wb-dashlet');
        if (destination && destination !== pointerSource && host.contains(destination)) {
          destination.parentNode.insertBefore(pointerSource, destination);
          save(host);
        }
        pointerSource.classList.remove('wb-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('pointercancel', function () {
        if (pointerSource) pointerSource.classList.remove('wb-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('dragstart', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (!node || !host.classList.contains('wb-dashboard-layout-edit') || !event.target.closest('.wb-dashlet__drag-handle')) { event.preventDefault(); return; }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', node.dataset.heritageDashlet || '');
        node.setAttribute('aria-grabbed', 'true');
      });
      host.addEventListener('dragend', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (node) node.setAttribute('aria-grabbed', 'false');
      });
      host.addEventListener('dragover', function (event) {
        if (host.classList.contains('wb-dashboard-layout-edit') && event.target.closest('.wb-dashlet')) event.preventDefault();
      });
      host.addEventListener('drop', function (event) {
        if (!host.classList.contains('wb-dashboard-layout-edit')) return;
        var target = event.target.closest('.wb-dashlet');
        var name = event.dataTransfer.getData('text/plain');
        var source = name && host.querySelector('.wb-dashlet[data-heritage-dashlet="' + name + '"]');
        if (!target || !source || target === source) return;
        event.preventDefault();
        target.parentNode.insertBefore(source, target);
        save(host);
      });
    }
    var header = host.querySelector(':scope > .page-header');
    var overview = syncOverview(host);
    if (header && !host.querySelector(':scope > .wb-dashboard-toolbar')) {
      var toolbar = document.createElement('div');
      toolbar.className = 'wb-dashboard-toolbar';
      toolbar.setAttribute('aria-label', t('dashboardLayoutControls'));
      var status = document.createElement('span');
      status.className = 'wb-dashboard-toolbar__status';
      status.setAttribute('data-heritage-layout-status', 'true');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      toolbar.appendChild(status);
      var actions = document.createElement('div');
      actions.className = 'wb-dashboard-toolbar__actions';
      toolbar.appendChild(actions);
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'wb-dashboard-button wb-dashboard-button--primary wb-dashboard-layout-toggle wb-dashboard-toolbar__primary';
      toggle.textContent = t('customizeDashboard');
      toggle.setAttribute('data-heritage-layout-toggle', 'true');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', function () {
        host.classList.toggle('wb-dashboard-layout-edit');
        if (reset) {
          reset.dataset.heritageConfirm = 'false';
          reset.classList.remove('wb-dashboard-layout-reset--armed');
          reset.textContent = t('resetLayout');
        }
        syncToolbar(host);
      });
      actions.appendChild(toggle);
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'wb-dashboard-button wb-dashboard-layout-reset';
      reset.textContent = t('resetLayout');
      reset.setAttribute('data-heritage-layout-reset', 'true');
      var resetTimer = null;
      reset.addEventListener('click', function () {
        if (reset.dataset.heritageConfirm !== 'true') {
          reset.dataset.heritageConfirm = 'true';
          reset.classList.add('wb-dashboard-layout-reset--armed');
          reset.textContent = t('confirmReset');
          status.textContent = t('resetWarning');
          if (resetTimer) window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            reset.dataset.heritageConfirm = 'false';
            reset.classList.remove('wb-dashboard-layout-reset--armed');
            reset.textContent = t('resetLayout');
            syncToolbar(host);
          }, 6000);
          return;
        }
        if (resetTimer) window.clearTimeout(resetTimer);
        reset.dataset.heritageConfirm = 'false';
        reset.classList.remove('wb-dashboard-layout-reset--armed');
        reset.textContent = t('resetLayout');
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
        dashlets(host).sort(function (a, b) {
          return Number(a.dataset.heritageDefaultOrder || 0) - Number(b.dataset.heritageDefaultOrder || 0);
        }).forEach(function (node) {
          var hiddenByDefault = Boolean(defaultHidden[node.dataset.heritageDashlet]);
          node.hidden = hiddenByDefault;
          node.dataset.heritageHidden = hiddenByDefault ? 'true' : 'false';
          setSize(node, defaultSizeFor(node));
          host.appendChild(node);
        });
        save(host);
        syncToolbar(host);
      });
      actions.appendChild(reset);
      var show = document.createElement('button');
      show.type = 'button';
      show.className = 'wb-dashboard-button wb-dashboard-layout-show-hidden';
      show.textContent = t('showHiddenWidgets');
      show.setAttribute('data-heritage-layout-show-hidden', 'true');
      show.addEventListener('click', function () { showAllWidgets(host); });
      actions.appendChild(show);
      (overview || header).insertAdjacentElement('afterend', toolbar);
      syncToolbar(host);
    }
    return true;
  }

  // Robust, timing-independent trigger: a MutationObserver on #pageContent
  // re-runs enhance whenever the page fragment changes (SPA navigation), instead
  // of relying on navigation event ordering. The observer is disconnected around
  // enhance so enhance's own DOM writes never re-trigger it (no loop).
  function installDashboardEnhancer() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var observer = null;
    function run() {
      if (observer) observer.disconnect();
      try { enhance(); } catch (e) { if (window.console && window.console.error) window.console.error('dashboard enhance error', e); }
      if (observer) observer.observe(host, { childList: true });
    }
    if (window.MutationObserver) {
      observer = new MutationObserver(run);
      observer.observe(host, { childList: true });
    }
    run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installDashboardEnhancer);
  else installDashboardEnhancer();
  window.heritageDashboardLayout = { enhance: enhance, storageKey: STORAGE_KEY };
}());

/* source: heritage-dialog.js */
(function () {
  'use strict';

  var openDialog = null;
  var returnFocus = null;

  function focusable(dialog) {
    return Array.from(dialog.querySelectorAll('a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  function resolveDialog(value) {
    if (value && value.nodeType === 1) return value;
    if (typeof value !== 'string' || !value) return null;
    return document.getElementById(value.replace(/^#/, ''));
  }

  function isOpen(dialog) {
    var target = resolveDialog(dialog) || openDialog;
    return Boolean(target && !target.hidden && target.getAttribute('aria-hidden') === 'false');
  }

  function focus(dialog) {
    var target = resolveDialog(dialog) || openDialog;
    if (!isOpen(target)) return false;
    var preferred = target.querySelector('[data-heritage-dialog-autofocus]:not([disabled]):not([hidden])');
    var elements = focusable(target);
    (preferred || elements[0] || target).focus();
    return target.contains(document.activeElement);
  }

  function open(dialog, trigger) {
    var target = resolveDialog(dialog);
    if (!target || target.getAttribute('role') !== 'dialog') return false;
    if (openDialog && openDialog !== target) close(openDialog, false);
    if (target.parentElement !== document.body) {
      document.body.appendChild(target);
      target.setAttribute('data-heritage-dialog-portaled', 'true');
    }
    returnFocus = trigger && trigger.nodeType === 1 ? trigger : document.activeElement;
    openDialog = target;
    target.hidden = false;
    target.setAttribute('aria-hidden', 'false');
    target.setAttribute('data-heritage-dialog-state', 'open');
    document.body.classList.add('wb-dialog-open');
    document.body.setAttribute('data-heritage-dialog-active', target.id || 'dialog');
    if (returnFocus && returnFocus.setAttribute && (returnFocus.getAttribute('aria-haspopup') === 'dialog' || returnFocus.getAttribute('aria-controls') === target.id)) {
      returnFocus.setAttribute('aria-expanded', 'true');
    }
    focus(target);
    window.setTimeout(function () { focus(target); }, 0);
    target.dispatchEvent(new CustomEvent('heritage:dialog-open', { bubbles: true }));
    return true;
  }

  function close(dialog, restoreFocus) {
    var target = resolveDialog(dialog) || openDialog;
    if (!target || !isOpen(target)) return false;
    target.setAttribute('aria-hidden', 'true');
    target.hidden = true;
    target.setAttribute('data-heritage-dialog-state', 'closed');
    document.body.classList.remove('wb-dialog-open');
    document.body.removeAttribute('data-heritage-dialog-active');
    if (returnFocus && returnFocus.setAttribute && (returnFocus.getAttribute('aria-haspopup') === 'dialog' || returnFocus.getAttribute('aria-controls') === target.id)) {
      returnFocus.setAttribute('aria-expanded', 'false');
    }
    target.dispatchEvent(new CustomEvent('heritage:dialog-close', { bubbles: true }));
    openDialog = null;
    if (restoreFocus !== false && returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
    return true;
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-heritage-dialog]');
    if (trigger) {
      event.preventDefault();
      open(trigger.getAttribute('data-heritage-dialog'), trigger);
      return;
    }
    var closeControl = event.target.closest('[data-heritage-dialog-close]');
    if (closeControl && closeControl.closest('.wb-dialog')) {
      event.preventDefault();
      close(closeControl.closest('.wb-dialog'), true);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!openDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(openDialog, true);
      return;
    }
    if (event.key !== 'Tab') return;
    var elements = focusable(openDialog);
    if (!elements.length) {
      event.preventDefault();
      openDialog.focus();
      return;
    }
    var first = elements[0];
    var last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('focusin', function (event) {
    if (!openDialog || openDialog.contains(event.target)) return;
    focus(openDialog);
  });

  window.heritageDialog = {
    open: open,
    close: close,
    focus: focus,
    isOpen: isOpen
  };
  window.heritageDialogInstalled = true;
}());

/* source: heritage-disclosure.js */
(function () {
  'use strict';

  var generatedId = 0;

  function donationRoot(link) {
    var root = link && link.closest('div');
    if (!root || !root.querySelector('h4 button.btn-link.btn-xs') || !root.querySelector('#description')) return null;
    return root;
  }

  function enhanceDonation(root) {
    if (!root || root.dataset.heritageDisclosure === 'true') return false;
    var legacyTrigger = root.querySelector('h4 button.btn-link.btn-xs');
    var panel = root.querySelector('#description');
    if (!legacyTrigger || !panel) return false;

    generatedId += 1;
    var panelId = 'heritage-donation-details-' + generatedId;
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'wb-disclosure__trigger';
    trigger.textContent = legacyTrigger.textContent.trim();
    trigger.setAttribute('aria-controls', panelId);
    trigger.setAttribute('aria-expanded', 'false');

    panel.id = panelId;
    panel.classList.add('wb-disclosure__panel');
    panel.style.removeProperty('display');
    panel.hidden = true;
    root.classList.add('wb-disclosure');
    root.dataset.heritageDisclosure = 'true';
    legacyTrigger.replaceWith(trigger);

    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;
      root.dispatchEvent(new CustomEvent('heritage:disclosure-change', {
        bubbles: true,
        detail: { expanded: !expanded }
      }));
    });
    return true;
  }

  function enhance(root) {
    var host = root && root.querySelectorAll ? root : document;
    var links = [];
    if (host.matches && host.matches('a[href*="ispconfig.org/donation"]')) links.push(host);
    host.querySelectorAll('a[href*="ispconfig.org/donation"]').forEach(function (link) { links.push(link); });
    links.forEach(function (link) { enhanceDonation(donationRoot(link)); });
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) enhance(node);
        });
      });
    });
    var observe = function () {
      var pageContent = document.getElementById('pageContent');
      if (pageContent) observer.observe(pageContent, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
  }

  document.addEventListener('heritage:navigation-complete', function () {
    enhance(document.getElementById('pageContent'));
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); }, { once: true });
  } else {
    enhance(document);
  }

  window.heritageDisclosure = { enhance: enhance };
  window.heritageDisclosureInstalled = true;
}());

/* source: heritage-form-state.js */
(function () {
  'use strict';

  var messages = {};
  var language = typeof window.heritageLanguage === 'function'
    ? window.heritageLanguage()
    : document.documentElement.lang;
  var isGerman = String(language || document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;

  function localized(german, english) {
    return isGerman ? german : english;
  }
  var snapshot = null;
  var snapshotNodes = [];
  var snapshotAction = null;
  var legacy = window.ISPConfig;
  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function app() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  function editableHost() {
    var host = document.getElementById('pageContent');
    if (!host || !host.querySelector('[data-submit-form="pageForm"][data-form-action]')) return null;
    return host;
  }

  function saveAction(host) {
    var control = host && host.querySelector('[data-submit-form="pageForm"][data-form-action]');
    return control ? (control.getAttribute('data-form-action') || '').split('?')[0] : '';
  }

  function supportsFieldDiff(host) {
    return Boolean(host && saveAction(host));
  }

  function relevantControl(control) {
    return control && control.closest && control.closest('#pageContent') &&
      control.matches('input:not([type="hidden"]):not([type="file"]), select, textarea') &&
      !control.disabled && !control.readOnly && !control.classList.contains('no-page-form-change');
  }

  function controls(host) {
    return Array.from(host.querySelectorAll('input, select, textarea')).filter(relevantControl);
  }

  function controlValue(control) {
    if (control.type === 'checkbox' || control.type === 'radio') return control.checked ? 'checked:' + control.value : 'unchecked';
    if (control.tagName === 'SELECT' && control.multiple) {
      return Array.from(control.selectedOptions).map(function (option) { return option.value; }).join('\u001f');
    }
    return control.value;
  }

  function takeSnapshot(host) {
    if (!host || !supportsFieldDiff(host)) {
      snapshot = null;
      snapshotNodes = [];
      snapshotAction = null;
      return false;
    }
    snapshotNodes = controls(host);
    snapshot = snapshotNodes.map(controlValue);
    snapshotAction = saveAction(host);
    return true;
  }

  function snapshotExpired(host) {
    var current = controls(host);
    return !snapshot || snapshotAction !== saveAction(host) || current.length !== snapshotNodes.length ||
      snapshotNodes.some(function (control, index) { return !control.isConnected || current[index] !== control; });
  }

  function changedCount(host) {
    if (!supportsFieldDiff(host)) return null;
    if (snapshotExpired(host)) takeSnapshot(host);
    return snapshotNodes.reduce(function (count, control, index) {
      return count + (controlValue(control) === snapshot[index] ? 0 : 1);
    }, 0);
  }

  function ensureStatus(host) {
    var status = host.querySelector(':scope > .wb-page-meta > .wb-form-state, :scope > .wb-form-state');
    if (status) return status;
    status = document.createElement('div');
    status.className = 'wb-form-state';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    var indicator = document.createElement('span');
    indicator.className = 'wb-form-state__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.className = 'wb-form-state__label';
    status.appendChild(indicator);
    status.appendChild(label);
    var meta = host.querySelector(':scope > .wb-page-meta');
    var heading = host.querySelector(':scope > .page-header');
    if (meta) meta.appendChild(status);
    else if (heading) heading.insertAdjacentElement('afterend', status);
    else host.prepend(status);
    return status;
  }

  function setState(dirty, count) {
    var host = editableHost();
    if (!host) return false;
    var status = ensureStatus(host);
    var state = dirty ? 'dirty' : 'clean';
    status.dataset.state = state;
    if (typeof count === 'number') status.dataset.changedCount = String(count);
    else delete status.dataset.changedCount;
    var label = dirty
      ? (messages.form_dirty || localized('Ungespeicherte Änderungen', 'Unsaved changes'))
      : (messages.form_clean || localized('Keine ungespeicherten Änderungen', 'No unsaved changes'));
    if (dirty && typeof count === 'number') {
      label += ' · ' + count + ' ' + (count === 1
        ? (messages.form_field || localized('geändertes Feld', 'changed field'))
        : (messages.form_fields || localized('geänderte Felder', 'changed fields')));
    }
    var labelNode = status.querySelector('.wb-form-state__label');
    if (labelNode.textContent !== label) labelNode.textContent = label;
    return true;
  }

  function reconcileFieldDiff(host) {
    var count = changedCount(host);
    if (count === null) return false;
    var runtime = app();
    if (runtime) runtime.pageFormChanged = count > 0;
    setState(count > 0, count);
    return true;
  }

  function enhance() {
    var host = editableHost();
    if (!host) return false;
    if (supportsFieldDiff(host)) return reconcileFieldDiff(host);
    var runtime = app();
    return setState(Boolean(runtime && runtime.pageFormChanged));
  }

  function handleControlChange(event) {
    if (!relevantControl(event.target) || !editableHost()) return;
    window.setTimeout(function () {
      var host = editableHost();
      var runtime = app();
      if (!reconcileFieldDiff(host)) setState(Boolean(runtime && runtime.pageFormChanged));
    }, 0);
  }

  document.addEventListener('input', handleControlChange);
  document.addEventListener('change', handleControlChange);

  if (legacy && typeof legacy.resetFormChanged === 'function') {
    var originalReset = legacy.resetFormChanged;
    legacy.resetFormChanged = function () {
      var result = originalReset.apply(this, arguments);
      var host = editableHost();
      if (supportsFieldDiff(host)) takeSnapshot(host);
      setState(false, supportsFieldDiff(host) ? 0 : null);
      return result;
    };
  }

  if (window.MutationObserver) {
    var observe = function () {
      var host = document.getElementById('pageContent');
      if (!host) return;
      new MutationObserver(function (mutations) {
        var contentChanged = mutations.some(function (mutation) {
          return !mutation.target.closest || !mutation.target.closest('.wb-form-state');
        });
        if (contentChanged) enhance();
      }).observe(host, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
  }

  document.addEventListener('heritage:navigation-complete', enhance);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();

  window.heritageFormState = {
    enhance: enhance,
    setState: setState,
    getState: function () {
      var status = document.querySelector('#pageContent > .wb-page-meta > .wb-form-state, #pageContent > .wb-form-state');
      return status ? status.dataset.state : null;
    },
    getChangedCount: function () {
      var status = document.querySelector('#pageContent > .wb-page-meta > .wb-form-state, #pageContent > .wb-form-state');
      return status && status.dataset.changedCount !== undefined ? Number(status.dataset.changedCount) : null;
    }
  };
  window.heritageFormStateInstalled = true;
}());

/* source: heritage-tabstrip.js */
(function () {
  'use strict';

  var messages = {};
  var sequence = 0;
  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function icon(name) {
    var item = document.createElement('span');
    item.className = 'icon icon-' + name;
    item.setAttribute('aria-hidden', 'true');
    return item;
  }

  function update(wrapper) {
    var list = wrapper.querySelector('.wb-form-tabs');
    if (!list) return;
    var maximum = Math.max(0, list.scrollWidth - list.clientWidth);
    var overflow = maximum > 2;
    wrapper.dataset.overflow = String(overflow);
    wrapper.querySelector('.wb-tabstrip__previous').disabled = !overflow || list.scrollLeft <= 1;
    wrapper.querySelector('.wb-tabstrip__next').disabled = !overflow || list.scrollLeft >= maximum - 1;
  }

  function revealActive(wrapper) {
    var list = wrapper.querySelector('.wb-form-tabs');
    var active = list && list.querySelector('li.active');
    if (!active) return;
    var left = active.offsetLeft;
    var right = left + active.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
  }

  function scroll(wrapper, direction) {
    var list = wrapper.querySelector('.wb-form-tabs');
    if (!list) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({ left: direction * Math.max(120, Math.round(list.clientWidth * 0.72)), behavior: reduced ? 'auto' : 'smooth' });
  }

  function synchronizeAccessibility(list) {
    list.setAttribute('role', 'tablist');
    Array.from(list.querySelectorAll('a[data-change-tab]')).forEach(function (anchor) {
      var selected = Boolean(anchor.closest('li.active'));
      anchor.setAttribute('role', 'tab');
      anchor.setAttribute('aria-selected', String(selected));
      anchor.tabIndex = selected ? 0 : -1;
    });
  }

  function removeRetiredTabs(list) {
    Array.from(list.querySelectorAll('li')).forEach(function (item) {
      var anchor = item.querySelector('a');
      var target = ((anchor && (anchor.getAttribute('href') || anchor.getAttribute('data-change-tab'))) || '').toLowerCase();
      var label = ((anchor && anchor.textContent) || item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (target.indexOf('xmpp') !== -1 || label === 'xmpp') item.remove();
    });
  }

  function handleKeyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    var list = event.currentTarget;
    var tabs = Array.from(list.querySelectorAll('a[data-change-tab]'));
    var current = tabs.indexOf(document.activeElement);
    if (current < 0 || !tabs.length) return;
    event.preventDefault();
    var target = event.key === 'Home' ? 0 :
      event.key === 'End' ? tabs.length - 1 :
      (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[target].focus();
  }

  function enhance(root) {
    var scope = root && root.querySelectorAll ? root : document;
    Array.from(scope.querySelectorAll('.content-tab-wrapper > .wb-form-tabs')).forEach(function (list) {
      if (list.parentElement && list.parentElement.classList.contains('wb-tabstrip')) return;
      removeRetiredTabs(list);
      var wrapper = document.createElement('div');
      wrapper.className = 'wb-tabstrip';
      wrapper.dataset.heritageTabstrip = 'true';
      list.id = list.id || 'heritage-tab-list-' + (++sequence);
      list.setAttribute('aria-label', messages.tab_sections || 'Form sections');
      synchronizeAccessibility(list);
      list.parentNode.insertBefore(wrapper, list);
      wrapper.appendChild(list);

      var previous = document.createElement('button');
      previous.type = 'button';
      previous.className = 'wb-tabstrip__control wb-tabstrip__previous';
      previous.setAttribute('aria-label', messages.tab_previous || 'Scroll tabs left');
      previous.setAttribute('aria-controls', list.id);
      previous.appendChild(icon('arrow-left'));

      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'wb-tabstrip__control wb-tabstrip__next';
      next.setAttribute('aria-label', messages.tab_next || 'Scroll tabs right');
      next.setAttribute('aria-controls', list.id);
      next.appendChild(icon('arrow-right'));

      wrapper.insertBefore(previous, list);
      wrapper.appendChild(next);
      previous.addEventListener('click', function () { scroll(wrapper, -1); });
      next.addEventListener('click', function () { scroll(wrapper, 1); });
      list.addEventListener('scroll', function () { update(wrapper); }, { passive: true });
      list.addEventListener('keydown', handleKeyboard);
      if (window.ResizeObserver) new ResizeObserver(function () { revealActive(wrapper); update(wrapper); }).observe(list);
      revealActive(wrapper);
      update(wrapper);
      if (window.heritageIcons) window.heritageIcons.render(wrapper);
    });
  }

  if (window.MutationObserver) {
    var observe = function () {
      var host = document.getElementById('pageContent');
      if (!host) return;
      new MutationObserver(function () { enhance(host); }).observe(host, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
  }
  document.addEventListener('heritage:navigation-complete', function () { enhance(document.getElementById('pageContent')); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { enhance(document); }, { once: true });
  else enhance(document);

  window.heritageTabstrip = { enhance: enhance, update: update, revealActive: revealActive };
  window.heritageTabstripInstalled = true;
}());

/* source: heritage-tab-confirm.js */
(function () {
  'use strict';

  var pending = null;
  var committing = false;

  function app() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  function dialog() {
    return document.getElementById('heritageTabChangeDialog');
  }

  function recordId() {
    var control = document.querySelector('form#pageForm [name="id"]');
    return { exists: Boolean(control), value: control ? control.value : null };
  }

  function confirmationMode() {
    var runtime = app();
    if (!runtime || runtime.pageFormChanged !== true || runtime.requestsRunning > 0) return null;
    var id = recordId();
    if (runtime.tabChangeDiscard === 'y') return (!id.exists || id.value) ? 'discard' : null;
    if (id.value && runtime.tabChangeWarning === 'y') return 'warning';
    return null;
  }

  function configure(target, mode) {
    target.dataset.mode = mode;
    target.querySelector('[data-heritage-tab-confirm-message]').textContent = mode === 'discard'
      ? target.dataset.discardMessage
      : target.dataset.warningMessage;
    target.querySelector('[data-heritage-tab-confirm-action="save"]').hidden = mode !== 'warning';
  }

  function open(anchor, mode) {
    var target = dialog();
    if (!target || !window.heritageDialog || pending) return false;
    pending = { anchor: anchor, mode: mode };
    configure(target, mode);
    return window.heritageDialog.open(target, anchor);
  }

  function cancel() {
    var target = dialog();
    pending = null;
    if (target && window.heritageDialog) window.heritageDialog.close(target, true);
  }

  function commit(action) {
    var decision = pending;
    var target = dialog();
    if (!decision || !decision.anchor || !decision.anchor.isConnected || !target) return cancel();
    pending = null;
    committing = true;
    window.heritageDialog.close(target, false);
    committing = false;
    var runtime = app();
    if (!runtime || typeof runtime.switchTabDecision !== 'function') return;
    runtime.switchTabDecision(
      decision.anchor.getAttribute('data-change-tab'),
      decision.anchor.getAttribute('data-tab-target'),
      decision.anchor.getAttribute('data-tab-force') === 'true',
      action
    );
  }

  document.addEventListener('click', function (event) {
    var anchor = event.target.closest('.content-tab-wrapper .wb-form-tabs a[data-change-tab]');
    if (!anchor) return;
    var mode = confirmationMode();
    if (!mode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(anchor, mode);
  }, true);

  document.addEventListener('click', function (event) {
    var action = event.target.closest('#heritageTabChangeDialog [data-heritage-tab-confirm-action]');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    var value = action.getAttribute('data-heritage-tab-confirm-action');
    if (value === 'cancel') cancel();
    else commit(value);
  });

  document.addEventListener('heritage:dialog-close', function (event) {
    if (event.target !== dialog() || committing) return;
    pending = null;
  });

  window.heritageTabConfirm = {
    getPendingMode: function () { return pending ? pending.mode : null; },
    cancel: cancel
  };
  window.heritageTabConfirmInstalled = true;
}());

/* source: heritage-accessibility.js */
(function () {
  'use strict';

  var generatedId = 0;

  function ensureId(element, prefix) {
    if (!element.id) {
      generatedId += 1;
      element.id = prefix + '-' + generatedId;
    }
    return element.id;
  }

  function hasAccessibleName(control) {
    if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || control.title) return true;
    if (control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]')) return true;
    return Boolean(control.closest('label'));
  }

  function enhanceTable(table) {
    if (!table.querySelector('caption') && !table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')) {
      var heading = table.closest('#pageContent, .dashlet')?.querySelector('.page-header h1, .fieldset-legend, h1, h2');
      if (heading && heading.textContent.trim()) {
        var caption = document.createElement('caption');
        caption.className = 'wb-visually-hidden';
        caption.textContent = heading.textContent.trim();
        table.prepend(caption);
      }
    }

    table.querySelectorAll('thead th').forEach(function (header) {
      if (!header.hasAttribute('scope')) header.setAttribute('scope', 'col');
    });

    table.querySelectorAll('thead input, thead select, thead textarea').forEach(function (control) {
      if (hasAccessibleName(control)) return;
      var cell = control.closest('th, td');
      var firstRow = table.tHead && table.tHead.rows[0];
      var header = cell && firstRow && firstRow.cells[cell.cellIndex];
      var text = header && header.textContent.trim();
      if (text) control.setAttribute('aria-label', text);
    });

    table.querySelectorAll('.tbl_row_noresults').forEach(function (row) {
      if (!row.hasAttribute('role')) row.setAttribute('role', 'status');
    });
  }

  function enhanceFormGroup(group) {
    var label = group.querySelector(':scope > label.control-label');
    var controls = Array.from(group.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    if (label && controls.length === 1 && !hasAccessibleName(controls[0])) {
      label.htmlFor = ensureId(controls[0], 'wb-field');
    } else if (label && controls.length > 1) {
      var labelId = ensureId(label, 'wb-group-label');
      controls.forEach(function (control) {
        if (!hasAccessibleName(control)) control.setAttribute('aria-labelledby', labelId);
      });
    }

    if (group.classList.contains('has-error')) {
      var error = group.querySelector('.help-block, .error, [role="alert"]');
      controls.forEach(function (control) {
        control.setAttribute('aria-invalid', 'true');
        if (error) {
          var errorId = ensureId(error, 'wb-field-error');
          var describedBy = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
          if (!describedBy.includes(errorId)) describedBy.push(errorId);
          control.setAttribute('aria-describedby', describedBy.join(' '));
        }
      });
    }
  }

  function dialogFocusable(dialog) {
    return Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  function focusDialog(dialog) {
    if (!dialog || dialog.hidden || dialog.getAttribute('aria-hidden') === 'true') return false;
    var focusable = dialogFocusable(dialog);
    (focusable[0] || dialog).focus();
    return dialog.contains(document.activeElement);
  }

  function restoreDialogFocus(dialog) {
    if (!dialog) return false;
    var trigger = dialog.heritageDialogTrigger || document.querySelector('[aria-controls="' + CSS.escape(dialog.id) + '"]');
    if (!trigger) return false;
    trigger.setAttribute('aria-expanded', 'false');
    if (document.contains(trigger)) trigger.focus();
    dialog.heritageDialogTrigger = null;
    return document.activeElement === trigger;
  }

  function dialogIsOpen() {
    return Boolean(document.querySelector('.wb-dialog:not([hidden]):not([aria-hidden="true"]), .modal.in[role="dialog"], .modal.show[role="dialog"]'));
  }

  function focusPageTarget(target) {
    if (!target || !target.isConnected || dialogIsOpen() || document.visibilityState === 'hidden') return false;
    var temporaryTabindex = !target.hasAttribute('tabindex');
    if (temporaryTabindex) target.setAttribute('tabindex', '-1');
    target.setAttribute('data-heritage-page-focus', 'true');
    try { target.focus({ preventScroll: true }); }
    catch (error) { target.focus(); }
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
    }
    target.addEventListener('blur', function cleanup() {
      if (temporaryTabindex) target.removeAttribute('tabindex');
      target.removeAttribute('data-heritage-page-focus');
    }, { once: true });
    return document.activeElement === target;
  }

  function focusLoadedPage(root, context) {
    if (!root || !context || context.source !== 'navigation') return false;
    var heading = root.querySelector(':scope > .wb-page-header h1, :scope > .page-header h1, :scope > h1');
    return focusPageTarget(heading || root);
  }

  function focusNavigationError(root) {
    if (!root) return false;
    return focusPageTarget(root.querySelector('.wb-content-state--error .wb-content-state__retry, .wb-content-state--error'));
  }

  function enhanceDialog(dialog) {
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    if (!dialog.hasAttribute('aria-modal')) dialog.setAttribute('aria-modal', 'true');
    if (!dialog.getAttribute('aria-label') && !dialog.getAttribute('aria-labelledby')) {
      var title = dialog.querySelector('.modal-title, h1, h2, h3, h4');
      if (title) dialog.setAttribute('aria-labelledby', ensureId(title, 'wb-dialog-title'));
    }
    if (dialog.dataset.heritageFocusTrap !== 'true') {
      dialog.dataset.heritageFocusTrap = 'true';
      dialog.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && window.heritageDialog) {
          event.preventDefault();
          event.stopPropagation();
          window.heritageDialog.close(dialog, true);
          return;
        }
        if (event.key !== 'Tab') return;
        var focusable = dialogFocusable(dialog);
        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }
    if (dialog.dataset.heritageDialogEvents !== 'true') {
      dialog.dataset.heritageDialogEvents = 'true';
      dialog.addEventListener('heritage:dialog-open', function () { focusDialog(dialog); });
      dialog.addEventListener('heritage:dialog-close', function () { restoreDialogFocus(dialog); });
    }
  }

  function enhance(root) {
    var host = root && root.querySelectorAll ? root : document;
    if (host.matches && host.matches('table')) enhanceTable(host);
    host.querySelectorAll('table').forEach(enhanceTable);
    if (host.matches && host.matches('.form-group')) enhanceFormGroup(host);
    host.querySelectorAll('.form-group').forEach(enhanceFormGroup);
    if (host.matches && host.matches('.modal[role="dialog"]')) enhanceDialog(host);
    host.querySelectorAll('.modal[role="dialog"]').forEach(enhanceDialog);
  }

  document.addEventListener('heritage:navigation-complete', function (event) {
    var root = document.querySelector('#pageContent');
    enhance(root);
    if (event.detail && event.detail.error) {
      window.requestAnimationFrame(function() { focusNavigationError(root); });
    }
    window.setTimeout(function () { enhance(document.querySelector('#pageContent')); }, 100);
  });

  document.addEventListener('heritage:content-ready', function(event) {
    var detail = event.detail || {};
    var root = detail.root && detail.root.querySelectorAll ? detail.root : document.querySelector('#pageContent');
    window.requestAnimationFrame(function() { focusLoadedPage(root, detail.context || null); });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); }, { once: true });
  } else {
    enhance(document);
  }

  window.heritageAccessibility = {
    enhance: enhance,
    focusDialog: focusDialog,
    restoreDialogFocus: restoreDialogFocus,
    focusLoadedPage: focusLoadedPage,
    focusNavigationError: focusNavigationError
  };
  window.heritageAccessibilityInstalled = true;
}());

/* source: heritage-validation.js */
(function () {
  'use strict';

  var generatedId = 0;
  var messages = {};
  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function isGerman() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
  }

  function localizeKnownValidationText(root) {
    if (!root || !isGerman()) return;
    var copy = {
      'Validation failed': 'Eingaben pr\u00fcfen',
      'Please correct the highlighted field.': 'Bitte korrigieren Sie das markierte Feld.',
      'Please correct the highlighted fields.': 'Bitte korrigieren Sie die markierten Felder.',
      'Please check the highlighted fields.': 'Bitte pr\u00fcfen Sie die markierten Felder.',
      'Select a valid interface language.': 'Bitte w\u00e4hlen Sie eine g\u00fcltige Oberfl\u00e4chensprache.'
    };
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || '').trim();
      if (copy[value]) node.nodeValue = node.nodeValue.replace(value, copy[value]);
    }
  }

  function ensureId(element, prefix) {
    if (!element.id) {
      generatedId += 1;
      element.id = prefix + '-' + generatedId;
    }
    return element.id;
  }

  function fieldControl(group) {
    return group.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
  }

  function fieldLabel(group, control, index) {
    var label = group.querySelector('.control-label, label');
    var value = label && label.textContent.trim();
    return value || control.getAttribute('aria-label') || control.name || ((messages.validation_field || 'Field') + ' ' + (index + 1));
  }

  function fieldError(group) {
    var error = group.querySelector('.help-block, .error, [role="alert"]');
    return error ? error.textContent.trim() : '';
  }

  function alignFieldError(group) {
    var error = group && group.querySelector(':scope > .help-block, :scope > .help-inline, :scope > .error, :scope > [role="alert"]');
    var body = group && group.querySelector(':scope > .wb-field-body');
    if (error && body && !body.contains(error)) {
      body.appendChild(error);
      error.setAttribute('data-heritage-field-error-aligned', 'true');
    }
    return error;
  }

  function invalidEntries(host) {
    return Array.from(host.querySelectorAll('.form-group.has-error, .wb-field-group.has-error')).map(function (group, index) {
      var control = fieldControl(group);
      if (!control) return null;
      return { group: group, control: control, label: fieldLabel(group, control, index), error: fieldError(group) };
    }).filter(Boolean);
  }

  function summaryAlert(host, entries) {
    var alert = host.querySelector('.wb-validation-summary, .alert.alert-danger, #errorMsg');
    if (!alert && entries.length) {
      alert = document.createElement('div');
      alert.className = 'wb-validation-summary wb-validation-summary--generated';
      alert.dataset.heritageValidationGenerated = 'true';
      host.prepend(alert);
    }
    return alert;
  }

  function revealAndFocus(entry) {
    if (!entry || !entry.control) return false;
    var collapsed = entry.group.closest('.collapse:not(.in), .wb-collapse:not(.in)');
    if (collapsed && window.heritageInteractions) window.heritageInteractions.collapse(collapsed, true, entry.control);
    window.setTimeout(function () {
      if (entry.control.offsetParent !== null) entry.control.focus();
    }, 0);
    return true;
  }

  function enhance(root, options) {
    var host = root && root.querySelectorAll ? root : document.getElementById('pageContent');
    if (!host) return { errors: 0, focused: false };
    if (window.heritageAccessibility) window.heritageAccessibility.enhance(host);

    localizeKnownValidationText(host);
    var entries = invalidEntries(host);
    var alert = summaryAlert(host, entries);
    if (!alert || !alert.textContent.trim() && !entries.length) return { errors: 0, focused: false };

    alert.classList.add('wb-validation-summary');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('tabindex', '-1');
    alert.setAttribute('aria-live', 'assertive');
    alert.querySelectorAll('[data-heritage-validation-list]').forEach(function (node) { node.remove(); });

    var title = alert.querySelector('.alert-label strong, .alert-label, h1, h2, h3, h4');
    if (!title) {
      var label = document.createElement('strong');
      label.className = 'wb-validation-summary__title';
      label.textContent = messages.validation_summary || (isGerman() ? 'Bitte pr\u00fcfen Sie die markierten Felder.' : 'Please check the highlighted fields.');
      alert.prepend(label);
      title = label;
    }
    alert.setAttribute('aria-labelledby', ensureId(title, 'wb-validation-title'));

    if (entries.length) {
      var list = document.createElement('ul');
      list.className = 'wb-validation-summary__list';
      list.dataset.heritageValidationList = 'true';
      entries.forEach(function (entry) {
        entry.control.setAttribute('aria-invalid', 'true');
        ensureId(entry.control, 'wb-invalid-field');
        alignFieldError(entry.group);
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + entry.control.id;
        link.textContent = entry.label + (entry.error ? ': ' + entry.error : '');
        link.addEventListener('click', function (event) {
          event.preventDefault();
          revealAndFocus(entry);
        });
        item.appendChild(link);
        list.appendChild(item);
      });
      alert.appendChild(list);
    }

    alert.dataset.heritageValidationSummary = 'true';
    var shouldFocus = options && options.focus === true;
    if (shouldFocus) {
      if (!entries.length || !revealAndFocus(entries[0])) window.setTimeout(function () { alert.focus(); }, 0);
    }
    return { errors: entries.length, focused: shouldFocus };
  }

  document.addEventListener('heritage:navigation-complete', function () {
    enhance(document.getElementById('pageContent'), { focus: false });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document.getElementById('pageContent')); }, { once: true });
  } else {
    enhance(document.getElementById('pageContent'));
  }

  window.heritageValidation = { enhance: enhance, revealAndFocus: revealAndFocus };
  window.heritageValidationInstalled = true;
}());

/* source: heritage-submit-feedback.js */
(function () {
  'use strict';

  var active = null;
  var messages = {};
  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function host() {
    return document.getElementById('pageContent');
  }

  function localizedMessage(key, germanFallback, englishFallback) {
    var value = String(messages[key] || '').trim();
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    if (!value) return german ? germanFallback : englishFallback;
    if (german && [
      'Saving changes',
      'Please review the highlighted errors',
      'Changes saved',
      'Changes could not be saved. Try again.'
    ].indexOf(value) !== -1) return germanFallback;
    return value;
  }

  function runtime() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  function saveControl(root) {
    return root && root.querySelector('.formbutton-success[data-submit-form="pageForm"][data-form-action]:not([data-form-upload="true"])');
  }

  function requestPath(value) {
    try { return new URL(value || '', document.baseURI).pathname.replace(/^\//, ''); }
    catch (error) { return ''; }
  }

  function isStandardSaveCall(formname, target) {
    var root = host();
    var control = saveControl(root);
    var form = document.getElementById(formname);
    return formname === 'pageForm' && form && control && requestPath(target) === requestPath(control.getAttribute('data-form-action')) &&
      form.querySelector('[name="_csrf_id"]') && form.querySelector('[name="_csrf_key"]');
  }

  function ensureFeedback(root) {
    var feedback = root.querySelector(':scope > .wb-page-meta > .wb-submit-feedback, :scope > .wb-submit-feedback');
    if (feedback) return feedback;
    feedback = document.createElement('div');
    feedback.className = 'wb-submit-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');
    var indicator = document.createElement('span');
    indicator.className = 'wb-submit-feedback__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.className = 'wb-submit-feedback__label';
    feedback.appendChild(indicator);
    feedback.appendChild(label);
    var meta = root.querySelector(':scope > .wb-page-meta');
    var formState = root.querySelector(':scope > .wb-page-meta > .wb-form-state, :scope > .wb-form-state');
    var heading = root.querySelector(':scope > .page-header');
    if (formState) formState.insertAdjacentElement('afterend', feedback);
    else if (meta) meta.appendChild(feedback);
    else if (heading) heading.insertAdjacentElement('afterend', feedback);
    else root.prepend(feedback);
    return feedback;
  }

  function setFeedback(root, state, label) {
    if (!root || !root.isConnected) root = host();
    if (!root) return null;
    var feedback = ensureFeedback(root);
    feedback.removeAttribute('data-heritage-delayed');
    feedback.dataset.state = state;
    feedback.setAttribute('role', state === 'failed' ? 'alert' : 'status');
    feedback.querySelector('.wb-submit-feedback__label').textContent = label;
    return feedback;
  }

  function begin(root, control, request, options) {
    if (!root || !control || active) return false;
    active = {
      request: request,
      root: root,
      control: control,
      themeChange: Boolean(options && options.themeChange),
      disabled: control.disabled,
      ariaBusy: control.getAttribute('aria-busy')
    };
    control.disabled = true;
    control.setAttribute('aria-busy', 'true');
    control.classList.add('wb-submit-source');
    root.setAttribute('aria-busy', 'true');
    setFeedback(root, 'saving', localizedMessage('form_saving', '\u00c4nderungen werden gespeichert', 'Saving changes'));
    active.slowTimer = window.setTimeout(function() {
      if (!active || active.request !== request) return;
      var feedback = setFeedback(active.root, 'saving', localizedMessage(
        'form_saving_delayed',
        'Das Speichern dauert etwas l\u00e4nger. Die Anfrage wird weiterhin verarbeitet.',
        'Saving is taking a little longer. The request is still being processed.'
      ));
      if (feedback) feedback.setAttribute('data-heritage-delayed', 'true');
    }, 7000);
    return true;
  }

  function success() {
    if (!active) return false;
    var current = host();
    var invalid = current && current.querySelector('.alert.alert-danger, #errorMsg');
    var themeChange = active.themeChange && !invalid;
    setFeedback(current || active.root, invalid ? 'review' : 'saved', invalid
      ? localizedMessage('form_save_review', 'Bitte pr\u00fcfen Sie die markierten Fehler', 'Please review the highlighted errors')
      : themeChange
        ? localizedMessage('theme_applied', 'Theme gespeichert. Die Oberfl\u00e4che wird aktualisiert \u2026', 'Theme saved. Refreshing the interface\u2026')
        : localizedMessage('form_saved', '\u00c4nderungen gespeichert', 'Changes saved'));
    if (themeChange) {
      window.setTimeout(function () { window.location.reload(); }, 550);
    }
    return true;
  }

  function failure() {
    if (!active) return false;
    setFeedback(active.root, 'failed', localizedMessage('form_save_failed', '\u00c4nderungen konnten nicht gespeichert werden. Bitte erneut versuchen.', 'Changes could not be saved. Try again.'));
    return true;
  }

  function complete() {
    if (!active) return false;
    var control = active.control;
    if (active.slowTimer) window.clearTimeout(active.slowTimer);
    if (control && control.isConnected) {
      control.disabled = active.disabled;
      if (active.ariaBusy === null) control.removeAttribute('aria-busy');
      else control.setAttribute('aria-busy', active.ariaBusy);
      control.classList.remove('wb-submit-source');
    }
    var root = host();
    if (root) root.setAttribute('aria-busy', 'false');
    active = null;
    return true;
  }

  var legacy = window.ISPConfig;
  var api = runtime();
  if (legacy && api && typeof legacy.submitForm === 'function' && !legacy.heritageSubmitFeedbackInstalled) {
    var originalSubmitForm = legacy.submitForm;
    legacy.submitForm = function (formname, target, confirmation) {
      var currentApi = runtime();
      var successMessage = arguments[3];
      if (!currentApi || !isStandardSaveCall(formname, target) || active) return originalSubmitForm.apply(this, arguments);
      if (confirmation && !window.confirm(confirmation)) return false;
      var form = document.getElementById(formname);
      var root = host();
      var control = saveControl(root);
      var themeChange = requestPath(target) === 'tools/user_settings.php' && Boolean(form.querySelector('[name="app_theme"]'));
      var request = currentApi.requestForm(form, target, { timeout: 30000 });
      begin(root, control, request, { themeChange: themeChange });
      request.promise.then(function(responseText) {
        if (successMessage && typeof currentApi.notify === 'function') currentApi.notify(successMessage, 'success');
        if (responseText.indexOf('HEADER_REDIRECT:') > -1) {
          currentApi.navigateTo(responseText.split(':')[1]);
        } else if (responseText.indexOf('LOGIN_REDIRECT:') > -1) {
          document.location.href = './index.php';
          return;
        } else {
          currentApi.replaceServerFragment(root, responseText);
          currentApi.onAfterContentLoad(target, new URLSearchParams(new FormData(form)).toString());
          if (window.heritageContentStates && typeof window.heritageContentStates.enhance === 'function') {
            window.heritageContentStates.enhance(root, target, { source: 'submit-feedback', focus: true });
          } else {
            if (window.heritageAccessibility) window.heritageAccessibility.enhance(root);
            if (window.heritageValidation) window.heritageValidation.enhance(root, { focus: true });
            if (window.heritageFeedback) window.heritageFeedback.enhance(root);
          }
          currentApi.pageFormChanged = false;
        }
        window.clearTimeout(currentApi.dataLogTimer);
        currentApi.dataLogNotification();
        success();
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) {
          failure();
          currentApi.reportError('Save request was not successful.');
        }
      }).finally(complete);
      return request;
    };
    legacy.heritageSubmitFeedbackInstalled = true;
  }

  window.heritageSubmitFeedback = {
    begin: begin,
    success: success,
    failure: failure,
    complete: complete,
    isActive: function () { return Boolean(active); }
  };
  window.heritageSubmitFeedbackInstalled = true;
}());

/* source: heritage-list-filter.js */
(function(window, document) {
  'use strict';
  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitForm !== 'function' || legacy.heritageListFilterInstalled) return;
  var previousSubmitForm = legacy.submitForm;
  var active = null;
  var changedSearchControl = null;
  function path(value) { try { return new URL(value || '', document.baseURI).pathname.replace(/^\//, ''); } catch (error) { return ''; } }
  function controlFor(formname, target) {
    var api = runtime();
    if (formname !== 'pageForm' || !document.body.classList.contains('wb-list-page') || !api || typeof api.requestForm !== 'function') return null;
    var root = document.getElementById('pageContent');
    var controls = root ? root.querySelectorAll('[name="Filter"][data-submit-form="pageForm"][data-form-action]') : [];
    var button = Array.prototype.find.call(controls, function(control) { return path(control.getAttribute('data-form-action')) === path(target); }) || null;
    if (button) return button;
    var automatic = changedSearchControl;
    changedSearchControl = null;
    return automatic && automatic.form && automatic.form.id === formname && /_list\.php$/.test(path(target)) ? automatic : null;
  }
  function finish(request) {
    if (!active || active.request !== request) return;
    var current = active; active = null;
    if (current.control && current.control.isConnected) { current.control.disabled = current.disabled; current.control.removeAttribute('aria-busy'); }
    if (current.root && current.root.isConnected) {
      current.root.classList.remove('wb-list-filter-active'); current.root.setAttribute('aria-busy', 'false');
      var status = current.root.querySelector('.wb-list-filter-status'); if (status) status.remove();
    }
  }
  function start(root, control, request) {
    var status = document.createElement('span');
    status.className = 'wb-list-filter-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    status.textContent = control.getAttribute('value') || control.textContent.trim() || 'Filter';
    control.insertAdjacentElement('afterend', status);
    active = { root: root, control: control, disabled: control.disabled, request: request };
    control.disabled = true; control.setAttribute('aria-busy', 'true'); root.classList.add('wb-list-filter-active'); root.setAttribute('aria-busy', 'true');
  }
  legacy.submitForm = function(formname, target, confirmation) {
    var api = runtime();
    var control = controlFor(formname, target); var form = document.getElementById(formname);
    if (!api || !control || !form) return previousSubmitForm.apply(this, arguments);
    if (confirmation && !window.confirm(confirmation)) return false;
    if (active && active.request && active.request.readyState !== 4) active.request.abort();
    var root = document.getElementById('pageContent');
    var request = api.requestForm(form, target, { timeout: 30000 }); start(root, control, request);
    request.promise.then(function(responseText) {
      if (responseText.indexOf('HEADER_REDIRECT:') > -1) api.navigateTo(responseText.split(':')[1]);
      else if (responseText.indexOf('LOGIN_REDIRECT:') > -1) document.location.href = './index.php';
      else { api.replaceServerFragment(root, responseText); api.onAfterContentLoad(target, new URLSearchParams(new FormData(form)).toString()); api.pageFormChanged = false; }
    }).catch(function(error) { if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Filter request was not successful.'); }).finally(function() { finish(request); });
    return request;
  };
  document.addEventListener('change', function(event) {
    var control = event.target && event.target.closest ? event.target.closest('#pageContent select[name^="search_"]') : null;
    if (control && document.body.classList.contains('wb-list-page')) changedSearchControl = control;
  }, true);
  window.heritageListFilter = { isActive: function() { return Boolean(active); } };
  legacy.heritageListFilterInstalled = true;
})(window, document);

/* source: heritage-statistics.js */
(function (window, document) {
  'use strict';

  function app() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  var runtime = app();
  if (!runtime || runtime.heritageStatisticsInstalled) return;

  var reports = [
    { key: 'web', path: 'sites/web_sites_stats.php', labels: { de: 'Web-Traffic', en: 'Web traffic' } },
    { key: 'ftp', path: 'sites/ftp_sites_stats.php', labels: { de: 'FTP-Traffic', en: 'FTP traffic' } },
    { key: 'user-quota', path: 'sites/user_quota_stats.php', labels: { de: 'Web-Quotas', en: 'Web quotas' } },
    { key: 'database-quota', path: 'sites/database_quota_stats.php', labels: { de: 'Datenbank-Quotas', en: 'Database quotas' } },
    { key: 'backups', path: 'sites/backup_stats.php', labels: { de: 'Backups', en: 'Backups' } }
  ];

  var copy = {
    de: {
      eyebrow: 'Webseiten / Statistiken', title: 'Statistik-Arbeitsbereich',
      description: 'Nutzung, Kapazitaeten und Sicherungsstatus in einer einheitlichen Ansicht.',
      visible: 'Sichtbare Eintraege', filters: 'Aktive Filter', notices: 'Quota-Hinweise',
      report: 'Aktueller Report', reports: 'Statistikbereiche', none: 'Keine',
      healthy: 'Keine sichtbaren Quota-Warnungen', warning: '{count} sichtbare Quota-Werte ab 75 %',
      open: '{name} oeffnen'
    },
    en: {
      eyebrow: 'Sites / Statistics', title: 'Statistics workspace',
      description: 'Usage, capacity and backup status in one consistent workspace.',
      visible: 'Visible entries', filters: 'Active filters', notices: 'Quota notices',
      report: 'Current report', reports: 'Statistics areas', none: 'None',
      healthy: 'No visible quota warnings', warning: '{count} visible quota values at or above 75%',
      open: 'Open {name}'
    }
  };

  function language() {
    var words = (document.body && document.body.textContent || '').toLowerCase();
    return /\b(uebersicht|webseiten|einstellungen|abmelden|statistik)\b/.test(words) ? 'de' : 'en';
  }

  function t(key, values) {
    var value = (copy[language()] || copy.en)[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      value = value.replace(new RegExp('\\{' + name + '\\}', 'g'), String(values[name]));
    });
    return value;
  }

  function currentReport(pageName) {
    var normalized = String(pageName || '').replace(/^\//, '');
    return reports.find(function (report) { return normalized.indexOf(report.path) >= 0; }) || null;
  }

  function recordRows(table) {
    return Array.prototype.filter.call(table.querySelectorAll('tbody > tr'), function (row) {
      if (row.classList.contains('tbl_row_noresults')) return false;
      if (row.hasAttribute('data-heritage-summary-row')) return false;
      if (row.querySelector('[data-heritage-summary-cell]')) return false;
      return row.querySelectorAll('td').length > 1;
    });
  }

  function activeFilters(host) {
    return Array.prototype.filter.call(host.querySelectorAll('thead [name^="search_"]:not([name="search_limit"])'), function (control) {
      return String(control.value || '').trim() !== '';
    }).length;
  }

  function quotaNotices(host) {
    return Array.prototype.filter.call(host.querySelectorAll('.progress [aria-valuenow]'), function (bar) {
      return Number(bar.getAttribute('aria-valuenow')) >= 75;
    }).length;
  }

  function metric(label, value, state, detail) {
    var card = document.createElement('article');
    card.className = 'wb-statistics-metric wb-statistics-metric--' + (state || 'neutral');
    var labelNode = document.createElement('span');
    labelNode.className = 'wb-statistics-metric__label';
    labelNode.textContent = label;
    var valueNode = document.createElement('strong');
    valueNode.className = 'wb-statistics-metric__value';
    valueNode.textContent = value;
    var detailNode = document.createElement('small');
    detailNode.className = 'wb-statistics-metric__detail';
    detailNode.textContent = detail || '';
    card.appendChild(labelNode);
    card.appendChild(valueNode);
    card.appendChild(detailNode);
    return card;
  }

  function navigation(active) {
    var nav = document.createElement('nav');
    nav.className = 'wb-statistics-navigation';
    nav.setAttribute('aria-label', t('reports'));
    reports.forEach(function (report) {
      var label = report.labels[language()] || report.labels.en;
      var link = document.createElement('a');
      link.href = '#';
      link.className = 'wb-statistics-navigation__item';
      link.textContent = label;
      link.setAttribute('data-heritage-load-content', report.path);
      link.setAttribute('aria-label', t('open', { name: label }));
      if (report.key === active.key) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
      nav.appendChild(link);
    });
    return nav;
  }

  function enhance(pageName) {
    var report = currentReport(pageName || (window.history.state && window.history.state.heritageContent));
    var host = document.getElementById('pageContent');
    if (!host) return false;
    document.body.classList.toggle('wb-statistics-page', Boolean(report));
    if (!report || host.dataset.heritageStatisticsReport === report.key) return Boolean(report);

    var table = host.querySelector('.table-wrapper table.table, table.table');
    if (!table) return false;
    host.dataset.heritageStatisticsEnhanced = 'true';
    host.dataset.heritageStatisticsReport = report.key;
    host.classList.add('wb-statistics-workspace');
    var rows = recordRows(table);
    var filters = activeFilters(host);
    var notices = quotaNotices(host);
    var reportLabel = report.labels[language()] || report.labels.en;

    var oldHeader = host.querySelector(':scope > .page-header');
    if (oldHeader) oldHeader.hidden = true;
    var duplicateLegend = host.querySelector(':scope > .fieldset-legend');
    if (duplicateLegend) duplicateLegend.hidden = true;

    var hero = document.createElement('header');
    hero.className = 'wb-statistics-hero';
    var eyebrow = document.createElement('span');
    eyebrow.className = 'wb-statistics-hero__eyebrow';
    eyebrow.textContent = t('eyebrow');
    var copy = document.createElement('div');
    var title = document.createElement('h1');
    title.textContent = t('title');
    var description = document.createElement('p');
    description.textContent = t('description');
    copy.appendChild(title);
    copy.appendChild(description);
    hero.appendChild(eyebrow);
    hero.appendChild(copy);
    host.insertBefore(hero, host.firstChild);
    hero.insertAdjacentElement('afterend', navigation(report));

    var metrics = document.createElement('section');
    metrics.className = 'wb-statistics-metrics';
    metrics.setAttribute('aria-label', t('title'));
    metrics.appendChild(metric(t('visible'), String(rows.length), 'neutral', reportLabel));
    metrics.appendChild(metric(t('filters'), filters ? String(filters) : t('none'), filters ? 'active' : 'neutral', filters ? t('report') : ''));
    metrics.appendChild(metric(t('notices'), String(notices), notices ? 'warning' : 'healthy', notices ? t('warning', { count: notices }) : t('healthy')));
    metrics.appendChild(metric(t('report'), reportLabel, 'accent', t('reports')));
    host.querySelector('.wb-statistics-navigation').insertAdjacentElement('afterend', metrics);

    var wrapper = table.closest('.table-wrapper');
    if (wrapper) wrapper.classList.add('wb-statistics-table');
    table.classList.add('wb-statistics-data-table');
    if (window.heritageIcons) window.heritageIcons.render(host);
    return true;
  }

  document.addEventListener('heritage:navigation-complete', function (event) {
    enhance(event.detail && event.detail.page);
  });
  document.addEventListener('click', function (event) {
    var launcher = event.target && event.target.closest ? event.target.closest('.wb-statistics-launcher[data-heritage-load-content], .wb-statistics-launcher[data-load-content]') : null;
    var current = app();
    if (!launcher || !current || typeof current.capp !== 'function') return;
    event.preventDefault();
    var path = launcher.getAttribute('data-heritage-load-content') || launcher.getAttribute('data-load-content');
    launcher.setAttribute('aria-busy', 'true');
    current.heritageActiveModule = 'sites';
    var request = current.capp('sites', path);
    Promise.resolve(request && request.promise ? request.promise : request)
      .catch(function () { if (current.reportError) current.reportError('Statistics could not be opened.'); })
      .finally(function () { if (launcher.isConnected) launcher.removeAttribute('aria-busy'); });
  });
  runtime.registerHook('onAfterContentLoad', function (name, params) {
    enhance(params && params.url ? params.url : (window.history.state && window.history.state.heritageContent));
  });

  window.heritageStatistics = { enhance: enhance, reports: reports.slice() };
  runtime.heritageStatisticsInstalled = true;
})(window, document);

/* source: heritage-wizard-preview.js */
(function(window, document) {
  'use strict';
  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitForm !== 'function' || legacy.heritageWizardPreviewInstalled) return;
  var previousSubmitForm = legacy.submitForm;
  var active = null;
  function targetPath(value) { try { return new URL(value || '', document.baseURI).pathname.replace(/^\//, ''); } catch (error) { return ''; } }
  function isPreview(formname, target) {
    var api = runtime();
    if (formname !== 'pageForm' || targetPath(target) !== 'dns/dns_wizard.php' || !api || typeof api.requestForm !== 'function') return false;
    var form = document.getElementById(formname); var create = form && form.querySelector('[name="create"]');
    return Boolean(form && create && create.value !== '1');
  }
  function finish(request) {
    if (!active || active !== request) return;
    active = null;
    var root = document.getElementById('pageContent');
    if (root) { root.classList.remove('wb-wizard-preview-active'); root.setAttribute('aria-busy', 'false'); var state = root.querySelector('.wb-wizard-preview-status'); if (state) state.remove(); }
  }
  legacy.submitForm = function(formname, target) {
    var api = runtime();
    if (!api || !isPreview(formname, target)) return previousSubmitForm.apply(this, arguments);
    if (active && active.readyState !== 4) active.abort();
    var form = document.getElementById(formname); var root = document.getElementById('pageContent');
    var status = document.createElement('div'); status.className = 'wb-wizard-preview-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.textContent = 'Updating form';
    root.prepend(status); root.classList.add('wb-wizard-preview-active'); root.setAttribute('aria-busy', 'true');
    var request = api.requestForm(form, target, { timeout: 30000 }); active = request;
    request.promise.then(function(responseText) {
      if (responseText.indexOf('HEADER_REDIRECT:') > -1) api.navigateTo(responseText.split(':')[1]);
      else if (responseText.indexOf('LOGIN_REDIRECT:') > -1) document.location.href = './index.php';
      else { api.replaceServerFragment(root, responseText); api.onAfterContentLoad(target, new URLSearchParams(new FormData(form)).toString()); api.pageFormChanged = false; }
    }).catch(function(error) { if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Wizard preview request was not successful.'); }).finally(function() { finish(request); });
    return request;
  };
  window.heritageWizardPreview = { isActive: function() { return Boolean(active); } };
  legacy.heritageWizardPreviewInstalled = true;
})(window, document);

/* source: heritage-advanced-controls.js */
(function () {
  'use strict';

  var codeFieldPattern = /(?:config|directive|rules?|template|snippet|php_ini|ssl_(?:key|cert|bundle|request)|ssh_rsa|dkim_(?:private|public)|dns_record|custom_mailfilter)/i;

  function localized(german, english) {
    var language = typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : (document.documentElement.lang || '');
    return String(language).toLowerCase().indexOf('de') === 0 ? german : english;
  }

  function createBadge(label, value, modifier) {
    var badge = document.createElement('span');
    badge.className = 'wb-specialty-badge' + (modifier ? ' wb-specialty-badge--' + modifier : '');
    badge.setAttribute('aria-label', label + ': ' + value);
    var count = document.createElement('strong');
    count.textContent = String(value);
    var caption = document.createElement('span');
    caption.textContent = label;
    badge.appendChild(count);
    badge.appendChild(caption);
    return badge;
  }

  function decorateExtensionWorkspace(scope) {
    scope.querySelectorAll('.wb-extension-workspace').forEach(function(workspace) {
      workspace.classList.add('wb-specialty-workspace', 'wb-specialty-workspace--extension');
      var pageType = workspace.getAttribute('data-heritage-extension-page') || 'extension';
      workspace.setAttribute('data-heritage-specialty-page', pageType);

      var table = workspace.querySelector('.wb-data-table');
      var rows = table ? Array.prototype.slice.call(table.querySelectorAll('tbody tr:not(.tbl_row_noresults)')) : [];
      var actions = workspace.querySelectorAll('.wb-row-action, .wb-form-actions button, .wb-form-actions a').length;
      var dangerActions = workspace.querySelectorAll('.wb-row-action--danger, .formbutton-danger').length;
      workspace.setAttribute('data-heritage-extension-records', String(rows.length));
      workspace.setAttribute('data-heritage-extension-actions', String(actions));

      var hero = workspace.querySelector('.wb-extension-hero');
      if (hero && !hero.querySelector('.wb-specialty-badges')) {
        var badges = document.createElement('div');
        badges.className = 'wb-specialty-badges';
        badges.appendChild(createBadge(localized('Einträge', 'Entries'), rows.length, 'records'));
        if (actions > 0) badges.appendChild(createBadge(localized('Aktionen', 'Actions'), actions, 'actions'));
        if (dangerActions > 0) badges.appendChild(createBadge(localized('Kritisch', 'Critical'), dangerActions, 'danger'));
        hero.appendChild(badges);
      }

      workspace.querySelectorAll('.wb-data-table tbody tr').forEach(function(row) {
        row.classList.add('wb-specialty-row');
        if (row.querySelector('.wb-row-action--danger, .formbutton-danger')) row.classList.add('wb-specialty-row--destructive');
      });
    });
  }

  function decorateMonitoringWorkspace(scope) {
    scope.querySelectorAll('.wb-monitor-workspace').forEach(function(workspace) {
      workspace.classList.add('wb-specialty-workspace', 'wb-specialty-workspace--monitoring');
      var charts = workspace.querySelectorAll('[data-heritage-chart-card]').length;
      var states = workspace.querySelectorAll('.stateview .alert, .systemmonitor .alert, .wb-monitor-state-card').length;
      workspace.setAttribute('data-heritage-monitor-charts', String(charts));
      workspace.setAttribute('data-heritage-monitor-states', String(states));

      var hero = workspace.querySelector('.wb-monitor-hero');
      if (hero && !hero.querySelector('.wb-specialty-badges')) {
        var badges = document.createElement('div');
        badges.className = 'wb-specialty-badges';
        if (states > 0) badges.appendChild(createBadge(localized('Status', 'Status'), states, 'records'));
        if (charts > 0) badges.appendChild(createBadge(localized('Diagramme', 'Charts'), charts, 'actions'));
        hero.appendChild(badges);
      }

      workspace.querySelectorAll('.wb-monitor-refresh-panel, .wb-monitor-refresh').forEach(function(panel) {
        panel.classList.add('wb-specialty-control-strip');
        var select = panel.querySelector('select');
        if (select && !panel.querySelector('.wb-specialty-control-hint')) {
          var hint = document.createElement('span');
          hint.className = 'wb-specialty-control-hint';
          hint.textContent = select.value
            ? localized('Automatische Aktualisierung aktiv', 'Automatic refresh active')
            : localized('Manuelle Aktualisierung', 'Manual refresh');
          panel.appendChild(hint);
        }
      });
    });
  }

  function decorate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('textarea.form-control').forEach(function (field) {
      var identity = [field.name || '', field.id || ''].join(' ');
      field.classList.add('wb-textarea-field');
      if (codeFieldPattern.test(identity)) {
        field.classList.add('wb-code-field');
        field.setAttribute('spellcheck', 'false');
      }
      if (field.readOnly || field.disabled) field.classList.add('wb-readonly-field');
    });

    scope.querySelectorAll('[role="progressbar"]').forEach(function (bar) {
      var value = Number(bar.getAttribute('aria-valuenow'));
      var label = bar.querySelector('span');
      bar.closest('.progress')?.classList.add('wb-progress');
      if (!bar.getAttribute('aria-label') && Number.isFinite(value)) {
        bar.setAttribute('aria-label', (label && label.textContent.trim()) || (value + '% used'));
      }
    });

    var monitorSurface = scope.querySelector('.systemmonitor, .stateview, .codeview, .panel_system');
    if (monitorSurface) {
      document.body.classList.add('wb-monitor-page');
      var page = document.getElementById('pageContent');
      if (page) page.classList.add('wb-monitor-surface');
      scope.querySelectorAll('#refreshinterval').forEach(function (field) {
        var group = field.closest('.form-group');
        if (group) group.classList.add('wb-monitor-refresh');
      });
      scope.querySelectorAll('.stateview .alert, .systemmonitor .alert').forEach(function (card) {
        card.classList.add('wb-monitor-state-card');
        var state = card.classList.contains('alert-danger') ? 'danger' :
          card.classList.contains('alert-warning') ? 'warning' :
          card.classList.contains('alert-success') ? 'success' : 'info';
        card.setAttribute('data-heritage-monitor-state', state);
        var title = card.querySelector('h3');
        if (title) title.classList.add('wb-monitor-state-card__title');
        var summary = card.querySelector('.statusDevice > p');
        if (summary && !summary.querySelector('.wb-monitor-state-metrics')) {
          summary.classList.add('wb-monitor-state-card__summary');
          var match = summary.textContent.replace(/\s+/g, ' ').trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
          if (match) {
            summary.textContent = match[1];
            var metrics = document.createElement('span');
            metrics.className = 'wb-monitor-state-metrics';
            match[2].split(',').forEach(function(metric) {
              var chip = document.createElement('span');
              chip.className = 'wb-monitor-state-metric';
              chip.textContent = metric.trim();
              metrics.appendChild(chip);
            });
            summary.appendChild(metrics);
          }
        }
        var status = card.querySelector('.statusDevice');
        if (status) status.classList.add('wb-monitor-state-card__body');
        card.querySelectorAll('a').forEach(function(link) { link.classList.add('wb-monitor-state-card__action'); });
      });
    } else if (scope === document || scope.id === 'pageContent') {
      document.body.classList.remove('wb-monitor-page');
    }

    decorateExtensionWorkspace(scope);
    decorateMonitoringWorkspace(scope);
  }

  document.addEventListener('DOMContentLoaded', function () { decorate(document); });
  document.addEventListener('heritage:navigation-complete', function (event) {
    decorate(event.detail && event.detail.root ? event.detail.root : document.getElementById('pageContent'));
  });
  window.WorkbenchAdvancedControls = { decorate: decorate };
})();

/* source: heritage-upload-feedback.js */
(function (window, document) {
  'use strict';

  function runtime() { return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitUploadForm !== 'function' || legacy.heritageUploadFeedbackInstalled) return;

  var originalSubmitUploadForm = legacy.submitUploadForm;
  var active = null;
  var messages = {};

  try {
    var source = document.getElementById('heritage-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) { messages = {}; }

  function requestPath(value) {
    try { return new URL(value || '', document.baseURI).pathname.replace(/^\//, ''); }
    catch (error) { return ''; }
  }

  function matchingControl(formname, target) {
    if (formname !== 'pageForm' || !window.heritageHttp || typeof window.heritageHttp.postMultipart !== 'function') return null;
    var root = document.getElementById('pageContent');
    var control = root && root.querySelector('.formbutton-success[data-submit-form="pageForm"][data-form-upload="true"][data-form-action]');
    return control && requestPath(target) === requestPath(control.getAttribute('data-form-action')) ? control : null;
  }

  function ensureFeedback(root) {
    var feedback = root.querySelector(':scope > .wb-upload-feedback');
    if (feedback) return feedback;
    feedback = document.createElement('div');
    feedback.className = 'wb-submit-feedback wb-upload-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');
    var indicator = document.createElement('span');
    indicator.className = 'wb-submit-feedback__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.className = 'wb-submit-feedback__label';
    feedback.appendChild(indicator);
    feedback.appendChild(label);
    var heading = root.querySelector(':scope > .page-header');
    if (heading) heading.insertAdjacentElement('afterend', feedback);
    else root.prepend(feedback);
    return feedback;
  }

  function setFeedback(state, label) {
    var root = document.getElementById('pageContent');
    if (!root) return;
    var feedback = ensureFeedback(root);
    feedback.removeAttribute('data-heritage-delayed');
    feedback.dataset.state = state;
    feedback.setAttribute('role', state === 'failed' ? 'alert' : 'status');
    feedback.querySelector('.wb-submit-feedback__label').textContent = label;
  }

  function csrfFrom(root) {
    var id = root && root.querySelector('input[name="_csrf_id"]');
    var key = root && root.querySelector('input[name="_csrf_key"]');
    return id && key && id.value && key.value ? { id: id.value, key: key.value } : null;
  }

  function replaceCsrf(form, values) {
    if (!values) return;
    [[' _csrf_id', values.id], [' _csrf_key', values.key]].forEach(function(entry) {
      var name = entry[0].trim();
      var field = form.querySelector('input[name="' + name + '"]');
      if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = name; form.appendChild(field); }
      field.value = entry[1];
    });
  }

  function replaceMessages(parsed) {
    var root = document.getElementById('pageContent');
    if (!root) return { ok: false, error: false };
    root.querySelectorAll('#OKMsg, #errorMsg').forEach(function(node) { node.remove(); });
    var anchor = root.querySelector('input[name="id"]') || root.querySelector('.clear');
    var result = { ok: false, error: false };
    ['OKMsg', 'errorMsg'].forEach(function(id) {
      var source = parsed.getElementById(id);
      if (!source) return;
      var imported = document.importNode(source, true);
      if (anchor) anchor.insertAdjacentElement('beforebegin', imported); else root.appendChild(imported);
      result[id === 'OKMsg' ? 'ok' : 'error'] = true;
    });
    return result;
  }

  function finish(state, label) {
    if (!active) return;
    var current = active;
    active = null;
    if (current.slowTimer) window.clearTimeout(current.slowTimer);
    if (current.control && current.control.isConnected) {
      current.control.disabled = current.disabled;
      if (current.ariaBusy === null) current.control.removeAttribute('aria-busy');
      else current.control.setAttribute('aria-busy', current.ariaBusy);
      current.control.classList.remove('wb-upload-source');
    }
    var root = document.getElementById('pageContent');
    if (root) root.setAttribute('aria-busy', 'false');
    setFeedback(state, label);
  }

  legacy.submitUploadForm = function (formname, target) {
    var api = runtime();
    var form = document.getElementById(formname);
    var control = matchingControl(formname, target);
    if (!api || !form || !control || active) return originalSubmitUploadForm.apply(this, arguments);

    active = { form: form, control: control, disabled: control.disabled, ariaBusy: control.getAttribute('aria-busy') };
    control.disabled = true;
    control.setAttribute('aria-busy', 'true');
    control.classList.add('wb-upload-source');
    var root = document.getElementById('pageContent');
    if (root) root.setAttribute('aria-busy', 'true');
    setFeedback('uploading', messages.upload_sending || 'Upload in progress');
    active.slowTimer = window.setTimeout(function() {
      if (!active) return;
      var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
      setFeedback('uploading', german
        ? 'Der Upload dauert etwas l\u00e4nger. Die Datei wird weiterhin verarbeitet.'
        : 'The upload is taking a little longer. The file is still being processed.');
      var feedback = document.querySelector('#pageContent > .wb-upload-feedback');
      if (feedback) feedback.setAttribute('data-heritage-delayed', 'true');
    }, 7000);

    var request;
    try { request = window.heritageHttp.postMultipart(form, target, { timeout: 120000 }); }
    catch (error) { finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.'); throw error; }
    active.request = request;
    request.promise.then(function(markup) {
      var parsed = new DOMParser().parseFromString(markup, 'text/html');
      var tokens = csrfFrom(parsed);
      if (!tokens) { finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.'); return; }
      replaceCsrf(form, tokens);
      var outcome = replaceMessages(parsed);
      if (outcome.error) finish('review', messages.upload_review || 'Please review the upload errors');
      else if (outcome.ok) finish('complete', messages.upload_complete || 'Upload processed');
      else finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.');
      if (typeof api.onAfterContentLoad === 'function') api.onAfterContentLoad(target, null);
    }).catch(function(error) {
      if (!request.aborted) finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.');
    });
    return request;
  };

  window.heritageUploadFeedback = {
    isActive: function () { return Boolean(active); },
    abort: function () { if (active && active.request) active.request.abort(); finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.'); }
  };
  legacy.heritageUploadFeedbackInstalled = true;
})(window, document);

/* source: heritage-global-search.js */
(function (window, document) {
  'use strict';

  if (window.heritageGlobalSearchInstalled) {
    return;
  }

  var timer = null;
  var request = null;
  var requestSequence = 0;
  var activeIndex = -1;

  function app() {
    return typeof window.heritageRuntime === 'function'
      ? window.heritageRuntime()
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
    if (!form || !input || input.dataset.heritageSearchReady === 'true') {
      return false;
    }

    input.dataset.heritageSearchReady = 'true';
    input.setAttribute('aria-keyshortcuts', '/');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    var resultBox = document.createElement('div');
    resultBox.id = 'heritage-global-search-results';
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
      clear.setAttribute('aria-label', document.body.getAttribute('data-heritage-search-clear') || tr('Suche leeren', 'Clear search'));
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
          option.id = 'heritage-global-search-option-' + count;
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

  window.heritageGlobalSearch = { init: init };
  window.heritageGlobalSearchInstalled = true;
}(window, document));

/* source: heritage-theme.js */
(function () {
  'use strict';
  var key = 'ispconfig-workbench-theme';
  var root = document.documentElement;
  var eye = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  var eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 3 18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6.1 0 9.5 6 9.5 6a18 18 0 0 1-3.1 3.8M6.1 6.8C3.8 8.2 2.5 12 2.5 12s3.4 6 9.5 6a9.7 9.7 0 0 0 3.1-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.7 15.3A8.5 8.5 0 0 1 8.7 3.3 8.5 8.5 0 1 0 20.7 15.3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var sun = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function svgFromMarkup(markup) {
    var source = String(markup || '');
    if (source.indexOf('xmlns=') === -1) source = source.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    var parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    var icon = parsed.documentElement;
    if (!icon || String(icon.nodeName).toLowerCase() === 'parsererror') return document.createTextNode('');
    return document.importNode(icon, true);
  }

  function setIcon(host, markup) {
    if (!host) return;
    host.replaceChildren(svgFromMarkup(markup));
  }

  function cssToken(name, fallback) {
    var value = window.getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  function colorWithAlpha(color, alpha) {
    var hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      var value = parseInt(hex[1], 16);
      return 'rgba(' + ((value >> 16) & 255) + ',' + ((value >> 8) & 255) + ',' + (value & 255) + ',' + alpha + ')';
    }
    var rgb = color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) return 'rgba(' + rgb[1].split(',').slice(0, 3).join(',') + ',' + alpha + ')';
    return color;
  }

  function colorChannels(color) {
    color = String(color || '').trim();
    var hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      var value = parseInt(hex[1], 16);
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    }
    var rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
  }

  function relativeLuminance(channels) {
    var linear = channels.map(function (channel) {
      var normalized = Math.max(0, Math.min(255, channel)) / 255;
      return normalized <= .04045 ? normalized / 12.92 : Math.pow((normalized + .055) / 1.055, 2.4);
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  }

  function contrastRatio(first, second) {
    var one = relativeLuminance(first);
    var two = relativeLuminance(second);
    return (Math.max(one, two) + .05) / (Math.min(one, two) + .05);
  }

  function accessibleAction(color, dark) {
    var source = colorChannels(color);
    if (!source) return color;
    var background = dark ? [21, 30, 45] : [244, 246, 250];
    if (contrastRatio(source, background) >= 4.55) return 'rgb(' + source.join(',') + ')';
    var target = dark ? [255, 255, 255] : [17, 24, 39];
    for (var step = 1; step <= 20; step++) {
      var amount = step / 20;
      var adjusted = source.map(function (channel, index) { return Math.round(channel + (target[index] - channel) * amount); });
      if (contrastRatio(adjusted, background) >= 4.55) return 'rgb(' + adjusted.join(',') + ')';
    }
    return 'rgb(' + target.join(',') + ')';
  }

  function applyActionContrast(color) {
    color = String(color || cssToken('--wb-action', '#cc151c')).trim();
    var channels = colorChannels(color);
    if (!channels) {
      root.style.setProperty('--wb-action-contrast', '#ffffff');
      return '#ffffff';
    }
    var luminance = relativeLuminance(channels);
    var contrast = ((luminance + .05) / .05) >= (1.05 / (luminance + .05)) ? '#111827' : '#ffffff';
    root.style.setProperty('--wb-action-contrast', contrast);
    return contrast;
  }

  function applyAccessibleAction(color) {
    var adjusted = accessibleAction(color || cssToken('--wb-accent', '#cc151c'), root.getAttribute('data-heritage-theme') === 'dark');
    root.style.setProperty('--wb-action', adjusted);
    applyActionContrast(adjusted);
    return adjusted;
  }

  function applyChartTheme() {
    if (!document.getElementById('pageContent')) return;
    Array.prototype.forEach.call(document.querySelectorAll('#pageContent canvas'), function (canvas) {
      canvas.classList.add('wb-themed-chart');
      canvas.style.removeProperty('background-color');
    });
  }

  function scheduleChartTheme() {
    window.requestAnimationFrame(function () { applyChartTheme(); });
    window.setTimeout(applyChartTheme, 80);
  }

  function apply(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-heritage-theme', dark ? 'dark' : 'light');
    applyAccessibleAction(cssToken('--wb-accent', '#cc151c'));
    Array.prototype.forEach.call(document.querySelectorAll('.wb-theme-toggle'), function (button) {
      var german = typeof window.heritageLanguage === 'function' && window.heritageLanguage() === 'de';
      button.setAttribute('aria-label', dark
        ? (german ? 'Zum hellen Design wechseln' : 'Switch to light theme')
        : (german ? 'Zum dunklen Design wechseln' : 'Switch to dark theme'));
      setIcon(button, dark ? sun : moon);
    });
    scheduleChartTheme();
  }
  apply(window.localStorage ? localStorage.getItem(key) : 'light');
  function enhanceLogin() {
    if (!document.body.classList.contains('wb-login-page')) return;
    var surface = document.querySelector('.wb-login-form-surface');
    var form = surface && surface.querySelector('form');
    if (!surface || !form) return;
    form.classList.add('wb-auth-form');
    var action = (form.getAttribute('action') || '').toLowerCase();
    var mode = action.indexOf('otp') !== -1 ? 'otp' : action.indexOf('password_reset') !== -1 ? 'reset' : action.indexOf('force_password') !== -1 ? 'password' : 'login';
    document.querySelector('.wb-login-card').setAttribute('data-heritage-auth-mode', mode);
    var fieldMap = {
      username: { text: 'Benutzername', autocomplete: 'username' },
      password: { text: 'Passwort', autocomplete: 'current-password' },
      new_password: { text: 'Neues Passwort', autocomplete: 'new-password' },
      confirm_password: { text: 'Passwort wiederholen', autocomplete: 'new-password' },
      email: { text: 'E-Mail-Adresse', autocomplete: 'email', type: 'email' },
      code: { text: 'Best\u00e4tigungscode', autocomplete: 'one-time-code', inputmode: 'numeric' }
    };
    Array.prototype.forEach.call(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])'), function (input) {
      var field = fieldMap[input.id] || fieldMap[input.name] || { text: input.placeholder || input.name || 'Eingabe' };
      if (field.autocomplete) input.setAttribute('autocomplete', field.autocomplete);
      if (field.inputmode) input.setAttribute('inputmode', field.inputmode);
      if (field.type && input.type === 'text') input.type = field.type;
      input.setAttribute('aria-label', input.getAttribute('aria-label') || field.text);
      var group = input.closest('.form-group') || input.parentElement;
      if (group) group.classList.add('wb-auth-field');
      if (group && !group.querySelector('[data-heritage-login-label]')) {
        var label = document.createElement('label');
        label.textContent = field.text;
        label.setAttribute('for', field.id);
        label.setAttribute('data-heritage-login-label', 'true');
        group.insertBefore(label, input);
      }
      if (input.type === 'password' && group && !group.querySelector('[data-heritage-password-toggle]')) {
        group.classList.add('wb-password-field');
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'wb-password-toggle';
        toggle.setAttribute('data-heritage-password-toggle', 'true');
        setIcon(toggle, eye);
        toggle.setAttribute('aria-label', 'Passwort anzeigen');
        toggle.addEventListener('click', function () {
          var visible = input.type === 'text';
          input.type = visible ? 'password' : 'text';
          toggle.setAttribute('aria-label', visible ? 'Passwort anzeigen' : 'Passwort verbergen');
          setIcon(toggle, visible ? eye : eyeOff);
        });
        group.appendChild(toggle);
      }
      if ((input.id || input.name) === 'code') {
        input.classList.add('wb-auth-code');
        group.classList.add('wb-auth-field--code');
      }
    });
    Array.prototype.forEach.call(surface.querySelectorAll('.alert'), function (alert) {
      alert.classList.add('wb-auth-feedback');
      alert.setAttribute('aria-live', 'polite');
    });
    Array.prototype.forEach.call(form.querySelectorAll('input[type="submit"]'), function (button, index) {
      button.classList.add(index === 0 ? 'wb-auth-primary' : 'wb-auth-secondary');
    });
    Array.prototype.forEach.call(form.querySelectorAll('button'), function (button) {
      if (button.type === 'submit' && button.value !== 'resend') button.classList.add('wb-auth-primary');
      else button.classList.add('wb-auth-secondary');
    });
    var heading = surface.querySelector('h2');
    if (heading) heading.classList.add('wb-auth-context-title');
    var description = heading && heading.nextElementSibling;
    if (description && description.tagName === 'P') description.classList.add('wb-auth-context-copy');
    if (form && !form.dataset.heritageLoginSubmitBound) {
      form.dataset.heritageLoginSubmitBound = 'true';
      form.addEventListener('submit', function () {
        var submit = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submit) {
          submit.disabled = true;
          submit.setAttribute('aria-busy', 'true');
        }
        var card = document.querySelector('.wb-login-card');
        if (card) card.classList.add('wb-login-is-submitting');
      });
    }
  }
  enhanceLogin();
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.wb-theme-toggle');
    if (!button) return;
    var next = root.getAttribute('data-heritage-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, next); } catch (ignore) {}
    apply(next);
  });
  document.addEventListener('heritage:navigation-complete', scheduleChartTheme);
  window.heritageChartTheme = { apply: applyChartTheme };
  window.heritageApplyAccentContrast = applyAccessibleAction;
}());

/* source: heritage-select.js */
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

  window.heritageSelect = { enhance: enhance, destroy: destroy, open: open, close: close };
  window.heritageSelectInstalled = true;
}());
