(function () {
  'use strict';

  var active = null;
  var messages = {};
  try {
    var source = document.getElementById('workbench-content-messages');
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
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
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
    feedback.removeAttribute('data-workbench-delayed');
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
      if (feedback) feedback.setAttribute('data-workbench-delayed', 'true');
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
  if (legacy && api && typeof legacy.submitForm === 'function' && !legacy.workbenchSubmitFeedbackInstalled) {
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
          if (window.workbenchContentStates && typeof window.workbenchContentStates.enhance === 'function') {
            window.workbenchContentStates.enhance(root, target, { source: 'submit-feedback', focus: true });
          } else {
            if (window.workbenchAccessibility) window.workbenchAccessibility.enhance(root);
            if (window.workbenchValidation) window.workbenchValidation.enhance(root, { focus: true });
            if (window.workbenchFeedback) window.workbenchFeedback.enhance(root);
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
    legacy.workbenchSubmitFeedbackInstalled = true;
  }

  window.workbenchSubmitFeedback = {
    begin: begin,
    success: success,
    failure: failure,
    complete: complete,
    isActive: function () { return Boolean(active); }
  };
  window.workbenchSubmitFeedbackInstalled = true;
}());
