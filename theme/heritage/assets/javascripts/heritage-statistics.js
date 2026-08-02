(function (window, document) {
  'use strict';

  function app() {
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  }

  var runtime = app();
  if (!runtime || runtime.workbenchStatisticsInstalled) return;

  var reports = [
    { key: 'web', path: 'sites/web_sites_stats.php', labels: { de: 'Web-Traffic', en: 'Web traffic' } },
    { key: 'ftp', path: 'sites/ftp_sites_stats.php', labels: { de: 'FTP-Traffic', en: 'FTP traffic' } },
    { key: 'user-quota', path: 'sites/user_quota_stats.php', labels: { de: 'Web-Quotas', en: 'Web quotas' } },
    { key: 'database-quota', path: 'sites/database_quota_stats.php', labels: { de: 'Datenbank-Quotas', en: 'Database quotas' } },
    { key: 'backups', path: 'sites/backup_stats.php', labels: { de: 'Backups', en: 'Backups' } }
  ];

  var copy = {
    de: {
      eyebrow: 'Webseiten / Statistiken', title: 'Statistik-Arbeitsbereich',
      description: 'Nutzung, Kapazitaeten und Sicherungsstatus in einer einheitlichen Ansicht.',
      visible: 'Sichtbare Eintraege', filters: 'Aktive Filter', notices: 'Quota-Hinweise',
      report: 'Aktueller Report', reports: 'Statistikbereiche', none: 'Keine',
      healthy: 'Keine sichtbaren Quota-Warnungen', warning: '{count} sichtbare Quota-Werte ab 75 %',
      open: '{name} oeffnen'
    },
    en: {
      eyebrow: 'Sites / Statistics', title: 'Statistics workspace',
      description: 'Usage, capacity and backup status in one consistent workspace.',
      visible: 'Visible entries', filters: 'Active filters', notices: 'Quota notices',
      report: 'Current report', reports: 'Statistics areas', none: 'None',
      healthy: 'No visible quota warnings', warning: '{count} visible quota values at or above 75%',
      open: 'Open {name}'
    }
  };

  function language() {
    var words = (document.body && document.body.textContent || '').toLowerCase();
    return /\b(uebersicht|webseiten|einstellungen|abmelden|statistik)\b/.test(words) ? 'de' : 'en';
  }

  function t(key, values) {
    var value = (copy[language()] || copy.en)[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      value = value.replace(new RegExp('\\{' + name + '\\}', 'g'), String(values[name]));
    });
    return value;
  }

  function currentReport(pageName) {
    var normalized = String(pageName || '').replace(/^\//, '');
    return reports.find(function (report) { return normalized.indexOf(report.path) >= 0; }) || null;
  }

  function recordRows(table) {
    return Array.prototype.filter.call(table.querySelectorAll('tbody > tr'), function (row) {
      if (row.classList.contains('tbl_row_noresults')) return false;
      if (row.hasAttribute('data-workbench-summary-row')) return false;
      if (row.querySelector('[data-workbench-summary-cell]')) return false;
      return row.querySelectorAll('td').length > 1;
    });
  }

  function activeFilters(host) {
    return Array.prototype.filter.call(host.querySelectorAll('thead [name^="search_"]:not([name="search_limit"])'), function (control) {
      return String(control.value || '').trim() !== '';
    }).length;
  }

  function quotaNotices(host) {
    return Array.prototype.filter.call(host.querySelectorAll('.progress [aria-valuenow]'), function (bar) {
      return Number(bar.getAttribute('aria-valuenow')) >= 75;
    }).length;
  }

  function metric(label, value, state, detail) {
    var card = document.createElement('article');
    card.className = 'wb-statistics-metric wb-statistics-metric--' + (state || 'neutral');
    var labelNode = document.createElement('span');
    labelNode.className = 'wb-statistics-metric__label';
    labelNode.textContent = label;
    var valueNode = document.createElement('strong');
    valueNode.className = 'wb-statistics-metric__value';
    valueNode.textContent = value;
    var detailNode = document.createElement('small');
    detailNode.className = 'wb-statistics-metric__detail';
    detailNode.textContent = detail || '';
    card.appendChild(labelNode);
    card.appendChild(valueNode);
    card.appendChild(detailNode);
    return card;
  }

  function navigation(active) {
    var nav = document.createElement('nav');
    nav.className = 'wb-statistics-navigation';
    nav.setAttribute('aria-label', t('reports'));
    reports.forEach(function (report) {
      var label = report.labels[language()] || report.labels.en;
      var link = document.createElement('a');
      link.href = '#';
      link.className = 'wb-statistics-navigation__item';
      link.textContent = label;
      link.setAttribute('data-workbench-load-content', report.path);
      link.setAttribute('aria-label', t('open', { name: label }));
      if (report.key === active.key) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
      nav.appendChild(link);
    });
    return nav;
  }

  function enhance(pageName) {
    var report = currentReport(pageName || (window.history.state && window.history.state.workbenchContent));
    var host = document.getElementById('pageContent');
    if (!host) return false;
    document.body.classList.toggle('wb-statistics-page', Boolean(report));
    if (!report || host.dataset.wbStatisticsReport === report.key) return Boolean(report);

    var table = host.querySelector('.table-wrapper table.table, table.table');
    if (!table) return false;
    host.dataset.wbStatisticsEnhanced = 'true';
    host.dataset.wbStatisticsReport = report.key;
    host.classList.add('wb-statistics-workspace');
    var rows = recordRows(table);
    var filters = activeFilters(host);
    var notices = quotaNotices(host);
    var reportLabel = report.labels[language()] || report.labels.en;

    var oldHeader = host.querySelector(':scope > .page-header');
    if (oldHeader) oldHeader.hidden = true;
    var duplicateLegend = host.querySelector(':scope > .fieldset-legend');
    if (duplicateLegend) duplicateLegend.hidden = true;

    var hero = document.createElement('header');
    hero.className = 'wb-statistics-hero';
    var eyebrow = document.createElement('span');
    eyebrow.className = 'wb-statistics-hero__eyebrow';
    eyebrow.textContent = t('eyebrow');
    var copy = document.createElement('div');
    var title = document.createElement('h1');
    title.textContent = t('title');
    var description = document.createElement('p');
    description.textContent = t('description');
    copy.appendChild(title);
    copy.appendChild(description);
    hero.appendChild(eyebrow);
    hero.appendChild(copy);
    host.insertBefore(hero, host.firstChild);
    hero.insertAdjacentElement('afterend', navigation(report));

    var metrics = document.createElement('section');
    metrics.className = 'wb-statistics-metrics';
    metrics.setAttribute('aria-label', t('title'));
    metrics.appendChild(metric(t('visible'), String(rows.length), 'neutral', reportLabel));
    metrics.appendChild(metric(t('filters'), filters ? String(filters) : t('none'), filters ? 'active' : 'neutral', filters ? t('report') : ''));
    metrics.appendChild(metric(t('notices'), String(notices), notices ? 'warning' : 'healthy', notices ? t('warning', { count: notices }) : t('healthy')));
    metrics.appendChild(metric(t('report'), reportLabel, 'accent', t('reports')));
    host.querySelector('.wb-statistics-navigation').insertAdjacentElement('afterend', metrics);

    var wrapper = table.closest('.table-wrapper');
    if (wrapper) wrapper.classList.add('wb-statistics-table');
    table.classList.add('wb-statistics-data-table');
    if (window.workbenchIcons) window.workbenchIcons.render(host);
    return true;
  }

  document.addEventListener('workbench:navigation-complete', function (event) {
    enhance(event.detail && event.detail.page);
  });
  document.addEventListener('click', function (event) {
    var launcher = event.target && event.target.closest ? event.target.closest('.wb-statistics-launcher[data-workbench-load-content], .wb-statistics-launcher[data-load-content]') : null;
    var current = app();
    if (!launcher || !current || typeof current.capp !== 'function') return;
    event.preventDefault();
    var path = launcher.getAttribute('data-workbench-load-content') || launcher.getAttribute('data-load-content');
    launcher.setAttribute('aria-busy', 'true');
    current.workbenchActiveModule = 'sites';
    var request = current.capp('sites', path);
    Promise.resolve(request && request.promise ? request.promise : request)
      .catch(function () { if (current.reportError) current.reportError('Statistics could not be opened.'); })
      .finally(function () { if (launcher.isConnected) launcher.removeAttribute('aria-busy'); });
  });
  runtime.registerHook('onAfterContentLoad', function (name, params) {
    enhance(params && params.url ? params.url : (window.history.state && window.history.state.workbenchContent));
  });

  window.workbenchStatistics = { enhance: enhance, reports: reports.slice() };
  runtime.workbenchStatisticsInstalled = true;
})(window, document);
