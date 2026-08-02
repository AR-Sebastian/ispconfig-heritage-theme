(function () {
  'use strict';

  var codeFieldPattern = /(?:config|directive|rules?|template|snippet|php_ini|ssl_(?:key|cert|bundle|request)|ssh_rsa|dkim_(?:private|public)|dns_record|custom_mailfilter)/i;

  function localized(german, english) {
    var language = typeof window.workbenchLanguage === 'function' ? window.workbenchLanguage() : (document.documentElement.lang || '');
    return String(language).toLowerCase().indexOf('de') === 0 ? german : english;
  }

  function createBadge(label, value, modifier) {
    var badge = document.createElement('span');
    badge.className = 'wb-specialty-badge' + (modifier ? ' wb-specialty-badge--' + modifier : '');
    badge.setAttribute('aria-label', label + ': ' + value);
    var count = document.createElement('strong');
    count.textContent = String(value);
    var caption = document.createElement('span');
    caption.textContent = label;
    badge.appendChild(count);
    badge.appendChild(caption);
    return badge;
  }

  function decorateExtensionWorkspace(scope) {
    scope.querySelectorAll('.wb-extension-workspace').forEach(function(workspace) {
      workspace.classList.add('wb-specialty-workspace', 'wb-specialty-workspace--extension');
      var pageType = workspace.getAttribute('data-wb-extension-page') || 'extension';
      workspace.setAttribute('data-wb-specialty-page', pageType);

      var table = workspace.querySelector('.wb-data-table');
      var rows = table ? Array.prototype.slice.call(table.querySelectorAll('tbody tr:not(.tbl_row_noresults)')) : [];
      var actions = workspace.querySelectorAll('.wb-row-action, .wb-form-actions button, .wb-form-actions a').length;
      var dangerActions = workspace.querySelectorAll('.wb-row-action--danger, .formbutton-danger').length;
      workspace.setAttribute('data-wb-extension-records', String(rows.length));
      workspace.setAttribute('data-wb-extension-actions', String(actions));

      var hero = workspace.querySelector('.wb-extension-hero');
      if (hero && !hero.querySelector('.wb-specialty-badges')) {
        var badges = document.createElement('div');
        badges.className = 'wb-specialty-badges';
        badges.appendChild(createBadge(localized('Einträge', 'Entries'), rows.length, 'records'));
        if (actions > 0) badges.appendChild(createBadge(localized('Aktionen', 'Actions'), actions, 'actions'));
        if (dangerActions > 0) badges.appendChild(createBadge(localized('Kritisch', 'Critical'), dangerActions, 'danger'));
        hero.appendChild(badges);
      }

      workspace.querySelectorAll('.wb-data-table tbody tr').forEach(function(row) {
        row.classList.add('wb-specialty-row');
        if (row.querySelector('.wb-row-action--danger, .formbutton-danger')) row.classList.add('wb-specialty-row--destructive');
      });
    });
  }

  function decorateMonitoringWorkspace(scope) {
    scope.querySelectorAll('.wb-monitor-workspace').forEach(function(workspace) {
      workspace.classList.add('wb-specialty-workspace', 'wb-specialty-workspace--monitoring');
      var charts = workspace.querySelectorAll('[data-wb-chart-card]').length;
      var states = workspace.querySelectorAll('.stateview .alert, .systemmonitor .alert, .wb-monitor-state-card').length;
      workspace.setAttribute('data-wb-monitor-charts', String(charts));
      workspace.setAttribute('data-wb-monitor-states', String(states));

      var hero = workspace.querySelector('.wb-monitor-hero');
      if (hero && !hero.querySelector('.wb-specialty-badges')) {
        var badges = document.createElement('div');
        badges.className = 'wb-specialty-badges';
        if (states > 0) badges.appendChild(createBadge(localized('Status', 'Status'), states, 'records'));
        if (charts > 0) badges.appendChild(createBadge(localized('Diagramme', 'Charts'), charts, 'actions'));
        hero.appendChild(badges);
      }

      workspace.querySelectorAll('.wb-monitor-refresh-panel, .wb-monitor-refresh').forEach(function(panel) {
        panel.classList.add('wb-specialty-control-strip');
        var select = panel.querySelector('select');
        if (select && !panel.querySelector('.wb-specialty-control-hint')) {
          var hint = document.createElement('span');
          hint.className = 'wb-specialty-control-hint';
          hint.textContent = select.value
            ? localized('Automatische Aktualisierung aktiv', 'Automatic refresh active')
            : localized('Manuelle Aktualisierung', 'Manual refresh');
          panel.appendChild(hint);
        }
      });
    });
  }

  function decorate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('textarea.form-control').forEach(function (field) {
      var identity = [field.name || '', field.id || ''].join(' ');
      field.classList.add('wb-textarea-field');
      if (codeFieldPattern.test(identity)) {
        field.classList.add('wb-code-field');
        field.setAttribute('spellcheck', 'false');
      }
      if (field.readOnly || field.disabled) field.classList.add('wb-readonly-field');
    });

    scope.querySelectorAll('[role="progressbar"]').forEach(function (bar) {
      var value = Number(bar.getAttribute('aria-valuenow'));
      var label = bar.querySelector('span');
      bar.closest('.progress')?.classList.add('wb-progress');
      if (!bar.getAttribute('aria-label') && Number.isFinite(value)) {
        bar.setAttribute('aria-label', (label && label.textContent.trim()) || (value + '% used'));
      }
    });

    var monitorSurface = scope.querySelector('.systemmonitor, .stateview, .codeview, .panel_system');
    if (monitorSurface) {
      document.body.classList.add('wb-monitor-page');
      var page = document.getElementById('pageContent');
      if (page) page.classList.add('wb-monitor-surface');
      scope.querySelectorAll('#refreshinterval').forEach(function (field) {
        var group = field.closest('.form-group');
        if (group) group.classList.add('wb-monitor-refresh');
      });
      scope.querySelectorAll('.stateview .alert, .systemmonitor .alert').forEach(function (card) {
        card.classList.add('wb-monitor-state-card');
        var state = card.classList.contains('alert-danger') ? 'danger' :
          card.classList.contains('alert-warning') ? 'warning' :
          card.classList.contains('alert-success') ? 'success' : 'info';
        card.setAttribute('data-wb-monitor-state', state);
        var title = card.querySelector('h3');
        if (title) title.classList.add('wb-monitor-state-card__title');
        var summary = card.querySelector('.statusDevice > p');
        if (summary && !summary.querySelector('.wb-monitor-state-metrics')) {
          summary.classList.add('wb-monitor-state-card__summary');
          var match = summary.textContent.replace(/\s+/g, ' ').trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
          if (match) {
            summary.textContent = match[1];
            var metrics = document.createElement('span');
            metrics.className = 'wb-monitor-state-metrics';
            match[2].split(',').forEach(function(metric) {
              var chip = document.createElement('span');
              chip.className = 'wb-monitor-state-metric';
              chip.textContent = metric.trim();
              metrics.appendChild(chip);
            });
            summary.appendChild(metrics);
          }
        }
        var status = card.querySelector('.statusDevice');
        if (status) status.classList.add('wb-monitor-state-card__body');
        card.querySelectorAll('a').forEach(function(link) { link.classList.add('wb-monitor-state-card__action'); });
      });
    } else if (scope === document || scope.id === 'pageContent') {
      document.body.classList.remove('wb-monitor-page');
    }

    decorateExtensionWorkspace(scope);
    decorateMonitoringWorkspace(scope);
  }

  document.addEventListener('DOMContentLoaded', function () { decorate(document); });
  document.addEventListener('workbench:navigation-complete', function (event) {
    decorate(event.detail && event.detail.root ? event.detail.root : document.getElementById('pageContent'));
  });
  window.WorkbenchAdvancedControls = { decorate: decorate };
})();
