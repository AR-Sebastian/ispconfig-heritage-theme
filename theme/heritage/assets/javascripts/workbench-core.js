(function(window, document) {
  'use strict';

  function toArray(value) {
    return Array.prototype.slice.call(value || []);
  }

  function extend(target) {
    target = target || {};
    toArray(arguments).slice(1).forEach(function(source) {
      Object.keys(source || {}).forEach(function(key) { target[key] = source[key]; });
    });
    return target;
  }

  function matches(element, selector) {
    return Boolean(element && element.matches && element.matches(selector));
  }

  function closest(element, selector) {
    return element && element.closest ? element.closest(selector) : null;
  }

  function query(root, selector) {
    return (root || document).querySelector(selector);
  }

  function queryAll(root, selector) {
    return toArray((root || document).querySelectorAll(selector));
  }

  function htmlEscape(value) {
    return String(value || '').replace(/[&<>"']/g, function(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function cssEscape(value) {
    value = String(value || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return value.replace(/["\\]/g, '\\$&');
  }

  function svgLockIcon() {
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var body = document.createElementNS(namespace, 'rect');
    body.setAttribute('x', '5');
    body.setAttribute('y', '10');
    body.setAttribute('width', '14');
    body.setAttribute('height', '10');
    body.setAttribute('rx', '2');
    var shackle = document.createElementNS(namespace, 'path');
    shackle.setAttribute('d', 'M8 10V7a4 4 0 0 1 8 0v3');
    svg.appendChild(body);
    svg.appendChild(shackle);
    return svg;
  }

  var workbenchEndpoints = {
    sitesJson: 'sites/ajax_get_json.php',
    sitesIpOptions: 'sites/ajax_get_ip.php',
    mailJson: 'mail/ajax_get_json.php',
    dnsJson: '/dns/ajax_get_json.php',
    brandingAction: 'admin/custom_logo_action.php',
    globalSearch: '/dashboard/ajax_get_json.php'
  };

  function workbenchEndpoint(name, cacheBust) {
    var endpoint = workbenchEndpoints[name] || String(name || '');
    if (!cacheBust) return endpoint;
    return endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + Math.round(new Date().getTime());
  }

  function legacyApi() {
    return window.ISPConfig || null;
  }

  function runtimeApi() {
    return window.workbenchApp || legacyApi();
  }

  window.workbenchRuntime = function() {
    return runtimeApi();
  };

  function callRuntime(name, args) {
    var api = runtimeApi();
    if (!api || typeof api[name] !== 'function') return null;
    return api[name].apply(api, args || []);
  }

  function requestRuntimeJson(url, options) {
    var api = runtimeApi();
    if (!api || typeof api.requestJson !== 'function') throw new TypeError('Workbench JSON runtime is not available.');
    return api.requestJson(url, options || {});
  }

  function reportRuntimeError(message) {
    callRuntime('reportError', [message]);
  }

  function navigateRuntime(target, params) {
    return callRuntime('navigateTo', [target, params || null]);
  }

  function activateRuntimeFragment(host) {
    callRuntime('activateFragmentScripts', [host]);
  }

  function resetRuntimeFormChanged() {
    callRuntime('resetFormChanged');
  }

  function endpointWithQuery(endpoint, key, value) {
    if (!endpoint || !key || value === undefined || value === null || value === '') return endpoint || '';
    var separator = endpoint.indexOf('?') >= 0 ? '&' : '?';
    return endpoint + separator + encodeURIComponent(key) + '=' + encodeURIComponent(String(value));
  }

  function endpointFromControl(control, fallbackName) {
    var endpointName = control && control.getAttribute('data-endpoint-name');
    if (endpointName) return workbenchEndpoint(endpointName);
    var endpoint = control && control.getAttribute('data-endpoint');
    if (endpoint) return endpoint;
    return fallbackName ? workbenchEndpoint(fallbackName) : '';
  }

  function endpointWithQueryTemplate(endpoint, template, control) {
    var query = controlUrl(template || '', control);
    if (!query) return endpoint || '';
    return (endpoint || '') + ((endpoint || '').indexOf('?') >= 0 ? '&' : '?') + query.replace(/^\?/, '');
  }

  function setHtml(host, markup) {
    if (!host) return;
    host.innerHTML = markup || '';
    normalizeWorkbenchContentContracts(host);
    activateRuntimeFragment(host);
  }

  function serializeForm(form) {
    return new URLSearchParams(new FormData(form)).toString();
  }

  function trigger(element, name) {
    if (!element) return;
    element.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
  }

  var WORKBENCH_CONTENT_CONTRACTS = {
    load: {
      native: 'data-workbench-load-content',
      legacy: 'data-load-content',
      selector: 'a[data-workbench-load-content],button[data-workbench-load-content],a[data-load-content],button[data-load-content]'
    },
    template: {
      native: 'data-workbench-load-content-template',
      legacy: 'data-load-content-template'
    },
    target: {
      native: 'data-workbench-load-content-into',
      legacy: 'data-load-content-into',
      selector: '[data-workbench-load-content-into],[data-load-content-into]'
    },
    module: {
      native: 'data-workbench-module',
      legacy: 'data-capp',
      selector: 'a[data-workbench-module],button[data-workbench-module],a[data-capp],button[data-capp]'
    }
  };

  function workbenchContractValue(element, contract) {
    if (!element || !contract) return null;
    return element.getAttribute(contract.native) || element.getAttribute(contract.legacy);
  }

  function mirrorAttribute(root, selector, sourceAttribute, targetAttribute) {
    queryAll(root || document, selector).forEach(function(element) {
      if (element.hasAttribute(targetAttribute)) return;
      var value = element.getAttribute(sourceAttribute);
      if (value !== null && value !== '') element.setAttribute(targetAttribute, value);
    });
  }

  function normalizeWorkbenchContentContracts(root) {
    root = root || document;
    mirrorAttribute(root, '[' + WORKBENCH_CONTENT_CONTRACTS.load.legacy + ']', WORKBENCH_CONTENT_CONTRACTS.load.legacy, WORKBENCH_CONTENT_CONTRACTS.load.native);
    mirrorAttribute(root, '[' + WORKBENCH_CONTENT_CONTRACTS.template.legacy + ']', WORKBENCH_CONTENT_CONTRACTS.template.legacy, WORKBENCH_CONTENT_CONTRACTS.template.native);
    mirrorAttribute(root, '[' + WORKBENCH_CONTENT_CONTRACTS.target.legacy + ']', WORKBENCH_CONTENT_CONTRACTS.target.legacy, WORKBENCH_CONTENT_CONTRACTS.target.native);
    mirrorAttribute(root, '[' + WORKBENCH_CONTENT_CONTRACTS.module.legacy + ']', WORKBENCH_CONTENT_CONTRACTS.module.legacy, WORKBENCH_CONTENT_CONTRACTS.module.native);
    return root;
  }

  function controlUrl(template, control) {
    var value = control ? control.value || '' : '';
    return String(template || '').replace(/\{value\}/g, encodeURIComponent(value));
  }

  function checkRelatedRadio(control) {
    var selector = control && control.getAttribute('data-check-radio-on-focus');
    var form = control && control.form;
    var option = selector ? query(form || document, selector) : null;
    if (option && option.type === 'radio') option.checked = true;
  }

  function handleRedirect(responseText) {
    if (typeof responseText !== 'string') return false;
    if (responseText.indexOf('WORKBENCH_RELOAD:') > -1) {
      document.location.reload();
      return true;
    }
    if (responseText.indexOf('HEADER_REDIRECT:') > -1) {
      navigateRuntime(responseText.split(':')[1]);
      return true;
    }
    if (responseText.indexOf('URL_REDIRECT:') > -1) {
      document.location.href = responseText.substr(responseText.indexOf('URL_REDIRECT:') + 'URL_REDIRECT:'.length);
      return true;
    }
    if (responseText.indexOf('LOGIN_REDIRECT:') > -1) {
      document.location.href = './index.php';
      return true;
    }
    return false;
  }

  function scrollToTop() {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (error) { window.scrollTo(0, 0); }
  }

  function copyTextToClipboard(value, control) {
    value = String(value || '').trim();
    if (!value) return;

    function markDone() {
      if (!control) return;
      control.setAttribute('data-workbench-copy-state', 'done');
      window.setTimeout(function() {
        control.removeAttribute('data-workbench-copy-state');
      }, 1400);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(markDone, function() {});
      return;
    }

    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      markDone();
    } catch (error) {}
    document.body.removeChild(textarea);
  }

  function setFieldValue(id, value) {
    var field = document.getElementById(id);
    if (!field) return;
    field.value = value || '';
    trigger(field, 'input');
    trigger(field, 'change');
  }

  function initSslClientDataHelpers(root) {
    queryAll(root || document, '[data-ssl-client-helper]').forEach(function(helper) {
      if (helper.getAttribute('data-workbench-initialized') === 'true') return;
      helper.setAttribute('data-workbench-initialized', 'true');
      var idFieldName = helper.getAttribute('data-record-field') || 'id';
      var idField = query(document, 'input[name="' + cssEscape(idFieldName) + '"]');
      if (idField && Number(idField.value) > 0) {
        helper.hidden = false;
        helper.style.display = '';
      }
    });
  }

  function resetSslClientData() {
    ['ssl_organisation', 'ssl_locality', 'ssl_state', 'ssl_organisation_unit'].forEach(function(id) {
      setFieldValue(id, '');
    });
    var sslCountry = document.getElementById('ssl_country');
    if (sslCountry && sslCountry.options.length) setFieldValue('ssl_country', sslCountry.options[0].value);
  }

  function loadSslClientData(control) {
    var idFieldName = control.getAttribute('data-record-field') || 'id';
    var idField = query(document, 'input[name="' + cssEscape(idFieldName) + '"]');
    var webId = idField ? idField.value : '';
    var endpoint = endpointFromControl(control, 'sitesJson');
    var request = requestRuntimeJson(endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + Math.round(new Date().getTime()), {
      query: {
        web_id: webId,
        type: control.getAttribute('data-ssl-request-type') || 'getclientssldata'
      },
      timeout: 30000
    });
    request.promise.then(function(data) {
      data = data || {};
      setFieldValue('ssl_organisation', data.company_name);
      setFieldValue('ssl_locality', data.city);
      setFieldValue('ssl_country', data.country);
      setFieldValue('ssl_state', data.state);
      setFieldValue('ssl_organisation_unit', data.organisation_unit || data.organization_unit || 'IT');
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('SSL client data could not be loaded.');
    });
    return request;
  }

  function setVisible(selector, visible) {
    queryAll(document, selector).forEach(function(element) {
      element.hidden = !visible;
      element.style.display = visible ? '' : 'none';
    });
  }

  function splitList(value, separator) {
    return String(value || '').split(separator || ',').map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }

  function syncVisibilityRules(control) {
    var rules = control && control.getAttribute('data-workbench-visibility-rules');
    if (!rules) return false;
    var value = String(control.value || '');
    splitList(rules, ';').forEach(function(rule) {
      var parts = rule.split('=');
      var selector = (parts.shift() || '').trim();
      var allowed = splitList(parts.join('='), '|');
      if (!selector) return;
      try {
        setVisible(selector, allowed.indexOf(value) !== -1);
      } catch (error) {
        if (window.console && console.warn) console.warn('Invalid Workbench visibility selector:', selector, error);
      }
    });
    return true;
  }

  function syncDeclaredVisibility(control) {
    var targetId = control && control.getAttribute('data-workbench-sync-visibility');
    var target = targetId ? document.getElementById(targetId) : null;
    if (!target) return false;
    var expected = control.getAttribute('data-visible-value') || '';
    var visible = String(control.value || '') === expected;
    target.hidden = !visible;
    target.style.display = visible ? '' : 'none';
    return true;
  }

  function syncDatabaseTypeFields(control) {
    var targets = control && control.getAttribute('data-workbench-database-type-toggle');
    if (!targets) return false;
    var hide = String(control.value || '') === 'postgresql';
    targets.split(',').forEach(function(id) {
      var field = document.getElementById(id.trim());
      var group = field ? closest(field, '.form-group') : null;
      if (!group) return;
      group.hidden = hide;
      group.style.display = hide ? 'none' : '';
    });
    return true;
  }

  function initDisabledHiddenClones(root) {
    queryAll(root || document, 'select[data-workbench-disabled-clone-hidden]').forEach(function(select) {
      if (select.getAttribute('data-workbench-hidden-clone-initialized') === 'true') return;
      var originalName = select.getAttribute('name') || '';
      if (!originalName) return;
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = originalName;
      hidden.value = select.value || '';
      select.setAttribute('data-workbench-hidden-clone-initialized', 'true');
      select.name = originalName + '_disabled';
      if (select.id) select.id = select.id + '_disabled';
      select.insertAdjacentElement('afterend', hidden);
    });
  }

  function initConfirmUncheck(root) {
    queryAll(root || document, '[data-workbench-confirm-uncheck]').forEach(function(marker) {
      if (marker.getAttribute('data-workbench-confirm-initialized') === 'true') return;
      var field = document.getElementById(marker.getAttribute('data-workbench-confirm-uncheck') || '');
      if (!field) return;
      marker.setAttribute('data-workbench-confirm-initialized', 'true');
      field.addEventListener('click', function(event) {
        if (field.checked) return;
        if (window.confirm(marker.getAttribute('data-confirm-message') || '')) return;
        event.preventDefault();
      });
    });
  }

  function generateWorkbenchPassword(length) {
    var size = Math.max(8, Number(length || 16));
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%+=?';
    var values = new Uint32Array(size);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      for (var fallbackIndex = 0; fallbackIndex < size; fallbackIndex += 1) values[fallbackIndex] = Math.floor(Math.random() * chars.length);
    }
    var passwordValue = '';
    for (var index = 0; index < size; index += 1) passwordValue += chars[values[index] % chars.length];
    return passwordValue;
  }

  function initDefaultPasswords(root) {
    queryAll(root || document, '[data-workbench-default-password]').forEach(function(input) {
      if (input.getAttribute('data-workbench-default-password-initialized') === 'true') return;
      input.setAttribute('data-workbench-default-password-initialized', 'true');
      if (input.value) return;
      input.value = generateWorkbenchPassword(input.getAttribute('data-workbench-default-password'));
    });
  }

  function isMasterTemplateEditable(region) {
    var masterId = region.getAttribute('data-template-master-control') || 'template_master';
    var master = document.getElementById(masterId);
    return master ? master.value === '0' : true;
  }

  function isMasterTemplateLockExempt(region, field) {
    var selector = region.getAttribute('data-template-lock-exempt') || '';
    if (!selector || !field || !field.matches) return false;
    return field.matches(selector) || !!closest(field, selector);
  }

  function handleMasterTemplateLock(region, event, alertUser) {
    if (isMasterTemplateEditable(region)) return;
    var field = closest(event.target, 'input, select, textarea, button');
    if (!field || !region.contains(field) || isMasterTemplateLockExempt(region, field)) return;
    event.preventDefault();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    else event.stopPropagation();
    if (alertUser && window.ISPConfig && typeof window.ISPConfig.notify === 'function') {
      window.ISPConfig.notify(
        region.getAttribute('data-template-lock-message') || (
          typeof window.workbenchLanguage === 'function' && window.workbenchLanguage() === 'de'
            ? 'Dieses Formular wird durch eine Mastervorlage gesteuert.'
            : 'This form is controlled by a master template.'
        ),
        'warning'
      );
    }
    if (field.blur) field.blur();
  }

  function initMasterTemplateLocks(root) {
    queryAll(root || document, '[data-workbench-master-template-lock]').forEach(function(region) {
      if (region.getAttribute('data-workbench-master-template-lock-initialized') === 'true') return;
      region.setAttribute('data-workbench-master-template-lock-initialized', 'true');
      region.addEventListener('click', function(event) {
        handleMasterTemplateLock(region, event, true);
      }, true);
      region.addEventListener('focusin', function(event) {
        handleMasterTemplateLock(region, event, false);
      }, true);
    });
  }

  function setExpanded(element, expanded) {
    if (!element) return;
    element.classList.toggle('in', expanded);
    element.classList.toggle('show', expanded);
    element.hidden = !expanded;
    element.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  }

  function bindCheckboxDisclosure(sourceId, targetId, afterChange) {
    var source = document.getElementById(sourceId);
    var target = document.getElementById(targetId);
    if (!source || !target) return null;

    var update = function() {
      setExpanded(target, source.checked);
      if (typeof afterChange === 'function') afterChange();
    };

    if (source.getAttribute('data-workbench-disclosure-initialized') !== 'true') {
      source.setAttribute('data-workbench-disclosure-initialized', 'true');
      source.addEventListener('change', update);
    }
    update();
    return update;
  }

  function syncPasswordValidation(control) {
    if (!control || !control.getAttribute) return;
    var contract = control.getAttribute('data-workbench-password-check') || '';
    if (!contract) return;
    var parts = contract.split(':');
    var passwordId = parts[0] || control.id || 'password';
    var repeatId = parts[1] || 'repeat_password';
    if (control.getAttribute('data-workbench-password-strength') === 'true' && typeof window.pass_check === 'function') {
      window.pass_check(control.value || '');
    }
    if (typeof window.checkPassMatch === 'function') {
      window.checkPassMatch(passwordId, repeatId);
    }
  }

  function initStaticSelectMirrors(root) {
    queryAll(root || document, 'select[data-workbench-static-select-mirror]').forEach(function(select) {
      if (select.getAttribute('data-workbench-static-select-initialized') === 'true') return;
      var name = select.getAttribute('name') || '';
      if (!name) return;
      var selected = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
      var label = selected ? selected.textContent : select.value;
      var text = document.createElement('p');
      text.className = 'form-control-static workbench-static-field';
      text.textContent = label || select.value || '';
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = select.value || '';
      select.setAttribute('data-workbench-static-select-initialized', 'true');
      select.insertAdjacentElement('beforebegin', text);
      select.insertAdjacentElement('beforebegin', hidden);
      select.remove();
    });
  }

  function setInputByName(name, value) {
    var input = query(document, 'input[name="' + cssEscape(name) + '"]');
    if (!input) return;
    input.value = value || '';
  }

  function replaceSelectOptions(select, data) {
    if (!select) return;
    var currentValue = select.value;
    select.replaceChildren();
    var empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '';
    select.appendChild(empty);
    Object.keys(data || {}).forEach(function(key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = data[key];
      option.selected = currentValue === key;
      select.appendChild(option);
    });
    trigger(select, 'change');
  }

  function updateTooltipText(id, value) {
    var element = document.getElementById(id);
    if (!element) return;
    element.setAttribute('data-original-title', value || '');
    element.setAttribute('title', value || '');
  }

  function setOptionVisible(select, value, visible) {
    if (!select) return;
    var option = query(select, 'option[value="' + cssEscape(value) + '"]');
    if (!option) return;
    option.hidden = !visible;
    option.disabled = !visible;
    option.style.display = visible ? '' : 'none';
  }

  function normalizeSelectValue(select, allowed, fallback) {
    if (!select) return;
    if (select.value === '' || allowed.indexOf(select.value) !== -1) return;
    select.value = fallback || 'no';
  }

  function setLastTabVisible(visible) {
    var lastTab = query(document, '.tabbox_tabs ul li:last-child');
    if (!lastTab) return;
    lastTab.hidden = !visible;
    lastTab.style.display = visible ? '' : 'none';
  }

  function requestSitesJson(queryData) {
    return requestRuntimeJson(workbenchEndpoint('sitesJson', true), { query: queryData || {}, timeout: 30000 });
  }

  function applyRedirectServerType(redirectType, serverType, allowApacheProxy) {
    var nginxValues = ['last', 'break', 'redirect', 'permanent', 'proxy'];
    var apacheValues = ['R', 'L', 'R,L', 'R=301,L'];
    var isNginx = serverType === 'nginx';
    nginxValues.forEach(function(value) { setOptionVisible(redirectType, value, isNginx || (allowApacheProxy && value === 'proxy')); });
    apacheValues.forEach(function(value) { setOptionVisible(redirectType, value, !isNginx); });
    normalizeSelectValue(redirectType, isNginx ? nginxValues.concat(['no']) : apacheValues.concat(allowApacheProxy ? ['no', 'proxy'] : ['no']), 'no');
  }

  function updateProxyTabFromRedirect() {
    var redirectType = document.getElementById('redirect_type');
    setLastTabVisible(!!redirectType && redirectType.value === 'proxy');
  }

  function syncChilddomainRedirect(control) {
    var redirectType = document.getElementById('redirect_type');
    if (!redirectType) return null;
    updateProxyTabFromRedirect();
    var request = requestSitesJson({ web_id: control.value || '', type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      var typeRequest = requestSitesJson({ server_id: serverId, type: 'getservertype' });
      typeRequest.promise.then(function(data) {
        applyRedirectServerType(redirectType, data && data.servertype, false);
        updateProxyTabFromRedirect();
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function syncProxyVisibility(control) {
    var webId = control && control.value ? control.value : '';
    var request = requestSitesJson({ web_id: webId, type: 'getredirecttype' });
    request.promise.then(function(data) {
      setVisible('.proxy', data && data.redirecttype === 'proxy');
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function syncVhostRedirect(control) {
    var webId = control && control.value ? control.value : '';
    var redirectType = document.getElementById('redirect_type');
    if (!redirectType) return null;
    var request = requestSitesJson({ web_id: webId, type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      var typeRequest = requestSitesJson({ server_id: serverId, type: 'getservertype' });
      typeRequest.promise.then(function(data) {
        var isNginx = data && data.servertype === 'nginx';
        applyRedirectServerType(redirectType, data && data.servertype, true);
        setVisible('.nginx', isNginx);
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function updatePmMode(pm) {
    setVisible('.pm_static', pm === 'static');
    setVisible('.pm_dynamic', pm === 'dynamic');
    setVisible('.pm_ondemand', pm === 'ondemand');
  }

  function syncVhostAdvanced(control) {
    var webId = control && control.value ? control.value : '';
    var request = requestSitesJson({ web_id: webId, type: 'getserverid' });
    request.promise.then(function(serverData) {
      var serverId = serverData && serverData.serverid ? serverData.serverid : '';
      requestSitesJson({ server_id: serverId, type: 'getservertype' }).promise.then(function(data) {
        var isNginx = data && data.servertype === 'nginx';
        setVisible('.nginx', isNginx);
        setVisible('.apache', !isNginx);
      });
      requestSitesJson({ web_id: webId, type: 'getphptype' }).promise.then(function(data) {
        setVisible('.phpfpm', data && data.phptype === 'php-fpm');
        setVisible('.php', data && data.phptype !== 'no');
      });
      requestSitesJson({ web_id: webId, type: 'getredirecttype' }).promise.then(function(data) {
        setVisible('.proxy', data && data.redirecttype === 'proxy');
      });
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function vhostMainContext(control) {
    return {
      control: control,
      clientGroupField: document.getElementById('client_group_id'),
      serverDisabled: document.getElementById('server_id_disabled'),
      serverField: document.getElementById('server_id'),
      phpField: document.getElementById('php'),
      parentDomainField: document.getElementById('parent_domain_id'),
      domainField: document.getElementById('domain'),
      webFolderDomain: document.getElementById('web_folder_domain'),
      serverPhpField: document.getElementById('server_php_id'),
      directiveSnippets: document.getElementById('directive_snippets_id')
    };
  }

  function getVhostServerId(ctx) {
    var stored = ctx.control ? ctx.control.getAttribute('data-current-server-id') : '';
    if (stored) return stored;
    var disabledServerId = ctx.serverDisabled ? ctx.serverDisabled.value : '';
    if (Number(disabledServerId) > 0) return disabledServerId;
    return ctx.serverField ? ctx.serverField.value : '';
  }

  function setVhostServerId(ctx, value) {
    if (ctx.control) ctx.control.setAttribute('data-current-server-id', value || '');
  }

  function updateVhostPhpDependentFields(ctx) {
    var phpValue = ctx.phpField ? ctx.phpField.value : '';
    var showServerPhp = phpValue === 'fast-cgi' || phpValue === 'php-fpm';
    setVisible('.server_php_id', showServerPhp);
    setVisible('#server_php_id_txt', showServerPhp);
    setVisible('#fastcgi_php_fallback_version_txt', false);
  }

  function retireLegacyPhpOptions(root) {
    queryAll(root || document, 'select#php').forEach(function(select) {
      ['cgi', 'suphp', 'hhvm'].forEach(function(value) {
        var option = Array.prototype.find.call(select.options, function(candidate) {
          return String(candidate.value || '').toLowerCase() === value;
        });
        if (!option) return;
        if (option.selected) {
          option.textContent = option.textContent + ' \u2013 Legacy, Migration erforderlich';
          option.dataset.workbenchMigrationOnly = 'true';
          select.dataset.workbenchLegacyPhp = value;
          return;
        }
        option.remove();
      });
    });
  }

  function adjustVhostMain(ctx, noFormChange) {
    var request = requestSitesJson({ server_id: getVhostServerId(ctx), type: 'getservertype' });
    request.promise.then(function(data) {
      var isNginx = data && data.servertype === 'nginx';
      if (ctx.control) ctx.control.setAttribute('data-current-server-type', isNginx ? 'nginx' : 'apache');
      setVisible('.apache', !isNginx);
      setVisible('.nginx', isNginx);
      if (ctx.phpField) {
        if (isNginx && ctx.phpField.value !== 'no' && ctx.phpField.value !== 'php-fpm' && ctx.phpField.value !== 'hhvm') {
          ctx.phpField.value = 'php-fpm';
        }
        ['fast-cgi', 'mod'].forEach(function(value) {
          setOptionVisible(ctx.phpField, value, !isNginx);
        });
      }
      updateVhostPhpDependentFields(ctx);
      if (noFormChange) resetRuntimeFormChanged();
    });
    return request;
  }

  function reloadVhostServerId(ctx, noFormChange) {
    var parentWebId = ctx.parentDomainField ? ctx.parentDomainField.value : '';
    var request = requestSitesJson({ web_id: parentWebId, type: 'getserverid' });
    request.promise.then(function(data) {
      if (data && data.serverid) setVhostServerId(ctx, data.serverid);
      adjustVhostMain(ctx, noFormChange);
      if (noFormChange) reloadVhostServerPhpVersions(ctx, noFormChange);
    });
    return request;
  }

  function rerenderWorkbenchSelect(elem) {
    var select = document.getElementById(elem);
    if (select) callRuntime('enhanceSelect', [select, {}]);
  }

  function reloadVhostWebIp(ctx) {
    var serverId = getVhostServerId(ctx);
    var clientGroupId = ctx.clientGroupField ? ctx.clientGroupField.value : '';
    callRuntime('loadOptionInto', ['ip_address', workbenchEndpoint('sitesIpOptions') + '?ip_type=IPv4&server_id=' + encodeURIComponent(serverId || '') + '&client_group_id=' + encodeURIComponent(clientGroupId || ''), rerenderWorkbenchSelect]);
    callRuntime('loadOptionInto', ['ipv6_address', workbenchEndpoint('sitesIpOptions') + '?ip_type=IPv6&server_id=' + encodeURIComponent(serverId || '') + '&client_group_id=' + encodeURIComponent(clientGroupId || ''), rerenderWorkbenchSelect]);
  }

  function reloadVhostDirectiveSnippets(ctx) {
    if (!ctx.directiveSnippets) return null;
    var currentValue = ctx.directiveSnippets.value;
    var request = requestSitesJson({ server_id: getVhostServerId(ctx), type: 'getdirectivesnippet' });
    request.promise.then(function(data) {
      ctx.directiveSnippets.replaceChildren();
      var emptyOption = document.createElement('option');
      emptyOption.value = '0';
      emptyOption.textContent = '-';
      ctx.directiveSnippets.appendChild(emptyOption);
      var group = document.createElement('optgroup');
      group.label = (ctx.control && ctx.control.getAttribute('data-directive-snippet-label')) || '';
      (data && data.snippets ? data.snippets : []).forEach(function(snippet) {
        var option = document.createElement('option');
        option.value = snippet.directive_snippets_id;
        option.textContent = snippet.name;
        option.selected = String(currentValue) === String(snippet.directive_snippets_id);
        group.appendChild(option);
      });
      ctx.directiveSnippets.appendChild(group);
      trigger(ctx.directiveSnippets, 'change');
    });
    return request;
  }

  function reloadVhostServerPhpVersions(ctx, noFormChange) {
    if (!ctx.serverPhpField) return null;
    var currentValue = ctx.serverPhpField.value;
    var request = requestSitesJson({
      server_id: getVhostServerId(ctx),
      php_type: ctx.phpField ? ctx.phpField.value : '',
      type: 'getserverphp',
      client_group_id: ctx.clientGroupField ? ctx.clientGroupField.value : ''
    });
    request.promise.then(function(data) {
      ctx.serverPhpField.replaceChildren();
      (data && data.phpversion ? data.phpversion : []).forEach(function(entry) {
        var key = Object.getOwnPropertyNames(entry)[0];
        var option = document.createElement('option');
        option.value = key;
        option.textContent = entry[key];
        if (ctx.control && ctx.control.value) option.selected = String(currentValue) === String(key);
        ctx.serverPhpField.appendChild(option);
      });
      trigger(ctx.serverPhpField, 'change');
      if (noFormChange) resetRuntimeFormChanged();
    });
    return request;
  }

  function updateVhostWebFolderDomain(ctx) {
    if (!ctx.webFolderDomain) return;
    ctx.webFolderDomain.textContent = ctx.domainField && ctx.domainField.value ? ctx.domainField.value : '[DOMAIN]';
  }

  function applyVhostReadonlyGuard() {
    queryAll(document, 'div.panel_web_domain fieldset input, div.panel_web_domain fieldset select, div.panel_web_domain fieldset button').forEach(function(element) {
      if (element.id === 'directive_snippets_id') return;
      ['click', 'mousedown'].forEach(function(eventName) {
        element.addEventListener(eventName, function(event) { event.preventDefault(); });
      });
      element.addEventListener('focus', function() { element.blur(); });
    });
  }

  function initVhostMain(control) {
    if (!control || control.getAttribute('data-vhost-main-initialized') === 'true') return null;
    control.setAttribute('data-vhost-main-initialized', 'true');
    var ctx = vhostMainContext(control);
    setVhostServerId(ctx, getVhostServerId(ctx));

    if (ctx.serverField && (!ctx.serverDisabled || Number(ctx.serverDisabled.value) <= 0)) {
      ctx.serverField.addEventListener('change', function() {
        setVhostServerId(ctx, ctx.serverField.value);
        adjustVhostMain(ctx, false);
        reloadVhostWebIp(ctx);
        reloadVhostServerPhpVersions(ctx, false);
        reloadVhostDirectiveSnippets(ctx);
      });
    }
    if (ctx.clientGroupField) {
      ctx.clientGroupField.addEventListener('change', function() {
        reloadVhostWebIp(ctx);
        reloadVhostServerPhpVersions(ctx, false);
      });
    }
    if (ctx.phpField) {
      ctx.phpField.addEventListener('change', function() {
        reloadVhostServerPhpVersions(ctx, false);
        updateVhostPhpDependentFields(ctx);
      });
    }
    if (ctx.parentDomainField) {
      ctx.parentDomainField.addEventListener('change', function() {
        reloadVhostServerId(ctx, false);
      });
    }
    if (ctx.domainField) {
      ctx.domainField.addEventListener('change', function() { updateVhostWebFolderDomain(ctx); });
      ctx.domainField.addEventListener('keyup', function() { updateVhostWebFolderDomain(ctx); });
    }
    var moreFolderDirectiveSnippets = document.getElementById('more_folder_directive_snippets');
    if (moreFolderDirectiveSnippets) {
      moreFolderDirectiveSnippets.addEventListener('click', function() {
        var nextHidden = query(document, '.folder_directive_snippets.hidden');
        if (nextHidden) nextHidden.classList.remove('hidden');
      });
    }
    if (control.getAttribute('data-vhost-readonly-tab') === 'true') applyVhostReadonlyGuard();

    adjustVhostMain(ctx, true);
    reloadVhostServerPhpVersions(ctx, true);
    updateVhostWebFolderDomain(ctx);
    if (getVhostServerId(ctx) === '') return reloadVhostServerId(ctx, false);
    return null;
  }

  function createDkimRecord(control) {
    function value(id) {
      var field = document.getElementById(id);
      return field ? field.value : '';
    }
    var request = requestRuntimeJson(workbenchEndpoint('mailJson', true), {
      query: {
        domain_id: value('domain'),
        dkim_public: value('dkim_public'),
        dkim_selector: value('dkim_selector'),
        type: 'create_dkim'
      },
      timeout: 30000
    });
    request.promise.then(function(data) {
      data = data || {};
      var dkimText = 'v=DKIM1; t=s; p=' + String(data.dns_record || '').replace(/(\r\n|\n|\r)/gm, '');
      var dns = data.dkim_selector + '._domainkey.' + data.domain + '. 3600   IN\tTXT\t"' + dkimText + '"';
      setFieldValue('dkim_selector', data.dkim_selector);
      setFieldValue('dkim_public', data.dkim_public);
      setFieldValue('dkim_private', data.dkim_private);
      setFieldValue('dns_record', dns);
      var dkim = document.getElementById('dkim');
      if (dkim) {
        dkim.checked = true;
        trigger(dkim, 'change');
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('DKIM data could not be generated.');
    });
    return request;
  }

  function runDependentJsonSync(control) {
    var mode = control && control.getAttribute('data-json-sync');
    if (!mode) return null;
    if (mode === 'sites-childdomain-redirect') return syncChilddomainRedirect(control);
    if (mode === 'sites-proxy-visibility') return syncProxyVisibility(control);
    if (mode === 'sites-vhost-redirect') return syncVhostRedirect(control);
    if (mode === 'sites-vhost-advanced') return syncVhostAdvanced(control);
    if (mode === 'sites-vhost-main') return initVhostMain(control);
    var endpoint = endpointFromControl(control, '');
    var requestType = control.getAttribute('data-request-type') || '';
    if (!endpoint || !requestType) return null;
    var queryData = { type: requestType };
    if (mode === 'dns-caa') queryData.ca_id = control.value || '';
    else queryData.web_id = control.value || '';
    var request = requestRuntimeJson(endpoint + '?' + Math.round(new Date().getTime()), { query: queryData, timeout: 30000 });
    request.promise.then(function(data) {
      data = data || {};
      if (mode === 'dns-caa') {
        setVisible('.wildcard', data.ca_wildcard === 'Y');
        setVisible('.critical', data.ca_critical === '1');
        setInputByName('ca_issue', data.ca_issue);
        setInputByName('ca_critical', data.ca_critical);
      } else if (mode === 'cron-placeholders') {
        updateTooltipText('php_cli_binary', data.php_cli_binary);
        updateTooltipText('docroot_client', data.docroot_client);
        updateTooltipText('domain', data.domain || control.getAttribute('data-domain-not-selected') || '');
        var existing = query(document, '.wb-jail-symbol, .jail-symbol');
        if (data.cron_type === 'chrooted') {
          if (!existing) {
            var marker = document.createElement('span');
            marker.className = 'wb-jail-symbol';
            marker.title = control.getAttribute('data-jailed-title') || '';
            marker.appendChild(svgLockIcon());
            control.insertAdjacentElement('afterend', marker);
          }
        } else {
          queryAll(document, '.wb-jail-symbol, .jail-symbol').forEach(function(element) { element.remove(); });
        }
      } else if (mode === 'database-users') {
        String(control.getAttribute('data-json-option-targets') || '').split(',').forEach(function(id) {
          replaceSelectOptions(document.getElementById(id.trim()), data);
        });
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) reportRuntimeError('Dependent form data could not be loaded.');
    });
    return request;
  }

  function initDependentJsonSync(root) {
    queryAll(root || document, '[data-json-sync]').forEach(function(control) {
      if (control.getAttribute('data-json-sync-initialized') === 'true') return;
      control.setAttribute('data-json-sync-initialized', 'true');
      if (control.getAttribute('data-json-sync') === 'sites-childdomain-redirect') {
        var redirectType = document.getElementById('redirect_type');
        if (redirectType && redirectType.getAttribute('data-proxy-tab-initialized') !== 'true') {
          redirectType.setAttribute('data-proxy-tab-initialized', 'true');
          redirectType.addEventListener('change', updateProxyTabFromRedirect);
        }
      }
      runDependentJsonSync(control);
    });
    queryAll(root || document, '[data-pm-mode-control]').forEach(function(control) {
      if (control.getAttribute('data-pm-mode-initialized') === 'true') return;
      control.setAttribute('data-pm-mode-initialized', 'true');
      updatePmMode(control.value);
      control.addEventListener('change', function() { updatePmMode(control.value); });
    });
  }

  function initDeclaredVisibility(root) {
    queryAll(root || document, '[data-workbench-sync-visibility]').forEach(syncDeclaredVisibility);
    queryAll(root || document, '[data-workbench-visibility-rules]').forEach(syncVisibilityRules);
    queryAll(root || document, '[data-workbench-database-type-toggle]').forEach(syncDatabaseTypeFields);
    retireLegacyPhpOptions(root);
    initStaticSelectMirrors(root);
    initDefaultPasswords(root);
    initDisabledHiddenClones(root);
    initConfirmUncheck(root);
    initMasterTemplateLocks(root);
  }

  function initDeclarativeFieldSearch(root) {
    var language = typeof window.workbenchLanguage === 'function'
      ? window.workbenchLanguage()
      : String(document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
    var german = language === 'de';
    queryAll(root || document, '[data-workbench-field-search]').forEach(function(input) {
      var endpointName = input.getAttribute('data-search-endpoint') || '';
      var endpoint = endpointName ? workbenchEndpoint(endpointName) : (input.getAttribute('data-search-src') || input.getAttribute('data-src') || '');
      endpoint = endpointWithQuery(endpoint, 'type', input.getAttribute('data-search-type') || '');
      if (!endpoint) return;
      ISPConfig.enhanceSearch(input, {
        dataSrc: endpoint,
        resultsLimit: input.getAttribute('data-search-results-limit') || (german ? '$ von % Ergebnissen' : '$ of % results'),
        ResultsTextPrefix: input.getAttribute('data-search-results-prefix') || '',
        noResultsText: input.getAttribute('data-search-no-results') || (german ? 'Keine Ergebnisse.' : 'No results.'),
        noResultsLimit: input.getAttribute('data-search-no-results-limit') || (german ? '0 Ergebnisse' : '0 results'),
        minChars: Number(input.getAttribute('data-search-min-chars') || 0),
        cssPrefix: input.getAttribute('data-search-css-prefix') || 'df-',
        fillSearchField: input.getAttribute('data-search-fill-field') !== 'false',
        fillSearchFieldWith: input.getAttribute('data-search-fill-with') || 'fill_text',
        searchFieldWatermark: input.getAttribute('data-search-watermark') || '',
        resultBoxPosition: input.getAttribute('data-search-result-position') || ''
      });
    });
  }

  function requestFallback(url, options, responseType) {
    options = options || {};
    var controller = window.AbortController ? new AbortController() : null;
    var method = options.method || 'GET';
    var target = new URL(url, window.location.href);
    if (target.origin !== window.location.origin) throw new Error('Cross-origin request blocked.');
    if (options.query) {
      var values = typeof options.query === 'string' ? new URLSearchParams(options.query) : new URLSearchParams();
      if (typeof options.query !== 'string') {
        Object.keys(options.query).forEach(function(key) {
          if (options.query[key] !== undefined && options.query[key] !== null) values.append(key, String(options.query[key]));
        });
      }
      values.forEach(function(value, key) { target.searchParams.append(key, value); });
    }
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    handle.promise = fetch(target.href, {
      method: method,
      credentials: 'same-origin',
      cache: options.cache || 'no-store',
      redirect: 'follow',
      headers: extend({
        Accept: responseType === 'json' ? 'application/json' : 'text/html'
      }, options.headers || {}),
      body: options.body || null,
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      if (!response.ok) {
        var error = new Error('HTTP ' + response.status);
        error.name = 'RequestError';
        error.status = response.status;
        throw error;
      }
      return responseType === 'json' ? response.json() : response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (error && error.name === 'AbortError') handle.aborted = true;
      throw error;
    });
    return handle;
  }


  var ISPConfig = window.ISPConfig = {
    pageFormChanged: false,
    tabChangeWarningTxt: '',
    tabChangeDiscardTxt: '',
    tabChangeWarning: false,
    tabChangeDiscard: false,
    requestsRunning: 0,
    indicatorCompleted: false,
    registeredHooks: [],
    new_tpl_add_id: 0,
    dataLogTimer: 0,
    options: {
      useLoadIndicator: false,
      useComboBox: false
    },

    setOption: function(key, value) {
      ISPConfig.options[key] = value;
    },

    setOptions: function(options) {
      extend(ISPConfig.options, options || {});
    },

    reportError: function(message) {
      if (window.console && console.warn) console.warn(message);
      if (window.workbenchFeedback && typeof window.workbenchFeedback.report === 'function') {
        return window.workbenchFeedback.report(message);
      }
      return null;
    },

    notify: function(message, state) {
      if (window.workbenchFeedback && typeof window.workbenchFeedback.show === 'function') {
        return window.workbenchFeedback.show(message, state || 'info');
      }
      if (window.console && console.info) console.info(message);
      return null;
    },


    registerHook: function(name, callback) {
      if (!ISPConfig.registeredHooks[name]) ISPConfig.registeredHooks[name] = [];
      ISPConfig.registeredHooks[name].push(callback);
    },

    callHook: function(name, params) {
      (ISPConfig.registeredHooks[name] || []).forEach(function(callback) {
        callback(name, params);
      });
    },

    enhanceTooltip: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.workbenchInteractions) window.workbenchInteractions.tooltip(element, options);
      });
      return elements;
    },

    enhanceSelect: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.workbenchSelect) window.workbenchSelect.enhance(element, options || {});
      });
      return elements;
    },

    enhanceSearch: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.workbenchFieldSearch) window.workbenchFieldSearch.enhance(element, options || {});
      });
      return elements;
    },

    enhanceDateTime: function(elements, options) {
      toArray(elements && elements.length !== undefined && !elements.nodeType ? elements : [elements]).forEach(function(element) {
        if (!element) return;
        if (window.workbenchDateTime) window.workbenchDateTime.enhance(element, options || {});
      });
      return elements;
    },

    closeDialog: function(selector) {
      var element = query(document, selector);
      if (element && window.workbenchDialog) return window.workbenchDialog.close(element, true);
      if (element) element.hidden = true;
      return Boolean(element);
    },

    requestRead: function(url, options, responseType) {
      options = options || {};
      if (window.workbenchHttp) {
        return responseType === 'json' ? window.workbenchHttp.getJson(url, options) : window.workbenchHttp.getText(url, options);
      }
      return requestFallback(url, options, responseType === 'json' ? 'json' : 'text');
    },

    requestText: function(url, options) {
      return ISPConfig.requestRead(url, options, 'text');
    },

    requestJson: function(url, options) {
      return ISPConfig.requestRead(url, options, 'json');
    },

    endpoint: function(name, options) {
      options = options || {};
      return workbenchEndpoint(name, options.cacheBust === true);
    },

    normalizeWorkbenchContentContracts: function(root) {
      return normalizeWorkbenchContentContracts(root || document);
    },

    replaceServerFragment: function(host, markup) {
      setHtml(host, markup);
      return host;
    },

    navigateTo: function(pagename, params) {
      ISPConfig.beginRequest();
      // Robust routing: mirror the current page into the address bar (real URL,
      // no '#') so a reload/bookmark restores exactly this page instead of the
      // server session module. Uses the theme's shared urlFor so the clean-path
      // (mod_rewrite) vs. ?wb= query-fallback choice stays consistent.
      if (pagename && window.history && window.history.replaceState) {
        try {
          var wbUrl = (typeof ISPConfig.workbenchUrlFor === 'function')
            ? ISPConfig.workbenchUrlFor(pagename)
            : (window.location.pathname + '?wb=' + String(pagename).replace(/#/g, '%23').replace(/&/g, '%26').replace(/\?/g, '%3F'));
          window.history.replaceState({ workbenchContent: pagename }, '', wbUrl);
        } catch (e) {}
      }
      var request = ISPConfig.requestText(pagename, { query: params || null, timeout: 30000 });
      request.promise.then(function(responseText) {
        if (handleRedirect(responseText)) return;
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(pagename, params || null);
        ISPConfig.pageFormChanged = false;
        window.clearTimeout(ISPConfig.dataLogTimer);
        ISPConfig.dataLogNotification();
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Navigation request was not successful.');
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    submitPageForm: function(formname, target, confirmation) {
      var successMessage = arguments[3];
      if (confirmation && !window.confirm(confirmation)) return false;
      var form = document.getElementById(formname || 'pageForm');
      if (!form) return false;
      var serialized = serializeForm(form);
      ISPConfig.beginRequest();
      var request = ISPConfig.requestForm(form, target, { timeout: 30000 });
      request.promise.then(function(responseText) {
        if (successMessage) ISPConfig.notify(successMessage, 'success');
        if (handleRedirect(responseText)) return;
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(target, serialized);
        ISPConfig.pageFormChanged = false;
        window.clearTimeout(ISPConfig.dataLogTimer);
        ISPConfig.dataLogNotification();
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) {
          ISPConfig.reportError('Form request was not successful.');
        }
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    switchTabDecision: function(tab, target, force, decision) {
      var idInput = query(document, 'form#pageForm [name="id"]');
      var id = idInput ? idInput.value : '';
      if (decision === 'save') return ISPConfig.submitPageForm('pageForm', target);
      if (decision === 'discard') return ISPConfig.navigateTo(target, { next_tab: tab, id: id });
      if (!force && id && ISPConfig.tabChangeWarning === 'y' && ISPConfig.pageFormChanged === true) {
        if (window.confirm(ISPConfig.tabChangeWarningTxt)) ISPConfig.submitPageForm('pageForm', target);
        else ISPConfig.navigateTo(target, { next_tab: tab, id: id });
        return;
      }
      if (id) ISPConfig.navigateTo(target, { next_tab: tab, id: id });
      else ISPConfig.submitPageForm('pageForm', target);
    },

    switchTab: function(tab, target, force) {
      return ISPConfig.switchTabDecision(tab, target, force, null);
    },

    refreshContentInto: function(elementid, pagename) {
      var host = document.getElementById(elementid);
      if (!host) return null;
      var request = ISPConfig.requestText(pagename, { timeout: 30000 });
      request.promise.then(function(responseText) { setHtml(host, responseText); });
      return request;
    },

    requestForm: function(form, url, options) {
      options = options || {};
      if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
      if (window.workbenchHttp) return window.workbenchHttp.postForm(form, url, options);
      return requestFallback(url, {
        method: 'POST',
        timeout: options.timeout || 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: serializeForm(form)
      }, 'text');
    },

    resetFormChanged: function() {
      ISPConfig.pageFormChanged = false;
    },

    beginRequest: function() {
      ISPConfig.requestsRunning += 1;
      document.body.classList.add('wb-request-active');
      document.body.dataset.wbRequestCount = String(ISPConfig.requestsRunning);
      var host = document.getElementById('pageContent');
      if (host) host.setAttribute('aria-busy', 'true');
    },

    endRequest: function() {
      ISPConfig.requestsRunning = Math.max(0, ISPConfig.requestsRunning - 1);
      document.body.dataset.wbRequestCount = String(ISPConfig.requestsRunning);
      if (ISPConfig.requestsRunning > 0) return;
      document.body.classList.remove('wb-request-active');
      var host = document.getElementById('pageContent');
      if (host) host.setAttribute('aria-busy', 'false');
    },

    showLoadIndicator: function() {
      return ISPConfig.beginRequest();
    },

    hideLoadIndicator: function() {
      return ISPConfig.endRequest();
    },

    onAfterSideNavLoaded: function() {
      if (ISPConfig.options.useComboBox === true) {
        ISPConfig.enhanceSelect(queryAll(document.getElementById('sidebar'), 'select:not(.chosen-select)'), {
          placeholder: '',
          selectOnBlur: true,
          allowClear: true
        });
      }
    },

    onAfterContentLoad: function(url, data) {
      var host = document.getElementById('pageContent') || document;
      normalizeWorkbenchContentContracts(host);
      if (ISPConfig.options.useComboBox === true) {
        ISPConfig.enhanceSelect(queryAll(host, 'select:not(.chosen-select)'), {
          placeholder: '',
          selectOnBlur: true,
          allowClear: true
        });
      }
      ISPConfig.enhanceSearch(queryAll(host, '.searchField'), {});
      initDeclarativeFieldSearch(host);
      initDeclaredVisibility(host);
      ISPConfig.enhanceDateTime(queryAll(host, 'input[data-input-element="date"]'), { pickTime: false, format: 'DD.MM.YYYY' });
      ISPConfig.enhanceDateTime(queryAll(host, 'input[data-input-element="datetime"]'), { pickTime: true, format: 'DD.MM.YYYY HH:mm' });
      ISPConfig.enhanceTooltip(queryAll(host, '[data-workbench-tooltip]'), {});
      initSslClientDataHelpers(host);
      initDependentJsonSync(host);
      var autofocus = query(host, 'input[autofocus]');
      if (autofocus) autofocus.focus();
      queryAll(host, 'input[type="password"]').forEach(function(field) {
        field.readOnly = true;
        field.addEventListener('click', function() { field.readOnly = false; }, { once: true });
        field.addEventListener('focus', function() { field.readOnly = false; }, { once: true });
      });
      ISPConfig.callHook('onAfterContentLoad', { url: url, data: data ? '&' + data : '' });
    },

    submitForm: function(formname, target, confirmation) {
      return ISPConfig.submitPageForm(formname || 'pageForm', target, confirmation, arguments[3]);
    },

    submitUploadForm: function(formname, target) {
      var form = document.getElementById(formname);
      if (!form || !window.workbenchHttp) return false;
      var request = window.workbenchHttp.postMultipart(form, target, { timeout: 120000 });
      request.promise.then(function(markup) {
        var parsed = new DOMParser().parseFromString(markup, 'text/html');
        ['errorMsg', 'OKMsg'].forEach(function(id) {
          var existing = document.getElementById(id);
          if (existing) existing.remove();
          var incoming = parsed.getElementById(id);
          if (incoming) form.prepend(incoming.cloneNode(true));
        });
        queryAll(form, 'input[name="_csrf_key"], input[name="_csrf_id"]').forEach(function(input) { input.remove(); });
        queryAll(parsed, 'input[name="_csrf_key"], input[name="_csrf_id"]').forEach(function(input) {
          form.prepend(input.cloneNode(true));
        });
      }).catch(function(error) {
        if (!request.aborted) ISPConfig.reportError('Upload request was not successful.');
      });
      return request;
    },

    capp: function(module, redirect) {
      ISPConfig.beginRequest();
      var request = ISPConfig.requestText('capp.php', {
        query: { mod: module, redirect: redirect === undefined ? null : redirect },
        timeout: 30000
      });
      request.promise.then(function(responseText) {
        handleRedirect(responseText);
        ISPConfig.loadMenus({ module: module });
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Module request was not successful. ' + module);
      }).finally(function() {
        ISPConfig.endRequest();
      });
      return request;
    },

    loadContent: function(pagename) {
      return ISPConfig.navigateTo(pagename, arguments[1] || null);
    },

    loadContentRefresh: function(pagename) {
      var refresh = document.getElementById('refreshinterval');
      if (!refresh || Number(refresh.value) <= 0) return null;
      var request = ISPConfig.requestText(pagename, { query: 'refresh=' + refresh.value, timeout: 30000 });
      request.promise.then(function(responseText) {
        setHtml(document.getElementById('pageContent'), responseText);
        ISPConfig.onAfterContentLoad(pagename, 'refresh=' + refresh.value);
        ISPConfig.pageFormChanged = false;
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Refresh request was not successful.');
      });
      window.setTimeout(function() { ISPConfig.loadContentRefresh(pagename); }, Number(refresh.value) * 1000 * 60);
      return request;
    },

    loadInitContent: function() {
      var host = document.getElementById('pageContent');
      var startpage = host && host.getAttribute('data-startpage') || 'dashboard/dashboard.php';
      ISPConfig.navigateTo(startpage);
      ISPConfig.loadMenus();
      ISPConfig.keepalive();
      ISPConfig.dataLogNotification();
    },

    loadMenus: function(options) {
      options = options || {};
      var side = ISPConfig.requestText('nav.php', { query: 'nav=side', timeout: 30000 });
      var top = ISPConfig.requestText('nav.php', { query: 'nav=top', timeout: 30000 });
      side.promise.then(function(markup) {
        setHtml(document.getElementById('sidebar'), markup);
        ISPConfig.onAfterSideNavLoaded();
        ISPConfig.loadPushyMenu();
      }).catch(function(error) {
        if (!side.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Side navigation request was not successful.');
      });
      top.promise.then(function(markup) {
        setHtml(document.getElementById('topnav-container'), markup);
        ISPConfig.loadPushyMenu();
      }).catch(function(error) {
        if (!top.aborted && (!error || error.name !== 'AbortError')) ISPConfig.reportError('Top navigation request was not successful.');
      });
      return [side, top];
    },

    loadPushyMenu: function() {},

    changeTab: function(tab, target, force) {
      return ISPConfig.switchTab(tab, target, force);
    },

    confirm_action: function(link, confirmation) {
      if (!window.confirm(confirmation)) return false;
      return ISPConfig.navigateTo(link);
    },

    loadContentInto: function(elementid, pagename) {
      return ISPConfig.refreshContentInto(elementid, pagename);
    },

    loadOptionInto: function(elementid, pagename, callback) {
      var select = document.getElementById(elementid);
      if (!select) return null;
      var request = ISPConfig.requestText(pagename, { timeout: 30000 });
      request.promise.then(function(responseText) {
        select.replaceChildren();
        responseText.split('#').forEach(function(value) {
          var option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
        if (typeof callback === 'function') callback(elementid, pagename);
      });
      return request;
    },

    keepalive: function() {
      var request = ISPConfig.requestText('keepalive.php', { timeout: 30000 });
      request.promise.then(function() {
        window.setTimeout(function() { ISPConfig.keepalive(); }, 1000000);
      }).catch(function() {
        ISPConfig.reportError('Session expired. Please login again.');
      });
      return request;
    },

    dataLogNotification: function() {
      var request = ISPConfig.requestJson('datalogstatus.php', { timeout: 30000 });
      request.promise.then(function(payload) {
        var entries = payload && payload.entries ? payload.entries : [];
        var count = Number(payload && payload.count || 0);
        var notification = query(document, '.notification');
        var textNode = query(document, '.notification_text');
        var dialog = document.getElementById('datalogModal');
        var modalBody = dialog && query(dialog, '.modal-body, .wb-dialog__body ul');
        if (modalBody) {
          modalBody.replaceChildren();
          Object.keys(entries).forEach(function(key) {
            var val = entries[key];
            var item = document.createElement('li');
            var label = document.createElement('strong');
            label.textContent = val.text + ':';
            item.appendChild(label);
            item.appendChild(document.createTextNode(' ' + val.count));
            modalBody.appendChild(item);
          });
        }
        if (textNode) textNode.textContent = String(count);
        if (notification) notification.style.display = count > 0 ? '' : 'none';
        if (count <= 0) ISPConfig.closeDialog('#datalogModal');
        ISPConfig.dataLogTimer = window.setTimeout(function() { ISPConfig.dataLogNotification(); }, count > 0 ? 2000 : 5000);
      }).catch(function() {
        var notification = query(document, '.notification');
        if (notification) notification.style.display = 'none';
      });
      return request;
    },

    addAdditionalTemplate: function() {
      var input = document.getElementById('template_additional');
      var select = document.getElementById('tpl_add_select');
      var list = query(document, '#template_additional_list ul');
      if (!input || !select || !list) return;
      var parts = String(select.value || '').split('|', 2);
      var addTplId = parts[0];
      var addTplText = parts[1] || '';
      if (!(Number(addTplId) > 0)) {
        ISPConfig.notify(
          (typeof window.workbenchLanguage === 'function' && window.workbenchLanguage() === 'de')
            ? 'Keine zusätzliche Vorlage ausgewählt.'
            : 'No additional template selected.',
          'warning'
        );
        return;
      }
      ISPConfig.new_tpl_add_id += 1;
      var key = 'n' + ISPConfig.new_tpl_add_id;
      var values = input.value ? input.value.split('/') : [];
      values.push(key + ':' + addTplId);
      input.value = values.join('/');
      var item = document.createElement('li');
      item.setAttribute('rel', key);
      item.appendChild(document.createTextNode(addTplText + ' '));
      var remove = document.createElement('a');
      remove.href = '#';
      remove.className = 'wb-template-remove';
      remove.setAttribute('data-workbench-template-remove', 'true');
      remove.setAttribute('aria-label', 'Remove template');
      var glyph = document.createElement('span');
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '\u00d7';
      remove.appendChild(glyph);
      remove.addEventListener('click', function(event) {
        event.preventDefault();
        ISPConfig.delAdditionalTemplate(key);
      });
      item.appendChild(remove);
      list.appendChild(item);
    },

    delAdditionalTemplate: function(tplId) {
      var input = document.getElementById('template_additional');
      if (!input) return;
      if (tplId) {
        var item = query(document, '#template_additional_list ul li[rel="' + cssEscape(tplId) + '"]');
        if (item) item.remove();
        input.value = (input.value || '').split('/').filter(function(value) {
          return value.split(':', 2)[0] !== tplId;
        }).join('/');
      }
    }
  };

  var workbenchApp = window.workbenchApp = window.workbenchApp || {};

  [
    'setOption',
    'setOptions',
    'reportError',
    'registerHook',
    'callHook',
    'requestRead',
    'requestText',
    'requestJson',
    'requestForm',
    'navigateTo',
    'submitPageForm',
    'submitForm',
    'submitUploadForm',
    'switchTab',
    'refreshContentInto',
    'loadOptionInto',
    'loadContentRefresh',
    'loadInitContent',
    'loadMenus',
    'loadPushyMenu',
    'replaceServerFragment',
    'capp',
    'keepalive',
    'dataLogNotification',
    'beginRequest',
    'endRequest',
    'showLoadIndicator',
    'hideLoadIndicator',
    'normalizeWorkbenchContentContracts',
    'activateFragmentScripts',
    'onAfterContentLoad',
    'onAfterSideNavLoaded',
    'enhanceTooltip',
    'enhanceSelect',
    'enhanceSearch',
    'enhanceDateTime',
    'closeDialog',
    'resetFormChanged',
    'endpoint'
  ].forEach(function(name) {
    workbenchApp[name] = function() {
      return ISPConfig[name].apply(ISPConfig, arguments);
    };
  });

  [
    'pageFormChanged',
    'tabChangeWarningTxt',
    'tabChangeDiscardTxt',
    'tabChangeWarning',
    'tabChangeDiscard',
    'requestsRunning',
    'workbenchActiveModule',
    'dataLogTimer',
    'options',
    'registeredHooks'
  ].forEach(function(name) {
    Object.defineProperty(workbenchApp, name, {
      configurable: true,
      enumerable: true,
      get: function() { return ISPConfig[name]; },
      set: function(value) { ISPConfig[name] = value; }
    });
  });

  window.password = function(length) {
    length = Number(length || 16);
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!$%&?';
    var result = '';
    var values = new Uint32Array(length);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(values);
    for (var i = 0; i < length; i += 1) {
      var index = values[i] ? values[i] % alphabet.length : Math.floor(Math.random() * alphabet.length);
      result += alphabet.charAt(index);
    }
    return result;
  };

  window.generatePassword = function(passwordFieldID, repeatPasswordFieldID) {
    var generated = window.password(16);
    var field = document.getElementById(passwordFieldID);
    var repeat = document.getElementById(repeatPasswordFieldID);
    if (field) {
      field.type = 'text';
      field.readOnly = false;
      field.value = generated;
      trigger(field, 'input');
      trigger(field, 'change');
    }
    if (repeat) {
      repeat.type = 'text';
      repeat.readOnly = false;
      repeat.value = generated;
      trigger(repeat, 'input');
      trigger(repeat, 'change');
    }
    if (typeof window.pass_check === 'function') window.pass_check(generated);
    if (typeof window.checkPassMatch === 'function') window.checkPassMatch(passwordFieldID, repeatPasswordFieldID);
    return generated;
  };

  window.pass_check = function(value) {
    var score = 0;
    value = String(value || '');
    if (value.length >= 8) score += 25;
    if (/[a-z]/.test(value)) score += 15;
    if (/[A-Z]/.test(value)) score += 15;
    if (/[0-9]/.test(value)) score += 15;
    if (/[^A-Za-z0-9]/.test(value)) score += 20;
    if (value.length >= 14) score += 10;
    score = Math.min(100, score);
    queryAll(document, '.progress .progress-bar, #passBar').forEach(function(bar) {
      bar.style.width = score + '%';
      bar.setAttribute('aria-valuenow', String(score));
    });
    return score;
  };

  window.checkPassMatch = function(firstId, secondId) {
    var first = document.getElementById(firstId);
    var second = document.getElementById(secondId);
    if (!first || !second) return false;
    var matchesPasswords = first.value === second.value;
    second.setCustomValidity(matchesPasswords ? '' : 'Passwords do not match.');
    return matchesPasswords;
  };

  function syncEmailDomainInput(input, deferred) {
    var apply = function() {
      if (!input || String(input.value || '').indexOf('@') < 0) return;
      var parts = String(input.value || '').split('@');
      var domain = parts.pop();
      var localPart = parts.join('@');
      var domainSelect = document.getElementById('email_domain');
      if (domainSelect) {
        domainSelect.value = domain;
        trigger(domainSelect, 'change');
      }
      input.value = localPart;
      trigger(input, 'input');
    };
    if (deferred) window.setTimeout(apply, 4);
    else apply();
  }

  window.processEmailAddressInput = function(input) {
    syncEmailDomainInput(input, true);
  };

  window.updateEmailDomain = function(input) {
    syncEmailDomainInput(input, false);
  };

  window.AR_ResetDates = function() {
    var autoresponder = document.getElementById('autoresponder');
    if (autoresponder && autoresponder.checked) return;
    ['autoresponder_start_date', 'autoresponder_end_date'].forEach(function(id) {
      var field = document.getElementById(id) || query(document, '[name="' + cssEscape(id) + '"]');
      if (field) {
        field.value = '';
        trigger(field, 'input');
        trigger(field, 'change');
      }
    });
  };

  document.addEventListener('input', function(event) {
    if (event.target && event.target.hasAttribute && event.target.hasAttribute('data-workbench-password-check')) {
      syncPasswordValidation(event.target);
    }
  });

  document.addEventListener('keyup', function(event) {
    if (event.target && event.target.hasAttribute && event.target.hasAttribute('data-workbench-password-check')) {
      syncPasswordValidation(event.target);
    }
  });

  document.addEventListener('change', function(event) {
    var target = event.target;
    if (!target) return;
    var changeAction = target.getAttribute('data-workbench-change-action');
    if (changeAction === 'hide-ok-message') {
      var message = document.getElementById(target.getAttribute('data-target') || 'OKMsg');
      if (message) {
        message.hidden = true;
        message.style.display = 'none';
        message.style.visibility = 'hidden';
      }
    }
    if (target.hasAttribute('data-email-domain-sync')) syncEmailDomainInput(target, false);
    if (target.hasAttribute('data-autoresponder-reset')) window.AR_ResetDates();
    var hideOkMessage = target.getAttribute('data-hide-ok-message');
    if (hideOkMessage) {
      var okMessage = document.getElementById(hideOkMessage);
      if (okMessage) {
        okMessage.hidden = true;
        okMessage.style.display = 'none';
      }
    }
    var submitOnChange = target.getAttribute('data-submit-on-change');
    if (submitOnChange) {
      event.preventDefault();
      ISPConfig.submitPageForm(target.getAttribute('data-submit-form') || 'pageForm', submitOnChange);
      return;
    }
    var refreshContent = target.getAttribute('data-load-content-refresh');
    if (refreshContent) {
      event.preventDefault();
      ISPConfig.loadContentRefresh(refreshContent);
      return;
    }
    var optionTarget = target.getAttribute('data-load-option-into');
    var optionTemplate = target.getAttribute('data-load-option-template');
    var optionEndpoint = target.getAttribute('data-load-option-endpoint');
    var optionQuery = target.getAttribute('data-load-option-query');
    if (optionTarget && (optionTemplate || optionEndpoint)) {
      event.preventDefault();
      ISPConfig.loadOptionInto(optionTarget, optionTemplate ? controlUrl(optionTemplate, target) : endpointWithQueryTemplate(workbenchEndpoint(optionEndpoint), optionQuery, target));
      return;
    }
    var contentTemplate = workbenchContractValue(target, WORKBENCH_CONTENT_CONTRACTS.template);
    if (contentTemplate) {
      event.preventDefault();
      ISPConfig.navigateTo(controlUrl(contentTemplate, target));
      return;
    }
    if (target.hasAttribute('data-json-sync')) {
      runDependentJsonSync(target);
    }
    if (target.hasAttribute('data-workbench-sync-visibility')) {
      syncDeclaredVisibility(target);
    }
    if (target.hasAttribute('data-workbench-visibility-rules')) {
      syncVisibilityRules(target);
    }
    if (target.hasAttribute('data-workbench-database-type-toggle')) {
      syncDatabaseTypeFields(target);
    }
    if (matches(target, 'select') && query(document, '#pageForm .table #Filter') && !target.classList.contains('disableChangeEvent')) {
      event.preventDefault();
      trigger(query(document, '#pageForm .table #Filter'), 'click');
    }
    if (matches(target, 'select, input, textarea') && !target.classList.contains('no-page-form-change')) {
      ISPConfig.pageFormChanged = true;
    }
  });

  document.addEventListener('paste', function(event) {
    var target = event.target;
    if (target && target.hasAttribute && target.hasAttribute('data-email-domain-sync')) syncEmailDomainInput(target, true);
  });

  document.addEventListener('focusin', function(event) {
    checkRelatedRadio(event.target);
  });

  document.addEventListener('click', function(event) {
    var loadControl = closest(event.target, WORKBENCH_CONTENT_CONTRACTS.load.selector);
    var loadIntoControl = closest(event.target, WORKBENCH_CONTENT_CONTRACTS.target.selector);
    var moduleControl = closest(event.target, WORKBENCH_CONTENT_CONTRACTS.module.selector);
    var submitControl = closest(event.target, 'a[data-submit-form],button[data-submit-form]');
    var passwordControl = closest(event.target, '[data-generate-password]');
    var confirmControl = closest(event.target, '[data-confirm-action]');
    var copyControl = closest(event.target, '[data-copy-email-address],[data-copy-composed-value],[data-copy-value]');
    var sslClientDataControl = closest(event.target, '[data-ssl-client-data-action]');
    var tabControl = closest(event.target, '[data-change-tab]');
    var workbenchActionControl = closest(event.target, '[data-workbench-action]');
    var noopControl = closest(event.target, '[data-workbench-noop]');
    var sortHeader = closest(event.target, 'th[data-column]');
    var placeholder = closest(event.target, '.addPlaceholder');
    var placeholderContent = closest(event.target, '.addPlaceholderContent');
    var additionalTemplateRemove = closest(event.target, '#template_additional_list [data-workbench-template-remove]');
    var checkFields = closest(event.target, '[data-check-fields] > input[type="checkbox"]');
    var uncheckFields = closest(event.target, '[data-uncheck-fields] > input[type="checkbox"]');

    checkRelatedRadio(event.target);

    if (loadControl || loadIntoControl || moduleControl || submitControl || passwordControl || confirmControl || copyControl || sslClientDataControl || tabControl || workbenchActionControl || noopControl || sortHeader || placeholder || placeholderContent || additionalTemplateRemove) {
      event.preventDefault();
      if (ISPConfig.requestsRunning > 0 && !passwordControl && !copyControl && !sslClientDataControl && !workbenchActionControl && !noopControl && !placeholder && !placeholderContent && !additionalTemplateRemove) return;
      if (!passwordControl && !copyControl && !sslClientDataControl && !workbenchActionControl && !noopControl && !placeholder && !placeholderContent && !additionalTemplateRemove) scrollToTop();
    }

    if (noopControl) {
      return;
    }

    if (additionalTemplateRemove) {
      var templateItem = closest(additionalTemplateRemove, 'li');
      if (templateItem) ISPConfig.delAdditionalTemplate(templateItem.getAttribute('rel'));
      return;
    }

    if (passwordControl) {
      window.generatePassword(
        passwordControl.getAttribute('data-password-field') || 'password',
        passwordControl.getAttribute('data-repeat-password-field') || 'repeat_password'
      );
      return;
    }

    if (confirmControl) {
      var confirmAction = confirmControl.getAttribute('data-confirm-action');
      if (confirmAction) ISPConfig.confirm_action(confirmAction, confirmControl.getAttribute('data-confirm-message') || '');
      return;
    }

    if (copyControl) {
      if (copyControl.hasAttribute('data-copy-email-address')) {
        var localField = document.getElementById(copyControl.getAttribute('data-local-field') || 'email_local_part');
        var domainField = document.getElementById(copyControl.getAttribute('data-domain-field') || 'email_domain');
        copyTextToClipboard((localField ? localField.value : '') + '@' + (domainField ? domainField.value : ''), copyControl);
        return;
      }
      if (copyControl.hasAttribute('data-copy-composed-value')) {
        var prefix = document.getElementById(copyControl.getAttribute('data-copy-source-prefix') || '');
        var source = document.getElementById(copyControl.getAttribute('data-copy-source-value') || '');
        copyTextToClipboard((prefix ? prefix.innerText || prefix.textContent || '' : '') + (source ? source.value || source.textContent || '' : ''), copyControl);
        return;
      }
      copyTextToClipboard(copyControl.getAttribute('data-copy-value') || '', copyControl);
      return;
    }

    if (sslClientDataControl) {
      var sslAction = sslClientDataControl.getAttribute('data-ssl-client-data-action');
      if (sslAction === 'reset') resetSslClientData();
      if (sslAction === 'load') loadSslClientData(sslClientDataControl);
      return;
    }

    if (tabControl) {
      ISPConfig.switchTab(
        tabControl.getAttribute('data-change-tab'),
        tabControl.getAttribute('data-tab-target') || tabControl.getAttribute('data-form-action'),
        tabControl.getAttribute('data-tab-force') === 'true'
      );
      return;
    }

    if (workbenchActionControl) {
      var workbenchAction = workbenchActionControl.getAttribute('data-workbench-action');
      if (workbenchAction === 'add-additional-template') ISPConfig.addAdditionalTemplate();
      if (workbenchAction === 'reset-autoresponder-dates') window.AR_ResetDates();
      if (workbenchAction === 'create-dkim') createDkimRecord(workbenchActionControl);
      if (workbenchAction === 'set-hidden-submit') {
        var fieldName = workbenchActionControl.getAttribute('data-hidden-field');
        var fieldValue = workbenchActionControl.getAttribute('data-hidden-value') || '1';
        var field = fieldName ? query(document, '[name="' + cssEscape(fieldName) + '"]') : null;
        if (field) {
          field.value = fieldValue;
          trigger(field, 'input');
        }
        ISPConfig.submitPageForm(workbenchActionControl.getAttribute('data-submit-form') || 'pageForm', workbenchActionControl.getAttribute('data-form-action'));
      }
      return;
    }

    if (loadIntoControl) {
      var targetId = workbenchContractValue(loadIntoControl, WORKBENCH_CONTENT_CONTRACTS.target);
      var targetContent = workbenchContractValue(loadIntoControl, WORKBENCH_CONTENT_CONTRACTS.load);
      if (targetId && targetContent) ISPConfig.refreshContentInto(targetId, targetContent);
      return;
    }

    if (loadControl) {
      var content = workbenchContractValue(loadControl, WORKBENCH_CONTENT_CONTRACTS.load);
      if (content) ISPConfig.navigateTo(content);
      return;
    }

    if (moduleControl) {
      var module = workbenchContractValue(moduleControl, WORKBENCH_CONTENT_CONTRACTS.module);
      if (module) ISPConfig.capp(module);
      return;
    }

    if (submitControl) {
      var action = submitControl.getAttribute('data-form-action');
      var form = submitControl.getAttribute('data-submit-form');
      if (submitControl.getAttribute('data-form-upload') === 'true') ISPConfig.submitUploadForm(form, action);
      else ISPConfig.submitPageForm(form, action);
      return;
    }

    if (sortHeader && query(document, '#pageForm .table #Filter') && sortHeader.getAttribute('data-sortable') !== 'false') {
      var filter = document.getElementById('Filter');
      var target = filter && filter.getAttribute('data-form-action');
      var formName = filter && filter.getAttribute('data-submit-form');
      if (target && formName) {
        target += (target.indexOf('?') >= 0 ? '&' : '?') + 'orderby=' + encodeURIComponent(sortHeader.getAttribute('data-column'));
        ISPConfig.submitPageForm(formName, target);
      }
      return;
    }

    if (placeholder) {
      var field = query(placeholder.parentNode, 'input, textarea');
      if (field) field.value += placeholder.textContent;
    }

    if (placeholderContent) {
      var destination = query(placeholderContent.parentNode, 'input, textarea');
      if (destination) destination.value += placeholderContent.textContent;
    }

    if (checkFields && checkFields.checked) {
      String(checkFields.parentNode.getAttribute('data-check-fields') || '').split(',').forEach(function(name) {
        queryAll(document, 'input[type="checkbox"][name="' + cssEscape(name.trim()) + '"]').forEach(function(box) { box.checked = true; });
      });
    }

    if (uncheckFields && !uncheckFields.checked) {
      String(uncheckFields.parentNode.getAttribute('data-uncheck-fields') || '').split(',').forEach(function(name) {
        queryAll(document, 'input[type="checkbox"][name="' + cssEscape(name.trim()) + '"]').forEach(function(box) { box.checked = false; });
      });
    }
  });

  document.addEventListener('keypress', function(event) {
    if (event.key !== 'Enter') return;
    if (query(document, '#pageForm .table #Filter') && !event.target.classList.contains('ui-autocomplete-input')) {
      event.preventDefault();
      trigger(query(document, '#pageForm .table #Filter'), 'click');
      return;
    }
    if (event.target.localName !== 'textarea' && matches(event.target, 'input, select') && query(document, '.tab-content button.formbutton-success:not([disabled])')) {
      event.preventDefault();
      trigger(query(document, '.tab-content button.formbutton-success:not([disabled])'), 'click');
    }
  });

  document.addEventListener('submit', function(event) {
    if (event.target && event.target.id === 'searchform') event.preventDefault();
    if (event.target && event.target.id === 'pageForm' && query(document, '#pageForm .table #Filter')) event.preventDefault();
  });

  document.addEventListener('DOMContentLoaded', function() {
    initSslClientDataHelpers(document);
    queryAll(document, '.progress .progress-bar').forEach(function(bar) {
      bar.style.width = (bar.getAttribute('aria-valuenow') || '0') + '%';
    });
  });
})(window, document);
