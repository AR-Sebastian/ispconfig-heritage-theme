(function (window, document) {
  'use strict';

  function runtime() { return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitUploadForm !== 'function' || legacy.workbenchUploadFeedbackInstalled) return;

  var originalSubmitUploadForm = legacy.submitUploadForm;
  var active = null;
  var messages = {};

  try {
    var source = document.getElementById('workbench-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) { messages = {}; }

  function requestPath(value) {
    try { return new URL(value || '', document.baseURI).pathname.replace(/^\//, ''); }
    catch (error) { return ''; }
  }

  function matchingControl(formname, target) {
    if (formname !== 'pageForm' || !window.workbenchHttp || typeof window.workbenchHttp.postMultipart !== 'function') return null;
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
    feedback.removeAttribute('data-workbench-delayed');
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
      if (feedback) feedback.setAttribute('data-workbench-delayed', 'true');
    }, 7000);

    var request;
    try { request = window.workbenchHttp.postMultipart(form, target, { timeout: 120000 }); }
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

  window.workbenchUploadFeedback = {
    isActive: function () { return Boolean(active); },
    abort: function () { if (active && active.request) active.request.abort(); finish('failed', messages.upload_failed || 'The upload response was invalid. Try again.'); }
  };
  legacy.workbenchUploadFeedbackInstalled = true;
})(window, document);
