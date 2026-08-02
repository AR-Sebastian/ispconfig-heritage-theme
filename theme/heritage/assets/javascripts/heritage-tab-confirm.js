(function () {
  'use strict';

  var pending = null;
  var committing = false;

  function app() {
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  }

  function dialog() {
    return document.getElementById('workbenchTabChangeDialog');
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
    target.querySelector('[data-workbench-tab-confirm-message]').textContent = mode === 'discard'
      ? target.dataset.discardMessage
      : target.dataset.warningMessage;
    target.querySelector('[data-workbench-tab-confirm-action="save"]').hidden = mode !== 'warning';
  }

  function open(anchor, mode) {
    var target = dialog();
    if (!target || !window.workbenchDialog || pending) return false;
    pending = { anchor: anchor, mode: mode };
    configure(target, mode);
    return window.workbenchDialog.open(target, anchor);
  }

  function cancel() {
    var target = dialog();
    pending = null;
    if (target && window.workbenchDialog) window.workbenchDialog.close(target, true);
  }

  function commit(action) {
    var decision = pending;
    var target = dialog();
    if (!decision || !decision.anchor || !decision.anchor.isConnected || !target) return cancel();
    pending = null;
    committing = true;
    window.workbenchDialog.close(target, false);
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
    var action = event.target.closest('#workbenchTabChangeDialog [data-workbench-tab-confirm-action]');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    var value = action.getAttribute('data-workbench-tab-confirm-action');
    if (value === 'cancel') cancel();
    else commit(value);
  });

  document.addEventListener('workbench:dialog-close', function (event) {
    if (event.target !== dialog() || committing) return;
    pending = null;
  });

  window.workbenchTabConfirm = {
    getPendingMode: function () { return pending ? pending.mode : null; },
    cancel: cancel
  };
  window.workbenchTabConfirmInstalled = true;
}());
