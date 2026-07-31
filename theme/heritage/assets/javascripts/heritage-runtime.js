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
    document.querySelectorAll('.wb-list-command-bar__actions').forEach(function (actions) {
      var primaryActions = actions.querySelectorAll(':scope > .wb-list-command-bar__primary');
      primaryActions.forEach(function (action, index) {
        action.classList.toggle('hg-list-action--secondary', index > 0);
      });
    });

    document.querySelectorAll('.wb-data-table').forEach(function (table) {
      var headers = Array.prototype.slice.call(table.querySelectorAll('thead tr:first-child > th, thead tr:first-child > td'));
      if (!headers.length) return;
      var labels = headers.map(function (header) {
        return header.textContent.replace(/\s+/g, ' ').trim();
      });
      var retiredIndexes = labels.reduce(function (indexes, label, index) {
        if (/^(?:xmpp|vserver)$/i.test(label)) indexes.push(index);
        return indexes;
      }, []);
      retiredIndexes.forEach(function (index) {
        headers[index].classList.add('hg-table-column--retired');
      });
      table.querySelectorAll('tr').forEach(function (row) {
        retiredIndexes.forEach(function (index) {
          if (row.children[index]) row.children[index].classList.add('hg-table-column--retired');
        });
      });
      var firstDataRow = table.querySelector('tbody > tr.wb-table-data-row');
      var actionCell = firstDataRow ? firstDataRow.querySelector('.wb-table-actions') : null;
      var actionIndex = actionCell ? Array.prototype.indexOf.call(firstDataRow.children, actionCell) : -1;
      if (actionIndex >= 0 && headers[actionIndex]) {
        headers[actionIndex].classList.add('wb-table-actions');
        if (!headers[actionIndex].textContent.trim()) {
          headers[actionIndex].textContent = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0
            ? 'Aktionen'
            : 'Actions';
        }
      }
      var identityIndex = labels.findIndex(function (label) {
        return /^(?:.*[\s_-])?(?:id|nr\.?|nummer)$/i.test(label);
      });
      var primaryPatterns = [
        /^(?:firmenname|company(?: name)?|firma)$/i,
        /^(?:domain(?:name)?|webseite|website|zone|zonenname)$/i,
        /^(?:e-?mail(?:-adresse)?|mailbox|postfach|quelle|source)$/i,
        /^(?:benutzername|username|login|name|titel|title)$/i,
        /^(?:kunde|client|server(?:name)?|ziel|destination)$/i
      ];
      var primaryIndex = -1;
      primaryPatterns.some(function (pattern) {
        primaryIndex = labels.findIndex(function (label, index) {
          return index !== identityIndex && pattern.test(label);
        });
        return primaryIndex >= 0;
      });
      if (primaryIndex < 0) {
        primaryIndex = labels.findIndex(function (label, index) {
          return index !== identityIndex && label && !/^(?:aktiv|active|status|gesperrt|locked|aktionen|actions?)$/i.test(label);
        });
      }
      if (primaryIndex < 0) return;

      headers[primaryIndex].classList.add('hg-table-column--primary');
      if (identityIndex >= 0 && identityIndex !== primaryIndex) headers[identityIndex].classList.add('hg-table-column--identity');
      headers.forEach(function (header, index) {
        if (/^(?:aktiv|active|status|gesperrt|locked|enabled)$/i.test(labels[index])) {
          header.classList.add('hg-table-column--status');
        }
      });

      table.querySelectorAll('tbody > tr').forEach(function (row) {
        if (!row.classList.contains('wb-table-data-row')) return;
        var identity = identityIndex >= 0 ? row.children[identityIndex] : null;
        var primary = row.children[primaryIndex];
        if (!primary) return;
        var identityText = identity ? identity.textContent.replace(/\s+/g, ' ').trim() : '';
        var identityLabel = identityIndex >= 0 ? labels[identityIndex] : '';
        primary.classList.add('hg-table-column--primary');
        if (identity && identity !== primary) identity.classList.add('hg-table-column--identity');

        var sourceLink = (identity && identity.querySelector('a[href]')) || primary.querySelector('a[href]');
        if (sourceLink && !primary.querySelector('a, button, input') && primary.textContent.trim()) {
          var promoted = sourceLink.cloneNode(false);
          promoted.className = 'hg-record-primary-link';
          promoted.textContent = primary.textContent.trim();
          primary.replaceChildren(promoted);
        } else if (sourceLink && primary.contains(sourceLink)) {
          sourceLink.classList.add('hg-record-primary-link');
        }

        if (identityText && !primary.querySelector('.hg-record-identity')) {
          var identitySummary = document.createElement('span');
          identitySummary.className = 'hg-record-identity';
          identitySummary.textContent = (identityLabel ? identityLabel + ' ' : '') + identityText;
          primary.appendChild(identitySummary);
        }

        headers.forEach(function (header, index) {
          if (header.classList.contains('hg-table-column--status') && row.children[index]) {
            row.children[index].classList.add('hg-table-column--status');
          }
        });
        var recordName = primary.textContent.replace(/\s+/g, ' ').trim();
        row.setAttribute('data-heritage-record-card', 'true');
        if (recordName) row.setAttribute('aria-label', recordName);
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
    var family = document.body.classList.contains('wb-dashboard-page') ? 'dashboard' :
      (isMonitor ? 'monitor' :
        (pageContent.querySelector('.wb-extension-workspace') ? 'extension' :
          (document.body.classList.contains('wb-form-profile--billing') || pageContent.querySelector('.wb-billing-product, .wb-billing-form, [data-billing-scope]') ? 'billing' :
            (document.body.classList.contains('wb-form-profile--system-config') || pageContent.querySelector('.wb-system-workspace, .system-config') ? 'system' : 'standard'))));
    document.body.classList.toggle('wb-monitor-page', isMonitor);
    pageContent.classList.toggle('wb-monitor-surface', isMonitor);
    document.body.setAttribute('data-heritage-module-family', family);
    pageContent.setAttribute('data-heritage-module-family', family);
    document.body.setAttribute('data-heritage-surface', isMonitor ? 'monitor' :
      (document.body.classList.contains('wb-list-page') ? 'list' :
        (document.body.classList.contains('wb-form-page') ? 'form' : 'module')));

    pageContent.querySelectorAll('.wb-monitor-workspace, .wb-extension-workspace, .wb-statistics-workspace, .wb-specialty-workspace, .wb-billing-product, .wb-billing-form, .wb-system-workspace').forEach(function (workspace) {
      workspace.setAttribute('data-heritage-module-workspace', family);
    });
    pageContent.querySelectorAll('.wb-monitor-hero, .wb-extension-hero, .wb-dashboard-hero').forEach(function (hero, index) {
      hero.setAttribute('data-heritage-module-hero', 'true');
      var heading = hero.querySelector('h1, h2');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-module-title-' + index;
        hero.setAttribute('aria-labelledby', heading.id);
      }
    });
    pageContent.querySelectorAll('.wb-monitor-chart-panel, .wb-monitor-status-panel, .wb-billing-panel, .wb-billing-settings-card, .wb-extension-workspace .panel, .wb-system-workspace .panel').forEach(function (panel, index) {
      panel.setAttribute('data-heritage-module-panel', 'true');
      var heading = panel.querySelector('h2, h3, .panel-title, .panel-heading');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-module-panel-' + index;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', heading.id);
      }
    });
    pageContent.querySelectorAll('.wb-monitor-refresh-panel, .wb-specialty-actions, .wb-extension-actions, .wb-billing-actions').forEach(function (actions) {
      actions.setAttribute('data-heritage-module-actions', 'true');
      actions.setAttribute('role', 'toolbar');
      actions.setAttribute('aria-label', (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0 ? 'Modulaktionen' : 'Module actions');
    });
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

  function enhancePageComposition() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var heading = host.querySelector(':scope > .wb-page-header, :scope > .page-header');
    var title = heading && heading.querySelector('h1, h2');

    if (heading) {
      heading.setAttribute('data-heritage-page-header', 'true');
      if (title && !title.id) title.id = 'heritage-page-title';
      if (title) host.setAttribute('aria-labelledby', title.id);
      var headingActions = heading.querySelector('.wb-page-header__actions');
      if (headingActions) {
        headingActions.setAttribute('role', 'group');
        headingActions.setAttribute('aria-label', german ? 'Seitenaktionen' : 'Page actions');
      }
    }

    var meta = host.querySelector(':scope > .wb-page-meta');
    if (meta) {
      meta.setAttribute('data-heritage-page-meta', 'true');
      meta.setAttribute('aria-label', german ? 'Seitenstatus' : 'Page status');
    }

    host.querySelectorAll(':scope > .wb-page-notices, :scope > .wb-feedback-stack').forEach(function (stack) {
      stack.setAttribute('data-heritage-notice-stack', 'true');
      stack.setAttribute('aria-label', german ? 'Meldungen' : 'Messages');
    });
    host.querySelectorAll('.alert, .alert-notification, .wb-feedback').forEach(function (notice) {
      var severity = notice.classList.contains('alert-danger') || notice.classList.contains('wb-feedback--danger') ? 'danger' :
        (notice.classList.contains('alert-warning') || notice.classList.contains('wb-feedback--warning') ? 'warning' :
          (notice.classList.contains('alert-success') || notice.classList.contains('wb-feedback--success') ? 'success' : 'info'));
      notice.setAttribute('data-heritage-notice', severity);
    });

    host.querySelectorAll('.wb-list-command-bar').forEach(function (bar) {
      bar.setAttribute('data-heritage-command-bar', 'true');
      bar.setAttribute('role', 'toolbar');
      bar.setAttribute('aria-label', german ? 'Listenaktionen' : 'List actions');
      var primary = bar.querySelector('.wb-list-command-bar__primary, .btn-primary');
      if (primary) primary.setAttribute('data-heritage-primary-action', 'true');
    });

    host.querySelectorAll('.wb-content-state').forEach(function (state) {
      state.setAttribute('data-heritage-content-state', 'true');
      state.setAttribute('role', state.classList.contains('wb-content-state--error') ? 'alert' : 'status');
      state.setAttribute('aria-live', state.classList.contains('wb-content-state--error') ? 'assertive' : 'polite');
    });
  }

  function enhanceDashboard() {
    var host = document.getElementById('pageContent');
    if (!host || !document.body.classList.contains('wb-dashboard-page')) return;
    /* Dashboard widgets may contain small quota tables. They are enhanced as
     * tables, but must not reclassify the complete cockpit as a list page. */
    host.classList.remove('wb-table-workspace', 'wb-table-workspace--finalized');
    document.body.classList.remove('wb-list-page', 'wb-form-page');
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
    var form = document.getElementById('pageForm');
    if (!host || !form || !form.contains(host) || !host.querySelector('.wb-form-actions')) {
      if (form) {
        form.removeAttribute('data-heritage-form-density');
        form.removeAttribute('data-heritage-form-system');
        form.removeAttribute('data-heritage-field-count');
        form.removeAttribute('aria-label');
      }
      return;
    }
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    var controls = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
    form.setAttribute('data-heritage-form-density', controls.length > 28 ? 'long' : (controls.length > 12 ? 'standard' : 'compact'));
    form.setAttribute('data-heritage-form-system', 'true');
    form.setAttribute('data-heritage-field-count', String(controls.length));
    if (!form.getAttribute('aria-label')) form.setAttribute('aria-label', german ? 'Bearbeitungsformular' : 'Edit form');

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

    form.querySelectorAll('.wb-form-section, fieldset, .panel, .wb-content-panel').forEach(function (section, sectionIndex) {
      var heading = section.querySelector(':scope > .wb-form-section-heading, :scope > legend, :scope > .panel-heading, :scope > .wb-content-panel__header');
      section.setAttribute('data-heritage-form-section', 'true');
      section.setAttribute('role', section.tagName === 'FIELDSET' ? 'group' : 'region');
      if (heading) {
        if (!heading.id) heading.id = 'heritage-form-section-' + sectionIndex;
        section.setAttribute('aria-labelledby', heading.id);
      }
    });

    form.querySelectorAll('.wb-field-group, .form-group, .ctrlHolder').forEach(function (group, groupIndex) {
      var field = group.querySelector('input:not([type="hidden"]), select, textarea');
      if (!field) return;
      group.setAttribute('data-heritage-field', 'true');
      var label = group.querySelector('label, .control-label');
      if (label && !label.id) label.id = 'heritage-field-label-' + groupIndex;
      if (label && !field.getAttribute('aria-labelledby') && !field.getAttribute('aria-label')) field.setAttribute('aria-labelledby', label.id);
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
      group.toggleAttribute('data-heritage-required', field.required || field.getAttribute('aria-required') === 'true' || group.classList.contains('wb-field-group--required'));
      group.toggleAttribute('data-heritage-invalid', field.getAttribute('aria-invalid') === 'true' || group.classList.contains('has-error') || group.classList.contains('wb-field-group--invalid'));
      if (help) help.setAttribute('role', 'note');
      if (error) {
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'polite');
      }
    });

    form.querySelectorAll('.wb-form-actions').forEach(function (actions) {
      actions.setAttribute('role', 'region');
      actions.setAttribute('aria-label', german ? 'Formularaktionen' : 'Form actions');
      actions.setAttribute('data-heritage-form-actions', 'true');
      var actionControls = actions.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      actions.setAttribute('data-heritage-action-count', String(actionControls.length));
      actionControls.forEach(function (action) {
        if (action.matches('.formbutton-success, .btn-primary, .wb-form-action--primary, .wb-action-control--primary')) action.setAttribute('data-heritage-action', 'primary');
        else if (action.matches('.formbutton-danger, .btn-danger, .wb-form-action--danger')) action.setAttribute('data-heritage-action', 'danger');
        else action.setAttribute('data-heritage-action', 'secondary');
      });
    });

    syncFormValidation(form, german);
    if (form.dataset.heritageValidationBound !== 'true') {
      form.dataset.heritageValidationBound = 'true';
      ['input', 'change'].forEach(function (eventName) {
        form.addEventListener(eventName, function () {
          window.requestAnimationFrame(function () { syncFormValidation(form, german); });
        });
      });
    }
  }

  function enhanceTables() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var german = (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
    host.querySelectorAll('.wb-data-table').forEach(function (table) {
      var headingRow = table.querySelector('thead > tr:first-child');
      var headers = headingRow ? Array.prototype.slice.call(headingRow.children) : [];
      headers.forEach(function (header) {
        if (header.matches('.sorting_asc, [data-sort-direction="asc"]')) header.setAttribute('aria-sort', 'ascending');
        else if (header.matches('.sorting_desc, [data-sort-direction="desc"]')) header.setAttribute('aria-sort', 'descending');
        else if (header.matches('.sorting, [data-sortable="true"]')) header.setAttribute('aria-sort', 'none');
      });

      var filterRow = table.querySelector('thead > tr[data-workbench-filter-row]');
      if (filterRow) {
        filterRow.setAttribute('aria-label', german ? 'Tabellenfilter' : 'Table filters');
        filterRow.querySelectorAll('input, select').forEach(function (control) {
          if (control.getAttribute('aria-label')) return;
          var cell = control.closest('th, td');
          var index = cell ? Array.prototype.indexOf.call(filterRow.children, cell) : -1;
          var heading = index >= 0 && headers[index] ? headers[index].textContent.replace(/\s+/g, ' ').trim() : '';
          control.setAttribute('aria-label', (german ? 'Filtern nach ' : 'Filter by ') + (heading || (german ? 'Wert' : 'value')));
        });
      }

      table.querySelectorAll('.wb-row-action').forEach(function (control) {
        var current = (control.getAttribute('aria-label') || control.getAttribute('title') || '').trim();
        var generic = /^(?:aktion|action)\s*\d*$/i.test(current);
        var href = (control.getAttribute('href') || '').toLowerCase();
        var label = current;
        if (control.classList.contains('wb-row-action--danger') || /delete|del=/.test(href)) label = german ? 'Löschen' : 'Delete';
        else if (control.classList.contains('wb-row-action--login') || /login/.test(href)) label = german ? 'Anmelden' : 'Log in';
        else if (control.classList.contains('wb-row-action--edit') || /edit/.test(href)) label = german ? 'Bearbeiten' : 'Edit';
        else if (/stat|traffic/.test(href)) label = german ? 'Statistiken' : 'Statistics';
        else if (!label || generic) label = german ? 'Weitere Aktion' : 'More action';
        control.setAttribute('aria-label', label);
        control.setAttribute('title', label);
      });
    });
  }

  function explicitInvalidFields(form) {
    var fields = [];
    form.querySelectorAll(
      '[aria-invalid="true"], .has-error input, .has-error select, .has-error textarea, ' +
      '.wb-field-error input, .wb-field-error select, .wb-field-error textarea'
    ).forEach(function (field) {
      if (field.matches('input, select, textarea') && fields.indexOf(field) < 0) fields.push(field);
    });
    return fields;
  }

  function syncFormValidation(form, german) {
    var invalid = explicitInvalidFields(form);
    var tabs = form.querySelectorAll('.wb-form-tabs a[href^="#"], .nav-tabs a[href^="#"]');
    tabs.forEach(function (tab) {
      var target = tab.getAttribute('href');
      var pane = target && target.length > 1 ? form.querySelector(target) : null;
      var count = pane ? invalid.filter(function (field) { return pane.contains(field); }).length : 0;
      var badge = tab.querySelector('.hg-tab-error-count');
      if (!tab.dataset.heritageBaseLabel) {
        var labelSource = tab.cloneNode(true);
        var oldBadge = labelSource.querySelector('.hg-tab-error-count');
        if (oldBadge) oldBadge.remove();
        tab.dataset.heritageBaseLabel = labelSource.textContent.replace(/\s+/g, ' ').trim();
      }
      if (!count) {
        if (badge) badge.remove();
        tab.removeAttribute('data-heritage-has-errors');
        tab.setAttribute('aria-label', tab.dataset.heritageBaseLabel);
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'hg-tab-error-count';
        badge.setAttribute('aria-hidden', 'true');
        tab.appendChild(badge);
      }
      if (badge.textContent !== String(count)) badge.textContent = String(count);
      tab.setAttribute('data-heritage-has-errors', 'true');
      tab.setAttribute('aria-label', tab.dataset.heritageBaseLabel + ' – ' + count + ' ' + (german ? 'Fehler' : (count === 1 ? 'error' : 'errors')));
    });

    var summary = form.querySelector(':scope > .hg-form-validation-summary');
    if (!invalid.length) {
      if (summary) summary.remove();
      return;
    }
    if (!summary) {
      summary = document.createElement('button');
      summary.type = 'button';
      summary.className = 'hg-form-validation-summary';
      summary.addEventListener('click', function () {
        var first = explicitInvalidFields(form)[0];
        if (!first) return;
        var pane = first.closest('.tab-pane');
        if (pane && !pane.classList.contains('active')) {
          var tab = form.querySelector('.wb-form-tabs a[href="#' + pane.id + '"], .nav-tabs a[href="#' + pane.id + '"]');
          if (tab) tab.click();
        }
        window.setTimeout(function () { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 40);
      });
      form.insertBefore(summary, form.firstChild);
    }
    var message = invalid.length + ' ' + (german ? (invalid.length === 1 ? 'Eingabe prüfen' : 'Eingaben prüfen') : (invalid.length === 1 ? 'field needs attention' : 'fields need attention'));
    if (summary.textContent !== message) summary.textContent = message;
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
    enhancePageComposition();
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceTables();
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
      var contentEnhancementTimer = 0;
      var contentObserver;
      var observeContent = function () {
        contentObserver.observe(pageContent, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'disabled', 'aria-invalid']
        });
      };
      var enhanceObservedContent = function () {
        contentEnhancementTimer = 0;
        contentObserver.disconnect();
        enhancePageComposition();
        markIdentityColumns();
        localizeComponentLabels();
        syncModuleContext();
        enhanceAccessibility();
        enhanceForms();
        enhanceTables();
        observeContent();
      };
      contentObserver = new MutationObserver(function () {
        window.clearTimeout(contentEnhancementTimer);
        contentEnhancementTimer = window.setTimeout(enhanceObservedContent, 24);
      });
      observeContent();
    }

  }

  document.addEventListener('workbench:navigation-complete', function () {
    enhancePageComposition();
    markIdentityColumns();
    localizeComponentLabels();
    syncModuleContext();
    enhanceForms();
    enhanceTables();
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
