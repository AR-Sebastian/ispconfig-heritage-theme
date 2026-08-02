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
    var source = document.getElementById('workbench-content-messages');
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
