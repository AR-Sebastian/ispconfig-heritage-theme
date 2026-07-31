/* Generated from heritage-js-bundles.json; edit the modular sources, not this file. */

/* source: workbench-feedback.js */
(function (window, document) {
  'use strict';

  if (window.workbenchFeedbackInstalled) return;

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
    var language = typeof window.workbenchLanguage === 'function' ? window.workbenchLanguage() : (document.documentElement.lang || '');
    return String(language).toLowerCase().indexOf('de') === 0 ? german : english;
  }

  function structureContent(alert) {
    var content = alert.querySelector(':scope > .wb-feedback__content');
    if (content) return content;
    content = document.createElement('div');
    content.className = 'wb-feedback__content';
    Array.prototype.slice.call(alert.childNodes).forEach(function(node) {
      if (node.nodeType === 1 && node.matches('.close, [data-workbench-dismiss], .wb-feedback__icon, .wb-feedback__action')) return;
      content.appendChild(node);
    });
    alert.appendChild(content);
    return content;
  }

  function enhanceAlert(alert) {
    if (alert.dataset.workbenchFeedback === 'true') return;
    if (alert.closest && alert.closest('.wb-login-form-surface')) return;
    var state = tone(alert);
    alert.dataset.workbenchFeedback = 'true';
    alert.dataset.workbenchTone = state;
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
    var dismiss = alert.querySelector(':scope > .close, :scope > [data-workbench-dismiss]');
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
    var dangerAction = dialog.querySelector('.wb-dialog__action--danger, .btn-danger, [data-workbench-tab-confirm-action="discard"]');
    var primaryAction = dialog.querySelector('.wb-dialog__action--primary, .btn-primary, [data-workbench-tab-confirm-action="save"]');
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
    if (alert.workbenchDismissController && alert.workbenchDismissController.timer) {
      window.clearTimeout(alert.workbenchDismissController.timer);
    }
    alert.remove();
  }

  function scheduleGeneratedDismiss(alert, toneName) {
    if (!alert || ['success', 'info'].indexOf(toneName) === -1) return;
    var duration = toneName === 'success' ? 7000 : 10000;
    alert.setAttribute('data-heritage-auto-dismiss', 'true');
    alert.style.setProperty('--hg-feedback-duration', duration + 'ms');
    var controller = alert.workbenchDismissController || {};
    if (controller.timer) window.clearTimeout(controller.timer);
    controller.timer = null;
    controller.remaining = duration;

    controller.pause = function() {
      if (!controller.timer) return;
      window.clearTimeout(controller.timer);
      controller.timer = null;
      controller.remaining = Math.max(500, controller.remaining - (Date.now() - controller.started));
      alert.setAttribute('data-workbench-dismiss-paused', 'true');
    };
    controller.resume = function() {
      if (controller.timer || !alert.isConnected) return;
      alert.removeAttribute('data-workbench-dismiss-paused');
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
    alert.workbenchDismissController = controller;
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
    var duplicate = Array.prototype.find.call(stack.querySelectorAll('[data-workbench-generated-feedback]'), function(item) {
      return item.getAttribute('data-workbench-feedback-message') === text &&
        item.getAttribute('data-workbench-feedback-tone') === toneName;
    });
    if (duplicate) {
      if (!duplicate.querySelector(':scope > .wb-feedback__action')) {
        var duplicateAction = actionControl(options);
        var duplicateDismiss = duplicate.querySelector(':scope > [data-workbench-dismiss]');
        if (duplicateAction) duplicate.insertBefore(duplicateAction, duplicateDismiss || null);
      }
      stack.prepend(duplicate);
      scheduleGeneratedDismiss(duplicate, toneName);
      return duplicate;
    }
    var alert = document.createElement('div');
    alert.className = 'alert alert-' + toneName;
    alert.setAttribute('data-workbench-generated-feedback', 'true');
    alert.setAttribute('data-workbench-feedback-message', text);
    alert.setAttribute('data-workbench-feedback-tone', toneName);
    var content = document.createElement('p');
    content.textContent = text;
    var action = actionControl(options);
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'close';
    dismiss.setAttribute('data-workbench-dismiss', 'alert');
    dismiss.setAttribute('aria-label', localized('Schließen', 'Close'));
    dismiss.textContent = '×';
    alert.appendChild(content);
    if (action) alert.appendChild(action);
    alert.appendChild(dismiss);
    stack.prepend(alert);
    enhanceAlert(alert);
    scheduleGeneratedDismiss(alert, toneName);

    Array.prototype.slice.call(stack.querySelectorAll('[data-workbench-generated-feedback]')).slice(3).forEach(function(oldAlert) {
      dismissGenerated(oldAlert);
    });
    return alert;
  }

  function connectivityFeedback(online) {
    var host = document.getElementById('pageContent');
    if (!host) return null;
    var current = host.querySelector('[data-workbench-connectivity-feedback]');
    if (current) current.remove();
    if (online) {
      var restored = show(localized('Verbindung wiederhergestellt.', 'Connection restored.'), 'success');
      if (restored) restored.setAttribute('data-workbench-connectivity-feedback', 'online');
      return restored;
    }
    var offline = show(
      localized('Keine Netzwerkverbindung. Lesevorgänge können nach dem Wiederherstellen der Verbindung erneut versucht werden.', 'No network connection. Read operations can be retried after the connection is restored.'),
      'warning'
    );
    if (offline) offline.setAttribute('data-workbench-connectivity-feedback', 'offline');
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
      '.alert-danger:not([data-workbench-generated-feedback])'
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

  window.workbenchFeedback = { enhance: enhance, show: show, report: report, connectivity: connectivityFeedback };
  window.workbenchFeedbackInstalled = true;
}(window, document));
;

/* source: workbench-login.js */
(function () {
  'use strict';

  var storageKey = 'ispconfig-workbench-login-username';
  var stayStorageKey = 'ispconfig-workbench-login-stay';

  function getStorage() {
    try {
      var testKey = storageKey + '-test';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalizeFeedback() {
    var surface = document.querySelector('.wb-login-form-surface');
    if (!surface) return;

    var nodes = surface.querySelectorAll('.alert, .box_error, .box_warning, .box_success, .box_info');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.wbLoginFeedbackNormalized === 'true') return;
      var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      node.dataset.wbLoginFeedbackNormalized = 'true';
      node.classList.add('wb-login-feedback-normalized');
      if (!node.getAttribute('role')) node.setAttribute('role', 'alert');
      if (!node.getAttribute('aria-live')) node.setAttribute('aria-live', 'polite');

      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      var message = document.createElement('span');
      message.className = 'wb-login-feedback-text';
      message.textContent = text;
      node.appendChild(message);
    });
  }

  function observeFeedback() {
    var surface = document.querySelector('.wb-login-form-surface');
    if (!surface || !('MutationObserver' in window)) return;

    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () {
        pending = false;
        normalizeFeedback();
      });
    });

    observer.observe(surface, { childList: true, subtree: true });
  }

  ready(function () {
    var storage = getStorage();
    var form = document.querySelector('.wb-login-form-surface form');
    var username = document.getElementById('username');
    var remember = document.getElementById('remember_username');
    var stay = document.getElementById('stay');
    var card = document.querySelector('.wb-login-card');

    normalizeFeedback();
    observeFeedback();

    document.addEventListener('click', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('[data-login-navigate]') : null;
      if (!control) return;
      var target = control.getAttribute('data-login-navigate');
      if (!target) return;
      event.preventDefault();
      window.location.href = target;
    });

    if (!form || !username || !storage) {
      return;
    }

    var rememberedUsername = storage.getItem(storageKey);
    if (rememberedUsername && !username.value) {
      username.value = rememberedUsername;
      if (remember) remember.checked = true;
      if (card) {
        card.setAttribute('data-wb-remembered-user', 'true');
      }
    }

    if (stay && storage.getItem(stayStorageKey) === '1') {
      stay.checked = true;
    }

    username.addEventListener('input', function () {
      if (card) {
        card.removeAttribute('data-wb-remembered-user');
      }
    });

    form.addEventListener('submit', function () {
      var value = (username.value || '').trim();
      if (remember && remember.checked && value) {
        storage.setItem(storageKey, value);
      } else {
        storage.removeItem(storageKey);
      }

      if (stay && stay.checked) {
        storage.setItem(stayStorageKey, '1');
      } else {
        storage.removeItem(stayStorageKey);
      }
    });
  });
}());
;

