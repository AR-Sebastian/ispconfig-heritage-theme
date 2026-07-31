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
