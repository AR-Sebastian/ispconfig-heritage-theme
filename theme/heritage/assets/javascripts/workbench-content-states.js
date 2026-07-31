(function(window, document) {
  'use strict';

  function runtime() { return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null; }
  var legacy = window.ISPConfig;
  var app = runtime();
  if (!legacy || !app || legacy.workbenchContentStatesInstalled) return;

  var sequence = 0;
  var retryRequests = {};
  var messages = {};
  var contentRequest = null;
  var contentStateTimer = null;
  var contentStateDelay = 140;
  var historyKey = 'workbenchContent';
  var isGerman = (typeof window.workbenchLanguage === 'function' ? window.workbenchLanguage() : (document.documentElement.lang || '')).toLowerCase().indexOf('de') === 0;

  function localized(german, english) {
    return isGerman ? german : english;
  }

  function isGenericActionLabel(value) {
    return /^(?:(?:Aktion|Action)\s*\d*|Weitere Aktion|More action|Aktionen|Actions)$/i.test(String(value || '').replace(/\s+/g, ' ').trim());
  }

  function inferRowActionLabel(control, flags) {
    var source = [
      control.className,
      control.getAttribute('href'),
      control.getAttribute('data-load-content'),
      control.getAttribute('data-workbench-load-content'),
      control.getAttribute('data-confirm-action'),
      control.getAttribute('name'),
      control.getAttribute('value')
    ].join(' ').toLowerCase();

    if (flags.isDanger || /delete|remove|drop|purge|destroy|loeschen|entfernen/.test(source)) return localized('Löschen', 'Delete');
    if (flags.isLogin || /loginas|login_as|login-as|impersonat|anmelden/.test(source)) return localized('Als Benutzer anmelden', 'Log in as user');
    if (flags.isEdit || /(?:^|[\\/_-])edit(?:[.\\/_?-]|$)|bearbeiten/.test(source)) return localized('Bearbeiten', 'Edit');
    if (/download|export|backup_download|icon-download/.test(source)) return localized('Herunterladen', 'Download');
    if (/copy|duplicate|clone|dupliz/.test(source)) return localized('Duplizieren', 'Duplicate');
    if (/restore|rollback|wiederherstell/.test(source)) return localized('Wiederherstellen', 'Restore');
    if (/enable|activate|aktivieren/.test(source)) return localized('Aktivieren', 'Enable');
    if (/disable|deactivate|deaktivieren/.test(source)) return localized('Deaktivieren', 'Disable');
    if (/stat|monitor|traffic|usage|quota|chart/.test(source)) return localized('Statistik anzeigen', 'View statistics');
    if (/preview|vorschau/.test(source)) return localized('Vorschau öffnen', 'Open preview');
    if (/link|open|visit|external|icon-link/.test(source)) return localized('Öffnen', 'Open');
    if (/add|create|new|hinzufuegen|erstellen|icon-add/.test(source)) return localized('Hinzufügen', 'Add');
    return localized('Weitere Optionen öffnen', 'Open more options');
  }

  try {
    var messageSource = document.getElementById('workbench-content-messages');
    messages = JSON.parse(messageSource ? messageSource.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function announceNavigationComplete(pagename, error) {
    document.dispatchEvent(new CustomEvent('workbench:navigation-complete', {
      detail: { page: pagename, error: error || null }
    }));
  }

  function announceContentReady(host, pageName, context) {
    document.dispatchEvent(new CustomEvent('workbench:content-ready', {
      detail: { root: host || document, page: pageName || '', context: context || null }
    }));
  }

  function text(value) {
    var node = document.createElement('div');
    node.textContent = value || '';
    return node.innerHTML;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function element(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = value;
    return node;
  }

  function iconElement(className, value) {
    var node = element('span', className, value);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function emptyStateNode(modifier, title, description) {
    var state = element('div', 'wb-empty-state wb-empty-state--' + modifier);
    var content = element('div', 'wb-empty-state__content');
    content.appendChild(element('strong', 'wb-empty-state__title', title));
    content.appendChild(element('span', 'wb-empty-state__description', description || ''));
    state.appendChild(iconElement('wb-empty-state__icon'));
    state.appendChild(content);
    return state;
  }

  function moduleAttribute(control) {
    return control ? (control.getAttribute('data-workbench-module') || control.getAttribute('data-capp') || '') : '';
  }

  function pageFromUrl() {
    var page = '';
    try { page = new URLSearchParams(window.location.search).get('wb') || ''; } catch (e) { page = ''; }
    // Only accept a plausible module page path (dashboard/dashboard.php,
    // monitor/show_sys_state.php?state=system, ...), never an arbitrary value.
    return /^[a-z0-9_-]+\/[a-z0-9_./-]+\.php(?:\?.*)?$/i.test(page) ? page : '';
  }
  function urlFor(page) {
    // Real, reload-safe, bookmarkable query URL kept entirely inside the theme
    // (no shared-core or server changes). Only sub-query/anchor separators are
    // escaped so URLSearchParams round-trips the value.
    return window.location.pathname + '?wb=' + String(page).replace(/#/g, '%23').replace(/&/g, '%26').replace(/\?/g, '%3F');
  }
  // Expose so the core runtime (navigateTo) uses the same URL form.
  if (legacy) legacy.workbenchUrlFor = urlFor;

  function installNavigationHistory() {
    if (!window.history || !window.history.pushState || document.documentElement.dataset.wbHistoryReady) return;
    document.documentElement.dataset.wbHistoryReady = 'true';
    var content = document.getElementById('pageContent');
    // Robust routing: the current page lives in the address-bar hash, so reload
    // or bookmark restores it instead of falling back to the server session
    // module (which made every reload land on the last full-loaded module).
    var initial = pageFromUrl() || (content && content.getAttribute('data-startpage')) || 'dashboard/dashboard.php';
    if (!window.history.state || !window.history.state[historyKey]) window.history.replaceState({ workbenchContent: initial }, '', urlFor(initial));
    document.addEventListener('click', function(event) {
      var trigger = event.target.closest('a[data-workbench-module],button[data-workbench-module],a[data-capp],button[data-capp]');
      if (!trigger) return;
      var target = moduleAttribute(trigger);
      if (!target || trigger.getAttribute('data-submit-form') || trigger.getAttribute('data-form-action')) return;
      var current = window.history.state && window.history.state[historyKey];
      if (current !== target) window.history.pushState({ workbenchContent: target }, '', urlFor(target));
    });
    window.addEventListener('popstate', function(event) {
      var target = event.state && event.state[historyKey];
      if (!target) return;
      var api = runtime();
      if (api) api.navigateTo(target);
    });
  }

  // Shared native GET transport for Workbench navigation. It deliberately
  // retains the small jqXHR-compatible handle expected by legacy callers.
  function requestHtml(url, data, timeout) {
    var api = runtime();
    if (!api || typeof api.requestText !== 'function') throw new Error('Workbench runtime requestText is unavailable.');
    return api.requestText(url || '', { query: data || null, timeout: timeout || 30000 });
  }

  function isSupersededRequest(request, error) {
    if (request && request.aborted) return true;
    if (error && error.name === 'AbortError') return true;
    if (error && error.name === 'WorkbenchHttpError' && /superseded|aborted|ersetzt/i.test(error.message || '')) return true;
    return false;
  }

  function decorateNavigation(host) {
    if (!host) return;
    host.querySelectorAll('a, button').forEach(function(control) {
      if (control.classList.contains('active')) control.setAttribute('aria-current', 'page');
      else if (control.getAttribute('aria-current') === 'page') control.removeAttribute('aria-current');
    });
  }

  function decoratePageContext(host, pageName) {
    if (!host) return;
    var hasTable = Boolean(host.querySelector(':scope > .table-wrapper > table.table, :scope > table.table, .table-wrapper > table.table, table.table'));
    var shellForm = host.closest('form#pageForm, form.form-horizontal');
    var hasForm = Boolean(host.querySelector('form#pageForm, .form-horizontal .form-group')) ||
      Boolean(shellForm && host.querySelector('.form-group, .pnl_formsarea, .tab-content')) ||
      /(?:_edit|_add|user_settings)\.php(?:$|\?)/.test(pageName || '');
    var body = document.body;
    body.classList.toggle('wb-list-page', hasTable);
    body.classList.toggle('wb-form-page', hasForm);
    applyFormProfiles(body, host, pageName, hasForm);
  }

  function normalizePageName(pageName) {
    return String(pageName || '').replace(/&amp;/gi, '&').replace(/^\.?\//, '').toLowerCase();
  }

  function applyFormProfiles(body, host, pageName, hasForm) {
    var route = normalizePageName(pageName);
    var profiles = [];
    var addProfile = function(profile) {
      if (profiles.indexOf(profile) === -1) profiles.push(profile);
    };
    Array.prototype.forEach.call(body.classList, function(className) {
      if (className.indexOf('wb-form-profile--') === 0) body.classList.remove(className);
    });
    if (!hasForm) {
      delete body.dataset.wbFormProfiles;
      return;
    }
    if (route.indexOf('billing/') === 0 || host.querySelector('.wb-billing-product, [data-billing-scope]')) addProfile('billing');
    if (route.indexOf('admin/system_config_edit.php') === 0 || host.querySelector('[data-wb-branding-manager], .wb-branding-manager')) addProfile('system-config');
    if (host.querySelector('[data-wb-branding-manager], .wb-branding-manager, #workbench-accent-color, #workbench-light-logo-file, #workbench-dark-logo-file, #workbench-favicon-file')) addProfile('branding');
    if (host.querySelector('#smtp_host, #smtp_port, #smtp_user, #smtp_pass, #smtp_crypt, #default_mailserver')) addProfile('system-mail');
    if (route.indexOf('admin/server_config') === 0 || host.querySelector('#maildir_path, #nginx_vhost_conf_dir, #apache_vhost_conf_dir, #jailkit_chroot_home')) addProfile('server-config');
    if (route.indexOf('admin/extension_') === 0 || host.querySelector('[data-load-content*="extension_"], [data-form-action*="extension_"]')) addProfile('extension');
    if (route.indexOf('client/client_edit.php') === 0 || route.indexOf('client/reseller_edit.php') === 0 || host.querySelector('.panel_client, [id^="limit_"], [name^="limit_"]')) addProfile('limits');
    if (host.querySelector('input[type="file"]')) addProfile('uploads');
    if (host.querySelector('input[type="password"], input[name*="pass"], input[id*="pass"]')) addProfile('secrets');
    if (host.querySelector('.content-tab-wrapper > .wb-form-tabs > li:nth-child(8), .tab-content > .tab-pane:nth-child(8)')) addProfile('deep-tabs');
    if (host.querySelector('.panel-group, .panel-collapse, .panel-heading, .well')) addProfile('legacy-panels');
    if (host.querySelector('.select2-container, .chosen-container, select[multiple], select[size]')) addProfile('legacy-selects');
    if (host.querySelector('.input-group, .input-append, .input-prepend, .btn-group')) addProfile('compound-controls');
    if (host.querySelector('textarea[name*="config"], textarea[id*="config"], textarea[name*="directive"], textarea[id*="directive"], textarea[name*="conf"], textarea[id*="conf"]')) addProfile('technical-text');
    if (host.querySelector('input[name*="ssl"], input[id*="ssl"], textarea[name*="ssl"], textarea[id*="ssl"], input[name*="cert"], input[id*="cert"], textarea[name*="cert"], textarea[id*="cert"]')) addProfile('certificate');
    if (host.querySelector('.formtable, table.table, .table-wrapper, .table-responsive')) addProfile('embedded-tables');
    if (host.querySelector('.fieldset, fieldset, .fieldset-container, legend, .fieldset-legend')) addProfile('fieldsets');
    if (host.querySelector('[readonly], [disabled], .form-control-static, .readonly, .disabled')) addProfile('locked-values');
    if (host.querySelector('.help-block, .help-inline, .description, .hint, small, .form-text')) addProfile('help-rich');
    if (host.scrollWidth > host.clientWidth + 24 || host.querySelector('textarea[cols], table[width], input[size]')) addProfile('wide-content');
    profiles.forEach(function(profile) {
      body.classList.add('wb-form-profile--' + profile);
    });
    body.dataset.wbFormProfiles = profiles.join(' ');
  }

  function moduleFromPageName(pageName) {
    var value = String(pageName || '').replace(/&amp;/gi, '&').replace(/^\.?\//, '').toLowerCase();
    if (!value || value.indexOf('dashboard/') === 0) return 'dashboard';
    if (value.indexOf('login/') === 0) return '';
    return value.split('/')[0] || '';
  }

  function moduleLabelFromPageName(pageName) {
    var moduleName = moduleFromPageName(pageName);
    if (!moduleName) return '';
    var direct = document.querySelector('#main-navigation a[data-workbench-module="' + moduleName + '"] .title, #main-navigation a[data-workbench-module="' + moduleName + '"], #main-navigation a[data-capp="' + moduleName + '"] .title, #main-navigation a[data-capp="' + moduleName + '"]');
    var label = direct && direct.textContent.replace(/\s+/g, ' ').trim();
    if (label) return label;
    var labels = {
      admin: 'System',
      billing: 'Fakturierung',
      client: 'Kunden',
      dashboard: '\u00dcbersicht',
      dns: 'DNS',
      help: 'Support',
      mail: 'E-Mail',
      monitor: '\u00dcberwachung',
      sites: 'Webseiten',
      tools: 'Einstellungen'
    };
    return labels[moduleName] || moduleName;
  }

  function decoratePageChrome(host, pageName) {
    if (!host) return;
    var header = host.querySelector(':scope > .page-header');
    if (header) {
      header.classList.add('wb-page-header');
      if (!document.body.classList.contains('wb-dashboard-page')) {
        var title = header.querySelector(':scope > h1');
        var moduleLabel = moduleLabelFromPageName(pageName);
        if (title && moduleLabel && moduleLabel.toLowerCase() !== title.textContent.trim().toLowerCase() && !header.querySelector(':scope > .wb-page-header__eyebrow')) {
          var eyebrow = document.createElement('span');
          eyebrow.className = 'wb-page-header__eyebrow';
          eyebrow.textContent = moduleLabel;
          header.insertBefore(eyebrow, title);
        }
        var meta = host.querySelector(':scope > .wb-page-meta');
        if (!meta) {
          meta = document.createElement('div');
          meta.className = 'wb-page-meta';
          header.insertAdjacentElement('afterend', meta);
        }
        var notices = host.querySelector(':scope > .wb-page-notices');
        if (!notices) {
          notices = document.createElement('section');
          notices.className = 'wb-page-notices';
          notices.setAttribute('aria-live', 'polite');
          meta.insertAdjacentElement('afterend', notices);
        }
      }
      Array.prototype.forEach.call(header.querySelectorAll(':scope > .btn, :scope > button, :scope > a.btn'), function(action) {
        action.classList.add('wb-page-header__action');
      });
      var description = header.nextElementSibling;
      if (description && description.classList.contains('wb-page-meta')) description = description.nextElementSibling;
      if (description && description.tagName === 'P' && !description.classList.contains('fieldset-legend')) {
        description.classList.add('wb-page-description');
        var metaTarget = host.querySelector(':scope > .wb-page-meta');
        if (metaTarget) metaTarget.appendChild(description);
      }
      var metaTarget = host.querySelector(':scope > .wb-page-meta');
      Array.prototype.forEach.call(host.querySelectorAll(':scope > .wb-form-state, :scope > .wb-submit-feedback'), function(status) {
        if (metaTarget) metaTarget.appendChild(status);
      });
      var noticeTarget = host.querySelector(':scope > .wb-page-notices');
      Array.prototype.forEach.call(host.querySelectorAll(':scope > #errormsg, :scope > #warningmsg, :scope > #infomsg, :scope > .alert'), function(notice) {
        if (noticeTarget) noticeTarget.appendChild(notice);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .fieldset-legend'), function(legend) {
      legend.classList.add('wb-section-heading');
    });
  }

  function decorateInformationArchitecture(host) {
    if (!host) return;
    var header = host.querySelector(':scope > .wb-page-header, :scope > .page-header');
    if (header) {
      var directActions = Array.prototype.slice.call(header.querySelectorAll(':scope > .wb-page-header__action, :scope > .btn, :scope > button, :scope > a.btn'));
      var actionGroup = header.querySelector(':scope > .wb-page-header__actions');
      if (directActions.length && !actionGroup) {
        actionGroup = document.createElement('div');
        actionGroup.className = 'wb-page-header__actions';
        actionGroup.setAttribute('role', 'group');
        actionGroup.setAttribute('aria-label', (header.querySelector('h1')?.textContent || localized('Seite', 'Page')) + ' ' + localized('Aktionen', 'actions'));
        directActions.forEach(function(action) {
          action.classList.add('wb-page-header__action');
          actionGroup.appendChild(action);
        });
        header.appendChild(actionGroup);
      }
      var title = header.querySelector('h1');
      if (title) {
        host.setAttribute('data-wb-page-title', title.textContent.replace(/\s+/g, ' ').trim());
        title.setAttribute('tabindex', '-1');
      }
    }

    Array.prototype.forEach.call(host.querySelectorAll('#errormsg, #warningmsg, #infomsg, #OKMsg, .alert'), function(notice) {
      notice.classList.add('wb-notice');
      var kind = notice.matches('#errormsg, .alert-danger, .alert-error') ? 'danger' :
        notice.matches('#warningmsg, .alert-warning') ? 'warning' :
        notice.matches('#OKMsg, .alert-success') ? 'success' : 'info';
      notice.classList.add('wb-notice--' + kind);
      notice.setAttribute('role', kind === 'danger' ? 'alert' : 'status');
      if (!notice.querySelector(':scope > .wb-notice__icon')) {
        var icon = document.createElement('span');
        icon.className = 'wb-notice__icon';
        icon.setAttribute('aria-hidden', 'true');
        notice.insertBefore(icon, notice.firstChild);
      }
    });

    Array.prototype.forEach.call(host.querySelectorAll('dl'), function(list) {
      list.classList.add('wb-definition-list');
      Array.prototype.forEach.call(list.querySelectorAll(':scope > dt'), function(term) { term.classList.add('wb-definition-list__term'); });
      Array.prototype.forEach.call(list.querySelectorAll(':scope > dd'), function(value) { value.classList.add('wb-definition-list__value'); });
    });
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .panel, :scope > .well'), function(card) {
      card.classList.add('wb-content-card');
    });
    Array.prototype.forEach.call(host.querySelectorAll('pre:not(.wb-code-output), .codeview:not(.wb-code-output)'), function(output) {
      output.classList.add('wb-code-output');
    });
    Array.prototype.forEach.call(host.querySelectorAll('.label, .badge'), function(status) {
      if (status.closest('#main-navigation, #sidebar, #workbench-mobile-navigation')) return;
      status.classList.add('wb-status-chip');
      if (!status.getAttribute('role')) status.setAttribute('role', 'status');
    });
    Array.prototype.forEach.call(host.querySelectorAll('.wb-section-heading'), function(heading) {
      if (!heading.getAttribute('role')) heading.setAttribute('role', 'heading');
      if (!heading.getAttribute('aria-level')) heading.setAttribute('aria-level', '2');
    });
  }

  function decorateTableFilters(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.table-wrapper > table > thead > tr:nth-child(2)'), function(row) {
      if (row.getAttribute('data-workbench-filter-row') === 'true') return;
      row.setAttribute('data-workbench-filter-row', 'true');
      var headerCells = Array.prototype.slice.call(row.parentElement ? row.parentElement.querySelectorAll('tr:first-child > th, tr:first-child > td') : []);
      Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) {
        control.setAttribute('data-workbench-filter', 'true');
        if (!control.getAttribute('aria-label')) {
          var name = control.getAttribute('name') || '';
          var cell = control.closest('th, td');
          var cellIndex = cell ? Array.prototype.indexOf.call(row.children, cell) : -1;
          var header = cellIndex >= 0 ? headerCells[cellIndex] : null;
          var label = (header ? header.textContent : '').replace(/\s+/g, ' ').trim();
          if (!label) label = name.replace(/^search_/, '').replace(/_/g, ' ').trim();
          if (label) control.setAttribute('aria-label', 'Filter ' + label);
        }
        if (control.tagName === 'INPUT' && !control.getAttribute('placeholder')) {
          control.setAttribute('placeholder', localized('Suchen …', 'Search…'));
        }
        if (control.tagName === 'SELECT' && control.options.length && !control.options[0].textContent.trim()) {
          control.options[0].textContent = localized('Alle', 'All');
        }
      });
      var cell = row.lastElementChild;
      if (!cell) return;
      var wrapper = row.closest('.table-wrapper');
      var toolbar = null;
      var toggle = null;
      var summary = null;
      if (wrapper && wrapper.parentNode && !wrapper.parentNode.querySelector(':scope > .wb-filter-toolbar')) {
        var toolbar = document.createElement('div');
        toolbar.className = 'wb-filter-toolbar';
        toolbar.setAttribute('role', 'search');
        var toolbarTitle = document.createElement('strong');
        toolbarTitle.className = 'wb-filter-toolbar__title';
        toolbarTitle.textContent = document.body.getAttribute('data-workbench-filter-toggle') || localized('Filter', 'Filters');
        var toggle = document.createElement('button');
        toggle.type = 'button'; toggle.className = 'wb-filter-toggle';
        var showLabel = document.body.getAttribute('data-workbench-filter-show') || localized('Filter anzeigen', 'Show filters');
        var hideLabel = document.body.getAttribute('data-workbench-filter-hide') || localized('Filter ausblenden', 'Hide filters');
        toggle.appendChild(iconElement('wb-filter-toggle__icon'));
        toggle.appendChild(element('span', 'wb-filter-toggle__label'));
        toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', 'wb-filter-row-' + Math.random().toString(36).slice(2));
        row.id = toggle.getAttribute('aria-controls'); row.hidden = true;
        function syncToggle() {
          var label = row.hidden ? showLabel : hideLabel;
          toggle.setAttribute('aria-expanded', row.hidden ? 'false' : 'true');
          toggle.setAttribute('aria-label', label);
          toggle.title = label;
          toggle.querySelector('.wb-filter-toggle__label').textContent = label;
          wrapper.classList.toggle('wb-filter-panel-open', !row.hidden);
        }
        toggle.addEventListener('click', function() {
          row.hidden = !row.hidden;
          syncToggle();
          if (!row.hidden) {
            var firstFilter = row.querySelector('input, select');
            if (firstFilter) firstFilter.focus();
          }
        });
        var summary = document.createElement('span');
        summary.className = 'wb-filter-summary';
        summary.setAttribute('role', 'status');
        summary.setAttribute('aria-live', 'polite');
        toolbar.appendChild(toolbarTitle);
        toolbar.appendChild(summary);
        toolbar.appendChild(toggle);
        wrapper.parentNode.insertBefore(toolbar, wrapper);
        syncToggle();
      } else if (wrapper && wrapper.parentNode) {
        toolbar = wrapper.parentNode.querySelector(':scope > .wb-filter-toolbar');
        toggle = toolbar ? toolbar.querySelector('.wb-filter-toggle') : null;
        summary = toolbar ? toolbar.querySelector('.wb-filter-summary') : null;
      }
      var reset = document.createElement('button');
      reset.type = 'button'; reset.className = 'wb-filter-reset';
      var resetLabel = document.body.getAttribute('data-workbench-filter-reset') || localized('Filter zurücksetzen', 'Reset filters');
      var resetActiveLabel = document.body.getAttribute('data-workbench-filter-reset-active') || localized('Filter zurücksetzen (%s)', 'Reset filters (%s)');
      reset.textContent = resetLabel; reset.setAttribute('aria-label', resetLabel);
      function syncFilterCount() {
        var count = Array.prototype.filter.call(row.querySelectorAll('input, select'), function(control) { return control.tagName === 'SELECT' ? control.selectedIndex > 0 : Boolean(control.value); }).length;
        var label = count ? resetActiveLabel.replace('%s', count) : resetLabel;
        reset.textContent = resetLabel;
        reset.setAttribute('aria-label', label);
        reset.disabled = count === 0;
        if (summary) summary.textContent = count ? label : '';
        if (toolbar) {
          toolbar.classList.toggle('wb-filter-toolbar--active', count > 0);
          toolbar.classList.toggle('wb-filter-toolbar--idle', count === 0);
        }
        if (count && row.hidden) {
          row.hidden = false;
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', hideLabel);
            toggle.title = hideLabel;
            toggle.querySelector('.wb-filter-toggle__label').textContent = hideLabel;
          }
          if (wrapper) wrapper.classList.add('wb-filter-panel-open');
        }
      }
      Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) { control.addEventListener('input', syncFilterCount); control.addEventListener('change', syncFilterCount); });
      reset.addEventListener('click', function() {
        Array.prototype.forEach.call(row.querySelectorAll('input, select'), function(control) {
          if (control.tagName === 'SELECT') control.selectedIndex = 0; else control.value = '';
          control.dispatchEvent(new Event('input', { bubbles: true })); control.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
      syncFilterCount();
      if (toolbar) toolbar.insertBefore(reset, toggle);
      row.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape' || !toggle) return;
        row.hidden = true;
        wrapper.classList.remove('wb-filter-panel-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', showLabel);
        toggle.title = showLabel;
        toggle.querySelector('.wb-filter-toggle__label').textContent = showLabel;
        toggle.focus();
      });
    });
  }

  function decorateListCommandBar(host) {
    if (!host || !document.body.classList.contains('wb-list-page') || host.querySelector(':scope > .wb-list-command-bar')) return;
    var tableWrapper = host.querySelector(':scope > .table-wrapper, :scope > .wb-table-workspace');
    if (!tableWrapper) return;
    host.classList.add('wb-table-workspace');
    tableWrapper.classList.add('wb-table-viewport');
    var bar = document.createElement('section');
    var meta = document.createElement('div');
    var actions = document.createElement('div');
    var result = document.createElement('span');
    var resultTemplate = document.body.dataset.workbenchListVisibleResults || localized('{count} Einträge auf dieser Seite', '{count} items on this page');
    var dataRows = Array.prototype.filter.call(tableWrapper.querySelectorAll('table > tbody > tr'), function(row) {
      return !row.classList.contains('tbl_row_noresults') && !row.hasAttribute('data-workbench-summary-row');
    });
    bar.className = 'wb-list-command-bar';
    bar.setAttribute('aria-label', host.querySelector(':scope > .page-header h1')?.textContent.trim() || localized('Listenaktionen', 'List actions'));
    meta.className = 'wb-list-command-bar__meta';
    actions.className = 'wb-list-command-bar__actions';
    result.className = 'wb-list-result-count';
    result.setAttribute('role', 'status');
    result.textContent = resultTemplate.replace('{count}', dataRows.length);
    bar.dataset.wbListRows = String(dataRows.length);
    bar.classList.toggle('wb-list-command-bar--empty', dataRows.length === 0);
    meta.appendChild(result);
    bar.appendChild(meta);
    bar.appendChild(actions);

    /* Native Workbench templates may publish their primary action next to the
     * table so the controller contract stays untouched. Consolidate that
     * source toolbar into the generated command bar instead of rendering two
     * competing headers above one dataset. */
    var sourceToolbar = tableWrapper.querySelector(':scope > .wb-list-toolbar');
    if (sourceToolbar) {
      Array.prototype.forEach.call(sourceToolbar.querySelectorAll('button, a'), function(action) {
        if (action.matches('.formbutton-success, .btn-success, .btn-primary, [data-wb-primary-action]')) {
          action.classList.add('wb-list-command-bar__primary');
        }
        actions.appendChild(action);
      });
      sourceToolbar.remove();
    }

    Array.prototype.forEach.call(host.querySelectorAll(':scope > button.formbutton-success, :scope > a.formbutton-success, :scope > .buttons > .formbutton-success'), function(action) {
      var originalParent = action.parentElement;
      var actionLegend = originalParent === host ? action.previousElementSibling : originalParent.previousElementSibling;
      if (actionLegend && (actionLegend.classList.contains('fieldset-legend') || actionLegend.classList.contains('wb-list-section-heading'))) actionLegend.hidden = true;
      action.classList.add('wb-list-command-bar__primary');
      actions.appendChild(action);
      if (originalParent !== host && !originalParent.children.length) originalParent.remove();
    });
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .wb-dns-zone-actions, :scope > .wb-list-actions'), function(actionGroup) {
      var actionLegend = actionGroup.previousElementSibling;
      if (actionLegend && (actionLegend.classList.contains('fieldset-legend') || actionLegend.classList.contains('wb-list-section-heading'))) actionLegend.hidden = true;
      actionGroup.classList.add('wb-list-command-bar__action-group');
      actions.appendChild(actionGroup);
    });
    var filterToolbar = host.querySelector(':scope > .wb-filter-toolbar');
    if (filterToolbar) actions.appendChild(filterToolbar);
    var pageSize = Array.prototype.find.call(tableWrapper.querySelectorAll('select'), function(select) {
      if (select.name === 'search_limit' || select.classList.contains('search_limit') || select.classList.contains('wb-page-size-select')) return true;
      var name = String(select.name || select.id || '').toLowerCase();
      if (/(^|[_-])(limit|pagesize|page_size|perpage|per_page|items_per_page)([_-]|$)/.test(name)) return true;
      if (select.multiple || (select.size && Number(select.size) > 1)) return false;
      var values = Array.prototype.map.call(select.options || [], function(option) {
        return String(option.value || option.textContent || '').trim();
      }).filter(Boolean);
      var pageSizes = ['5', '10', '15', '20', '25', '30', '50', '100', '250'];
      return values.length >= 2 && values.length <= 8 &&
        values.every(function(value) { return /^\d{1,3}$/.test(value) && pageSizes.indexOf(value) !== -1; }) &&
        values.some(function(value) { return value === '15' || value === '25' || value === '50'; });
    });
    if (pageSize && !host.querySelector(':scope > .wb-list-page-size')) {
      var pageSizeCell = pageSize.closest('td, th');
      var pageSizeGroup = document.createElement('div');
      var pageSizeLabel = document.createElement('span');
      var pageSizeState = window.workbenchSelect ? window.workbenchSelect.enhance(pageSize, { compact: true, search: false }) : null;
      var pageSizeShell = pageSize.closest('.wb-select--page-size') || (pageSizeState && pageSizeState.root) || pageSize;
      pageSizeGroup.className = 'wb-list-page-size';
      pageSizeGroup.setAttribute('role', 'group');
      pageSizeGroup.setAttribute('aria-label', pageSize.getAttribute('aria-label') || localized('Einträge pro Seite', 'Items per page'));
      pageSizeLabel.className = 'wb-list-page-size__label';
      pageSizeLabel.textContent = pageSize.getAttribute('aria-label') || (((document.documentElement.lang || '').toLowerCase().indexOf('de') === 0) ? 'Pro Seite' : 'Per page');
      pageSizeGroup.appendChild(pageSizeLabel);
      pageSizeGroup.appendChild(pageSizeShell);
      pageSize.setAttribute('data-workbench-toolbar-control', 'true');
      if (pageSizeCell) {
        pageSizeCell.classList.add('wb-page-size-source-cell');
        pageSizeCell.setAttribute('aria-hidden', 'true');
        if (!pageSizeCell.textContent.replace(/\s+/g, '').trim()) pageSizeCell.hidden = true;
      }
      actions.insertBefore(pageSizeGroup, actions.firstChild);
    }

    var pageTitle = host.querySelector(':scope > .page-header h1');
    Array.prototype.forEach.call(host.querySelectorAll(':scope > .fieldset-legend, :scope > .wb-list-section-heading'), function(legend) {
      var duplicatesTitle = pageTitle && legend.textContent.trim() === pageTitle.textContent.trim();
      if (duplicatesTitle || legend.classList.contains('wb-list-section-heading')) {
        legend.hidden = true;
        legend.setAttribute('aria-hidden', 'true');
      }
    });
    tableWrapper.parentNode.insertBefore(bar, tableWrapper);
  }

  function decorateDataTables(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.table-wrapper > table.table, .wb-table-workspace > table.table'), function(table) {
      if (table.getAttribute('data-workbench-table') === 'true') return;
      table.setAttribute('data-workbench-table', 'true');
      table.classList.add('wb-data-table');
      var tableViewport = table.closest('.table-wrapper');
      if (tableViewport) {
        tableViewport.classList.add('wb-table-viewport');
        tableViewport.setAttribute('data-workbench-table-viewport', 'true');
        if (tableViewport.parentElement) tableViewport.parentElement.classList.add('wb-table-workspace');
      }
      var headerNodes = Array.prototype.slice.call(table.querySelectorAll('thead > tr:first-child > th, thead > tr:first-child > td'));
      var headers = headerNodes.map(function(header) {
        var label = (header.textContent || header.getAttribute('aria-label') || header.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        var column = (header.getAttribute('data-column') || '').replace(/^search_/, '').replace(/[_-]+/g, ' ').trim();
        if (!label && column) label = column.replace(/\b\w/g, function(letter) { return letter.toUpperCase(); });
        return label;
      });
      headerNodes.forEach(function(header, index) {
        var html = header.innerHTML || '';
        var sortable = Boolean(header.querySelector('a[href], a[data-load-content], [data-sort], [data-order]')) ||
          /(?:order|orderby|order_by|sort|sortierung)/i.test(html) ||
          /[\u2191\u2193\u2195]/.test(header.textContent || '');
        header.classList.add('wb-table-header');
        header.classList.toggle('wb-table-header--sortable', sortable);
        header.classList.toggle('wb-table-header--actions', index === headerNodes.length - 1);
        if (headers[index]) header.setAttribute('data-wb-label', headers[index]);
        if (sortable && !header.getAttribute('aria-sort')) header.setAttribute('aria-sort', 'none');
      });
      table.setAttribute('data-wb-columns', String(headers.length));
      table.style.setProperty('--wb-table-columns', String(Math.max(headers.length, 1)));
      table.classList.toggle('wb-data-table--wide', headers.length >= 6);
      var body = table.querySelector('tbody');
      if (!body) return;
      var dataRowCount = Array.prototype.filter.call(body.querySelectorAll(':scope > tr'), function(row) {
        return !row.classList.contains('tbl_row_noresults') && !row.hasAttribute('data-workbench-summary-row');
      }).length;
      var paginationLabel = document.body.dataset.workbenchPagination || localized('Seitennavigation', 'Pagination');
      var resultTemplate = document.body.dataset.workbenchListVisibleResults || localized('{count} Einträge auf dieser Seite', '{count} items on this page');
      var wrapper = table.closest('.table-wrapper') || table.parentElement;
      var footerBar = wrapper && wrapper.nextElementSibling && wrapper.nextElementSibling.classList.contains('wb-list-footer') ? wrapper.nextElementSibling : null;
      if (wrapper && wrapper.parentNode && !footerBar) {
        footerBar = document.createElement('section');
        footerBar.className = 'wb-list-footer';
        wrapper.insertAdjacentElement('afterend', footerBar);
      }
      if (wrapper) wrapper.classList.add('wb-table-viewport--finalized');
      if (wrapper && wrapper.parentElement) wrapper.parentElement.classList.add('wb-table-workspace--finalized');
      var footerSummary = null;
      var paginationSlot = null;
      if (footerBar) {
        footerBar.classList.add('wb-table-footer');
        footerBar.dataset.workbenchListFooter = 'true';
        footerBar.setAttribute('aria-label', paginationLabel);
        footerSummary = footerBar.querySelector(':scope > .wb-list-footer__summary');
        if (!footerSummary) {
          footerSummary = document.createElement('span');
          footerSummary.className = 'wb-list-footer__summary';
          footerBar.appendChild(footerSummary);
        }
        footerSummary.textContent = resultTemplate.replace('{count}', dataRowCount);
        paginationSlot = footerBar.querySelector(':scope > .wb-list-footer__pagination');
        if (!paginationSlot) {
          paginationSlot = document.createElement('div');
          paginationSlot.className = 'wb-list-footer__pagination';
          footerBar.appendChild(paginationSlot);
        }
        paginationSlot.hidden = true;
      }
      table.classList.toggle('wb-data-table--empty', dataRowCount === 0);
      table.classList.toggle('wb-data-table--compact', headers.length <= 4);
      table.classList.toggle('wb-data-table--dense', dataRowCount > 20);
      if (tableViewport) tableViewport.classList.toggle('wb-table-viewport--empty', dataRowCount === 0);
      var emptyStateSurface = null;
      var emptyStateRow = null;
      Array.prototype.forEach.call(body.querySelectorAll(':scope > tr'), function(row) {
        var cells = row.querySelectorAll(':scope > td, :scope > th');
        if (row.classList.contains('tbl_row_noresults')) {
          row.classList.add('wb-table-empty-row');
          row.setAttribute('role', 'status');
          var emptyCell = cells[0];
          if (emptyCell && !emptyCell.querySelector('.wb-empty-state')) {
            emptyCell.colSpan = Math.max(headers.length, 1);
            var serverMessage = (emptyCell.textContent || '').replace(/\s+/g, ' ').trim();
            var emptyState = emptyStateNode('table', serverMessage || messages.empty_title || messages.empty, messages.empty_description || '');
            var primaryAction = host.querySelector('.wb-list-command-bar__primary');
            if (primaryAction && !primaryAction.closest('.wb-list-command-bar')) {
              var actionLabel = (primaryAction.value || primaryAction.textContent || primaryAction.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
              if (actionLabel) {
                var emptyAction = document.createElement('button');
                emptyAction.type = 'button';
                emptyAction.className = 'wb-empty-state__action wb-empty-state__action--primary';
                emptyAction.textContent = actionLabel;
                emptyAction.addEventListener('click', function() { primaryAction.click(); });
                emptyState.appendChild(emptyAction);
              }
            }
            if (primaryAction && primaryAction.closest('.wb-list-command-bar')) {
              emptyState.dataset.wbPrimaryActionDocked = 'true';
            }
            emptyCell.textContent = '';
            emptyCell.appendChild(emptyState);
            emptyStateSurface = emptyState;
            emptyStateRow = row;
          }
          return;
        }
        row.classList.add('wb-table-data-row');
        row.setAttribute('tabindex', '-1');
        Array.prototype.forEach.call(cells, function(cell, index) {
          if (headers[index]) cell.setAttribute('data-wb-label', headers[index]);
          var cellText = (cell.textContent || '').replace(/\s+/g, ' ').trim();
          var hasInteractive = Boolean(cell.querySelector('a, button, input, select, textarea'));
          cell.classList.toggle('wb-table-cell--empty', !cellText && !hasInteractive);
          cell.classList.toggle('wb-table-cell--numeric', /^[-+]?\d+(?:[.,]\d+)?(?:\s*[%a-z]+)?$/i.test(cellText));
          cell.classList.toggle('wb-table-cell--status', /^(yes|no|ja|nein|active|inactive|enabled|disabled|aktiv|inaktiv)$/i.test(cellText));
          if (index === 0) cell.classList.add('wb-table-cell--identity');
          if (index === cells.length - 1 || cell.classList.contains('wb-table-align-end') || cell.classList.contains('text-right')) {
            cell.classList.add('wb-table-actions');
            cell.setAttribute('data-wb-label', document.body.dataset.workbenchTableActions || localized('Aktionen', 'Actions'));
          }
        });

        var primaryLink = Array.prototype.find.call(cells, function(cell) {
          return !cell.classList.contains('wb-table-actions') && cell.querySelector('a[data-capp], a[href]');
        });
        primaryLink = primaryLink && primaryLink.querySelector('a[data-capp], a[href]');
        if (primaryLink) {
          primaryLink.classList.add('wb-record-link');
          primaryLink.closest('td, th').classList.add('wb-table-cell--primary');
          row.setAttribute('data-wb-record', (primaryLink.textContent || '').replace(/\s+/g, ' ').trim());
        }

        Array.prototype.forEach.call(row.querySelectorAll(':scope > .wb-table-actions'), function(cell) {
          var controls = cell.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
          if (!controls.length) return;
          var group = cell.querySelector(':scope > .wb-row-actions');
          if (!group) {
            group = document.createElement('div');
            group.className = 'wb-row-actions';
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', cell.getAttribute('data-wb-label') || localized('Aktionen', 'Actions'));
            cell.insertBefore(group, cell.firstChild);
            while (group.nextSibling) group.appendChild(group.nextSibling);
          }
          controls = group.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
          cell.setAttribute('data-wb-action-count', String(controls.length));
          Array.prototype.forEach.call(controls, function(control, controlIndex) {
            var visibleLabel = control.tagName === 'INPUT' ? control.value : control.textContent;
            var label = control.getAttribute('aria-label') || control.title || (visibleLabel || '').replace(/\s+/g, ' ').trim();
            var hadGenericLabel = isGenericActionLabel(label);
            if (hadGenericLabel) label = '';
            var isDanger = control.classList.contains('formbutton-danger') || control.classList.contains('btn-danger');
            var isLogin = /loginas|login_as|cid=|Anmelden als|Login as/i.test(control.className + ' ' + control.getAttribute('href') + ' ' + label);
            var isEdit = /edit|bearbeiten/i.test(control.className + ' ' + control.getAttribute('href') + ' ' + label);
            control.classList.add('wb-row-action');
            control.classList.toggle('wb-row-action--danger', isDanger);
            control.classList.toggle('wb-row-action--login', isLogin);
            control.classList.toggle('wb-row-action--edit', isEdit);
            if (!isDanger && controlIndex === 0) control.classList.add('wb-row-action--primary');
            if (!label) {
              label = inferRowActionLabel(control, {
                isDanger: isDanger,
                isLogin: isLogin,
                isEdit: isEdit
              });
            }
            if (hadGenericLabel || !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
            if (hadGenericLabel || !control.title) control.title = label;
            if (hadGenericLabel || isGenericActionLabel(control.getAttribute('data-original-title'))) control.setAttribute('data-original-title', label);
            if (control.getAttribute('style') && /url\(/i.test(control.getAttribute('style'))) control.dataset.wbLegacyInlineIcon = 'true';
          });
        });
      });
      if (dataRowCount === 0 && wrapper && emptyStateSurface && emptyStateRow) {
        emptyStateSurface.classList.add('wb-empty-state--detached');
        wrapper.appendChild(emptyStateSurface);
        emptyStateRow.hidden = true;
        emptyStateRow.removeAttribute('role');
      }
      var paging = table.querySelector('.pagination');
      if (paging) {
        var pageLabel = document.body.dataset.workbenchPaginationPage || localized('Seite {page}', 'Page {page}');
        var summaryTemplate = document.body.dataset.workbenchPaginationSummary || localized('Seite {current} von {total}', 'Page {current} of {total}');
        var paginationNav = paging.closest('nav');
        var numberedLinks = Array.prototype.filter.call(paging.querySelectorAll('li > a, li > span'), function(control) {
          return /^\d+$/.test(control.textContent.trim());
        });
        var activeControl = paging.querySelector('li.active > a, li.active > span');
        var currentPage = activeControl && /^\d+$/.test(activeControl.textContent.trim()) ? Number(activeControl.textContent.trim()) : 1;
        var totalPages = numberedLinks.reduce(function(maximum, control) {
          return Math.max(maximum, Number(control.textContent.trim()));
        }, currentPage);
        paging.setAttribute('aria-label', paginationLabel);
        if (paginationNav) paginationNav.setAttribute('aria-label', paginationLabel);
        Array.prototype.forEach.call(paging.querySelectorAll(':scope > li'), function(item) {
          var control = item.querySelector(':scope > a, :scope > span');
          if (!control) return;
          var number = /^\d+$/.test(control.textContent.trim()) ? Number(control.textContent.trim()) : 0;
          if (item.classList.contains('active')) control.setAttribute('aria-current', 'page');
          if (item.classList.contains('disabled')) {
            item.setAttribute('aria-disabled', 'true');
            control.setAttribute('tabindex', '-1');
          }
          if (number) {
            item.classList.add('wb-pagination-page');
            control.setAttribute('aria-label', pageLabel.replace('{page}', number));
            if (number !== 1 && number !== totalPages && Math.abs(number - currentPage) > 1) item.classList.add('wb-pagination-page--peripheral');
          }
        });
        var pagingCell = paging.closest('td');
        var pagingRow = paging.closest('tr');
        if (footerBar) {
          footerBar.classList.add('wb-table-footer');
          footerBar.dataset.workbenchListFooter = 'true';
          footerBar.setAttribute('aria-label', paginationLabel);
          footerSummary.textContent = summaryTemplate.replace('{current}', currentPage).replace('{total}', totalPages);
          paginationSlot.hidden = false;
          paginationSlot.appendChild(paginationNav || paging);
          if (pagingRow && pagingRow.parentNode) pagingRow.parentNode.removeChild(pagingRow);
          if (pagingCell) {
            pagingCell.classList.remove('wb-table-pagination');
            pagingCell.removeAttribute('colspan');
            Array.prototype.forEach.call(pagingCell.querySelectorAll('.wb-table-pagination__summary'), function(oldSummary) {
              oldSummary.parentNode.removeChild(oldSummary);
            });
          }
        }
      }
    });
  }

  function decorateOperationalStates(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.panel-body, .tab-pane.active, .wb-content-card'), function(region) {
      if (region.querySelector('form, table, input, select, textarea, button, a, img, canvas, svg, .wb-empty-state')) return;
      if ((region.textContent || '').replace(/\s+/g, ' ').trim()) return;
      region.classList.add('wb-empty-region');
      var state = emptyStateNode('region', messages.empty_title || messages.empty, messages.empty_description || '');
      state.setAttribute('role', 'status');
      region.appendChild(state);
    });
  }

  function normalizePageSizeControls(host) {
    if (!host || !window.workbenchSelect) return;
    Array.prototype.forEach.call(host.querySelectorAll('select[name="search_limit"], select.search_limit, select.wb-page-size-select'), function(select) {
      window.workbenchSelect.enhance(select, { compact: true, search: false });
    });
  }

  function normalizeResidualLegacyFragments(host) {
    if (!host) return;

    Array.prototype.forEach.call(host.querySelectorAll('.panel, .well, .content-box, .box, .pnl_formsarea, .tab-content, .tab-pane'), function(surface) {
      if (surface.closest('#topnav-container, #sidebar, #workbench-mobile-navigation')) return;
      surface.classList.add('wb-owned-surface');
      if (surface.matches('.tab-content, .tab-pane')) surface.classList.add('wb-owned-surface--tabs');
      if (surface.matches('.panel, .well, .content-box, .box, .pnl_formsarea')) surface.classList.add('wb-owned-surface--card');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.dropdown-menu, .popover, .modal-content, .ui-datepicker, .ui-dialog, .select2-drop, .chosen-drop'), function(overlay) {
      if (overlay.closest('#topnav-container, #sidebar, #workbench-mobile-navigation')) return;
      overlay.classList.add('wb-owned-overlay');
      if (overlay.matches('.select2-drop, .chosen-drop')) overlay.classList.add('wb-owned-enhanced-select__panel');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.input-group, .input-append, .input-prepend, .btn-group, .btn-toolbar'), function(cluster) {
      if (cluster.closest('#topnav-container, #sidebar, #workbench-mobile-navigation, .wb-header-actions')) return;
      cluster.classList.add('wb-owned-control-cluster');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.table-responsive, .table-wrapper'), function(region) {
      region.classList.add('wb-owned-scroll-region');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-container, .select2-container-multi, .chosen-container, .chosen-container-single, .chosen-container-multi'), function(container) {
      if (container.closest('#topnav-container, #sidebar, #workbench-mobile-navigation')) return;
      container.classList.add('wb-owned-enhanced-select');
      Array.prototype.forEach.call(container.querySelectorAll('.select2-choice, .select2-choices, .chosen-single, .chosen-choices'), function(control) {
        control.classList.add('wb-owned-enhanced-select__control');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-chosen, .select2-search-choice, .chosen-single span, .chosen-choices li.search-choice'), function(value) {
        value.classList.add('wb-owned-enhanced-select__value');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-arrow, .chosen-single div'), function(arrow) {
        arrow.classList.add('wb-owned-enhanced-select__arrow');
      });
      Array.prototype.forEach.call(container.querySelectorAll('.select2-search input, .chosen-search input, .chosen-choices li.search-field input'), function(input) {
        input.classList.add('wb-owned-enhanced-select__search');
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-results, .chosen-results'), function(list) {
      list.classList.add('wb-owned-enhanced-select__results');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-result-label, .select2-results li, .chosen-results li'), function(option) {
      option.classList.add('wb-owned-enhanced-select__option');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.select2-highlighted, .chosen-results li.highlighted'), function(option) {
      option.classList.add('wb-owned-enhanced-select__option--active');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.help-block, .help-inline, .description, .hint, .text-muted, small, label, legend, .control-label'), function(textNode) {
      if (textNode.closest('#topnav-container, #sidebar, #workbench-mobile-navigation')) return;
      textNode.classList.add('wb-owned-readable-text');
    });

    Array.prototype.forEach.call(host.querySelectorAll('[style]'), function(node) {
      var style = node.getAttribute('style') || '';
      var scrubbed = scrubResidualInlineStyle(node, style);
      if (/(?:^|;)\s*(?:width|min-width|max-width)\s*:\s*(?:\d{3,}|1000|auto)/i.test(style)) {
        node.classList.add('wb-residual-inline-geometry');
      }
      if (/(?:^|;)\s*(?:color|background(?:-color)?)\s*:/i.test(style)) {
        node.classList.add('wb-residual-inline-colour');
      }
      if (/(?:^|;)\s*background(?:-color)?\s*:\s*(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(style)) {
        node.classList.add('wb-residual-bright-surface');
      }
      if (scrubbed) node.classList.add('wb-residual-inline-scrubbed');
    });

    Array.prototype.forEach.call(host.querySelectorAll('table.table, table.formtable'), function(table) {
      var wrapper = table.closest('.table-wrapper, .table-responsive, .wb-field-group--embedded-table');
      if (wrapper) return;
      var shell = document.createElement('div');
      shell.className = 'table-wrapper wb-table-wrapper--runtime';
      table.parentNode.insertBefore(shell, table);
      shell.appendChild(table);
    });

    Array.prototype.forEach.call(host.querySelectorAll('input[type="submit"], input[type="button"], button, a.btn, .btn'), function(control) {
      var label = (control.value || control.textContent || control.getAttribute('aria-label') || control.title || '').replace(/\s+/g, ' ').trim();
      if (label && !control.getAttribute('aria-label') && /^(?:\+|>|<|»|«|→|←)$/.test(label)) {
        control.setAttribute('aria-label', document.body.dataset.workbenchGenericAction || localized('Aktion ausführen', 'Perform action'));
      }
      if (/^(?:reset filters|filter zurücksetzen|filter zur\u00fccksetzen)$/i.test(label)) control.classList.add('wb-control--filter-reset');
      if (/^(?:show filters|filter anzeigen|filter einblenden)$/i.test(label)) control.classList.add('wb-control--filter-toggle');
    });

    Array.prototype.forEach.call(host.querySelectorAll('.pagination, .pager'), function(pagination) {
      pagination.classList.add('wb-pagination');
      var nav = pagination.closest('nav');
      if (nav && !nav.getAttribute('aria-label')) nav.setAttribute('aria-label', document.body.dataset.workbenchPagination || localized('Seitennavigation', 'Pagination'));
    });
  }

  function scrubResidualInlineStyle(node, style) {
    if (!node || !style || node.dataset.wbPreserveInlineStyle === 'true') return false;
    if (/^(?:canvas|svg|path|circle|rect|line|polyline|polygon|img|picture|source|video|meter|progress)$/i.test(node.tagName || '')) return false;
    if (node.closest('[data-workbench-preserve-style="true"], .wb-chart-card, .wb-sparkline, .wb-stat-visual, .wb-logo, #logo, .notification_text')) return false;
    if (node.closest('#topnav-container, #workbench-mobile-navigation, .wb-app-navigation, .wb-header-actions')) return false;

    var properties = [];
    var legacyPaint = /(?:^|;)\s*(?:color|background(?:-color)?|font(?:-family|-size)?|line-height)\s*:/i.test(style);
    var legacyGeometry = /(?:^|;)\s*(?:width|min-width|max-width)\s*:\s*(?:auto|100%|\d{3,}px|\d{2,}em|\d{3,})/i.test(style);
    if (legacyPaint) properties.push('color', 'background', 'background-color', 'font-family', 'font-size', 'line-height');
    if (legacyGeometry) properties.push('width', 'min-width', 'max-width');
    if (!properties.length) return false;

    node.dataset.wbOriginalInlineStyle = node.dataset.wbOriginalInlineStyle || style;
    properties.forEach(function(property) {
      try { node.style.removeProperty(property); } catch (error) {}
    });
    if (!node.getAttribute('style')) node.removeAttribute('style');
    return true;
  }

  function runEnhancementStep(label, callback) {
    try {
      callback();
    } catch (error) {
      if (window.console && console.warn) console.warn('Workbench enhancement skipped: ' + label, error);
      var api = runtime();
      if (api && api.reportError) api.reportError('Workbench enhancement skipped: ' + label);
    }
  }

  function enhanceLoadedContent(host, pageName, params, context) {
    if (!host) return;
    runEnhancementStep('localization', function() {
      if (typeof window.workbenchLocalize === 'function') window.workbenchLocalize(host);
    });
    runEnhancementStep('page context', function() { decoratePageContext(host, pageName); });
    runEnhancementStep('page chrome', function() { decoratePageChrome(host, pageName); });
    runEnhancementStep('information architecture', function() { decorateInformationArchitecture(host); });
    runEnhancementStep('legacy fragments before controls', function() { normalizeResidualLegacyFragments(host); });
    runEnhancementStep('table filters', function() { decorateTableFilters(host); });
    runEnhancementStep('page size controls', function() { normalizePageSizeControls(host); });
    runEnhancementStep('list command bar', function() { decorateListCommandBar(host); });
    runEnhancementStep('data tables', function() { decorateDataTables(host); });
    runEnhancementStep('forms', function() { decorateForms(host, context); });
    runEnhancementStep('action controls', function() { decorateActionControls(document); });
    runEnhancementStep('operational states', function() { decorateOperationalStates(host); });
    runEnhancementStep('legacy fragments after controls', function() { normalizeResidualLegacyFragments(host); });
    runEnhancementStep('icons', function() { if (window.workbenchIcons) window.workbenchIcons.render(host); });
    runEnhancementStep('navigation shell', function() {
      if (!window.workbenchNavigation) return;
      window.workbenchNavigation.syncShellLayout();
      window.workbenchNavigation.render();
      if (window.workbenchNavigation.syncActiveNavigationState) window.workbenchNavigation.syncActiveNavigationState(pageName || '');
    });
    runEnhancementStep('dashboard layout', function() { if (window.workbenchDashboardLayout) window.workbenchDashboardLayout.enhance(); });
    runEnhancementStep('dashboard metrics', function() { if (window.workbenchDashboardMetrics) window.workbenchDashboardMetrics.enhance(host); });
    runEnhancementStep('statistics', function() { if (window.workbenchStatistics) window.workbenchStatistics.enhance(pageName); });
    runEnhancementStep('monitoring', function() { if (window.workbenchMonitoring) window.workbenchMonitoring.enhance(host); });
    if (params !== undefined) {
      runEnhancementStep('after content hooks', function() {
        var api = runtime();
        if (api && typeof api.onAfterContentLoad === 'function') api.onAfterContentLoad(pageName, params || null);
      });
    }
  }

  function schedulePostRenderEnhancement(host, pageName) {
    if (!host || host.dataset.wbPostRenderScheduled === 'true') return;
    host.dataset.wbPostRenderScheduled = 'true';
    var run = function() {
      host.dataset.wbPostRenderScheduled = 'false';
      if (!document.contains(host)) return;
      enhanceLoadedContent(host, pageName);
      announceContentReady(host, pageName || '', { source: 'post-render' });
      announceNavigationComplete(pageName || '');
    };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function() { window.requestAnimationFrame(run); });
    } else {
      window.setTimeout(run, 50);
    }
  }

  function makeFormSummaryItem(label, value, modifier) {
    var item = document.createElement('span');
    item.className = 'wb-form-section-summary__item' + (modifier ? ' wb-form-section-summary__item--' + modifier : '');
    item.setAttribute('aria-label', label + ': ' + value);

    var count = document.createElement('strong');
    count.textContent = String(value);

    var caption = document.createElement('span');
    caption.textContent = label;

    item.appendChild(count);
    item.appendChild(caption);
    return item;
  }

  function summarizeFormSections(scope) {
    if (!scope) return;
    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
      var groups = Array.prototype.slice.call(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)'));
      if (!groups.length) return;

      var controls = Array.prototype.slice.call(section.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      var required = groups.filter(function(group) {
        return group.classList.contains('wb-field-group--required') ||
          !!group.querySelector('[required], [aria-required="true"], .required, .req, label.required');
      }).length;
      var invalid = groups.filter(function(group) {
        return group.classList.contains('has-error') ||
          group.getAttribute('aria-invalid') === 'true' ||
          !!group.querySelector('[aria-invalid="true"], .has-error, .text-danger, .alert-danger, .error, .invalid-feedback');
      }).length;
      var disabled = controls.filter(function(control) {
        return control.disabled || (control.readOnly && control.type !== 'password');
      }).length;

      section.setAttribute('data-wb-section-fields', String(groups.length));
      section.setAttribute('data-wb-section-required', String(required));
      section.setAttribute('data-wb-section-invalid', String(invalid));
      section.setAttribute('data-wb-section-locked', String(disabled));
      section.classList.toggle('wb-form-section--has-errors', invalid > 0);
      section.classList.toggle('wb-form-section--has-required', required > 0);

      var summary = section.querySelector(':scope > .wb-form-section-summary');
      if (!summary) {
        summary = document.createElement('div');
        summary.className = 'wb-form-section-summary';
        summary.setAttribute('aria-label', document.body.dataset.workbenchFormSectionSummary || localized('Zusammenfassung des Formularabschnitts', 'Form section summary'));
        var heading = section.querySelector(':scope > .wb-form-section-heading, :scope > legend, :scope > .fieldset-legend');
        if (heading && heading.parentNode === section) {
          if (heading.nextSibling) section.insertBefore(summary, heading.nextSibling);
          else section.appendChild(summary);
        } else {
          section.insertBefore(summary, section.firstChild);
        }
      }

      while (summary.firstChild) summary.removeChild(summary.firstChild);
      if (required > 0) summary.appendChild(makeFormSummaryItem('Pflicht', required, 'required'));
      if (invalid > 0) summary.appendChild(makeFormSummaryItem('Prüfen', invalid, 'invalid'));
      if (disabled > 0) summary.appendChild(makeFormSummaryItem('Gesperrt', disabled, 'locked'));
      summary.hidden = !summary.childElementCount;
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-panel'), function(panel) {
      var count = panel.getAttribute('data-wb-panel-fields') || '0';
      var invalid = panel.querySelectorAll('.has-error, [aria-invalid="true"], .text-danger, .alert-danger, .error').length;
      var trigger = panel.querySelector('.wb-form-panel-trigger');
      panel.classList.toggle('wb-form-panel--has-errors', invalid > 0);
      panel.setAttribute('data-wb-panel-invalid', String(invalid));
      if (trigger) {
        trigger.setAttribute('data-wb-panel-fields', count);
        trigger.setAttribute('data-wb-panel-invalid', String(invalid));
        trigger.classList.toggle('wb-form-panel-trigger--has-errors', invalid > 0);
      }
    });
  }

  function stableFormId(prefix, index) {
    return prefix + '-' + String(index).replace(/[^a-z0-9_-]/gi, '-');
  }

  function labelText(label) {
    return label ? (label.textContent || '').replace(/\s+/g, ' ').replace(/\s*:\s*$/, '').trim() : '';
  }

  function hasRequiredCue(group, label, controls) {
    if (label && (label.classList.contains('required') || /\*/.test(label.textContent || ''))) return true;
    if (group.querySelector('.required, .req, [data-required="true"]')) return true;
    return controls.some(function(control) {
      return control.required || control.getAttribute('aria-required') === 'true';
    });
  }

  function classifyFieldGroup(group, label, controls) {
    var kinds = [];
    controls.forEach(function(control) {
      var tag = control.tagName.toLowerCase();
      var type = (control.getAttribute('type') || tag).toLowerCase();
      var controlName = String(control.getAttribute('name') || '').toLowerCase();
      var controlId = String(control.id || '').toLowerCase();
      var controlValue = String(control.getAttribute('value') || '').toLowerCase();
      kinds.push(type);
      control.classList.add('wb-field-control');
      control.setAttribute('data-wb-control-kind', type);
      if (label && control.id && !label.getAttribute('for')) label.setAttribute('for', control.id);
      if (control.disabled) group.classList.add('wb-field-group--disabled');
      if (control.readOnly) group.classList.add('wb-field-group--readonly');
      if (type === 'checkbox' || type === 'radio') group.classList.add('wb-field-group--choice');
      if (type === 'password') group.classList.add('wb-field-group--secret');
      if (type === 'file') group.classList.add('wb-field-group--file');
      if (type === 'color') group.classList.add('wb-field-group--color');
      if (type === 'number') group.classList.add('wb-field-group--number');
      if (tag === 'select') group.classList.add('wb-field-group--select');
      if (tag === 'textarea') group.classList.add('wb-field-group--textarea');
      if (/^smtp_(user|pass)$/.test(controlName) || /^smtp_(user|pass)$/.test(controlId)) group.classList.add('wb-field-group--mail-credential');
      if (/^limit_/.test(controlName) || /^limit_/.test(controlId)) group.classList.add('wb-field-group--limit-value');
      if (/(_path|_dir|config_dir|conf_dir|root_dir|log_dir|vhost_conf_dir)$/.test(controlName) || /(_path|_dir|config_dir|conf_dir|root_dir|log_dir|vhost_conf_dir)$/.test(controlId) || (type === 'text' && controlValue.indexOf('/') !== -1)) group.classList.add('wb-field-group--path-value');
      if (/(ssl|cert|csr|key|ca_bundle|private_key)/.test(controlName) || /(ssl|cert|csr|key|ca_bundle|private_key)/.test(controlId)) group.classList.add('wb-field-group--certificate');
      if (tag === 'textarea' && /(config|directive|snippet|conf|custom|template)/.test(controlName + ' ' + controlId)) group.classList.add('wb-field-group--technical-text');
      if (control.matches('[readonly], [disabled]')) control.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
    });
    if (group.querySelector('.select2-container, .select2-container-multi')) group.classList.add('wb-field-group--enhanced-select');
    if (controls.length === 1 && kinds[0] === 'checkbox') {
      group.classList.add('wb-field-group--boolean');
      controls[0].setAttribute('role', 'switch');
      controls[0].setAttribute('aria-checked', controls[0].checked ? 'true' : 'false');
      if (!controls[0].getAttribute('data-wb-boolean-bound')) {
        controls[0].setAttribute('data-wb-boolean-bound', 'true');
        controls[0].addEventListener('change', function() {
          controls[0].setAttribute('aria-checked', controls[0].checked ? 'true' : 'false');
        });
      }
    }
    if (group.querySelector('.input-group, .input-append, .input-prepend')) group.classList.add('wb-field-group--compound');
    if (group.querySelector('button, .btn, input[type="button"], input[type="submit"]')) group.classList.add('wb-field-group--with-action');
        if (group.classList.contains('has-error') || group.querySelector('[aria-invalid="true"], .text-danger, .invalid-feedback, .confirmpassworderror')) group.classList.add('wb-field-group--invalid');
        if (group.classList.contains('has-warning') || group.querySelector('.text-warning, .alert-warning')) group.classList.add('wb-field-group--warning');
        if (group.classList.contains('has-success') || group.querySelector('.text-success, .confirmpasswordok')) group.classList.add('wb-field-group--success');
        if (group.querySelector('.alert, .alert-info, .alert-warning, .alert-danger, .alert-success, .box_error, .box_warning, .box_success')) group.classList.add('wb-field-group--notice');
        if (group.querySelector('.help-block, .help-inline, .description, .hint, small, .form-text')) group.classList.add('wb-field-group--with-help');
        if (group.querySelector('.form-control-static, output, code, pre')) group.classList.add('wb-field-group--static-value');
        if (group.querySelector('table, .table-wrapper, .table-responsive')) group.classList.add('wb-field-group--embedded-table');
    if (kinds.length) group.setAttribute('data-wb-field-kinds', kinds.join(' '));
  }

  function inferSectionTitle(section, scope) {
    var heading = section.querySelector(':scope > legend, :scope > .fieldset-legend, :scope > .panel-heading, :scope > h2, :scope > h3, :scope > h4');
    if (heading && heading.textContent.trim()) return heading.textContent.replace(/\s+/g, ' ').trim();
    if (section.id && scope) {
      var tab = scope.querySelector('.content-tab-wrapper > .wb-form-tabs a[href="#' + section.id.replace(/"/g, '\\"') + '"]');
      if (tab && tab.textContent.trim()) return tab.textContent.replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  function finalizeFormSections(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
      var groups = Array.prototype.slice.call(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)'));
      var controls = section.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
      var notices = section.querySelectorAll('.alert, .box_error, .box_warning, .box_success, .wb-field-group--notice').length;
      var title = inferSectionTitle(section, scope);
      section.classList.toggle('wb-form-section--empty', groups.length === 0 && controls === 0);
      section.classList.toggle('wb-form-section--compact', groups.length > 0 && groups.length <= 3);
      section.classList.toggle('wb-form-section--large', groups.length > 12);
      section.classList.toggle('wb-form-section--notice-heavy', notices > 0);
      section.setAttribute('data-wb-section-controls', String(controls));
      section.setAttribute('data-wb-section-notices', String(notices));
      if (title) section.setAttribute('data-wb-section-title', title);
    });
  }

  function wireFormHelp(group, controls, formIndex, groupIndex) {
    var helps = Array.prototype.slice.call(group.querySelectorAll('.help-block, .form-text, .formHint, .hint, .description, small'));
    helps.forEach(function(help, helpIndex) {
      help.classList.add('wb-field-help');
      if (!help.id) help.id = stableFormId('wb-field-help-' + formIndex + '-' + groupIndex, helpIndex + 1);
    });
    if (!helps.length || controls.length !== 1) return;
    var ids = helps.map(function(help) { return help.id; }).filter(Boolean).join(' ');
    if (ids && !controls[0].getAttribute('aria-describedby')) controls[0].setAttribute('aria-describedby', ids);
  }

  function decorateFormActions(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.right, .form-actions, .buttonHolder'), function(actions) {
      if (!actions.querySelector('.btn, button, input[type="button"], input[type="submit"]')) return;
      actions.classList.add('wb-form-actions');
      actions.setAttribute('role', 'group');
      actions.setAttribute('aria-label', document.body.dataset.workbenchFormActions || localized('Formularaktionen', 'Form actions'));
      var hasDangerAction = false;
      Array.prototype.forEach.call(actions.querySelectorAll('.btn, button, input[type="button"], input[type="submit"], a.formbutton-success, a.formbutton-default, a.formbutton-danger'), function(action) {
        var tone = 'secondary';
        var actionText = (action.textContent || action.value || action.getAttribute('title') || '').toLowerCase();
        if (action.classList.contains('formbutton-danger') || action.classList.contains('btn-danger') || /delete|remove|löschen|loeschen|storno|cancel invoice/.test(actionText)) tone = 'danger';
        else if (action.classList.contains('formbutton-success') || action.classList.contains('btn-success') || action.classList.contains('btn-primary') || /save|speichern|create|erstellen|hinzufügen|hinzufuegen|import|upload/.test(actionText)) tone = 'primary';
        if (tone === 'danger') hasDangerAction = true;
        action.classList.add('wb-form-action', 'wb-form-action--' + tone);
        action.setAttribute('data-wb-form-action-tone', tone);
      });
      actions.classList.toggle('wb-form-actions--has-danger', hasDangerAction);
    });
  }

  function actionControlText(control) {
    return (control.textContent || control.value || control.getAttribute('aria-label') || control.getAttribute('title') || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function inferActionControlTone(control) {
    var explicitTone = String(control.getAttribute('data-wb-action-tone') || '').toLowerCase();
    if (['primary', 'secondary', 'danger', 'warning', 'info'].indexOf(explicitTone) !== -1) return explicitTone;
    if (control.classList.contains('wb-dns-zone-actions__secondary')) return 'secondary';
    var textValue = actionControlText(control);
    var href = String(control.getAttribute('href') || control.getAttribute('data-capp') || control.getAttribute('data-form-action') || '').toLowerCase();
    var className = String(control.className || '').toLowerCase();
    var signal = [textValue, href, className].join(' ');
    if (
      control.classList.contains('wb-row-action--danger') ||
      control.classList.contains('wb-form-action--danger') ||
      control.classList.contains('formbutton-danger') ||
      control.classList.contains('btn-danger') ||
      control.hasAttribute('data-confirm-action') ||
      /delete|remove|drop|purge|destroy|disable|löschen|loeschen|entfernen|storno|gutschrift|cancel invoice|abbrechen rechnung/.test(signal)
    ) return 'danger';
    if (
      control.classList.contains('btn-warning') ||
      /warning|warnung|reset|zurücksetzen|zuruecksetzen|restart|reload|erneut/.test(signal)
    ) return 'warning';
    if (
      control.classList.contains('btn-info') ||
      /info|details|anzeigen|show|preview|vorschau|prüfen|pruefen|testen/.test(signal)
    ) return 'info';
    if (
      control.classList.contains('wb-row-action--primary') ||
      control.classList.contains('wb-form-action--primary') ||
      control.classList.contains('formbutton-success') ||
      control.classList.contains('btn-success') ||
      control.classList.contains('btn-primary') ||
      control.hasAttribute('data-submit-form') ||
      control.hasAttribute('data-form-upload') ||
      /save|speichern|create|erstellen|hinzufügen|hinzufuegen|add|neu|new|import|upload|start|connect|verbinden|login|anmelden|apply|anwenden|generate|erzeugen/.test(signal)
    ) return 'primary';
    return 'secondary';
  }

  function decorateActionControls(host) {
    if (!host) return;
    var controls = host.querySelectorAll('#pageContent .btn, #pageContent button:not(.close):not(.wb-dialog__backdrop), #pageContent input[type="button"], #pageContent input[type="submit"], #pageContent a.formbutton-success, #pageContent a.formbutton-default, #pageContent a.formbutton-danger');
    Array.prototype.forEach.call(controls, function(control) {
      if (control.closest('.select2-container, .chosen-container, .mce-container, .mce-tinymce')) return;
      var tone = inferActionControlTone(control);
      var visibleText = actionControlText(control);
      var iconOnly = control.classList.contains('formbutton-narrow') ||
        control.classList.contains('btn-icon') ||
        control.classList.contains('wb-icon-button') ||
        (!visibleText && Boolean(control.querySelector('span, i, svg, img')));
      control.classList.add('wb-action-control', 'wb-action-control--' + tone);
      control.setAttribute('data-wb-action-tone', tone);
      control.classList.toggle('wb-action-control--icon', iconOnly);
      if (!control.getAttribute('aria-label') && !visibleText) {
        control.setAttribute('aria-label', control.getAttribute('title') || document.body.dataset.workbenchTableActions || localized('Aktion', 'Action'));
      }
    });
  }

  function finalizeFormControls(scope) {
    if (!scope) return;
    scope.dataset.workbenchFormFinalized = 'true';

    Array.prototype.forEach.call(scope.querySelectorAll('.input-group, .input-append, .input-prepend'), function(deck) {
      deck.classList.add('wb-form-control-deck');
      Array.prototype.forEach.call(deck.querySelectorAll('.input-group-addon, .add-on, .input-group-btn, .btn, button, input[type="button"], input[type="submit"]'), function(part) {
        part.classList.add('wb-form-control-deck__item');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--file'), function(group) {
      var body = group.querySelector('.wb-field-body') || group;
      body.classList.add('wb-upload-dropzone');
      Array.prototype.forEach.call(group.querySelectorAll('input[type="file"]'), function(input) {
        input.classList.add('wb-upload-dropzone__input');
        input.setAttribute('data-wb-file-ready', 'true');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--color'), function(group) {
      var body = group.querySelector('.wb-field-body') || group;
      body.classList.add('wb-color-control-deck');
      Array.prototype.forEach.call(group.querySelectorAll('input[type="color"]'), function(input) {
        input.classList.add('wb-color-control-deck__swatch');
      });
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--technical-text textarea, textarea[name*="config"], textarea[id*="config"], textarea[name*="directive"], textarea[id*="directive"], textarea[name*="snippet"], textarea[id*="snippet"], textarea[name*="template"], textarea[id*="template"]'), function(textarea) {
      textarea.classList.add('wb-code-input');
      textarea.setAttribute('spellcheck', 'false');
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-actions .btn, .wb-form-actions button, .wb-form-actions input[type="button"], .wb-form-actions input[type="submit"], .wb-form-actions a.formbutton-success, .wb-form-actions a.formbutton-default, .wb-form-actions a.formbutton-danger'), function(action) {
      var tone = action.getAttribute('data-wb-form-action-tone') || 'secondary';
      action.classList.add('wb-form-action-control', 'wb-form-action-control--' + tone);
    });

    Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group'), function(group) {
      var body = group.querySelector('.wb-field-body');
      if (!body) return;
      if (group.classList.contains('wb-field-group--compound')) body.classList.add('wb-field-body--compound');
      if (group.classList.contains('wb-field-group--select')) body.classList.add('wb-field-body--select');
      if (group.classList.contains('wb-field-group--textarea')) body.classList.add('wb-field-body--textarea');
      if (group.classList.contains('wb-field-group--secret')) body.classList.add('wb-field-body--secret');
      if (group.classList.contains('wb-field-group--readonly') || group.classList.contains('wb-field-group--disabled')) body.classList.add('wb-field-body--locked');
    });

    var strengthBar = scope.querySelector('#passBar');
    var strengthInput = scope.querySelector('[data-workbench-password-strength="true"]');
    if (strengthBar && strengthInput) {
      var strengthGroup = strengthBar.closest('.wb-field-group');
      var strengthText = scope.querySelector('#passText');
      var syncStrengthVisibility = function() {
        var hasPassword = String(strengthInput.value || '').length > 0;
        if (strengthGroup) {
          strengthGroup.hidden = !hasPassword;
          strengthGroup.classList.add('wb-field-group--password-strength');
        }
        strengthBar.setAttribute('role', 'progressbar');
        strengthBar.setAttribute('aria-valuemin', '0');
        strengthBar.setAttribute('aria-valuemax', '100');
        if (strengthText) strengthText.setAttribute('aria-live', 'polite');
      };
      if (!strengthInput.getAttribute('data-wb-strength-visibility-bound')) {
        strengthInput.setAttribute('data-wb-strength-visibility-bound', 'true');
        strengthInput.addEventListener('input', syncStrengthVisibility);
        strengthInput.addEventListener('change', syncStrengthVisibility);
      }
      syncStrengthVisibility();
    }
  }

  function decorateForms(host, context) {
    if (!host) return;
    var forms = Array.prototype.slice.call(host.querySelectorAll('form#pageForm, form.form-horizontal'));
    var shellForm = host.closest('form#pageForm, form.form-horizontal');
    if (shellForm && forms.indexOf(shellForm) === -1) forms.push(shellForm);
    forms.forEach(function(form) {
      form.classList.add('wb-modern-form');
      var fieldCount = 0;
      var scope = form === shellForm ? host : form;
      Array.prototype.forEach.call(scope.querySelectorAll('.tab-pane, fieldset, .pnl_formsarea'), function(section, sectionIndex) {
        section.classList.add('wb-form-section');
        section.setAttribute('data-wb-section-index', String(sectionIndex + 1));
        if (section.tagName === 'FIELDSET') section.classList.add('wb-form-fieldset');
        var legend = section.querySelector(':scope > legend, :scope > .fieldset-legend');
        if (legend) legend.classList.add('wb-form-section-heading');
      });
      // WP-925: also decorate native .wb-field-group templates (Bootstrap-free forms),
      // not only legacy Bootstrap .form-group. Static NodeList + idempotent add =>
      // no double processing; legacy .form-group templates behave exactly as before.
      Array.prototype.forEach.call(scope.querySelectorAll('.form-group, .wb-field-group'), function(group, groupIndex) {
        group.classList.add('wb-field-group');
        var label = group.querySelector(':scope > label, :scope > .control-label');
        var controls = Array.prototype.slice.call(group.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        if (label) {
          label.classList.add('wb-field-label');
          var readableLabel = labelText(label);
          if (readableLabel) group.setAttribute('data-wb-field-label', readableLabel);
        }
        if (!label) group.classList.add('wb-field-group--unlabelled');
        if (!controls.length) group.classList.add('wb-field-group--content');
        if (!controls.length && !group.textContent.trim() && !group.querySelector('button, a, [role], [id]:not(input)')) {
          group.classList.add('wb-field-group--empty');
          group.setAttribute('aria-hidden', 'true');
        }
        if (controls.length === 1) group.classList.add('wb-field-group--single');
        if (hasRequiredCue(group, label, controls)) group.classList.add('wb-field-group--required');
        classifyFieldGroup(group, label, controls);
        var fieldBodies = [];
        Array.prototype.forEach.call(group.children, function(child) {
          if (child === label) return;
          if (child.matches('[class*="col-"], .controls, .input-group, .input-append, .input-prepend, .checkbox, .radio, .select2-container, .select2-container-multi')) {
            child.classList.add('wb-field-body');
            fieldBodies.push(child);
          }
        });
        if (!fieldBodies.length && controls.length) {
          controls.forEach(function(control) {
            var parent = control.parentElement;
            if (parent && parent !== group && parent.parentElement === group) {
              parent.classList.add('wb-field-body');
              if (fieldBodies.indexOf(parent) === -1) fieldBodies.push(parent);
            }
          });
        }
        if (fieldBodies.length > 1) group.classList.add('wb-field-group--multi-body');
        fieldBodies.forEach(function(body, bodyIndex) {
          body.setAttribute('data-wb-field-body-index', String(bodyIndex + 1));
          if (!body.querySelector('input:not([type="hidden"]), select, textarea, button, a') && body.textContent.trim()) {
            body.classList.add('wb-field-affix');
            group.classList.add('wb-field-group--with-affix');
          }
        });
        Array.prototype.forEach.call(controls, function(control) {
          fieldCount += 1;
          if (group.classList.contains('wb-field-group--required')) control.setAttribute('aria-required', 'true');
        });
        wireFormHelp(group, controls, forms.indexOf(form) + 1, groupIndex + 1);
      });
      form.setAttribute('data-workbench-field-count', String(fieldCount));
      form.classList.toggle('wb-modern-form--dense', fieldCount > 12);
      form.classList.toggle('wb-modern-form--long', fieldCount > 20);
      form.classList.toggle('wb-modern-form--huge', fieldCount > 38);
      var tabCount = scope.querySelectorAll('.content-tab-wrapper > .wb-form-tabs > li').length;
      form.classList.toggle('wb-modern-form--tabbed', tabCount > 1);
      form.setAttribute('data-workbench-tab-count', String(tabCount));
      form.classList.toggle('wb-modern-form--has-upload', !!scope.querySelector('.wb-field-group--file'));
      form.classList.toggle('wb-modern-form--has-secrets', !!scope.querySelector('.wb-field-group--secret'));
      form.classList.toggle('wb-modern-form--has-choices', !!scope.querySelector('.wb-field-group--choice'));
      Array.prototype.forEach.call(scope.querySelectorAll('.wb-form-section'), function(section) {
        section.setAttribute('data-wb-section-fields', String(section.querySelectorAll('.wb-field-group:not(.wb-field-group--empty)').length));
      });
      finalizeFormSections(scope);
      Array.prototype.forEach.call(scope.querySelectorAll('.panel-group, .wb-limit-sections, .wb-form-sections'), function(accordion) {
        accordion.classList.add('wb-form-accordion');
        Array.prototype.forEach.call(accordion.querySelectorAll(':scope > .panel, :scope > .wb-limit-section, :scope > .wb-form-section'), function(panel) {
          panel.classList.add('wb-form-panel');
          var body = panel.querySelector('.panel-body, .panel-collapse, .wb-limit-section__content, .wb-limit-section__body, .wb-form-section__content, .wb-form-section__body');
          var heading = panel.querySelector(':scope > .panel-heading, :scope > .wb-limit-section__header, :scope > .wb-form-section__header');
          var trigger = heading && heading.querySelector('a[href^="#"], button[data-target]');
          var count = body ? body.querySelectorAll('.form-group').length : 0;
          panel.setAttribute('data-wb-panel-fields', String(count));
          if (heading) heading.classList.add('wb-form-panel-heading');
          if (trigger) {
            trigger.classList.add('wb-form-panel-trigger');
            var target = trigger.getAttribute('href') || trigger.getAttribute('data-target') || '';
            if (target.charAt(0) === '#') trigger.setAttribute('aria-controls', target.slice(1));
            trigger.setAttribute('aria-expanded', trigger.classList.contains('collapsed') ? 'false' : 'true');
            if (!trigger.querySelector('.wb-form-panel-count')) {
              var counter = document.createElement('span');
              counter.className = 'wb-form-panel-count';
              counter.textContent = String(count);
              counter.setAttribute('aria-hidden', 'true');
              trigger.appendChild(counter);
            }
          }
        });
        if (accordion.dataset.workbenchAccordionState !== 'true') {
          accordion.dataset.workbenchAccordionState = 'true';
          var synchronizeAccordionState = function(event) {
            var targetId = event.target && event.target.id;
            if (!targetId) return;
            Array.prototype.forEach.call(accordion.querySelectorAll('.wb-form-panel-trigger'), function(trigger) {
              var target = trigger.getAttribute('href') || trigger.getAttribute('data-target') || '';
              if (target === '#' + targetId) trigger.setAttribute('aria-expanded', event.type === 'workbench:collapse-open' ? 'true' : 'false');
            });
          };
          accordion.addEventListener('workbench:collapse-open', synchronizeAccordionState);
          accordion.addEventListener('workbench:collapse-close', synchronizeAccordionState);
        }
      });
      summarizeFormSections(scope);
      decorateFormActions(scope);
      finalizeFormControls(scope);

      function updateConditionalRows() {
        Array.prototype.forEach.call(scope.querySelectorAll('.wb-field-group--unlabelled.wb-field-group--content'), function(group) {
          var conditionalNodes = Array.prototype.slice.call(group.querySelectorAll('[style*="display"], [hidden]'));
          if (!conditionalNodes.length) return;
          var visible = conditionalNodes.some(function(node) {
            if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
            var style = window.getComputedStyle ? window.getComputedStyle(node) : node.style;
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          group.classList.toggle('wb-field-group--dormant', !visible);
          group.setAttribute('aria-hidden', visible ? 'false' : 'true');
        });
      }
      updateConditionalRows();
      if (form._workbenchConditionalObserver) form._workbenchConditionalObserver.disconnect();
      if (window.MutationObserver) {
        form._workbenchConditionalObserver = new MutationObserver(updateConditionalRows);
        form._workbenchConditionalObserver.observe(scope, { subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'aria-hidden'] });
      }
    });
    if (window.workbenchAccessibility) window.workbenchAccessibility.enhance(host);
    if (window.workbenchValidation) window.workbenchValidation.enhance(host, {
      focus: Boolean(context && context.focus === true)
    });
    if (window.workbenchFormState) window.workbenchFormState.enhance();
    if (window.workbenchFeedback) window.workbenchFeedback.enhance(host);
    if (window.workbenchMessageAcknowledgement) window.workbenchMessageAcknowledgement.enhance(host);
  }

  document.addEventListener('click', function(event) {
    var trigger = event.target.closest('#main-navigation a[data-workbench-module], #workbench-mobile-navigation a[data-workbench-module], #main-navigation a[data-capp], #workbench-mobile-navigation a[data-capp]');
    if (!trigger) return;
    var moduleName = moduleAttribute(trigger);
    if (!moduleName) return;
    var api = runtime();
    if (api) api.workbenchActiveModule = moduleName;
    document.querySelectorAll('#main-navigation a[aria-current="page"]').forEach(function(link) { link.removeAttribute('aria-current'); });
    document.querySelectorAll('#main-navigation a[data-workbench-module], #main-navigation a[data-capp]').forEach(function(link) {
      if (moduleAttribute(link) === moduleName) link.setAttribute('aria-current', 'page');
    });
  });

  function errorDiagnostic(error, pageName) {
    var parts = [];
    if (pageName) parts.push('page=' + pageName);
    if (error && error.name) parts.push('name=' + error.name);
    if (error && error.status !== undefined) parts.push('status=' + error.status);
    if (error && error.message) parts.push('message=' + error.message);
    if (error && error.url) parts.push('url=' + error.url);
    return parts.join(' | ');
  }

  function contentStateNode(kind, token, diagnostic, retryArgs) {
    var state;
    if (kind === 'loading') {
      state = element('div', 'wb-content-state wb-content-state--loading');
      state.setAttribute('role', 'status');
      state.appendChild(iconElement('wb-content-state__spinner'));
      state.appendChild(element('strong', 'wb-content-state__title', messages.loading));
      state.appendChild(element('span', 'wb-content-state__description', messages.loading_description || ''));
      var skeleton = iconElement('wb-content-state__skeleton');
      skeleton.appendChild(document.createElement('i'));
      skeleton.appendChild(document.createElement('i'));
      skeleton.appendChild(document.createElement('i'));
      state.appendChild(skeleton);
      return state;
    }
    if (kind === 'empty') {
      state = element('div', 'wb-content-state wb-content-state--empty');
      state.setAttribute('role', 'status');
      state.appendChild(iconElement('wb-content-state__icon'));
      state.appendChild(element('strong', 'wb-content-state__title', messages.empty_title || messages.empty));
      state.appendChild(element('span', 'wb-content-state__description', messages.empty_description || ''));
      return state;
    }
    state = element('div', 'wb-content-state wb-content-state--error');
    state.setAttribute('role', 'alert');
    state.appendChild(iconElement('wb-content-state__icon', '!'));
    state.appendChild(element('strong', 'wb-content-state__title', messages.error));
    state.appendChild(element('span', 'wb-content-state__description', messages.error_description || ''));
    var detail = element('span', 'wb-visually-hidden', diagnostic || '');
    detail.setAttribute('data-workbench-error-detail', 'true');
    state.appendChild(detail);
    if (token) {
      var retry = element('button', 'wb-content-state__retry', messages.retry);
      retry.type = 'button';
      retry.setAttribute('data-workbench-retry', token);
      retry.setAttribute('data-workbench-retry-owner', '94');
      retry.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        retryContentRequest(token, retryArgs);
      });
      state.appendChild(retry);
    }
    return state;
  }

  function retryContentRequest(token, explicitArgs) {
    var args = explicitArgs || retryRequests[token];
    delete retryRequests[token];
    // Retry the content-state facade itself. The runtime app's compatibility
    // loadContent method delegates to navigateTo and would bypass the retry
    // token lifecycle installed below.
    if (legacy && typeof legacy.loadContent === 'function' && args) {
      legacy.loadContent.apply(legacy, args);
    }
  }

  function renderContentState(host, kind, token, diagnostic, retryArgs) {
    if (!host) return;
    clearNode(host);
    host.appendChild(contentStateNode(kind, token, diagnostic, retryArgs));
  }

  function clearScheduledContentState() {
    if (contentStateTimer === null) return;
    window.clearTimeout(contentStateTimer);
    contentStateTimer = null;
  }

  function scheduleLoadingContentState(host, token) {
    clearScheduledContentState();
    contentStateTimer = window.setTimeout(function() {
      contentStateTimer = null;
      if (token !== sequence || !host || host.getAttribute('aria-busy') !== 'true') return;
      renderContentState(host, 'loading');
    }, contentStateDelay);
  }

  function activateFragmentScripts(host) {
    if (!host || !host.querySelectorAll) return 0;
    var activated = 0;
    Array.prototype.slice.call(host.querySelectorAll('script')).forEach(function(original) {
      var source = original.getAttribute('src');
      if (source) {
        var resolved;
        try { resolved = new URL(source, document.baseURI); } catch (error) { resolved = null; }
        if (!resolved || resolved.origin !== window.location.origin) {
          original.remove();
          return;
        }
      }
      var replacement = document.createElement('script');
      Array.prototype.forEach.call(original.attributes, function(attribute) {
        replacement.setAttribute(attribute.name, attribute.value);
      });
      if (source) replacement.async = false;
      else replacement.textContent = original.textContent || '';
      original.parentNode.replaceChild(replacement, original);
      activated += 1;
    });
    return activated;
  }

  legacy.activateFragmentScripts = activateFragmentScripts;

  legacy.loadContent = function(pagename) {
    var api = runtime();
    var args = arguments;
    var token = ++sequence;
    var host = document.getElementById('pageContent');
    var params = arguments[1];
    retryRequests[token] = Array.prototype.slice.call(args);
    if (!api || !host) return null;

    clearScheduledContentState();
    if (contentRequest && contentRequest.readyState !== 4) contentRequest.abort();
    if (window.workbenchMonitoring) window.workbenchMonitoring.destroy(host);
    host.setAttribute('aria-busy', 'true');
    scheduleLoadingContentState(host, token);
    var request = requestHtml(pagename, params || null, 30000);
    contentRequest = request;
    request.promise.then(function(response) {
        if (token !== sequence || request.aborted) return;
        clearScheduledContentState();
        if (response.indexOf('HEADER_REDIRECT:') > -1) {
          delete retryRequests[token];
          api.navigateTo(response.split(':')[1]);
          return;
        }
        if (response.indexOf('URL_REDIRECT:') > -1) {
          delete retryRequests[token];
          document.location.href = response.substr(response.indexOf('URL_REDIRECT:') + 'URL_REDIRECT:'.length);
          return;
        }
        host.setAttribute('aria-busy', 'false');
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        var loadedModule = moduleFromPageName(pagename);
        if (loadedModule) {
          api.workbenchActiveModule = loadedModule;
          syncPrimaryModule(document.querySelector('#topnav-container'), loadedModule);
          syncPrimaryModule(document.querySelector('#workbench-mobile-navigation'), loadedModule);
        }
        enhanceLoadedContent(host, pagename, params || null);
        announceContentReady(host, pagename, { source: 'navigation', params: params || null });
        schedulePostRenderEnhancement(host, pagename);
        api.pageFormChanged = false;
        clearTimeout(api.dataLogTimer);
        api.dataLogNotification();
        delete retryRequests[token];
        if (!host.textContent.trim()) renderContentState(host, 'empty');
        announceNavigationComplete(pagename);
      }).catch(function(error) {
        if (isSupersededRequest(request, error) || token !== sequence) {
          if (token === sequence) {
            clearScheduledContentState();
            host.setAttribute('aria-busy', 'false');
          }
          delete retryRequests[token];
          return;
        }
        clearScheduledContentState();
        host.setAttribute('aria-busy', 'false');
        renderContentState(host, 'error', token, errorDiagnostic(error, pagename), Array.prototype.slice.call(args));
        api.reportError('Navigation request was not successful.');
        announceNavigationComplete(pagename, error);
      });
    return request;
  };

  // Confirmed links include historical GET actions. Their backend contract is
  // unchanged, but the accepted request uses the bounded native controller.
  legacy.confirm_action = function(link, confirmation) {
    var api = runtime();
    if (!api) return false;
    if (!window.confirm(confirmation)) return false;
    document.body.classList.add('wb-confirmed-action-active');
    var request = legacy.loadContent(link);
    if (request && request.promise) request.promise.finally(function() {
      document.body.classList.remove('wb-confirmed-action-active');
    });
    return request;
  };

  var menuSequence = 0;
  var menuRequests = [];
  var menuCache = { top: null, side: Object.create(null) };

  function resolvedMenuRequest(response) {
    return { readyState: 4, aborted: false, abort: function() {}, promise: Promise.resolve(response) };
  }

  function syncPrimaryModule(host, moduleName) {
    if (!host || !moduleName) return;
    host.querySelectorAll('.active, [aria-current="page"]').forEach(function(node) {
      node.classList.remove('active');
      node.removeAttribute('aria-current');
    });
    host.querySelectorAll('[data-workbench-module], [data-capp]').forEach(function(link) {
      var active = moduleAttribute(link) === String(moduleName);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      var item = link.closest('li');
      if (item) item.classList.toggle('active', active);
    });
  }

  function loadMenu(target, data, afterLoad, token, cacheKey, activeModule) {
    var host = document.querySelector(target);
    if (!host) return resolvedMenuRequest('');
    host.setAttribute('aria-busy', 'true');
    var cached = cacheKey === 'top' ? menuCache.top : menuCache.side[cacheKey];
    var request = typeof cached === 'string' ? resolvedMenuRequest(cached) : requestHtml('nav.php', data, 30000);
    request.promise = request.promise.then(function(response) {
        if (token !== menuSequence) return;
        // WP-864 regression fix: `var api` was declared below but referenced
        // here first; hoisting made it undefined, so every menu response threw
        // "fragment renderer is not available" and the nav silently failed.
        var api = runtime();
        if (cacheKey === 'top') menuCache.top = response;
        else if (cacheKey) menuCache.side[cacheKey] = response;
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        if (cacheKey === 'top') syncPrimaryModule(host, activeModule);
        decorateNavigation(host);
        if (window.workbenchIcons) window.workbenchIcons.render(host);
        afterLoad();
        if (api && typeof api.loadPushyMenu === 'function') api.loadPushyMenu();
        if (window.workbenchIcons) window.workbenchIcons.render(document.querySelector('#workbench-mobile-navigation'));
      }).catch(function(error) {
        if (!request.aborted && (!error || error.name !== 'AbortError') && token === menuSequence) {
          var api = runtime();
          if (api) api.reportError('Navigation menu request was not successful.');
        }
      }).then(function() {
        if (token === menuSequence) host.setAttribute('aria-busy', 'false');
      });
    return request;
  }

  legacy.loadMenus = function(options) {
    var api = runtime();
    options = options || {};
    var moduleName = options.module || (api && api.workbenchActiveModule) || '';
    if (moduleName && api) api.workbenchActiveModule = moduleName;
    menuSequence += 1;
    var token = menuSequence;
    menuRequests.forEach(function(request) {
      if (request && request.readyState !== 4) request.abort();
    });
    menuRequests = [
      loadMenu('#sidebar', 'nav=side', function() { var current = runtime(); if (current) current.onAfterSideNavLoaded(); }, token, moduleName ? 'side:' + moduleName : '', moduleName),
      loadMenu('#topnav-container', 'nav=top', function() {}, token, 'top', moduleName)
    ];
    return menuRequests;
  };

  legacy.loadInitContent = function() {
    var api = runtime();
    if (!api) return;
    installNavigationHistory();
    var content = document.getElementById('pageContent');
    var startpage = pageFromUrl() || (content && content.getAttribute('data-startpage')) || 'dashboard/dashboard.php';
    api.workbenchActiveModule = String(startpage).split('/')[0] || 'dashboard';
    api.navigateTo(startpage);
    api.loadMenus({ module: api.workbenchActiveModule });
    api.keepalive();
    window.setTimeout(function() {
      try {
        var username = document.querySelector('form#pageForm input[name="username"]');
        if (username) username.focus();
      } catch (error) {}
    }, 1000);
  };

  var refreshSequence = 0;
  var refreshRequest = null;
  var refreshTimer = null;

  function refreshState(kind) {
    document.querySelectorAll('.wb-refresh-state').forEach(function(state) { state.remove(); });
    var role = kind === 'error' ? 'alert' : 'status';
    var label = kind === 'error' ? messages.refresh_error : messages.refreshing;
    var host = document.getElementById('pageContent');
    if (!host) return;
    var state = element('div', 'wb-refresh-state wb-refresh-state--' + kind);
    state.setAttribute('role', role);
    state.appendChild(kind === 'error' ? iconElement('wb-refresh-state__icon', '!') : iconElement('wb-refresh-state__spinner'));
    state.appendChild(element('span', '', label));
    host.insertBefore(state, host.firstChild);
  }

  legacy.loadContentRefresh = function(pagename) {
    var api = runtime();
    var intervalControl = document.getElementById('refreshinterval');
    var interval = Number(intervalControl && intervalControl.value || 0);
    refreshSequence += 1;
    var token = refreshSequence;

    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (refreshRequest && refreshRequest.readyState !== 4) refreshRequest.abort();
    refreshRequest = null;

    if (interval <= 0) {
      document.querySelectorAll('.wb-refresh-state').forEach(function(state) { state.remove(); });
      return;
    }

    refreshState('loading');
    var request = requestHtml(pagename, 'refresh=' + interval, 30000);
    refreshRequest = request;
    request.promise.then(function(response) {
        if (token !== refreshSequence || request.aborted) return;
        var host = document.getElementById('pageContent');
        if (window.workbenchMonitoring) window.workbenchMonitoring.destroy(host);
        if (!api || typeof api.replaceServerFragment !== 'function') throw new TypeError('Workbench fragment renderer is not available.');
        api.replaceServerFragment(host, response);
        enhanceLoadedContent(host, pagename, 'refresh=' + interval);
        announceContentReady(host, pagename, { source: 'refresh', params: 'refresh=' + interval });
        schedulePostRenderEnhancement(host, pagename);
        if (api) api.pageFormChanged = false;
      }).catch(function(error) {
        if (isSupersededRequest(request, error) || token !== refreshSequence) return;
        refreshState('error');
        if (api) api.reportError('Refresh request was not successful. ' + pagename);
      });

    refreshTimer = window.setTimeout(function() {
      var current = runtime();
      if (current) current.loadContentRefresh(pagename);
    }, interval * 1000 * 60);
  };

  document.addEventListener('click', function(event) {
    var trigger = event.target.closest('.wb-content-state__retry');
    if (!trigger) return;
    event.preventDefault();
    var token = trigger.getAttribute('data-workbench-retry');
    retryContentRequest(token);
  });

  legacy.workbenchEnhanceContent = function(rootOrPageName, pageName, context) {
    var host = rootOrPageName && rootOrPageName.nodeType ? rootOrPageName : document.getElementById('pageContent');
    var resolvedPage = rootOrPageName && rootOrPageName.nodeType ? pageName : rootOrPageName;
    if (!host) return false;
    enhanceLoadedContent(host, resolvedPage || '', undefined, context || {});
    announceContentReady(host, resolvedPage || '', context || { source: 'manual-enhance' });
    return true;
  };

  window.workbenchContentStates = window.workbenchContentStates || {};
  window.workbenchContentStates.enhance = function(root, pageName, context) {
    return (legacy && typeof legacy.workbenchEnhanceContent === 'function')
      ? legacy.workbenchEnhanceContent(root || document.getElementById('pageContent'), pageName || '', context || { source: 'external-enhance' })
      : false;
  };

  legacy.registerHook('onAfterContentLoad', function(name, params) {
    if (params && params.__workbenchEnhanced) return;
    if (legacy && typeof legacy.workbenchEnhanceContent === 'function') {
      legacy.workbenchEnhanceContent(params && params.url ? params.url : name || '', '', { source: 'legacy-after-content-hook' });
    }
  });

  legacy.workbenchContentStatesInstalled = true;
})(window, document);
