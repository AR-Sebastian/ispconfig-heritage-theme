(function(window, document) {
  'use strict';

  function flag(value) {
    return value === true || value === 'true' || value === 'y' || value === '1';
  }

  function app() {
    return typeof window.heritageRuntime === 'function' ? window.heritageRuntime() : null;
  }

  function applyRuntimeConfig() {
    var runtime = app();
    if (!runtime || !document.body) return false;

    var body = document.body;
    runtime.tabChangeDiscard = body.getAttribute('data-heritage-tab-change-discard') || '';
    runtime.tabChangeWarning = body.getAttribute('data-heritage-tab-change-warning') || '';
    runtime.tabChangeWarningTxt = body.getAttribute('data-heritage-tab-change-warning-text') || '';
    runtime.tabChangeDiscardTxt = body.getAttribute('data-heritage-tab-change-discard-text') || '';

    if (flag(body.getAttribute('data-heritage-use-load-indicator'))) runtime.setOption('useLoadIndicator', true);
    if (flag(body.getAttribute('data-heritage-use-combobox'))) runtime.setOption('useComboBox', true);

    return true;
  }

  function bootWorkbench() {
    if (!applyRuntimeConfig()) return;
    var runtime = app();
    if (runtime && typeof runtime.loadInitContent === 'function') {
      runtime.loadInitContent();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWorkbench, { once: true });
  } else {
    bootWorkbench();
  }
})(window, document);
