(function(window, document) {
  'use strict';
  function runtime() { return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof legacy.submitForm !== 'function' || legacy.workbenchWizardPreviewInstalled) return;
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
  window.workbenchWizardPreview = { isActive: function() { return Boolean(active); } };
  legacy.workbenchWizardPreviewInstalled = true;
})(window, document);
