(function () {
  'use strict';

  document.documentElement.classList.add('heritage-runtime');

  function syncThemeToggleLabel() {
    var toggle = document.querySelector('.wb-theme-toggle');
    if (!toggle) return;

    var isDark = document.documentElement.getAttribute('data-wb-theme') === 'dark';
    var isGerman = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var label = isGerman
      ? (isDark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln')
      : (isDark ? 'Switch to light theme' : 'Switch to dark theme');

    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  }

  function markIdentityColumns() {
    document.querySelectorAll('.wb-data-table').forEach(function (table) {
      var headers = table.querySelectorAll('thead tr:first-child > th, thead tr:first-child > td');
      if (!headers.length) return;
      var identityLabel = headers[0].textContent.trim();
      var isCompactIdentity = headers[0].classList.contains('small-col') &&
        /^(?:.*\s)?id$/i.test(identityLabel);
      if (!isCompactIdentity) return;

      table.querySelectorAll('tr').forEach(function (row) {
        if (row.children[0]) row.children[0].classList.add('hg-table-column--identity');
      });
    });
  }

  function localizeComponentLabels() {
    if ((document.documentElement.lang || '').toLowerCase().indexOf('de') !== 0) return;
    var tabLabels = {
      'Info': 'Informationen',
      'Address': 'Adresse',
      'Limits': 'Kontingente',
      'Sites': 'Webseiten',
      'Mail': 'E-Mail',
      'Web': 'Webseiten',
      'Cron': 'Cronjobs',
      'Rescue': 'Rettung',
      'Misc': 'Sonstiges'
    };
    document.querySelectorAll('#pageContent [role="tab"], #pageContent .nav-tabs a').forEach(function (tab) {
      var current = tab.textContent.trim();
      if (tabLabels[current]) tab.textContent = tabLabels[current];
    });

    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var title = pageContent.querySelector('h1');
    if (title && /^Client\s*-\s*/.test(title.textContent.trim())) {
      title.textContent = title.textContent.replace(/^Client\s*-\s*/, 'Kunde – ');
    }
    var pageTitles = {
      'Websites': 'Webseiten',
      'Supportnachricht': 'Supportnachrichten',
      'monitor_general_systemstate_txt': 'Systemzustand',
      'System Config': 'Systemkonfiguration',
      'Server Config': 'Serverkonfiguration',
      'User Settings': 'Benutzereinstellungen'
    };
    if (title && pageTitles[title.textContent.trim()]) {
      title.textContent = pageTitles[title.textContent.trim()];
    }

    if (title) {
      var normalizedTitle = title.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
      pageContent.querySelectorAll('h2, h3, .fieldset-legend, .wb-list-section-heading').forEach(function (heading) {
        if (heading === title || heading.querySelector('button, a, input, select')) return;
        var normalizedHeading = heading.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
        heading.classList.toggle('hg-redundant-heading', normalizedHeading !== '' && normalizedHeading === normalizedTitle);
      });
    }

    pageContent.querySelectorAll('.wb-form-tabs-shell').forEach(function (shell) {
      var tabs = shell.querySelectorAll('.wb-form-tabs > li, .nav-tabs > li');
      shell.classList.toggle('hg-single-tab-shell', tabs.length === 1);
    });

    var copy = {
      'Client info': 'Kundeninformationen',
      'Company Name:': 'Firma:',
      'Contact Name:': 'Kontakt:',
      'E-mail:': 'E-Mail:',
      'Login as:': 'Anmelden als:',
      'monitor_settings_refreshsq_txt': 'Automatische Aktualisierung',
      'monitor_serverstate_server_txt': 'Server',
      'monitor_serverstate_state_txt': 'Status',
      'monitor_serverstate_unknown_txt': 'Unbekannt',
      'monitor_serverstate_info_txt': 'Informationen',
      'monitor_serverstate_warning_txt': 'Warnungen',
      'monitor_serverstate_critical_txt': 'Kritisch',
      'monitor_serverstate_error_txt': 'Fehler',
      'monitor_serverstate_moreinfo_txt': 'Details anzeigen',
      '- No Refresh -': '– Keine Aktualisierung –',
      '5 minutes': '5 Minuten',
      '10 minutes': '10 Minuten',
      '15 minutes': '15 Minuten',
      '30 minutes': '30 Minuten',
      '60 minutes': '60 Minuten'
    };
    var walker = document.createTreeWalker(pageContent, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      Object.keys(copy).forEach(function (source) {
        if (value.indexOf(source) < 0) return;
        value = value.split(source).join(copy[source]);
      });
      if (node.nodeValue !== value) node.nodeValue = value;
    }
  }

  function syncModuleContext() {
    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var isMonitor = !!pageContent.querySelector('.wb-monitor-workspace, .systemmonitor, .stateview, .panel_system');
    document.body.classList.toggle('wb-monitor-page', isMonitor);
    pageContent.classList.toggle('wb-monitor-surface', isMonitor);
    document.body.setAttribute('data-heritage-surface', isMonitor ? 'monitor' :
      (document.body.classList.contains('wb-list-page') ? 'list' :
        (document.body.classList.contains('wb-form-page') ? 'form' : 'module')));
  }

  function enhanceAccessibility() {
    var pageContent = document.getElementById('pageContent');
    if (!pageContent) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var pageTitle = pageContent.querySelector('h1');
    var titleText = pageTitle ? pageTitle.textContent.trim() : '';

    pageContent.querySelectorAll('a[href="#"]').forEach(function (link) {
      var name = (link.getAttribute('aria-label') || link.getAttribute('title') || link.textContent || '').trim();
      if (name || link.querySelector('img, svg, [class*="icon"]')) return;
      link.removeAttribute('href');
      link.setAttribute('tabindex', '-1');
      link.setAttribute('aria-hidden', 'true');
    });

    pageContent.querySelectorAll('button[title], a[title], [role="button"][title]').forEach(function (control) {
      if (!control.getAttribute('aria-label') && !control.textContent.trim()) {
        control.setAttribute('aria-label', control.getAttribute('title'));
      }
    });

    pageContent.querySelectorAll('.alert, .alert-notification, .wb-feedback').forEach(function (notice) {
      var urgent = notice.classList.contains('alert-danger') || notice.classList.contains('wb-feedback--danger');
      notice.setAttribute('role', urgent ? 'alert' : 'status');
      notice.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
      notice.setAttribute('aria-atomic', 'true');
    });

    pageContent.querySelectorAll('[role="tablist"], .nav-tabs').forEach(function (tablist) {
      tablist.setAttribute('aria-label', german ? 'Abschnitte' : 'Sections');
      tablist.setAttribute('aria-orientation', 'horizontal');
    });

    pageContent.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
      field.setAttribute('aria-required', 'true');
    });
    pageContent.querySelectorAll('.has-error input, .has-error select, .has-error textarea, [aria-invalid="true"]').forEach(function (field) {
      field.setAttribute('aria-invalid', 'true');
    });

    pageContent.querySelectorAll('.table-responsive, .wb-table-scroll, .wb-table-viewport, .wb-owned-scroll-region').forEach(function (region) {
      var table = region.querySelector('table');
      if (!table) return;
      var caption = table.querySelector('caption');
      var label = caption && caption.textContent.trim();
      region.setAttribute('role', 'region');
      region.setAttribute('aria-label', label || (titleText + (german ? ' – Tabelle' : ' – table')));
      region.setAttribute('tabindex', region.scrollWidth > region.clientWidth ? '0' : '-1');
    });

    pageContent.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      ['noopener', 'noreferrer'].forEach(function (value) {
        if (rel.indexOf(value) < 0) rel.push(value);
      });
      link.setAttribute('rel', rel.join(' '));
    });
  }

  function enhanceDashboard() {
    var host = document.getElementById('pageContent');
    if (!host || !document.body.classList.contains('wb-dashboard-page')) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var sections = [
      {
        selector: '.wb-dashlet-module-atomic',
        key: 'modules',
        title: german ? 'Bereiche' : 'Modules',
        description: german ? 'Direkteinstiege in deine Arbeitsbereiche' : 'Direct access to your work areas'
      },
      {
        selector: '.wb-dashlet-metric-atomic',
        key: 'metrics',
        title: german ? 'Systemmetriken' : 'System metrics',
        description: german ? 'Aktuelle Messwerte und interaktive Verläufe' : 'Current readings and interactive trends'
      },
      {
        selector: '.wb-dashlet-limits, .wb-dashlet-quota, .wb-dashlet-mailquota, .wb-dashlet-databasequota',
        key: 'capacity',
        title: german ? 'Kapazitäten' : 'Capacity',
        description: german ? 'Kontingente, Nutzung und verfügbare Reserven' : 'Limits, usage and available headroom'
      }
    ];

    sections.forEach(function (section) {
      var first = host.querySelector(section.selector + ':not([data-wb-hidden="true"])');
      var marker = host.querySelector('[data-heritage-dashboard-section="' + section.key + '"]');
      if (!first || first.hidden || first.getClientRects().length === 0) {
        if (marker) marker.hidden = true;
        return;
      }
      if (!marker) {
        marker = document.createElement('header');
        marker.className = 'hg-dashboard-section';
        marker.setAttribute('data-heritage-dashboard-section', section.key);
        marker.innerHTML = '<strong></strong><span></span>';
      }
      marker.hidden = false;
      var heading = marker.querySelector('strong');
      var description = marker.querySelector('span');
      if (heading.textContent !== section.title) heading.textContent = section.title;
      if (description.textContent !== section.description) description.textContent = section.description;
      if (marker.nextElementSibling !== first) host.insertBefore(marker, first);
    });

    host.querySelectorAll('[data-wb-metric-toggle]').forEach(function (toggle, index) {
      var metric = toggle.getAttribute('data-wb-metric-toggle') || String(index);
      var details = host.querySelector('[data-wb-metric-details="' + metric + '"]');
      if (!details) return;
      var id = details.id || ('heritage-metric-details-' + metric.replace(/[^a-z0-9_-]/gi, '-'));
      details.id = id;
      toggle.setAttribute('aria-controls', id);
      toggle.setAttribute('aria-haspopup', 'true');
    });
  }

  function enhanceForms() {
    var host = document.getElementById('pageContent');
    var form = host && host.querySelector('#pageForm');
    if (!form) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var controls = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
    form.setAttribute('data-heritage-form-density', controls.length > 28 ? 'long' : (controls.length > 12 ? 'standard' : 'compact'));

    var fieldContracts = {
      company_name: { autocomplete: 'organization' },
      contact_firstname: { autocomplete: 'given-name' },
      contact_name: { autocomplete: 'family-name' },
      username: { autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false' },
      email: { autocomplete: 'email', inputmode: 'email', autocapitalize: 'none', spellcheck: 'false' },
      street: { autocomplete: 'street-address' },
      zip: { autocomplete: 'postal-code', inputmode: 'numeric' },
      city: { autocomplete: 'address-level2' },
      state: { autocomplete: 'address-level1' },
      country: { autocomplete: 'country' },
      telephone: { autocomplete: 'tel', inputmode: 'tel' },
      mobile: { autocomplete: 'tel', inputmode: 'tel' },
      fax: { inputmode: 'tel' },
      internet: { autocomplete: 'url', inputmode: 'url', autocapitalize: 'none', spellcheck: 'false' },
      password: { autocomplete: 'new-password' },
      repeat_password: { autocomplete: 'new-password' }
    };
    Object.keys(fieldContracts).forEach(function (id) {
      var field = form.querySelector('#' + id);
      if (!field) return;
      Object.keys(fieldContracts[id]).forEach(function (name) {
        if (!field.getAttribute(name)) field.setAttribute(name, fieldContracts[id][name]);
      });
    });

    form.querySelectorAll('.wb-field-group, .form-group, .ctrlHolder').forEach(function (group) {
      var field = group.querySelector('input:not([type="hidden"]), select, textarea');
      if (!field) return;
      var help = group.querySelector('.help-block, .form-text, .field-help, .wb-field-help');
      var error = group.querySelector('.help-block-error, .field-error, .wb-field-error');
      var descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      [help, error].forEach(function (description, index) {
        if (!description) return;
        if (!description.id) description.id = 'heritage-field-' + (field.id || 'control') + '-' + (index ? 'error' : 'help');
        if (descriptions.indexOf(description.id) < 0) descriptions.push(description.id);
      });
      if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
      group.classList.toggle('hg-field-group--disabled', field.disabled);
    });

    form.querySelectorAll('.wb-form-actions').forEach(function (actions) {
      actions.setAttribute('role', 'region');
      actions.setAttribute('aria-label', german ? 'Formularaktionen' : 'Form actions');
    });
  }

  function markShell() {
    document.body.classList.add('heritage-shell');
    var formEnhancementTimer = 0;
    new MutationObserver(function () {
      window.clearTimeout(formEnhancementTimer);
      formEnhancementTimer = window.setTimeout(enhanceForms, 40);
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
    window.setTimeout(enhanceForms, 0);

    var navigation = document.getElementById('workbench-mobile-navigation');
    if (navigation) {
      navigation.setAttribute('data-heritage-navigation', 'true');
      navigation.setAttribute('aria-label', 'Navigation');
      var navigationLandmark = navigation.querySelector('nav');
      if (navigationLandmark) navigationLandmark.setAttribute('aria-label', 'Navigation');
      var homeLink = navigation.querySelector('.wb-mobile-navigation__header a');
      if (homeLink) homeLink.setAttribute('aria-label', 'Übersicht');
    }
    syncThemeToggleLabel();
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceAccessibility();
    enhanceDashboard();
    window.setTimeout(enhanceDashboard, 250);
    window.setTimeout(enhanceForms, 250);

    new MutationObserver(syncThemeToggleLabel).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-wb-theme']
    });

    var pageContent = document.getElementById('pageContent');
    if (pageContent) {
      new MutationObserver(function () {
        markIdentityColumns();
        localizeComponentLabels();
        syncModuleContext();
        enhanceAccessibility();
        enhanceForms();
      }).observe(pageContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'disabled', 'aria-invalid']
      });
    }

  }

  document.addEventListener('workbench:navigation-complete', function () {
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceAccessibility();
    enhanceDashboard();
    window.setTimeout(enhanceDashboard, 120);
    window.setTimeout(enhanceForms, 120);
  });
  document.addEventListener('click', function (event) {
    var reset = event.target.closest && event.target.closest('.wb-filter-reset');
    if (!reset || !document.body.classList.contains('heritage-shell')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    var host = document.getElementById('pageContent');
    var row = host && host.querySelector('thead tr[data-workbench-filter-row]');
    if (!row) return;

    row.querySelectorAll('input, select').forEach(function (control) {
      if (control.tagName === 'SELECT') control.selectedIndex = 0;
      else control.value = '';
    });

    var apply = row.querySelector('#Filter');
    if (apply) apply.click();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markShell, { once: true });
  } else {
    markShell();
  }
}());
