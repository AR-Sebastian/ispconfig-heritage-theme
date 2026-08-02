(function(window, document) {
  'use strict';
  function runtime() { return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitForm !== 'function' || legacy.workbenchListFilterInstalled) return;
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
  window.workbenchListFilter = { isActive: function() { return Boolean(active); } };
  legacy.workbenchListFilterInstalled = true;
})(window, document);
