(function () {
  'use strict';

  var STORAGE_KEY = 'ispconfig-workbench.dashboard.layout.v7';
  // V2 retires persisted row-spanning layouts that could turn quota and
  // statistics widgets into a single extremely tall grid track after login.
  // The storage key stays stable; the revision deliberately resets only the
  // incompatible geometry while preserving the public layout contract.
  var LAYOUT_REVISION = 'premium-density-v3';
  var sizes = ['1x1', '1x2', '2x2'];
  var defaults = {
    modules: '2x2',
    metrics: '2x2',
    statistics: '1x2',
    limits: '1x1',
    databasequota: '1x1',
    quota: '1x1',
    mailquota: '1x1',
    donate: '1x1',
    news: '1x1'
  };
  var defaultOrder = {
    modules: 10,
    metrics: 20,
    statistics: 25,
    limits: 30,
    quota: 40,
    mailquota: 50,
    databasequota: 60,
    news: 90,
    donate: 100
  };
  var defaultHidden = {
    donate: true,
    news: true,
    quota: true,
    mailquota: true,
    databasequota: true
  };
  var priority = {
    modules: 'primary',
    metrics: 'primary',
    statistics: 'primary',
    limits: 'operational',
    quota: 'operational',
    mailquota: 'operational',
    databasequota: 'operational',
    news: 'secondary',
    donate: 'secondary'
  };
  var copy = {
    en: {
      moreItems: '{count} more items available', showMore: 'Show more', expandWidget: 'Expand {name}', widget: 'widget',
      overview: 'Dashboard overview', availableModules: 'Available modules', quickDestinations: 'Quick destinations',
      needsAttention: 'Needs attention', attentionDetail: '{critical} critical, {warning} warnings', activeWidgets: 'Active widgets',
      personalLayout: 'Personal browser layout', layoutEditing: 'Layout mode: drag widgets or use the arrow and size controls.',
      layoutSaved: 'Your personal widget layout is saved in this browser.', finishEditing: 'Finish editing',
      customizeDashboard: 'Customize dashboard', showHiddenCount: 'Show hidden widgets ({count})', noHiddenWidgets: 'No hidden widgets',
      layoutControls: '{name} layout controls', dashboardWidget: 'Dashboard widget', moveEarlier: 'Move widget earlier',
      moveLater: 'Move widget later', hide: 'Hide', accountLimitSummary: 'Account limit summary', limitsTracked: 'limits tracked',
      warning: 'warning', warnings: 'warnings', critical: 'critical', showDetails: 'Show details', hideDetails: 'Hide details',
      accountLimitWarnings: 'Account limit warnings', limitsHealthy: 'All account limits are within the configured range.',
      accountLimit: 'Account limit', moreInDetails: '+{count} more in details', dashboardLayoutControls: 'Dashboard layout controls',
      resetLayout: 'Reset layout', showHiddenWidgets: 'Show hidden widgets', openModule: 'Open module', editHint: 'Move and resize',
      dragWidget: 'Drag {name} to reposition', resizeTo: 'Resize {name} to {size}', hideWidget: 'Hide {name}',
      emptyTitle: 'Your dashboard is clear', emptyText: 'All widgets are hidden. Restore the recommended operational view or choose every widget from the toolbar.', restoreWidgets: 'Restore recommended view',
      confirmReset: 'Confirm reset', resetWarning: 'Click again to restore the default widget order and sizes.',
      workspace: 'Operations workspace', workspaceSummary: 'Services, capacity and shortcuts at a glance.',
      destinationCount: '{count} destinations', destinationSingle: '1 destination', metricCount: '{count} live metrics', metricSingle: '1 live metric',
      capacityHealthy: '{count} capacity checks - healthy', capacityAttention: '{count} capacity checks - {attention} notices',
      newsCount: '{count} updates', optionalContent: 'Optional',
      currentValue: 'Current value', systemLoad: 'System load', memoryUsage: 'Memory usage', networkIn: 'Network in', networkOut: 'Network out',
      limitMail: 'Email', limitWeb: 'Web & access', limitDns: 'DNS', limitDatabase: 'Databases', limitClients: 'Customers & users', limitOther: 'Other',
      groupHealthy: 'Within range', groupAttention: '{count} notices', quotaEntries: 'Entries', totalUsage: 'Total usage', quotaHealthy: 'No quota warnings', quotaAttention: '{count} need attention',
      moduleWidget: 'Module', metricWidget: 'Metric', individualModule: 'Single module', individualMetric: 'Live metric',
      sizeCompact: 'Compact', sizeTall: 'Tall', sizeDetail: 'Detail',
      sizeCompactHint: 'Fits one dashboard tile', sizeTallHint: 'More vertical detail', sizeDetailHint: 'Largest dashboard view'
    },
    de: {
      moreItems: '{count} weitere Einträge verfügbar', showMore: 'Mehr anzeigen', expandWidget: '{name} vergrößern', widget: 'Widget',
      overview: 'Dashboard-Übersicht', availableModules: 'Verfügbare Module', quickDestinations: 'Direkteinstiege',
      needsAttention: 'Aufmerksamkeit', attentionDetail: '{critical} kritisch, {warning} Warnungen', activeWidgets: 'Aktive Widgets',
      personalLayout: 'Persönliches Browser-Layout', layoutEditing: 'Layoutmodus: Widgets ziehen oder Pfeil- und Größensteuerung verwenden.',
      layoutSaved: 'Das persönliche Widget-Layout ist in diesem Browser gespeichert.', finishEditing: 'Bearbeitung beenden',
      customizeDashboard: 'Dashboard anpassen', showHiddenCount: 'Ausgeblendete Widgets zeigen ({count})', noHiddenWidgets: 'Keine ausgeblendeten Widgets',
      accountLimit: 'Kontolimit', moreInDetails: '+{count} weitere in den Details', dashboardLayoutControls: 'Dashboard-Layoutsteuerung',
      moveLater: 'Widget nach hinten verschieben', hide: 'Ausblenden', accountLimitSummary: 'Zusammenfassung der Kontolimits', limitsTracked: 'Limits überwacht',
      warning: 'Warnung', warnings: 'Warnungen', critical: 'kritisch', showDetails: 'Details anzeigen', hideDetails: 'Details ausblenden',
      accountLimitWarnings: 'Warnungen zu Kontolimits', limitsHealthy: 'Alle Kontolimits liegen im konfigurierten Bereich.',
      layoutControls: 'Layoutsteuerung für {name}', dashboardWidget: 'Dashboard-Widget', moveEarlier: 'Widget nach vorne verschieben',
      resetLayout: 'Layout zurücksetzen', showHiddenWidgets: 'Ausgeblendete Widgets zeigen', openModule: 'Modul öffnen', editHint: 'Verschieben und skalieren',
      dragWidget: '{name} zum Verschieben ziehen', resizeTo: '{name} auf {size} skalieren', hideWidget: '{name} ausblenden',
      emptyTitle: 'Das Dashboard ist aufgeräumt', emptyText: 'Alle Widgets sind ausgeblendet. Stelle die empfohlene Arbeitsansicht wieder her oder zeige über die Werkzeugleiste bewusst alle Widgets.', restoreWidgets: 'Empfohlene Ansicht wiederherstellen',
      confirmReset: 'Zurücksetzen bestätigen', resetWarning: 'Erneut klicken, um Standardreihenfolge und -größen wiederherzustellen.',
      workspace: 'Arbeitsbereich Betrieb', workspaceSummary: 'Dienste, Kapazitäten und Direkteinstiege auf einen Blick.',
      destinationCount: '{count} Direkteinstiege', destinationSingle: '1 Direkteinstieg', metricCount: '{count} Live-Kennzahlen', metricSingle: '1 Live-Kennzahl',
      capacityHealthy: '{count} Kapazitaetspruefungen - stabil', capacityAttention: '{count} Kapazitaetspruefungen - {attention} Hinweise',
      newsCount: '{count} Meldungen', optionalContent: 'Optional',
      currentValue: 'Aktueller Wert', systemLoad: 'Systemlast', memoryUsage: 'Speicherauslastung', networkIn: 'Netzwerk eingehend', networkOut: 'Netzwerk ausgehend',
      limitMail: 'E-Mail', limitWeb: 'Web & Zugänge', limitDns: 'DNS', limitDatabase: 'Datenbanken', limitClients: 'Kunden & Benutzer', limitOther: 'Sonstige',
      groupHealthy: 'Im grünen Bereich', groupAttention: '{count} Hinweise', quotaEntries: 'Einträge', totalUsage: 'Gesamtnutzung', quotaHealthy: 'Keine Quota-Warnungen', quotaAttention: '{count} benötigen Aufmerksamkeit',
      moduleWidget: 'Modul', metricWidget: 'Kennzahl', individualModule: 'Einzelmodul', individualMetric: 'Live-Kennzahl',
      sizeCompact: 'Kompakt', sizeTall: 'Hoch', sizeDetail: 'Detail',
      sizeCompactHint: 'Passt in eine Dashboard-Kachel', sizeTallHint: 'Mehr vertikale Details', sizeDetailHint: 'Groesste Dashboard-Ansicht'
    }
  };

  function language() {
    var active = typeof window.workbenchLanguage === 'function' ? window.workbenchLanguage() : String(document.documentElement.lang || 'en');
    return String(active).toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }

  function t(key, values) {
    var text = (copy[language()] && copy[language()][key]) || copy.en[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), String(values[name]));
    });
    return text;
  }

  function readLayout() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return stored && stored.__revision === LAYOUT_REVISION ? stored : {};
    }
    catch (error) { return {}; }
  }

  function writeLayout(layout) {
    try {
      layout.__revision = LAYOUT_REVISION;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    }
    catch (error) { /* Private browsing may disable localStorage. */ }
  }

  function dashlets(host) {
    return Array.prototype.slice.call(host.querySelectorAll(':scope > .wb-dashlet'));
  }

  function normalizeServerDashlets(host) {
    var boundary = host.querySelector(':scope > [data-wb-dashboard-server-content]');
    if (!boundary) return;
    var widgets = Array.prototype.slice.call(boundary.children).filter(function (node) {
      return node.classList && node.classList.contains('wb-dashlet');
    });
    widgets.forEach(function (node) {
      boundary.insertAdjacentElement('beforebegin', node);
    });
    if (!boundary.children.length && !boundary.textContent.trim()) boundary.remove();
  }

  function makeEl(tag, className, value) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined && value !== null) item.textContent = value;
    return item;
  }

  function hiddenIcon(className, value) {
    var item = makeEl('span', className, value);
    item.setAttribute('aria-hidden', 'true');
    return item;
  }

  function dashboardButton(label, attributes) {
    var button = makeEl('button', '', label);
    button.type = 'button';
    Object.keys(attributes || {}).forEach(function (name) {
      button.setAttribute(name, attributes[name]);
    });
    return button;
  }

  function slug(value) {
    return String(value || 'widget').toLowerCase()
      .replace(/&[a-z0-9#]+;/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'widget';
  }

  function sizeLabel(size) {
    if (size === '1x2') return t('sizeTall');
    if (size === '2x2') return t('sizeDetail');
    return t('sizeCompact');
  }

  function sizeHint(size) {
    if (size === '1x2') return t('sizeTallHint');
    if (size === '2x2') return t('sizeDetailHint');
    return t('sizeCompactHint');
  }

  function setSize(node, size) {
    var safe = sizes.indexOf(size) >= 0 ? size : '1x1';
    node.dataset.wbSize = safe;
    node.setAttribute('data-wb-size', safe);
    node.setAttribute('data-wb-density', safe === '1x1' ? 'compact' : 'expanded');
    if (node.dataset.wbAtomicSource === 'modules') {
      node.dataset.wbModuleViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    if (node.dataset.wbAtomicSource === 'metrics') {
      node.dataset.wbMetricViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    node.classList.remove('wb-dashlet-size-1x1', 'wb-dashlet-size-1x2', 'wb-dashlet-size-2x2');
    node.classList.add('wb-dashlet-size-' + safe);
    Array.prototype.forEach.call(node.querySelectorAll('[data-wb-layout-size]'), function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-wb-layout-size') === safe ? 'true' : 'false');
    });
    syncDensity(node);
    syncMetricAnalysisVisibility(node, safe);
  }

  function syncMetricAnalysisVisibility(node, size) {
    if (node.dataset.wbAtomicSource !== 'metrics') return;
    var expanded = size === '2x2';
    Array.prototype.forEach.call(node.querySelectorAll('[data-wb-metric-details]'), function (details) {
      details.hidden = !expanded;
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-wb-metric-toggle]'), function (toggle) {
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function densityItems(node) {
    var name = node.dataset.wbDashlet;
    if (name === 'modules') return Array.prototype.slice.call(node.querySelectorAll('.modules > li'));
    if (name === 'news') return Array.prototype.slice.call(node.querySelectorAll('ul > li'));
    if (name === 'metrics') return Array.prototype.slice.call(node.querySelectorAll('.wb-dashboard-metric-card'));
    if (name === 'statistics') return Array.prototype.slice.call(node.querySelectorAll('.wb-statistics-launcher'));
    if (name === 'quota' || name === 'mailquota' || name === 'databasequota') {
      return Array.prototype.slice.call(node.querySelectorAll('.table-wrapper table > tbody > tr'));
    }
    return [];
  }

  function densityLimit(node) {
    return node.dataset.wbDashlet === 'modules' ? 4 : node.dataset.wbDashlet === 'news' ? 3 : node.dataset.wbDashlet === 'metrics' ? 2 : node.dataset.wbDashlet === 'statistics' ? 3 : 5;
  }

  function syncDensity(node) {
    var items = densityItems(node);
    var compact = node.dataset.wbSize === '1x1';
    var limit = densityLimit(node);
    var hiddenCount = 0;
    items.forEach(function (item, index) {
      var hide = compact && index >= limit;
      if (hide) {
        item.hidden = true;
        item.dataset.wbDensityHidden = 'true';
        hiddenCount += 1;
      } else if (item.dataset.wbDensityHidden === 'true') {
        item.hidden = false;
        delete item.dataset.wbDensityHidden;
      }
    });
    var existing = node.querySelector(':scope > .wb-dashlet__density-note');
    if (existing) existing.remove();
    if (!hiddenCount) return;
    var note = document.createElement('div');
    note.className = 'wb-dashlet__density-note';
    note.setAttribute('role', 'status');
    var text = document.createElement('span');
    text.textContent = t('moreItems', { count: hiddenCount });
    note.appendChild(text);
    var expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'wb-dashlet__density-expand';
    expand.textContent = t('showMore');
    expand.setAttribute('aria-label', t('expandWidget', { name: node.getAttribute('aria-label') || t('widget') }));
    expand.addEventListener('click', function () {
      setSize(node, node.dataset.wbDashlet === 'modules' ? '2x2' : '1x2');
      var host = node.parentElement;
      if (host) save(host);
    });
    note.appendChild(expand);
    node.appendChild(note);
  }

  function hiddenCount(host) {
    return dashlets(host).filter(function (node) { return node.dataset.wbHidden === 'true'; }).length;
  }

  function decorateModules(node) {
    if (node.dataset.wbModulesDecorated === 'true') return;
    Array.prototype.forEach.call(node.querySelectorAll('.modules > li'), function (launcher) {
      var title = launcher.querySelector('.title');
      var action = launcher.querySelector('a.button[data-workbench-module], a.button[data-capp]');
      launcher.classList.add('wb-module-launcher');
      if (title && !launcher.querySelector('.wb-module-launcher__meta')) {
        var meta = document.createElement('span');
        meta.className = 'wb-module-launcher__meta';
        meta.textContent = t('openModule');
        title.insertAdjacentElement('afterend', meta);
      }
      if (action) {
        action.classList.add('wb-module-launcher__action');
        action.setAttribute('aria-label', (action.textContent || t('openModule')).replace(/\s+/g, ' ').trim());
      }
    });
    node.dataset.wbModulesDecorated = 'true';
  }

  function standardModuleTitle(moduleName) {
    var labels = language() === 'de' ? {
      dashboard: '\u00dcbersicht', help: 'Support', client: 'Kunden', sites: 'Webseiten',
      billing: 'Fakturierung', mail: 'E-Mail', dns: 'DNS', monitor: '\u00dcberwachung',
      tools: 'Einstellungen', admin: 'System'
    } : {
      dashboard: 'Overview', help: 'Support', client: 'Clients', sites: 'Sites',
      billing: 'Billing', mail: 'Email', dns: 'DNS', monitor: 'Monitoring',
      tools: 'Settings', admin: 'System'
    };
    return labels[String(moduleName || '').trim().toLowerCase()] || '';
  }

  function splitModuleDashlet(host) {
    var source = host.querySelector(':scope > .wb-dashlet[data-wb-dashlet="modules"]');
    if (!source || source.dataset.wbAtomicSplit === 'true') return;
    decorateModules(source);
    var items = Array.prototype.slice.call(source.querySelectorAll('.modules > li.wb-module-launcher'));
    if (!items.length) return;
    var anchor = source;
    items.forEach(function (item, index) {
      var titleNode = item.querySelector('.title');
      var title = titleNode ? titleNode.textContent.replace(/\s+/g, ' ').trim() : t('moduleWidget') + ' ' + (index + 1);
      var moduleLink = item.querySelector('[data-capp]');
      var moduleName = moduleLink ? moduleLink.getAttribute('data-capp') : '';
      var navigationItems = Array.prototype.slice.call(document.querySelectorAll('#workbench-mobile-navigation [data-workbench-module], #main-navigation [data-workbench-module]'));
      var matchingNavigationItems = navigationItems.filter(function (candidate) {
        return candidate.getAttribute('data-workbench-module') === moduleName;
      });
      var completeTitle = matchingNavigationItems.map(function (candidate) {
        var navigationTitle = candidate.querySelector('.title');
        return (navigationTitle ? navigationTitle.textContent : candidate.getAttribute('aria-label') || candidate.textContent || '').replace(/\s+/g, ' ').trim();
      }).sort(function (left, right) { return right.length - left.length; })[0] || standardModuleTitle(moduleName);
      if (completeTitle) {
        var shortenedTitle = title;
        title = completeTitle;
        if (titleNode) titleNode.textContent = completeTitle;
        if (moduleLink && shortenedTitle && moduleLink.textContent.indexOf(shortenedTitle) !== -1) {
          moduleLink.textContent = moduleLink.textContent.replace(shortenedTitle, completeTitle);
        }
      }
      var article = document.createElement('section');
      article.className = 'wb-dashlet wb-dashlet-module-atomic';
      article.dataset.wbDashlet = 'module-' + slug(title) + '-' + index;
      article.dataset.wbAtomicSource = 'modules';
      article.dataset.wbAtomicLabel = t('individualModule');
      article.dataset.wbDashboardCockpit = 'module';
      article.dataset.wbPriority = 'primary';
      article.dataset.wbDefaultOrder = String(10 + index);
      article.setAttribute('data-wb-cockpit-card', 'module');
      var heading = makeEl('h3', '', title);
      var wrapper = makeEl('div', 'dashboard-modules-wrapper wb-dashboard-atomic-module');
      var list = makeEl('ul', 'modules');
      wrapper.appendChild(list);
      article.appendChild(heading);
      article.appendChild(wrapper);
      list.appendChild(item);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.wbAtomicSplit = 'true';
    source.remove();
  }

  function decorateDonate(node) {
    if (node.dataset.wbDonateDecorated === 'true') return;
    var button = node.querySelector('.wb-donate-card__toggle');
    var description = node.querySelector('[data-wb-donate-description], #description');
    if (!button || !description) {
      node.dataset.wbDonateDecorated = 'true';
      return;
    }
    if (!description.id) {
      description.id = 'wb-donate-description-' + Math.random().toString(36).slice(2, 8);
    }
    button.setAttribute('aria-controls', description.id);
    description.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      description.hidden = expanded;
    });
    node.dataset.wbDonateDecorated = 'true';
  }

  function chartInstance(canvas) {
    if (!window.Chart) return null;
    if (typeof window.Chart.getChart === 'function') return window.Chart.getChart(canvas) || null;
    var match = null;
    Object.keys(window.Chart.instances || {}).some(function (key) {
      var chart = window.Chart.instances[key];
      if (chart && chart.canvas === canvas) { match = chart; return true; }
      return false;
    });
    return match;
  }

  function metricFallback(canvas) {
    return { loadchart: t('systemLoad'), memchart: t('memoryUsage'), rxchart: t('networkIn'), txchart: t('networkOut') }[canvas.id] || t('currentValue');
  }

  function metricValue(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '-';
    return number.toLocaleString(language() === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 });
  }

  function metricSource(card) {
    return card.querySelector('canvas, .wb-dashboard-sparkline');
  }

  function metricValuesFromSparkline(source) {
    if (!source || !source.dataset || !source.dataset.wbMetricValues) return [];
    return source.dataset.wbMetricValues.split(',').map(Number).filter(Number.isFinite);
  }

  function metricLabelFromSource(source) {
    if (!source) return t('currentValue');
    return source.dataset && source.dataset.wbMetricLabel || source.getAttribute('aria-label') || metricFallback(source);
  }

  function syncMetricCards(node) {
    Array.prototype.forEach.call(node.querySelectorAll('.wb-dashboard-metric-card'), function (card) {
      var canvas = card.querySelector('canvas');
      var source = metricSource(card);
      var chart = canvas && chartInstance(canvas);
      var dataset = chart && chart.data && chart.data.datasets && chart.data.datasets[0];
      var values = dataset && dataset.data || metricValuesFromSparkline(source);
      var latest = values.length ? values[values.length - 1] : null;
      var label = card.querySelector('.wb-dashboard-metric-card__label');
      var value = card.querySelector('.wb-dashboard-metric-card__value');
      if (label) label.textContent = dataset && dataset.label || metricLabelFromSource(source || canvas || {});
      if (value) value.textContent = metricValue(latest);
      if (!chart) return;
      chart.options = chart.options || {};
      chart.options.plugins = chart.options.plugins || {};
      chart.options.plugins.legend = chart.options.plugins.legend || {};
      chart.options.plugins.legend.display = false;
      Object.keys(chart.options.scales || {}).forEach(function (key) {
        var scale = chart.options.scales[key];
        if (key === 'x') scale.display = false;
        scale.ticks = scale.ticks || {};
        scale.ticks.maxTicksLimit = 3;
      });
      if (dataset) { dataset.pointRadius = 0; dataset.pointHoverRadius = 3; dataset.borderWidth = 1.6; }
      canvas.style.removeProperty('background-color');
      if (typeof chart.update === 'function') chart.update('none');
    });
  }

  function decorateMetrics(node) {
    if (node.dataset.wbMetricsDecorated === 'true') return;
    var content = node.querySelector(':scope > div');
    if (!content) return;
    var title = content.querySelector(':scope > div:first-child > h3');
    var titleHolder = title && title.parentElement;
    if (title) node.insertBefore(title, content);
    if (titleHolder && !titleHolder.textContent.trim() && !titleHolder.children.length) titleHolder.remove();
    content.classList.add('wb-dashboard-metrics-grid');
    Array.prototype.forEach.call(content.children, function (container) {
      var metric = container.querySelector && container.querySelector(':scope > canvas, :scope > .wb-dashboard-sparkline');
      if (!metric) return;
      container.classList.add('wb-dashboard-metric-card');
      container.style.removeProperty('padding-bottom');
      if (!container.querySelector('.wb-dashboard-metric-card__header')) {
        var header = document.createElement('header');
        header.className = 'wb-dashboard-metric-card__header';
        var label = makeEl('span', 'wb-dashboard-metric-card__label', metricLabelFromSource(metric));
        var value = makeEl('strong', 'wb-dashboard-metric-card__value', '-');
        value.setAttribute('aria-label', t('currentValue'));
        header.appendChild(label);
        header.appendChild(value);
        container.insertBefore(header, metric);
      }
    });
    node.dataset.wbMetricsDecorated = 'true';
    window.requestAnimationFrame(function () { syncMetricCards(node); });
    window.setTimeout(function () { syncMetricCards(node); }, 120);
  }

  function splitMetricDashlet(host) {
    var source = host.querySelector(':scope > .wb-dashlet[data-wb-dashlet="metrics"]');
    if (!source || source.dataset.wbAtomicSplit === 'true') return;
    // Render the declarative metric payload before the source dashlet is split
    // into atomic widgets. Removing the source first also removed its JSON
    // payload, leaving all four charts permanently empty after login.
    if (window.workbenchDashboardMetrics && typeof window.workbenchDashboardMetrics.enhance === 'function') {
      window.workbenchDashboardMetrics.enhance(source);
    }
    decorateMetrics(source);
    var cards = Array.prototype.slice.call(source.querySelectorAll('.wb-dashboard-metric-card'));
    if (!cards.length) return;
    var anchor = source;
    cards.forEach(function (card, index) {
      var metric = metricSource(card);
      var label = card.querySelector('.wb-dashboard-metric-card__label');
      var title = label ? label.textContent.replace(/\s+/g, ' ').trim() : metricLabelFromSource(metric || {});
      var article = document.createElement('section');
      article.className = 'wb-dashlet wb-dashlet-metric-atomic';
      article.dataset.wbDashlet = 'metric-' + slug(metric && metric.id || title) + '-' + index;
      article.dataset.wbAtomicSource = 'metrics';
      article.dataset.wbAtomicLabel = t('individualMetric');
      article.dataset.wbDashboardCockpit = 'metric';
      article.dataset.wbPriority = 'primary';
      // Keep the four live metrics together as one visual dashboard group.
      // Operational limit cards follow afterwards and must not split the
      // metric sequence or impose their taller row height between charts.
      article.dataset.wbDefaultOrder = String(20 + index);
      article.setAttribute('data-wb-cockpit-card', 'metric');
      var heading = makeEl('h3', '', title);
      var metricHost = makeEl('div', 'wb-dashboard-single-metric');
      article.appendChild(heading);
      article.appendChild(metricHost);
      metricHost.appendChild(card);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.wbAtomicSplit = 'true';
    source.remove();
    window.requestAnimationFrame(function () {
      dashlets(host).forEach(function (node) {
        if (node.dataset.wbAtomicSource === 'metrics') syncMetricCards(node);
      });
    });
  }

  function splitAtomicDashlets(host) {
    var unsplitSource = host.querySelector(':scope > .wb-dashlet[data-wb-dashlet="modules"], :scope > .wb-dashlet[data-wb-dashlet="metrics"]');
    if (host.dataset.wbAtomicDashboard === 'true' && !unsplitSource) return;
    if (unsplitSource) delete host.dataset.wbAtomicDashboard;
    splitModuleDashlet(host);
    splitMetricDashlet(host);
    host.dataset.wbAtomicDashboard = 'true';
  }

  function decorateHero(header) {
    if (!header || header.dataset.wbHeroDecorated === 'true') return;
    var title = header.querySelector('h1');
    if (!title) return;
    var eyebrow = document.createElement('span');
    eyebrow.className = 'wb-dashboard-hero__eyebrow';
    eyebrow.textContent = t('workspace');
    title.insertAdjacentElement('beforebegin', eyebrow);
    var summary = document.createElement('p');
    summary.className = 'wb-dashboard-hero__summary';
    summary.textContent = t('workspaceSummary');
    title.insertAdjacentElement('afterend', summary);
    header.classList.add('wb-dashboard-hero');
    header.dataset.wbHeroDecorated = 'true';
  }

  function syncOverview(host) {
    var header = host.querySelector(':scope > .page-header');
    if (!header) return null;
    decorateHero(header);
    var overview = host.querySelector(':scope > .wb-dashboard-overview');
    if (!overview) {
      overview = document.createElement('section');
      overview.className = 'wb-dashboard-overview';
      overview.setAttribute('aria-label', t('overview'));
      header.insertAdjacentElement('afterend', overview);
    }
    var moduleCount = host.querySelectorAll('.wb-module-launcher').length;
    var warningCount = host.querySelectorAll('.progress-bar-warning').length;
    var criticalCount = host.querySelectorAll('.progress-bar-danger').length;
    var visibleCount = dashlets(host).filter(function(node) { return node.dataset.wbHidden !== 'true'; }).length;
    var totalCount = dashlets(host).length;
    var attention = warningCount + criticalCount;
    var modulesCard = overviewStat(t('availableModules'), moduleCount, t('quickDestinations'));
    var attentionCard = overviewStat(t('needsAttention'), attention, t('attentionDetail', { critical: criticalCount, warning: warningCount }), attention ? 'wb-dashboard-overview__stat--attention' : 'wb-dashboard-overview__stat--healthy');
    var layoutCard = overviewStat(t('activeWidgets'), visibleCount, t('personalLayout'), '', totalCount);
    overview.dataset.wbAttention = attention ? 'true' : 'false';
    while (overview.firstChild) overview.removeChild(overview.firstChild);
    (attention ? [attentionCard, modulesCard, layoutCard] : [modulesCard, attentionCard, layoutCard]).forEach(function (card) {
      overview.appendChild(card);
    });
    return overview;
  }

  function overviewStat(label, value, detail, modifier, total) {
    var card = makeEl('article', 'wb-dashboard-overview__stat' + (modifier ? ' ' + modifier : ''));
    var strong = makeEl('strong', '', value);
    if (total !== undefined && total !== null) strong.appendChild(makeEl('em', '', '/' + total));
    card.appendChild(makeEl('span', '', label));
    card.appendChild(strong);
    card.appendChild(makeEl('small', '', detail));
    return card;
  }

  function showAllWidgets(host) {
    dashlets(host).forEach(function (node) {
      node.hidden = false;
      node.dataset.wbHidden = 'false';
    });
    save(host);
    syncToolbar(host);
  }

  function restoreRecommended(host) {
    dashlets(host).forEach(function (node) {
      var hiddenByDefault = Boolean(defaultHidden[node.dataset.wbDashlet]);
      node.hidden = hiddenByDefault;
      node.dataset.wbHidden = hiddenByDefault ? 'true' : 'false';
      setSize(node, defaultSizeFor(node));
    });
    save(host);
    syncToolbar(host);
  }

  function syncEmptyState(host) {
    var visible = dashlets(host).some(function (node) { return node.dataset.wbHidden !== 'true'; });
    var state = host.querySelector(':scope > .wb-dashboard-empty-state');
    if (visible) {
      if (state) state.remove();
      return;
    }
    if (state) return;
    state = document.createElement('section');
    state.className = 'wb-dashboard-empty-state';
    state.setAttribute('role', 'status');
    var content = makeEl('div');
    content.appendChild(makeEl('h2', '', t('emptyTitle')));
    content.appendChild(makeEl('p', '', t('emptyText')));
    state.appendChild(hiddenIcon('wb-dashboard-empty-state__icon'));
    state.appendChild(content);
    var restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'wb-dashboard-button wb-dashboard-button--primary';
    restore.textContent = t('restoreWidgets');
    restore.addEventListener('click', function () { restoreRecommended(host); });
    state.appendChild(restore);
    var toolbar = host.querySelector(':scope > .wb-dashboard-toolbar');
    (toolbar || host.querySelector(':scope > .wb-dashboard-overview') || host.querySelector(':scope > .page-header')).insertAdjacentElement('afterend', state);
  }

  function syncToolbar(host) {
    var toolbar = host.querySelector(':scope > .wb-dashboard-toolbar');
    if (!toolbar) return;
    var editing = host.classList.contains('wb-dashboard-layout-edit');
    var count = hiddenCount(host);
    var status = toolbar.querySelector('[data-wb-layout-status]');
    var toggle = toolbar.querySelector('[data-wb-layout-toggle]');
    var show = toolbar.querySelector('[data-wb-layout-show-hidden]');
    toolbar.classList.toggle('wb-dashboard-toolbar--editing', editing);
    status.textContent = editing ? t('layoutEditing') : t('layoutSaved');
    toggle.setAttribute('aria-pressed', editing ? 'true' : 'false');
    toggle.textContent = editing ? t('finishEditing') : t('customizeDashboard');
    show.disabled = count === 0;
    show.textContent = count ? t('showHiddenCount', { count: count }) : t('noHiddenWidgets');
    syncOverview(host);
    syncEmptyState(host);
  }

  function save(host) {
    var layout = {};
    dashlets(host).forEach(function (node, index) {
      var name = node.dataset.wbDashlet;
      if (name) layout[name] = { size: node.dataset.wbSize || '1x1', order: index, hidden: node.dataset.wbHidden === 'true' };
    });
    writeLayout(layout);
  }

  function makeControls(node, host) {
    var widgetTitle = node.querySelector(':scope > h2, :scope > h3, :scope > header');
    var widgetHeader = node.querySelector(':scope > .wb-dashlet__header');
    if (!widgetHeader) {
      widgetHeader = document.createElement('div');
      widgetHeader.className = 'wb-dashlet__header';
      node.insertBefore(widgetHeader, node.firstChild);
      if (widgetTitle) widgetHeader.appendChild(widgetTitle);
    }
    if (!widgetHeader.querySelector('.wb-dashlet__type-icon')) {
      var typeIcon = document.createElement('span');
      typeIcon.className = 'wb-dashlet__type-icon';
      typeIcon.setAttribute('aria-hidden', 'true');
      widgetHeader.insertBefore(typeIcon, widgetHeader.firstChild);
    }
    var titleText = widgetTitle ? widgetTitle.textContent.replace(/\s+/g, ' ').trim() : (node.dataset.wbDashlet || t('dashboardWidget'));
    var dragHandle = document.createElement('span');
    dragHandle.className = 'wb-dashlet__drag-handle';
    dragHandle.setAttribute('role', 'button');
    dragHandle.setAttribute('tabindex', '0');
    dragHandle.setAttribute('aria-label', t('dragWidget', { name: titleText }));
    dragHandle.setAttribute('draggable', 'true');
    for (var dot = 0; dot < 6; dot += 1) dragHandle.appendChild(document.createElement('i'));
    widgetHeader.insertBefore(dragHandle, widgetHeader.firstChild);
    var editHint = document.createElement('span');
    editHint.className = 'wb-dashlet__edit-hint';
    editHint.textContent = t('editHint');
    widgetHeader.appendChild(editHint);
    var controls = document.createElement('div');
    controls.className = 'wb-dashlet__layout-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t('layoutControls', { name: titleText }));
    // Regression fix: inside makeControls the `node` parameter (the dashlet
    // element) shadows the module-level makeEl() element helper, so calling
    // makeEl('span', ...) threw "node is not a function". Build the label inline.
    var layoutLabel = document.createElement('span');
    layoutLabel.className = 'wb-dashlet__layout-label';
    layoutLabel.textContent = t('editHint');
    controls.appendChild(layoutLabel);
    controls.appendChild(dashboardButton('\u2191', { 'data-wb-layout-move': 'up', 'aria-label': t('moveEarlier') }));
    controls.appendChild(dashboardButton('\u2193', { 'data-wb-layout-move': 'down', 'aria-label': t('moveLater') }));
    controls.appendChild(dashboardButton('1\u00d71', { 'data-wb-layout-size': '1x1' }));
    controls.appendChild(dashboardButton('1\u00d72', { 'data-wb-layout-size': '1x2' }));
    controls.appendChild(dashboardButton('2\u00d72', { 'data-wb-layout-size': '2x2' }));
    controls.appendChild(dashboardButton(t('hide'), { 'data-wb-layout-hide': 'true' }));
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-wb-layout-size]');
      var move = event.target.closest('[data-wb-layout-move]');
      var hide = event.target.closest('[data-wb-layout-hide]');
      if (hide) {
        node.dataset.wbHidden = 'true';
        node.hidden = true;
        save(host);
        syncToolbar(host);
        return;
      }
      if (move) {
        var sibling = move.getAttribute('data-wb-layout-move') === 'up' ? node.previousElementSibling : node.nextElementSibling;
        if (sibling && sibling.classList.contains('wb-dashlet')) {
          if (move.getAttribute('data-wb-layout-move') === 'up') node.parentNode.insertBefore(node, sibling);
          else node.parentNode.insertBefore(sibling, node);
          save(host);
        }
        return;
      }
      if (!button) return;
      setSize(node, button.getAttribute('data-wb-layout-size'));
      save(host);
    });
    widgetHeader.appendChild(controls);
    var moveUp = controls.querySelector('[data-wb-layout-move="up"]');
    var moveDown = controls.querySelector('[data-wb-layout-move="down"]');
    var sizeLabels = controls.querySelectorAll('[data-wb-layout-size]');
    if (moveUp) moveUp.textContent = '\u2191';
    if (moveDown) moveDown.textContent = '\u2193';
    Array.prototype.forEach.call(sizeLabels, function (button) {
      var size = button.getAttribute('data-wb-layout-size');
      button.textContent = size.replace('x', '\u00d7');
      button.setAttribute('data-wb-size-code', size.replace('x', '\u00d7'));
      button.setAttribute('data-wb-size-label', sizeLabel(size));
      button.setAttribute('title', sizeHint(size));
      button.setAttribute('aria-label', t('resizeTo', { name: titleText, size: sizeLabel(size) + ' ' + size.replace('x', '\u00d7') }));
      button.setAttribute('aria-pressed', button.getAttribute('data-wb-layout-size') === node.dataset.wbSize ? 'true' : 'false');
    });
    var hideButton = controls.querySelector('[data-wb-layout-hide]');
    if (hideButton) hideButton.setAttribute('aria-label', t('hideWidget', { name: titleText }));
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'article');
    if (titleText) node.setAttribute('aria-label', titleText);
    syncDensity(node);
    node.addEventListener('keydown', function (event) {
      if (!host.classList.contains('wb-dashboard-layout-edit') || event.target.closest('button, a, input, select, textarea')) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      var sibling = event.key === 'ArrowUp' ? node.previousElementSibling : node.nextElementSibling;
      if (!sibling || !sibling.classList.contains('wb-dashlet')) return;
      if (event.key === 'ArrowUp') node.parentNode.insertBefore(node, sibling);
      else node.parentNode.insertBefore(sibling, node);
      save(host);
      node.focus();
    });
  }

  function limitSummaryItem(className, value, label) {
    var item = makeEl('span', className || '');
    item.appendChild(makeEl('strong', '', value));
    item.appendChild(document.createTextNode(' ' + label));
    return item;
  }

  function decorateDashboardTableLabels(table) {
    if (!table || table.dataset.wbDashboardLabels === 'true') return;
    var headings = Array.prototype.map.call(table.querySelectorAll('thead th'), function (cell) {
      return cell.textContent.replace(/\s+/g, ' ').trim();
    });
    Array.prototype.forEach.call(table.querySelectorAll('tbody > tr'), function (row) {
      var cells = Array.prototype.slice.call(row.cells || []);
      var rowLabel = cells[0] ? cells[0].textContent.replace(/\s+/g, ' ').trim() : '';
      cells.forEach(function (cell, index) {
        if ((cell.getAttribute('data-wb-label') || '').trim()) return;
        var label = headings[index] || (index === 0 ? t('accountLimit') : rowLabel);
        if (label) cell.setAttribute('data-wb-label', label);
      });
    });
    table.dataset.wbDashboardLabels = 'true';
  }

  function decorateLimits(node) {
    if (node.dataset.wbLimitsDecorated === 'true') return;
    var table = node.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = table.querySelectorAll('tbody > tr');
    var warning = table.querySelectorAll('.progress-bar-warning').length;
    var critical = table.querySelectorAll('.progress-bar-danger').length;
    var summary = document.createElement('div');
    summary.className = 'wb-limit-summary';
    summary.setAttribute('aria-label', t('accountLimitSummary'));
    summary.appendChild(limitSummaryItem('', rows.length, t('limitsTracked')));
    summary.appendChild(limitSummaryItem('wb-limit-summary__warning', warning, t('warnings')));
    summary.appendChild(limitSummaryItem('wb-limit-summary__critical', critical, t('critical')));
    var detailsToggle = dashboardButton(t('showDetails'), { 'class': 'wb-limit-summary__toggle', 'aria-expanded': 'false' });
    summary.appendChild(detailsToggle);
    var wrapper = table.closest('.table-wrapper');
    (wrapper && wrapper.parentNode || node).insertBefore(summary, wrapper || table);
    var alertRows = Array.prototype.filter.call(rows, function (row) {
      return row.querySelector('.progress-bar-warning, .progress-bar-danger');
    });
    var alerts = document.createElement('div');
    alerts.className = 'wb-limit-alerts';
    alerts.setAttribute('aria-label', t('accountLimitWarnings'));
    if (!alertRows.length) {
      alerts.appendChild(makeEl('span', 'wb-limit-alerts__empty', t('limitsHealthy')));
    } else {
      alertRows.slice(0, 4).forEach(function (row) {
        var bar = row.querySelector('.progress-bar-warning, .progress-bar-danger');
        var label = row.cells && row.cells[0] ? row.cells[0].textContent.trim() : t('accountLimit');
        var severity = bar.classList.contains('progress-bar-danger') ? 'critical' : 'warning';
        var alert = makeEl('span', 'wb-limit-alert wb-limit-alert--' + severity);
        alert.appendChild(makeEl('strong', '', label));
        alert.appendChild(makeEl('em', '', t(severity)));
        alerts.appendChild(alert);
      });
      if (alertRows.length > 4) alerts.appendChild(makeEl('span', 'wb-limit-alerts__more', t('moreInDetails', { count: alertRows.length - 4 })));
    }
    summary.parentNode.insertBefore(alerts, summary.nextSibling);
    var groups = { mail: { total: 0, attention: 0 }, web: { total: 0, attention: 0 }, dns: { total: 0, attention: 0 }, database: { total: 0, attention: 0 }, clients: { total: 0, attention: 0 }, other: { total: 0, attention: 0 } };
    Array.prototype.forEach.call(rows, function (row) {
      var label = row.cells && row.cells[0] ? row.cells[0].textContent.toLowerCase() : '';
      var category = /mail|e-mail|email|postfach|spam|fetchmail/.test(label) ? 'mail' :
        /dns|zone|record/.test(label) ? 'dns' :
        /database|datenbank/.test(label) ? 'database' :
        /web|domain|ftp|shell|cron|php/.test(label) ? 'web' :
        /client|customer|kunde|reseller|user|benutzer/.test(label) ? 'clients' : 'other';
      groups[category].total += 1;
      if (row.querySelector('.progress-bar-warning, .progress-bar-danger')) groups[category].attention += 1;
    });
    var groupLabels = { mail: 'limitMail', web: 'limitWeb', dns: 'limitDns', database: 'limitDatabase', clients: 'limitClients', other: 'limitOther' };
    var groupOverview = document.createElement('div');
    groupOverview.className = 'wb-limit-groups';
    groupOverview.setAttribute('aria-label', t('accountLimitSummary'));
    Object.keys(groups).forEach(function (name) {
      var group = groups[name];
      if (!group.total) return;
      var card = document.createElement('article');
      card.className = 'wb-limit-group' + (group.attention ? ' wb-limit-group--attention' : '');
      var label = document.createElement('span');
      label.textContent = t(groupLabels[name]);
      var value = document.createElement('strong');
      value.textContent = String(group.total);
      var state = document.createElement('small');
      state.textContent = group.attention ? t('groupAttention', { count: group.attention }) : t('groupHealthy');
      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(state);
      groupOverview.appendChild(card);
    });
    summary.parentNode.insertBefore(groupOverview, alerts);
    summary.querySelector('.wb-limit-summary__toggle').addEventListener('click', function (event) {
      var expanded = node.classList.toggle('wb-dashlet-limits--expanded');
      event.currentTarget.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      event.currentTarget.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    node.dataset.wbLimitsDecorated = 'true';
  }

  function quotaSummaryItem(className, label, value) {
    var item = makeEl('article', className || '');
    item.appendChild(makeEl('span', '', label));
    item.appendChild(makeEl('strong', '', value));
    return item;
  }

  function decorateQuota(node) {
    if (node.dataset.wbQuotaDecorated === 'true') return;
    var wrapper = node.querySelector('.table-wrapper');
    var table = wrapper && wrapper.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody > tr'));
    var alertRows = rows.filter(function (row) { return row.querySelector('.progress-bar-warning, .progress-bar-danger'); });
    var footerValues = Array.prototype.map.call(table.querySelectorAll('tfoot th'), function (cell) { return cell.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var totalUsage = footerValues.length > 1 ? footerValues[footerValues.length - 1] : '-';
    var summary = document.createElement('div');
    summary.className = 'wb-quota-summary';
    summary.appendChild(quotaSummaryItem('', t('quotaEntries'), rows.length));
    summary.appendChild(quotaSummaryItem('', t('totalUsage'), totalUsage));
    summary.appendChild(quotaSummaryItem(alertRows.length ? 'wb-quota-summary__attention' : 'wb-quota-summary__healthy', alertRows.length ? t('quotaAttention', { count: alertRows.length }) : t('quotaHealthy'), alertRows.length));
    var alerts = document.createElement('div');
    alerts.className = 'wb-quota-alerts';
    alertRows.slice(0, 3).forEach(function (row) {
      var label = row.cells && row.cells[0] ? row.cells[0].textContent.replace(/\s+/g, ' ').trim() : t('quotaEntries');
      var progress = row.querySelector('[role="progressbar"]');
      var item = document.createElement('span');
      item.className = 'wb-quota-alert';
      var name = document.createElement('strong');
      name.textContent = label;
      var value = document.createElement('em');
      value.textContent = progress && progress.getAttribute('aria-valuenow') ? progress.getAttribute('aria-valuenow') + '%' : t('needsAttention');
      item.appendChild(name);
      item.appendChild(value);
      alerts.appendChild(item);
    });
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'wb-quota-details-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = t('showDetails');
    toggle.addEventListener('click', function () {
      var expanded = node.classList.toggle('wb-dashlet-quota-expanded');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    wrapper.parentNode.insertBefore(summary, wrapper);
    if (alertRows.length) wrapper.parentNode.insertBefore(alerts, wrapper);
    wrapper.parentNode.insertBefore(toggle, wrapper);
    node.classList.add('wb-dashlet-quota-collapsed');
    node.dataset.wbQuotaDecorated = 'true';
  }

  function syncCardState(node) {
    var state = node.querySelector('.progress-bar-danger, .wb-limit-alert--critical') ? 'critical' :
      node.querySelector('.progress-bar-warning, .wb-limit-alert--warning') ? 'warning' : 'neutral';
    node.classList.remove('wb-dashlet-state-neutral', 'wb-dashlet-state-warning', 'wb-dashlet-state-critical');
    node.classList.add('wb-dashlet-state-' + state);
    node.dataset.wbState = state;
  }

  function syncPrimaryContext(node) {
    var name = node.dataset.wbDashlet;
    var atomicModule = node.dataset.wbAtomicSource === 'modules';
    var atomicMetric = node.dataset.wbAtomicSource === 'metrics';
    if (name !== 'modules' && name !== 'metrics' && name !== 'statistics' && !atomicModule && !atomicMetric) return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    var count = name === 'modules' || atomicModule ? node.querySelectorAll('.wb-module-launcher').length : name === 'statistics' ? node.querySelectorAll('.wb-statistics-launcher').length : node.querySelectorAll('.wb-dashboard-metric-card').length;
    if (atomicModule || atomicMetric) {
      context.textContent = node.dataset.wbAtomicLabel || t(atomicMetric ? 'individualMetric' : 'individualModule');
      return;
    }
    var singleKey = name === 'metrics' || atomicMetric ? 'metricSingle' : 'destinationSingle';
    var pluralKey = name === 'metrics' || atomicMetric ? 'metricCount' : 'destinationCount';
    context.textContent = count === 1 ? t(singleKey) : t(pluralKey, { count: count });
  }

  function defaultSizeFor(node) {
    var name = node.dataset.wbDashlet;
    if (node.dataset.wbAtomicSource === 'modules') return '1x1';
    if (node.dataset.wbAtomicSource === 'metrics') return '1x1';
    return defaults[name] || '1x1';
  }

  function syncOperationalContext(node) {
    var name = node.dataset.wbDashlet;
    var operational = name === 'limits' || name === 'quota' || name === 'mailquota' || name === 'databasequota';
    if (!operational) return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context wb-dashlet__context--capacity';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    var count = name === 'limits' ? node.querySelectorAll('.wb-limit-group').length : node.querySelectorAll('.wb-quota-summary > article').length;
    var attention = node.querySelectorAll('.wb-limit-alert--warning, .wb-limit-alert--critical, .wb-quota-alert').length;
    context.dataset.wbState = attention ? 'attention' : 'healthy';
    context.textContent = t(attention ? 'capacityAttention' : 'capacityHealthy', { count: count, attention: attention });
  }

  function syncSecondaryContext(node) {
    var name = node.dataset.wbDashlet;
    if (name !== 'news' && name !== 'donate') return;
    var header = node.querySelector(':scope > .wb-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .wb-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'wb-dashlet__context wb-dashlet__context--secondary';
      header.insertBefore(context, header.querySelector('.wb-dashlet__edit-hint, .wb-dashlet__layout-controls'));
    }
    context.textContent = name === 'news' ? t('newsCount', { count: node.querySelectorAll('ul > li').length }) : t('optionalContent');
  }

  function enhance() {
    // Self-sufficient + idempotent: enhance is the single authority on the
    // dashboard state. It detects the dashboard by its raw, direct-child
    // .wb-dashlet widgets, sets the gating classes itself, and clears them on
    // non-dashboard pages. This removes the earlier fragile dependency on some
    // other code having set body.wb-dashboard-page first, which caused the
    // SPA-return race where the dashboard rendered undecorated.
    var host = document.getElementById('pageContent');
    if (!host) return false;
    normalizeServerDashlets(host);
    if (!host.querySelector(':scope > .wb-dashlet')) {
      document.body.classList.remove('wb-dashboard-page');
      host.classList.remove('wb-dashboard-layout');
      return false;
    }
    document.body.classList.add('wb-dashboard-page');
    host.classList.add('wb-dashboard-layout');
    splitAtomicDashlets(host);
    var layout = readLayout();
    var nodes = dashlets(host);
    nodes.forEach(function (node, index) {
      var name = node.dataset.wbDashlet;
      if (node.dataset.wbDefaultOrder === undefined) node.dataset.wbDefaultOrder = String(defaultOrder[name] || 500 + index);
      node.dataset.wbPriority = node.dataset.wbPriority || priority[name] || 'standard';
    });
    nodes.sort(function (a, b) {
      var ao = layout[a.dataset.wbDashlet] && layout[a.dataset.wbDashlet].order;
      var bo = layout[b.dataset.wbDashlet] && layout[b.dataset.wbDashlet].order;
      return (typeof ao === 'number' ? ao : Number(a.dataset.wbDefaultOrder)) - (typeof bo === 'number' ? bo : Number(b.dataset.wbDefaultOrder));
    }).forEach(function (node) { host.appendChild(node); });
    dashlets(host).forEach(function (node) {
      var name = node.dataset.wbDashlet;
      setSize(node, layout[name] && layout[name].size || defaultSizeFor(node));
      node.dataset.wbHidden = layout[name] ? (layout[name].hidden ? 'true' : 'false') : (defaultHidden[name] ? 'true' : 'false');
      node.hidden = node.dataset.wbHidden === 'true';
      node.draggable = false;
      node.setAttribute('aria-grabbed', 'false');
      if (name === 'limits') decorateLimits(node);
      if (name === 'modules') decorateModules(node);
      if (name === 'donate') decorateDonate(node);
      if (name === 'metrics') decorateMetrics(node);
      if (name === 'quota' || name === 'mailquota' || name === 'databasequota') decorateQuota(node);
      if (!node.querySelector('.wb-dashlet__layout-controls')) makeControls(node, host);
      syncCardState(node);
      syncPrimaryContext(node);
      syncOperationalContext(node);
      syncSecondaryContext(node);
    });
    if (!host.dataset.wbLayoutDnD) {
      host.dataset.wbLayoutDnD = 'true';
      var pointerSource = null;
      host.addEventListener('pointerdown', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (!node || !host.classList.contains('wb-dashboard-layout-edit') || !event.target.closest('.wb-dashlet__drag-handle')) return;
        pointerSource = node;
        node.classList.add('wb-dashlet--dragging');
        node.setPointerCapture(event.pointerId);
      });
      host.addEventListener('pointerup', function (event) {
        if (!pointerSource) return;
        var target = document.elementFromPoint(event.clientX, event.clientY);
        var destination = target && target.closest('.wb-dashlet');
        if (destination && destination !== pointerSource && host.contains(destination)) {
          destination.parentNode.insertBefore(pointerSource, destination);
          save(host);
        }
        pointerSource.classList.remove('wb-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('pointercancel', function () {
        if (pointerSource) pointerSource.classList.remove('wb-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('dragstart', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (!node || !host.classList.contains('wb-dashboard-layout-edit') || !event.target.closest('.wb-dashlet__drag-handle')) { event.preventDefault(); return; }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', node.dataset.wbDashlet || '');
        node.setAttribute('aria-grabbed', 'true');
      });
      host.addEventListener('dragend', function (event) {
        var node = event.target.closest('.wb-dashlet');
        if (node) node.setAttribute('aria-grabbed', 'false');
      });
      host.addEventListener('dragover', function (event) {
        if (host.classList.contains('wb-dashboard-layout-edit') && event.target.closest('.wb-dashlet')) event.preventDefault();
      });
      host.addEventListener('drop', function (event) {
        if (!host.classList.contains('wb-dashboard-layout-edit')) return;
        var target = event.target.closest('.wb-dashlet');
        var name = event.dataTransfer.getData('text/plain');
        var source = name && host.querySelector('.wb-dashlet[data-wb-dashlet="' + name + '"]');
        if (!target || !source || target === source) return;
        event.preventDefault();
        target.parentNode.insertBefore(source, target);
        save(host);
      });
    }
    var header = host.querySelector(':scope > .page-header');
    var overview = syncOverview(host);
    if (header && !host.querySelector(':scope > .wb-dashboard-toolbar')) {
      var toolbar = document.createElement('div');
      toolbar.className = 'wb-dashboard-toolbar';
      toolbar.setAttribute('aria-label', t('dashboardLayoutControls'));
      var status = document.createElement('span');
      status.className = 'wb-dashboard-toolbar__status';
      status.setAttribute('data-wb-layout-status', 'true');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      toolbar.appendChild(status);
      var actions = document.createElement('div');
      actions.className = 'wb-dashboard-toolbar__actions';
      toolbar.appendChild(actions);
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'wb-dashboard-button wb-dashboard-button--primary wb-dashboard-layout-toggle wb-dashboard-toolbar__primary';
      toggle.textContent = t('customizeDashboard');
      toggle.setAttribute('data-wb-layout-toggle', 'true');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', function () {
        host.classList.toggle('wb-dashboard-layout-edit');
        if (reset) {
          reset.dataset.wbConfirm = 'false';
          reset.classList.remove('wb-dashboard-layout-reset--armed');
          reset.textContent = t('resetLayout');
        }
        syncToolbar(host);
      });
      actions.appendChild(toggle);
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'wb-dashboard-button wb-dashboard-layout-reset';
      reset.textContent = t('resetLayout');
      reset.setAttribute('data-wb-layout-reset', 'true');
      var resetTimer = null;
      reset.addEventListener('click', function () {
        if (reset.dataset.wbConfirm !== 'true') {
          reset.dataset.wbConfirm = 'true';
          reset.classList.add('wb-dashboard-layout-reset--armed');
          reset.textContent = t('confirmReset');
          status.textContent = t('resetWarning');
          if (resetTimer) window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            reset.dataset.wbConfirm = 'false';
            reset.classList.remove('wb-dashboard-layout-reset--armed');
            reset.textContent = t('resetLayout');
            syncToolbar(host);
          }, 6000);
          return;
        }
        if (resetTimer) window.clearTimeout(resetTimer);
        reset.dataset.wbConfirm = 'false';
        reset.classList.remove('wb-dashboard-layout-reset--armed');
        reset.textContent = t('resetLayout');
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
        dashlets(host).sort(function (a, b) {
          return Number(a.dataset.wbDefaultOrder || 0) - Number(b.dataset.wbDefaultOrder || 0);
        }).forEach(function (node) {
          var hiddenByDefault = Boolean(defaultHidden[node.dataset.wbDashlet]);
          node.hidden = hiddenByDefault;
          node.dataset.wbHidden = hiddenByDefault ? 'true' : 'false';
          setSize(node, defaultSizeFor(node));
          host.appendChild(node);
        });
        save(host);
        syncToolbar(host);
      });
      actions.appendChild(reset);
      var show = document.createElement('button');
      show.type = 'button';
      show.className = 'wb-dashboard-button wb-dashboard-layout-show-hidden';
      show.textContent = t('showHiddenWidgets');
      show.setAttribute('data-wb-layout-show-hidden', 'true');
      show.addEventListener('click', function () { showAllWidgets(host); });
      actions.appendChild(show);
      (overview || header).insertAdjacentElement('afterend', toolbar);
      syncToolbar(host);
    }
    return true;
  }

  // Robust, timing-independent trigger: a MutationObserver on #pageContent
  // re-runs enhance whenever the page fragment changes (SPA navigation), instead
  // of relying on navigation event ordering. The observer is disconnected around
  // enhance so enhance's own DOM writes never re-trigger it (no loop).
  function installDashboardEnhancer() {
    var host = document.getElementById('pageContent');
    if (!host) return;
    var observer = null;
    function run() {
      if (observer) observer.disconnect();
      try { enhance(); } catch (e) { if (window.console && window.console.error) window.console.error('dashboard enhance error', e); }
      if (observer) observer.observe(host, { childList: true });
    }
    if (window.MutationObserver) {
      observer = new MutationObserver(run);
      observer.observe(host, { childList: true });
    }
    run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installDashboardEnhancer);
  else installDashboardEnhancer();
  window.workbenchDashboardLayout = { enhance: enhance, storageKey: STORAGE_KEY };
}());

