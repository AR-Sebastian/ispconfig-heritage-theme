(function (window, document) {
  'use strict';

  var activeRequest = null;

  function app() {
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  }

  function init() {
    var root = document.querySelector('[data-wb-branding-editor]');
    if (!root || root.dataset.ready === 'true' || !window.workbenchHttp) return;
    root.dataset.ready = 'true';

    var color = root.querySelector('#workbench-accent-color');
    var colorValue = root.querySelector('[data-wb-accent-value]');
    var light = root.querySelector('#workbench-light-logo-file');
    var dark = root.querySelector('#workbench-dark-logo-file');
    var favicon = root.querySelector('#workbench-favicon-file');
    var lightPreview = root.querySelector('[data-wb-light-preview]');
    var darkPreview = root.querySelector('[data-wb-dark-preview]');
    var faviconPreview = root.querySelector('[data-wb-favicon-preview]');
    var state = root.querySelector('[data-wb-branding-state]');
    var status = root.querySelector('[data-wb-branding-status]');
    var lightState = root.querySelector('[data-wb-light-state]');
    var darkState = root.querySelector('[data-wb-dark-state]');
    var faviconState = root.querySelector('[data-wb-favicon-state]');
    var accentState = root.querySelector('[data-wb-accent-state]');
    var saveButton = root.querySelector('[data-wb-branding-save]');
    var resetButton = root.querySelector('[data-wb-branding-reset]');
    var controls = [color, light, dark, favicon, saveButton, resetButton];
    var locked = false;

    function message(name, fallback) { return root.dataset[name] || fallback; }

    function endpoint() {
      var endpointName = root.dataset.endpointName || 'brandingAction';
      var runtime = app();
      if (runtime && typeof runtime.endpoint === 'function') return runtime.endpoint(endpointName);
      return endpointName;
    }

    function assetState(custom) {
      return custom ? message('assetCustom', 'Custom') : message('assetDefault', 'ISPConfig default');
    }

    function updateAssetStates(payload) {
      if (!payload) return;
      if (lightState && payload.has_custom_logo !== undefined) lightState.textContent = assetState(payload.has_custom_logo);
      if (darkState && payload.has_custom_dark_logo !== undefined) darkState.textContent = assetState(payload.has_custom_dark_logo);
      if (faviconState && payload.has_custom_favicon !== undefined) faviconState.textContent = assetState(payload.has_custom_favicon);
      if (accentState && payload.has_custom_accent !== undefined) accentState.textContent = assetState(payload.has_custom_accent);
    }

    function setColor(value) {
      var next = (value || color.value || '#CC151C').toUpperCase();
      color.value = next;
      colorValue.textContent = next;
      document.documentElement.style.setProperty('--wb-accent', next);
      document.documentElement.style.setProperty('--wb-action', next);
      if (window.workbenchApplyAccentContrast) window.workbenchApplyAccentContrast(next);
    }

    function preview(file, target) {
      if (!file || !target || !window.FileReader) return;
      var reader = new FileReader();
      reader.onload = function () { target.src = reader.result; };
      reader.readAsDataURL(file);
    }

    function setBusy(busy) {
      root.dataset.busy = busy ? 'true' : 'false';
      root.setAttribute('aria-busy', busy ? 'true' : 'false');
      controls.forEach(function (control) { if (control) control.disabled = busy || locked; });
    }

    function lockAfterAmbiguousFailure() {
      locked = true;
      root.dataset.brandingLocked = 'true';
      setBusy(false);
    }

    function updateCsrf(payload) {
      if (!payload || !payload.csrf_id || !payload.csrf_key) return false;
      root.dataset.csrfId = payload.csrf_id;
      root.dataset.csrfKey = payload.csrf_key;
      return true;
    }

    function waitForSessionIdle() {
      var runtime = app();
      if (runtime) clearTimeout(runtime.dataLogTimer);
      if (!runtime || Number(runtime.requestsRunning || 0) === 0) return Promise.resolve(true);
      return new Promise(function (resolve) {
        var deadline = Date.now() + 5000;
        function poll() {
          var current = app();
          if (current) clearTimeout(current.dataLogTimer);
          if (!current || Number(current.requestsRunning || 0) === 0) { resolve(true); return; }
          if (Date.now() >= deadline) { resolve(false); return; }
          window.setTimeout(poll, 50);
        }
        poll();
      });
    }

    function resumeStatusPolling() {
      var runtime = app();
      if (!runtime || typeof runtime.dataLogNotification !== 'function') return;
      clearTimeout(runtime.dataLogTimer);
      runtime.dataLogTimer = window.setTimeout(function () { runtime.dataLogNotification(); }, 1000);
    }

    function validFiles() {
      var logoTypes = ['image/png', 'image/jpeg', 'image/webp'];
      var faviconTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
      var lightFile = light.files[0];
      var darkFile = dark.files[0];
      var faviconFile = favicon.files[0];
      if ((lightFile && logoTypes.indexOf(lightFile.type) === -1) || (darkFile && logoTypes.indexOf(darkFile.type) === -1) || (faviconFile && faviconTypes.indexOf(faviconFile.type) === -1)) {
        status.textContent = message('brandingTypeError', 'Choose a supported image file.');
        return false;
      }
      if (lightFile && lightFile.size > Number(root.dataset.lightMaxBytes || 46080)) {
        status.textContent = message('lightSizeError', 'The light logo is too large.');
        return false;
      }
      if ((darkFile && darkFile.size > Number(root.dataset.brandingMaxBytes || 1048576)) || (faviconFile && faviconFile.size > Number(root.dataset.brandingMaxBytes || 1048576))) {
        status.textContent = message('brandingSizeError', 'A branding file is too large.');
        return false;
      }
      return true;
    }

    function updateShell(payload) {
      var headerLogo = document.getElementById('logo');
      if (headerLogo && payload.logo) {
        headerLogo.style.backgroundImage = 'url("' + payload.logo + '")';
        if (payload.width) headerLogo.style.width = payload.width + 'px';
        if (payload.height) headerLogo.style.height = payload.height + 'px';
      }
      if (payload.dark_logo) document.documentElement.style.setProperty('--wb-dark-logo', 'url("' + payload.dark_logo + '")');
      if (payload.favicon) {
        Array.from(document.querySelectorAll('link[rel*="icon"]')).forEach(function (link) { link.href = payload.favicon; });
      }
    }

    async function request(action) {
      if (activeRequest || locked || (action === 'branding_save' && !validFiles())) return;
      activeRequest = { action: action };
      setBusy(true);
      status.textContent = action === 'branding_reset' ? message('resetting', 'Restoring defaults …') : message('saving', 'Saving appearance …');
      var sessionReady = await waitForSessionIdle();
      if (!sessionReady) {
        status.textContent = message('requestError', 'The appearance action failed. Reload before trying again.');
        activeRequest = null;
        setBusy(false);
        resumeStatusPolling();
        return;
      }

      var body = new FormData();
      body.append('action', action);
      body.append('_csrf_id', root.dataset.csrfId || '');
      body.append('_csrf_key', root.dataset.csrfKey || '');
      if (action === 'branding_save') {
        body.append('accent_color', color.value);
        if (light.files[0]) body.append('light_logo_file', light.files[0], light.files[0].name);
        if (dark.files[0]) body.append('dark_logo_file', dark.files[0], dark.files[0].name);
        if (favicon.files[0]) body.append('favicon_file', favicon.files[0], favicon.files[0].name);
      }

      try {
        activeRequest.handle = window.workbenchHttp.postMultipartJson(body, endpoint(), { timeout: 120000 });
        var result = await activeRequest.handle.promise;
        var payload = result.payload || {};
        var rotated = updateCsrf(payload);
        if (!result.ok || !payload.ok) {
          status.textContent = payload.message || message('requestError', 'The appearance action failed.');
          if (!rotated) lockAfterAmbiguousFailure();
          return;
        }
        if (!rotated || !payload.logo || !payload.dark_logo || !payload.favicon || !payload.accent) throw new Error('invalid-response');
        lightPreview.src = payload.logo;
        darkPreview.src = payload.dark_logo;
        faviconPreview.src = payload.favicon;
        light.value = '';
        dark.value = '';
        favicon.value = '';
        setColor(payload.accent);
        updateShell(payload);
        updateAssetStates(payload);
        state.textContent = payload.has_custom_logo ? message('customState', 'A custom interface logo is active.') : message('defaultState', 'The default ISPConfig logo is active.');
        status.textContent = payload.message || (action === 'branding_reset' ? message('reset', 'Defaults restored.') : message('saved', 'Appearance saved.'));
      } catch (error) {
        lockAfterAmbiguousFailure();
        status.textContent = message('requestError', 'The appearance action failed. Reload before trying again.');
      } finally {
        activeRequest = null;
        setBusy(false);
        resumeStatusPolling();
      }
    }

    color.addEventListener('input', function () {
      setColor(color.value);
      if (accentState) accentState.textContent = assetState(String(color.value || '').toUpperCase() !== '#CC151C');
    });
    light.addEventListener('change', function () { preview(light.files[0], lightPreview); });
    dark.addEventListener('change', function () { preview(dark.files[0], darkPreview); });
    favicon.addEventListener('change', function () { preview(favicon.files[0], faviconPreview); });
    saveButton.addEventListener('click', function () { request('branding_save'); });
    resetButton.addEventListener('click', function () { request('branding_reset'); });
    setColor(color.value);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  document.addEventListener('workbench:navigation-complete', init);
})(window, document);