/* source: workbench-theme.js */
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
    var adjusted = accessibleAction(color || cssToken('--wb-accent', '#cc151c'), root.getAttribute('data-wb-theme') === 'dark');
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
    root.setAttribute('data-wb-theme', dark ? 'dark' : 'light');
    applyAccessibleAction(cssToken('--wb-accent', '#cc151c'));
    Array.prototype.forEach.call(document.querySelectorAll('.wb-theme-toggle'), function (button) {
      var german = typeof window.workbenchLanguage === 'function' && window.workbenchLanguage() === 'de';
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
    document.querySelector('.wb-login-card').setAttribute('data-wb-auth-mode', mode);
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
      if (group && !group.querySelector('[data-wb-login-label]')) {
        var label = document.createElement('label');
        label.textContent = field.text;
        label.setAttribute('for', field.id);
        label.setAttribute('data-wb-login-label', 'true');
        group.insertBefore(label, input);
      }
      if (input.type === 'password' && group && !group.querySelector('[data-wb-password-toggle]')) {
        group.classList.add('wb-password-field');
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'wb-password-toggle';
        toggle.setAttribute('data-wb-password-toggle', 'true');
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
    if (form && !form.dataset.wbLoginSubmitBound) {
      form.dataset.wbLoginSubmitBound = 'true';
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
    var next = root.getAttribute('data-wb-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, next); } catch (ignore) {}
    apply(next);
  });
  document.addEventListener('workbench:navigation-complete', scheduleChartTheme);
  window.workbenchChartTheme = { apply: applyChartTheme };
  window.workbenchApplyAccentContrast = applyAccessibleAction;
}());
;

/* source: heritage-runtime.js */
(function () {
  'use strict';

  document.documentElement.classList.add('heritage-runtime');

  function syncThemeToggleLabel() {
    var toggle = document.querySelector('.wb-theme-toggle');
    if (!toggle) return;

    var isDark = document.documentElement.getAttribute('data-wb-theme') === 'dark';
    var isGerman = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var label = isGerman
      ? (isDark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln')
      : (isDark ? 'Switch to light theme' : 'Switch to dark theme');

    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  }

  function markIdentityColumns() {
    document.querySelectorAll('.wb-list-command-bar__actions').forEach(function (actions) {
      var primaryActions = actions.querySelectorAll(':scope > .wb-list-command-bar__primary');
      primaryActions.forEach(function (action, index) {
        action.classList.toggle('hg-list-action--secondary', index > 0);
      });
    });

    document.querySelectorAll('.wb-data-table').forEach(function (table) {
      var headers = Array.prototype.slice.call(table.querySelectorAll('thead tr:first-child > th, thead tr:first-child > td'));
      if (!headers.length) return;
      var labels = headers.map(function (header) {
        return header.textContent.replace(/\s+/g, ' ').trim();
      });
      var retiredIndexes = labels.reduce(function (indexes, label, index) {
        if (/^(?:xmpp|vserver)$/i.test(label)) indexes.push(index);
        return indexes;
      }, []);
      retiredIndexes.forEach(function (index) {
        headers[index].classList.add('hg-table-column--retired');
      });
      table.querySelectorAll('tr').forEach(function (row) {
        retiredIndexes.forEach(function (index) {
          if (row.children[index]) row.children[index].classList.add('hg-table-column--retired');
        });
      });
      var firstDataRow = table.querySelector('tbody > tr.wb-table-data-row');
      var actionCell = firstDataRow ? firstDataRow.querySelector('.wb-table-actions') : null;
      var actionIndex = actionCell ? Array.prototype.indexOf.call(firstDataRow.children, actionCell) : -1;
      if (actionIndex >= 0 && headers[actionIndex]) {
        headers[actionIndex].classList.add('wb-table-actions');
        if (!headers[actionIndex].textContent.trim()) {
          headers[actionIndex].textContent = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0
            ? 'Aktionen'
            : 'Actions';
        }
      }
      var identityIndex = labels.findIndex(function (label) {
        return /^(?:.*[\s_-])?(?:id|nr\.?|nummer)$/i.test(label);
      });
      var primaryPatterns = [
        /^(?:firmenname|company(?: name)?|firma)$/i,
        /^(?:domain(?:name)?|webseite|website|zone|zonenname)$/i,
        /^(?:e-?mail(?:-adresse)?|mailbox|postfach|quelle|source)$/i,
        /^(?:benutzername|username|login|name|titel|title)$/i,
        /^(?:kunde|client|server(?:name)?|ziel|destination)$/i
      ];
      var primaryIndex = -1;
      primaryPatterns.some(function (pattern) {
        primaryIndex = labels.findIndex(function (label, index) {
          return index !== identityIndex && pattern.test(label);
        });
        return primaryIndex >= 0;
      });
      if (primaryIndex < 0) {
        primaryIndex = labels.findIndex(function (label, index) {
          return index !== identityIndex && label && !/^(?:aktiv|active|status|gesperrt|locked|aktionen|actions?)$/i.test(label);
        });
      }
      if (primaryIndex < 0) return;

      headers[primaryIndex].classList.add('hg-table-column--primary');
      if (identityIndex >= 0 && identityIndex !== primaryIndex) headers[identityIndex].classList.add('hg-table-column--identity');
      headers.forEach(function (header, index) {
        if (/^(?:aktiv|active|status|gesperrt|locked|enabled)$/i.test(labels[index])) {
          header.classList.add('hg-table-column--status');
        }
      });

      table.querySelectorAll('tbody > tr').forEach(function (row) {
        if (!row.classList.contains('wb-table-data-row')) return;
        var identity = identityIndex >= 0 ? row.children[identityIndex] : null;
        var primary = row.children[primaryIndex];
        if (!primary) return;
        var identityText = identity ? identity.textContent.replace(/\s+/g, ' ').trim() : '';
        var identityLabel = identityIndex >= 0 ? labels[identityIndex] : '';
        primary.classList.add('hg-table-column--primary');
        if (identity && identity !== primary) identity.classList.add('hg-table-column--identity');

        var sourceLink = (identity && identity.querySelector('a[href]')) || primary.querySelector('a[href]');
        if (sourceLink && !primary.querySelector('a, button, input') && primary.textContent.trim()) {
          var promoted = sourceLink.cloneNode(false);
          promoted.className = 'hg-record-primary-link';
          promoted.textContent = primary.textContent.trim();
          primary.replaceChildren(promoted);
        } else if (sourceLink && primary.contains(sourceLink)) {
          sourceLink.classList.add('hg-record-primary-link');
        }

        if (identityText && !primary.querySelector('.hg-record-identity')) {
          var identitySummary = document.createElement('span');
          identitySummary.className = 'hg-record-identity';
          identitySummary.textContent = (identityLabel ? identityLabel + ' ' : '') + identityText;
          primary.appendChild(identitySummary);
        }

        headers.forEach(function (header, index) {
          if (header.classList.contains('hg-table-column--status') && row.children[index]) {
            row.children[index].classList.add('hg-table-column--status');
          }
        });
        var recordName = primary.textContent.replace(/\s+/g, ' ').trim();
        row.setAttribute('data-heritage-record-card', 'true');
        if (recordName) row.setAttribute('aria-label', recordName);
      });
    });
  }

  function localizeComponentLabels() {
    if ((document.documentElement.lang || '').toLowerCase().indexOf('de') !== 0) return;
    var tabLabels = {
      'Info': 'Informationen',
      'Address': 'Adresse',
      'Limits': 'Kontingente',
      'Sites': 'Webseiten',
      'Mail': 'E-Mail',
      'Web': 'Webseiten',
      'Cron': 'Cronjobs',
      'Rescue': 'Rettung',
      'Misc': 'Sonstiges'
    };
    document.querySelectorAll('#pageContent [role="tab"], #pageContent .nav-tabs a').forEach(function (tab) {
      var current = tab.textContent.trim();
      if (tabLabels[current]) tab.textContent = tabLabels[current];
    });

    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var title = pageContent.querySelector('h1');
    if (title && /^Client\s*-\s*/.test(title.textContent.trim())) {
      title.textContent = title.textContent.replace(/^Client\s*-\s*/, 'Kunde – ');
    }
    var pageTitles = {
      'Websites': 'Webseiten',
      'Supportnachricht': 'Supportnachrichten',
      'monitor_general_systemstate_txt': 'Systemzustand',
      'System Config': 'Systemkonfiguration',
      'Server Config': 'Serverkonfiguration',
      'User Settings': 'Benutzereinstellungen'
    };
    if (title && pageTitles[title.textContent.trim()]) {
      title.textContent = pageTitles[title.textContent.trim()];
    }

    if (title) {
      var normalizedTitle = title.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
      pageContent.querySelectorAll('h2, h3, .fieldset-legend, .wb-list-section-heading').forEach(function (heading) {
        if (heading === title || heading.querySelector('button, a, input, select')) return;
        var normalizedHeading = heading.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
        heading.classList.toggle('hg-redundant-heading', normalizedHeading !== '' && normalizedHeading === normalizedTitle);
      });
    }

    pageContent.querySelectorAll('.wb-form-tabs-shell').forEach(function (shell) {
      var tabs = shell.querySelectorAll('.wb-form-tabs > li, .nav-tabs > li');
      shell.classList.toggle('hg-single-tab-shell', tabs.length === 1);
    });

    var copy = {
      'Client info': 'Kundeninformationen',
      'Company Name:': 'Firma:',
      'Contact Name:': 'Kontakt:',
      'E-mail:': 'E-Mail:',
      'Login as:': 'Anmelden als:',
      'monitor_settings_refreshsq_txt': 'Automatische Aktualisierung',
      'monitor_serverstate_server_txt': 'Server',
      'monitor_serverstate_state_txt': 'Status',
      'monitor_serverstate_unknown_txt': 'Unbekannt',
      'monitor_serverstate_info_txt': 'Informationen',
      'monitor_serverstate_warning_txt': 'Warnungen',
      'monitor_serverstate_critical_txt': 'Kritisch',
      'monitor_serverstate_error_txt': 'Fehler',
      'monitor_serverstate_moreinfo_txt': 'Details anzeigen',
      '- No Refresh -': '– Keine Aktualisierung –',
      '5 minutes': '5 Minuten',
      '10 minutes': '10 Minuten',
      '15 minutes': '15 Minuten',
      '30 minutes': '30 Minuten',
      '60 minutes': '60 Minuten'
    };
    var walker = document.createTreeWalker(pageContent, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      Object.keys(copy).forEach(function (source) {
        if (value.indexOf(source) < 0) return;
        value = value.split(source).join(copy[source]);
      });
      if (node.nodeValue !== value) node.nodeValue = value;
    }
  }

  function syncModuleContext() {
    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var isMonitor = !!pageContent.querySelector('.wb-monitor-workspace, .systemmonitor, .stateview, .panel_system');
    var family = document.body.classList.contains('wb-dashboard-page') ? 'dashboard' :
      (isMonitor ? 'monitor' :
        (pageContent.querySelector('.wb-extension-workspace') ? 'extension' :
          (document.body.classList.contains('wb-form-profile--billing') || pageContent.querySelector('.wb-billing-product, .wb-billing-form, [data-billing-scope]') ? 'billing' :
            (document.body.classList.contains('wb-form-profile--system-config') || pageContent.querySelector('.wb-system-workspace, .system-config') ? 'system' : 'standard'))));
    document.body.classList.toggle('wb-monitor-page', isMonitor);
    pageContent.classList.toggle('wb-monitor-surface', isMonitor);
    document.body.setAttribute('data-heritage-module-family', family);
    pageContent.setAttribute('data-heritage-module-family', family);
    document.body.setAttribute('data-heritage-surface', isMonitor ? 'monitor' :
      (document.body.classList.contains('wb-list-page') ? 'list' :
        (document.body.classList.contains('wb-form-page') ? 'form' : 'module')));

    pageContent.querySelectorAll('.wb-monitor-workspace, .wb-extension-workspace, .wb-statistics-workspace, .wb-specialty-workspace, .wb-billing-product, .wb-billing-form, .wb-system-workspace').forEach(function (workspace) {
      workspace.setAttribute('data-heritage-module-workspace', family);
    });
    pageContent.querySelectorAll('.wb-monitor-hero, .wb-extension-hero, .wb-dashboard-hero').forEach(function (hero, index) {
      hero.setAttribute('data-heritage-module-hero', 'true');
      var heading = hero.querySelector('h1, h2');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-module-title-' + index;
        hero.setAttribute('aria-labelledby', heading.id);
      }
    });
    pageContent.querySelectorAll('.wb-monitor-chart-panel, .wb-monitor-status-panel, .wb-billing-panel, .wb-billing-settings-card, .wb-extension-workspace .panel, .wb-system-workspace .panel').forEach(function (panel, index) {
      panel.setAttribute('data-heritage-module-panel', 'true');
      var heading = panel.querySelector('h2, h3, .panel-title, .panel-heading');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-module-panel-' + index;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', heading.id);
      }
    });
    pageContent.querySelectorAll('.wb-monitor-refresh-panel, .wb-specialty-actions, .wb-extension-actions, .wb-billing-actions').forEach(function (actions) {
      actions.setAttribute('data-heritage-module-actions', 'true');
      actions.setAttribute('role', 'toolbar');
      actions.setAttribute('aria-label', (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0 ? 'Modulaktionen' : 'Module actions');
    });
  }

  function enhanceAccessibility() {
    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var pageTitle = pageContent.querySelector('h1');
    var titleText = pageTitle ? pageTitle.textContent.trim() : '';

    pageContent.querySelectorAll('a[href="#"]').forEach(function (link) {
      var name = (link.getAttribute('aria-label') || link.getAttribute('title') || link.textContent || '').trim();
      if (name || link.querySelector('img, svg, [class*="icon"]')) return;
      link.removeAttribute('href');
      link.setAttribute('tabindex', '-1');
      link.setAttribute('aria-hidden', 'true');
    });

    pageContent.querySelectorAll('button[title], a[title], [role="button"][title]').forEach(function (control) {
      if (!control.getAttribute('aria-label') && !control.textContent.trim()) {
        control.setAttribute('aria-label', control.getAttribute('title'));
      }
    });

    pageContent.querySelectorAll('.alert, .alert-notification, .wb-feedback').forEach(function (notice) {
      var urgent = notice.classList.contains('alert-danger') || notice.classList.contains('wb-feedback--danger');
      notice.setAttribute('role', urgent ? 'alert' : 'status');
      notice.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
      notice.setAttribute('aria-atomic', 'true');
    });

    pageContent.querySelectorAll('[role="tablist"], .nav-tabs').forEach(function (tablist) {
      tablist.setAttribute('aria-label', german ? 'Abschnitte' : 'Sections');
      tablist.setAttribute('aria-orientation', 'horizontal');
    });

    pageContent.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
      field.setAttribute('aria-required', 'true');
    });
    pageContent.querySelectorAll('.has-error input, .has-error select, .has-error textarea, [aria-invalid="true"]').forEach(function (field) {
      field.setAttribute('aria-invalid', 'true');
    });

    pageContent.querySelectorAll('.table-responsive, .wb-table-scroll, .wb-table-viewport, .wb-owned-scroll-region').forEach(function (region) {
      var table = region.querySelector('table');
      if (!table) return;
      var caption = table.querySelector('caption');
      var label = caption && caption.textContent.trim();
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', label || (titleText + (german ? ' – Tabelle' : ' – table')));
      region.setAttribute('tabindex', region.scrollWidth > region.clientWidth ? '0' : '-1');
    });

    pageContent.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      ['noopener', 'noreferrer'].forEach(function (value) {
        if (rel.indexOf(value) < 0) rel.push(value);
      });
      link.setAttribute('rel', rel.join(' '));
    });
  }

  function enhancePageComposition() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var heading = host.querySelector(':scope > .wb-page-header, :scope > .page-header');
    var title = heading && heading.querySelector('h1, h2');

    if (heading) {
      heading.setAttribute('data-heritage-page-header', 'true');
      if (title && !title.id) title.id = 'heritage-page-title';
      if (title) host.setAttribute('aria-labelledby', title.id);
      var headingActions = heading.querySelector('.wb-page-header__actions');
      if (headingActions) {
        headingActions.setAttribute('role', 'group');
        headingActions.setAttribute('aria-label', german ? 'Seitenaktionen' : 'Page actions');
      }
    }

    var meta = host.querySelector(':scope > .wb-page-meta');
    if (meta) {
      meta.setAttribute('data-heritage-page-meta', 'true');
      meta.setAttribute('aria-label', german ? 'Seitenstatus' : 'Page status');
    }

    host.querySelectorAll(':scope > .wb-page-notices, :scope > .wb-feedback-stack').forEach(function (stack) {
      stack.setAttribute('data-heritage-notice-stack', 'true');
      stack.setAttribute('aria-label', german ? 'Meldungen' : 'Messages');
    });
    host.querySelectorAll('.alert, .alert-notification, .wb-feedback').forEach(function (notice) {
      var severity = notice.classList.contains('alert-danger') || notice.classList.contains('wb-feedback--danger') ? 'danger' :
        (notice.classList.contains('alert-warning') || notice.classList.contains('wb-feedback--warning') ? 'warning' :
          (notice.classList.contains('alert-success') || notice.classList.contains('wb-feedback--success') ? 'success' : 'info'));
      notice.setAttribute('data-heritage-notice', severity);
    });

    host.querySelectorAll('.wb-list-command-bar').forEach(function (bar) {
      bar.setAttribute('data-heritage-command-bar', 'true');
      bar.setAttribute('role', 'toolbar');
      bar.setAttribute('aria-label', german ? 'Listenaktionen' : 'List actions');
      var primary = bar.querySelector('.wb-list-command-bar__primary, .btn-primary');
      if (primary) primary.setAttribute('data-heritage-primary-action', 'true');
    });

    host.querySelectorAll('.wb-content-state').forEach(function (state) {
      state.setAttribute('data-heritage-content-state', 'true');
      state.setAttribute('role', state.classList.contains('wb-content-state--error') ? 'alert' : 'status');
      state.setAttribute('aria-live', state.classList.contains('wb-content-state--error') ? 'assertive' : 'polite');
    });
  }

  function enhanceDashboard() {
    var host = document.getElementById('pageContent');
    if (!host || !document.body.classList.contains('wb-dashboard-page')) return;
    /* Dashboard widgets may contain small quota tables. They are enhanced as
     * tables, but must not reclassify the complete cockpit as a list page. */
    host.classList.remove('wb-table-workspace', 'wb-table-workspace--finalized');
    document.body.classList.remove('wb-list-page', 'wb-form-page');
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var sections = [
      {
        selector: '.wb-dashlet-module-atomic',
        key: 'modules',
        title: german ? 'Bereiche' : 'Modules',
        description: german ? 'Direkteinstiege in deine Arbeitsbereiche' : 'Direct access to your work areas'
      },
      {
        selector: '.wb-dashlet-metric-atomic',
        key: 'metrics',
        title: german ? 'Systemmetriken' : 'System metrics',
        description: german ? 'Aktuelle Messwerte und interaktive Verläufe' : 'Current readings and interactive trends'
      },
      {
        selector: '.wb-dashlet-limits, .wb-dashlet-quota, .wb-dashlet-mailquota, .wb-dashlet-databasequota',
        key: 'capacity',
        title: german ? 'Kapazitäten' : 'Capacity',
        description: german ? 'Kontingente, Nutzung und verfügbare Reserven' : 'Limits, usage and available headroom'
      }
    ];

    sections.forEach(function (section) {
      var first = host.querySelector(section.selector + ':not([data-wb-hidden="true"])');
      var marker = host.querySelector('[data-heritage-dashboard-section="' + section.key + '"]');
      if (!first || first.hidden || first.getClientRects().length === 0) {
        if (marker) marker.hidden = true;
        return;
      }
      if (!marker) {
        marker = document.createElement('header');
        marker.className = 'hg-dashboard-section';
        marker.setAttribute('data-heritage-dashboard-section', section.key);
        marker.innerHTML = '<strong></strong><span></span>';
      }
      marker.hidden = false;
      var heading = marker.querySelector('strong');
      var description = marker.querySelector('span');
      if (heading.textContent !== section.title) heading.textContent = section.title;
      if (description.textContent !== section.description) description.textContent = section.description;
      if (marker.nextElementSibling !== first) host.insertBefore(marker, first);
    });

    host.querySelectorAll('[data-wb-metric-toggle]').forEach(function (toggle, index) {
      var metric = toggle.getAttribute('data-wb-metric-toggle') || String(index);
      var details = host.querySelector('[data-wb-metric-details="' + metric + '"]');
      if (!details) return;
      var id = details.id || ('heritage-metric-details-' + metric.replace(/[^a-z0-9_-]/gi, '-'));
      details.id = id;
      toggle.setAttribute('aria-controls', id);
      toggle.setAttribute('aria-haspopup', 'true');
    });
  }

  function enhanceForms() {
    var host = document.getElementById('pageContent');
    var form = document.getElementById('pageForm');
    if (!host || !form || !form.contains(host) || !host.querySelector('.wb-form-actions')) {
      if (form) {
        form.removeAttribute('data-heritage-form-density');
        form.removeAttribute('data-heritage-form-system');
        form.removeAttribute('data-heritage-field-count');
        form.removeAttribute('aria-label');
      }
      return;
    }
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var controls = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
    form.setAttribute('data-heritage-form-density', controls.length > 28 ? 'long' : (controls.length > 12 ? 'standard' : 'compact'));
    form.setAttribute('data-heritage-form-system', 'true');
    form.setAttribute('data-heritage-field-count', String(controls.length));
    if (!form.getAttribute('aria-label')) form.setAttribute('aria-label', german ? 'Bearbeitungsformular' : 'Edit form');

    var fieldContracts = {
      company_name: { autocomplete: 'organization' },
      contact_firstname: { autocomplete: 'given-name' },
      contact_name: { autocomplete: 'family-name' },
      username: { autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false' },
      email: { autocomplete: 'email', inputmode: 'email', autocapitalize: 'none', spellcheck: 'false' },
      street: { autocomplete: 'street-address' },
      zip: { autocomplete: 'postal-code', inputmode: 'numeric' },
      city: { autocomplete: 'address-level2' },
      state: { autocomplete: 'address-level1' },
      country: { autocomplete: 'country' },
      telephone: { autocomplete: 'tel', inputmode: 'tel' },
      mobile: { autocomplete: 'tel', inputmode: 'tel' },
      fax: { inputmode: 'tel' },
      internet: { autocomplete: 'url', inputmode: 'url', autocapitalize: 'none', spellcheck: 'false' },
      password: { autocomplete: 'new-password' },
      repeat_password: { autocomplete: 'new-password' }
    };
    Object.keys(fieldContracts).forEach(function (id) {
      var field = form.querySelector('#' + id);
      if (!field) return;
      Object.keys(fieldContracts[id]).forEach(function (name) {
        if (!field.getAttribute(name)) field.setAttribute(name, fieldContracts[id][name]);
      });
    });

    form.querySelectorAll('.wb-form-section, fieldset, .panel, .wb-content-panel').forEach(function (section, sectionIndex) {
      var heading = section.querySelector(':scope > .wb-form-section-heading, :scope > legend, :scope > .panel-heading, :scope > .wb-content-panel__header');
      section.setAttribute('data-heritage-form-section', 'true');
      section.setAttribute('role', section.tagName === 'FIELDSET' ? 'group' : 'region');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-form-section-' + sectionIndex;
        section.setAttribute('aria-labelledby', heading.id);
      }
    });

    form.querySelectorAll('.wb-field-group, .form-group, .ctrlHolder').forEach(function (group, groupIndex) {
      var field = group.querySelector('input:not([type="hidden"]), select, textarea');
      if (!field) return;
      group.setAttribute('data-heritage-field', 'true');
      var label = group.querySelector('label, .control-label');
      if (label && !label.id) label.id = 'heritage-field-label-' + groupIndex;
      if (label && !field.getAttribute('aria-labelledby') && !field.getAttribute('aria-label')) field.setAttribute('aria-labelledby', label.id);
      var help = group.querySelector('.help-block, .form-text, .field-help, .wb-field-help');
      var error = group.querySelector('.help-block-error, .field-error, .wb-field-error');
      var descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      [help, error].forEach(function (description, index) {
        if (!description) return;
        if (!description.id) description.id = 'heritage-field-' + (field.id || 'control') + '-' + (index ? 'error' : 'help');
        if (descriptions.indexOf(description.id) < 0) descriptions.push(description.id);
      });
      if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
      group.classList.toggle('hg-field-group--disabled', field.disabled);
      group.toggleAttribute('data-heritage-required', field.required || field.getAttribute('aria-required') === 'true' || group.classList.contains('wb-field-group--required'));
      group.toggleAttribute('data-heritage-invalid', field.getAttribute('aria-invalid') === 'true' || group.classList.contains('has-error') || group.classList.contains('wb-field-group--invalid'));
      if (help) help.setAttribute('role', 'note');
      if (error) {
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'polite');
      }
    });

    form.querySelectorAll('.wb-form-actions').forEach(function (actions) {
      actions.setAttribute('role', 'region');
      actions.setAttribute('aria-label', german ? 'Formularaktionen' : 'Form actions');
      actions.setAttribute('data-heritage-form-actions', 'true');
      var actionControls = actions.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      actions.setAttribute('data-heritage-action-count', String(actionControls.length));
      actionControls.forEach(function (action) {
        if (action.matches('.formbutton-success, .btn-primary, .wb-form-action--primary, .wb-action-control--primary')) action.setAttribute('data-heritage-action', 'primary');
        else if (action.matches('.formbutton-danger, .btn-danger, .wb-form-action--danger')) action.setAttribute('data-heritage-action', 'danger');
        else action.setAttribute('data-heritage-action', 'secondary');
      });
    });

    syncFormValidation(form, german);
    if (form.dataset.heritageValidationBound !== 'true') {
      form.dataset.heritageValidationBound = 'true';
      ['input', 'change'].forEach(function (eventName) {
        form.addEventListener(eventName, function () {
          window.requestAnimationFrame(function () { syncFormValidation(form, german); });
        });
      });
    }
  }

  function enhanceTables() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    host.querySelectorAll('.wb-data-table').forEach(function (table) {
      var headingRow = table.querySelector('thead > tr:first-child');
      var headers = headingRow ? Array.prototype.slice.call(headingRow.children) : [];
      headers.forEach(function (header) {
        if (header.matches('.sorting_asc, [data-sort-direction="asc"]')) header.setAttribute('aria-sort', 'ascending');
        else if (header.matches('.sorting_desc, [data-sort-direction="desc"]')) header.setAttribute('aria-sort', 'descending');
        else if (header.matches('.sorting, [data-sortable="true"]')) header.setAttribute('aria-sort', 'none');
      });

      var filterRow = table.querySelector('thead > tr[data-workbench-filter-row]');
      if (filterRow) {
        filterRow.setAttribute('aria-label', german ? 'Tabellenfilter' : 'Table filters');
        filterRow.querySelectorAll('input, select').forEach(function (control) {
          if (control.getAttribute('aria-label')) return;
          var cell = control.closest('th, td');
          var index = cell ? Array.prototype.indexOf.call(filterRow.children, cell) : -1;
          var heading = index >= 0 && headers[index] ? headers[index].textContent.replace(/\s+/g, ' ').trim() : '';
          control.setAttribute('aria-label', (german ? 'Filtern nach ' : 'Filter by ') + (heading || (german ? 'Wert' : 'value')));
        });
      }

      table.querySelectorAll('.wb-row-action').forEach(function (control) {
        var current = (control.getAttribute('aria-label') || control.getAttribute('title') || '').trim();
        var generic = /^(?:aktion|action)\s*\d*$/i.test(current);
        var href = (control.getAttribute('href') || '').toLowerCase();
        var label = current;
        if (control.classList.contains('wb-row-action--danger') || /delete|del=/.test(href)) label = german ? 'Löschen' : 'Delete';
        else if (control.classList.contains('wb-row-action--login') || /login/.test(href)) label = german ? 'Anmelden' : 'Log in';
        else if (control.classList.contains('wb-row-action--edit') || /edit/.test(href)) label = german ? 'Bearbeiten' : 'Edit';
        else if (/stat|traffic/.test(href)) label = german ? 'Statistiken' : 'Statistics';
        else if (!label || generic) label = german ? 'Weitere Aktion' : 'More action';
        control.setAttribute('aria-label', label);
        control.setAttribute('title', label);
      });
    });
  }

  function explicitInvalidFields(form) {
    var fields = [];
    form.querySelectorAll(
      '[aria-invalid="true"], .has-error input, .has-error select, .has-error textarea, ' +
      '.wb-field-error input, .wb-field-error select, .wb-field-error textarea'
    ).forEach(function (field) {
      if (field.matches('input, select, textarea') && fields.indexOf(field) < 0) fields.push(field);
    });
    return fields;
  }

  function syncFormValidation(form, german) {
    var invalid = explicitInvalidFields(form);
    var tabs = form.querySelectorAll('.wb-form-tabs a[href^="#"], .nav-tabs a[href^="#"]');
    tabs.forEach(function (tab) {
      var target = tab.getAttribute('href');
      var pane = target && target.length > 1 ? form.querySelector(target) : null;
      var count = pane ? invalid.filter(function (field) { return pane.contains(field); }).length : 0;
      var badge = tab.querySelector('.hg-tab-error-count');
      if (!tab.dataset.heritageBaseLabel) {
        var labelSource = tab.cloneNode(true);
        var oldBadge = labelSource.querySelector('.hg-tab-error-count');
        if (oldBadge) oldBadge.remove();
        tab.dataset.heritageBaseLabel = labelSource.textContent.replace(/\s+/g, ' ').trim();
      }
      if (!count) {
        if (badge) badge.remove();
        tab.removeAttribute('data-heritage-has-errors');
        tab.setAttribute('aria-label', tab.dataset.heritageBaseLabel);
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'hg-tab-error-count';
        badge.setAttribute('aria-hidden', 'true');
        tab.appendChild(badge);
      }
      if (badge.textContent !== String(count)) badge.textContent = String(count);
      tab.setAttribute('data-heritage-has-errors', 'true');
      tab.setAttribute('aria-label', tab.dataset.heritageBaseLabel + ' – ' + count + ' ' + (german ? 'Fehler' : (count === 1 ? 'error' : 'errors')));
    });

    var summary = form.querySelector(':scope > .hg-form-validation-summary');
    if (!invalid.length) {
      if (summary) summary.remove();
      return;
    }
    if (!summary) {
      summary = document.createElement('button');
      summary.type = 'button';
      summary.className = 'hg-form-validation-summary';
      summary.addEventListener('click', function () {
        var first = explicitInvalidFields(form)[0];
        if (!first) return;
        var pane = first.closest('.tab-pane');
        if (pane && !pane.classList.contains('active')) {
          var tab = form.querySelector('.wb-form-tabs a[href="#' + pane.id + '"], .nav-tabs a[href="#' + pane.id + '"]');
          if (tab) tab.click();
        }
        window.setTimeout(function () { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 40);
      });
      form.insertBefore(summary, form.firstChild);
    }
    var message = invalid.length + ' ' + (german ? (invalid.length === 1 ? 'Eingabe prüfen' : 'Eingaben prüfen') : (invalid.length === 1 ? 'field needs attention' : 'fields need attention'));
    if (summary.textContent !== message) summary.textContent = message;
  }

  function markShell() {
    document.body.classList.add('heritage-shell');
    var formEnhancementTimer = 0;
    new MutationObserver(function () {
      window.clearTimeout(formEnhancementTimer);
      formEnhancementTimer = window.setTimeout(enhanceForms, 40);
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
    window.setTimeout(enhanceForms, 0);

    var navigation = document.getElementById('workbench-mobile-navigation');
    if (navigation) {
      navigation.setAttribute('data-heritage-navigation', 'true');
      navigation.setAttribute('aria-label', 'Navigation');
      var navigationLandmark = navigation.querySelector('nav');
      if (navigationLandmark) navigationLandmark.setAttribute('aria-label', 'Navigation');
      var homeLink = navigation.querySelector('.wb-mobile-navigation__header a');
      if (homeLink) homeLink.setAttribute('aria-label', 'Übersicht');
    }
    syncThemeToggleLabel();
    enhancePageComposition();
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceTables();
    enhanceAccessibility();
    enhanceDashboard();
    window.setTimeout(enhanceDashboard, 250);
    window.setTimeout(enhanceForms, 250);

    new MutationObserver(syncThemeToggleLabel).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-wb-theme']
    });

    var pageContent = document.getElementById('pageContent');
    if (pageContent) {
      var contentEnhancementTimer = 0;
      var contentObserver;
      var observeContent = function () {
        contentObserver.observe(pageContent, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'disabled', 'aria-invalid']
        });
      };
      var enhanceObservedContent = function () {
        contentEnhancementTimer = 0;
        contentObserver.disconnect();
        enhancePageComposition();
        markIdentityColumns();
        localizeComponentLabels();
        syncModuleContext();
        enhanceAccessibility();
        enhanceForms();
        enhanceTables();
        observeContent();
      };
      contentObserver = new MutationObserver(function () {
        window.clearTimeout(contentEnhancementTimer);
        contentEnhancementTimer = window.setTimeout(enhanceObservedContent, 24);
      });
      observeContent();
    }

  }

  document.addEventListener('workbench:navigation-complete', function () {
    enhancePageComposition();
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceTables();
    enhanceAccessibility();
    enhanceDashboard();
    window.setTimeout(enhanceDashboard, 120);
    window.setTimeout(enhanceForms, 120);
  });
  document.addEventListener('click', function (event) {
    var reset = event.target.closest && event.target.closest('.wb-filter-reset');
    if (!reset || !document.body.classList.contains('heritage-shell')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    var host = document.getElementById('pageContent');
    var row = host && host.querySelector('thead tr[data-workbench-filter-row]');
    if (!row) return;

    row.querySelectorAll('input, select').forEach(function (control) {
      if (control.tagName === 'SELECT') control.selectedIndex = 0;
      else control.value = '';
    });

    var apply = row.querySelector('#Filter');
    if (apply) apply.click();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markShell, { once: true });
  } else {
    markShell();
  }
}());
;
