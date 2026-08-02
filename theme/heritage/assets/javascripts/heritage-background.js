(function(window, document) {
  'use strict';

  function runtime() { return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || typeof app.requestText !== 'function' || typeof app.requestJson !== 'function' || legacy.workbenchBackgroundInstalled) return;

  var contentRequests = {};
  var keepaliveTimer = null;
  var keepaliveRequest = null;
  var datalogRequest = null;
  var datalogStarted = false;

  function scheduleDatalog(delay) {
    var api = runtime();
    if (!api) return;
    window.clearTimeout(api.dataLogTimer);
    api.dataLogTimer = null;
    if (!datalogStarted || document.hidden) return;
    api.dataLogTimer = window.setTimeout(function() { api.dataLogNotification(); }, delay);
  }

  legacy.loadContentInto = function(elementId, pageName) {
    var api = runtime();
    var host = document.getElementById(elementId);
    if (!api || !host) return null;
    if (contentRequests[elementId] && contentRequests[elementId].readyState !== 4) contentRequests[elementId].abort();
    host.setAttribute('aria-busy', 'true');
    var request = api.requestText(pageName, { timeout: 30000 });
    contentRequests[elementId] = request;
    request.promise.then(function(responseText) {
      if (contentRequests[elementId] !== request) return;
      if (typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
      api.replaceServerFragment(host, responseText);
      if (window.workbenchContentStates && typeof window.workbenchContentStates.enhance === 'function') {
        window.workbenchContentStates.enhance(host, pageName, { source: 'partial-content' });
      } else {
        if (window.workbenchAccessibility) window.workbenchAccessibility.enhance(host);
        if (window.workbenchIcons) window.workbenchIcons.render(host);
      }
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Partial content request was not successful.');
    }).finally(function() {
      if (contentRequests[elementId] === request) host.setAttribute('aria-busy', 'false');
    });
    return request;
  };

  legacy.loadOptionInto = function(elementId, pageName, callback) {
    var api = runtime();
    var select = document.getElementById(elementId);
    if (!api || !select) return null;
    var key = 'option:' + elementId;
    if (contentRequests[key] && contentRequests[key].readyState !== 4) contentRequests[key].abort();
    select.setAttribute('aria-busy', 'true');
    var request = api.requestText(pageName, { timeout: 30000 });
    contentRequests[key] = request;
    request.promise.then(function(responseText) {
      if (contentRequests[key] !== request) return;
      select.replaceChildren();
      responseText.split('#').forEach(function(value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
      if (typeof callback === 'function') callback(elementId, pageName);
    }).catch(function(error) {
      if (!request.aborted && (!error || error.name !== 'AbortError')) api.reportError('Option request was not successful.');
    }).finally(function() {
      if (contentRequests[key] === request) select.removeAttribute('aria-busy');
    });
    return request;
  };

  legacy.keepalive = function() {
    var api = runtime();
    if (!api) return null;
    if (keepaliveTimer) window.clearTimeout(keepaliveTimer);
    if (keepaliveRequest && keepaliveRequest.readyState !== 4) return keepaliveRequest;
    keepaliveRequest = api.requestText('keepalive.php', { timeout: 30000 });
    keepaliveRequest.promise.then(function() {
      keepaliveTimer = window.setTimeout(function() { api.keepalive(); }, 1000000);
    }).catch(function(error) {
      if (!keepaliveRequest.aborted && (!error || error.name !== 'AbortError')) api.reportError('Session expired. Please login again.');
    });
    return keepaliveRequest;
  };

  function renderDatalog(payload) {
    var trigger = document.querySelector('.notification');
    var counter = trigger && trigger.querySelector('.notification_text');
    var dialog = document.getElementById('datalogModal');
    var list = dialog && dialog.querySelector('.wb-dialog__body ul');
    var count = Number(payload && payload.count || 0);
    if (!trigger || !counter || !list) return;
    list.replaceChildren();
    if (count > 0) {
      var entries = payload && payload.entries ? payload.entries : [];
      (Array.isArray(entries) ? entries : Object.keys(entries).map(function(key) { return entries[key]; })).forEach(function(entry) {
        var item = document.createElement('li');
        var label = document.createElement('strong');
        label.textContent = String(entry.text || '') + ':';
        item.append(label, document.createTextNode(' ' + String(entry.count || 0)));
        list.appendChild(item);
      });
      counter.textContent = String(count);
      trigger.style.display = '';
      scheduleDatalog(2000);
    } else {
      counter.textContent = '0';
      if (window.workbenchDialog && dialog && window.workbenchDialog.isOpen(dialog)) {
        var empty = document.createElement('li');
        empty.textContent = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0 ? 'Keine ausstehenden Änderungen.' : 'No pending changes.';
        list.appendChild(empty);
        trigger.style.display = '';
      } else {
        trigger.style.display = 'none';
      }
      scheduleDatalog(5000);
    }
  }

  legacy.dataLogNotification = function() {
    var api = runtime();
    if (!api) return null;
    datalogStarted = true;
    window.clearTimeout(api.dataLogTimer);
    api.dataLogTimer = null;
    if (document.hidden) return null;
    if (datalogRequest && datalogRequest.readyState !== 4) return datalogRequest;
    var request = api.requestJson('datalogstatus.php', { timeout: 30000 });
    datalogRequest = request;
    request.promise.then(renderDatalog).catch(function(error) {
      if (request.aborted || (error && error.name === 'AbortError')) return;
      var trigger = document.querySelector('.notification');
      if (trigger) trigger.style.display = 'none';
      api.reportError('Notification temporarily unavailable.');
      scheduleDatalog(10000);
    }).finally(function() {
      if (datalogRequest === request) datalogRequest = null;
    });
    return request;
  };

  document.addEventListener('visibilitychange', function() {
    if (!datalogStarted) return;
    if (document.hidden) {
      var api = runtime();
      if (api) {
        window.clearTimeout(api.dataLogTimer);
        api.dataLogTimer = null;
      }
      if (datalogRequest && datalogRequest.readyState !== 4) datalogRequest.abort();
      datalogRequest = null;
      return;
    }
    var visibleApi = runtime();
    if (visibleApi) visibleApi.dataLogNotification();
  });

  window.addEventListener('pagehide', function() {
    var api = runtime();
    if (api) window.clearTimeout(api.dataLogTimer);
    if (datalogRequest && datalogRequest.readyState !== 4) datalogRequest.abort();
  });

  legacy.workbenchBackgroundInstalled = true;
})(window, document);
