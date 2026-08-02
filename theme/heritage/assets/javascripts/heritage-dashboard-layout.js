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
    var active = typeof window.heritageLanguage === 'function' ? window.heritageLanguage() : String(document.documentElement.lang || 'en');
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
    return Array.prototype.slice.call(host.querySelectorAll(':scope > .hg-dashlet'));
  }

  function normalizeServerDashlets(host) {
    var boundary = host.querySelector(':scope > [data-heritage-dashboard-server-content]');
    if (!boundary) return;
    var widgets = Array.prototype.slice.call(boundary.children).filter(function (node) {
      return node.classList && node.classList.contains('hg-dashlet');
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
    node.dataset.heritageSize = safe;
    node.setAttribute('data-heritage-size', safe);
    node.setAttribute('data-heritage-density', safe === '1x1' ? 'compact' : 'expanded');
    if (node.dataset.heritageAtomicSource === 'modules') {
      node.dataset.heritageModuleViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    if (node.dataset.heritageAtomicSource === 'metrics') {
      node.dataset.heritageMetricViewport = safe === '2x2' ? 'detail' : safe === '1x2' ? 'tall' : 'compact';
    }
    node.classList.remove('hg-dashlet-size-1x1', 'hg-dashlet-size-1x2', 'hg-dashlet-size-2x2');
    node.classList.add('hg-dashlet-size-' + safe);
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-layout-size]'), function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-heritage-layout-size') === safe ? 'true' : 'false');
    });
    syncDensity(node);
    syncMetricAnalysisVisibility(node, safe);
  }

  function syncMetricAnalysisVisibility(node, size) {
    if (node.dataset.heritageAtomicSource !== 'metrics') return;
    var expanded = size === '2x2';
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-metric-details]'), function (details) {
      details.hidden = !expanded;
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-heritage-metric-toggle]'), function (toggle) {
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function densityItems(node) {
    var name = node.dataset.heritageDashlet;
    if (name === 'modules') return Array.prototype.slice.call(node.querySelectorAll('.modules > li'));
    if (name === 'news') return Array.prototype.slice.call(node.querySelectorAll('ul > li'));
    if (name === 'metrics') return Array.prototype.slice.call(node.querySelectorAll('.hg-dashboard-metric-card'));
    if (name === 'statistics') return Array.prototype.slice.call(node.querySelectorAll('.hg-statistics-launcher'));
    if (name === 'quota' || name === 'mailquota' || name === 'databasequota') {
      return Array.prototype.slice.call(node.querySelectorAll('.table-wrapper table > tbody > tr'));
    }
    return [];
  }

  function densityLimit(node) {
    return node.dataset.heritageDashlet === 'modules' ? 4 : node.dataset.heritageDashlet === 'news' ? 3 : node.dataset.heritageDashlet === 'metrics' ? 2 : node.dataset.heritageDashlet === 'statistics' ? 3 : 5;
  }

  function syncDensity(node) {
    var items = densityItems(node);
    var compact = node.dataset.heritageSize === '1x1';
    var limit = densityLimit(node);
    var hiddenCount = 0;
    items.forEach(function (item, index) {
      var hide = compact && index >= limit;
      if (hide) {
        item.hidden = true;
        item.dataset.heritageDensityHidden = 'true';
        hiddenCount += 1;
      } else if (item.dataset.heritageDensityHidden === 'true') {
        item.hidden = false;
        delete item.dataset.heritageDensityHidden;
      }
    });
    var existing = node.querySelector(':scope > .hg-dashlet__density-note');
    if (existing) existing.remove();
    if (!hiddenCount) return;
    var note = document.createElement('div');
    note.className = 'hg-dashlet__density-note';
    note.setAttribute('role', 'status');
    var text = document.createElement('span');
    text.textContent = t('moreItems', { count: hiddenCount });
    note.appendChild(text);
    var expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'hg-dashlet__density-expand';
    expand.textContent = t('showMore');
    expand.setAttribute('aria-label', t('expandWidget', { name: node.getAttribute('aria-label') || t('widget') }));
    expand.addEventListener('click', function () {
      setSize(node, node.dataset.heritageDashlet === 'modules' ? '2x2' : '1x2');
      var host = node.parentElement;
      if (host) save(host);
    });
    note.appendChild(expand);
    node.appendChild(note);
  }

  function hiddenCount(host) {
    return dashlets(host).filter(function (node) { return node.dataset.heritageHidden === 'true'; }).length;
  }

  function decorateModules(node) {
    if (node.dataset.heritageModulesDecorated === 'true') return;
    Array.prototype.forEach.call(node.querySelectorAll('.modules > li'), function (launcher) {
      var title = launcher.querySelector('.title');
      var action = launcher.querySelector('a.button[data-heritage-module], a.button[data-capp]');
      launcher.classList.add('hg-module-launcher');
      if (title && !launcher.querySelector('.hg-module-launcher__meta')) {
        var meta = document.createElement('span');
        meta.className = 'hg-module-launcher__meta';
        meta.textContent = t('openModule');
        title.insertAdjacentElement('afterend', meta);
      }
      if (action) {
        action.classList.add('hg-module-launcher__action');
        action.setAttribute('aria-label', (action.textContent || t('openModule')).replace(/\s+/g, ' ').trim());
      }
    });
    node.dataset.heritageModulesDecorated = 'true';
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
    var source = host.querySelector(':scope > .hg-dashlet[data-heritage-dashlet="modules"]');
    if (!source || source.dataset.heritageAtomicSplit === 'true') return;
    decorateModules(source);
    var items = Array.prototype.slice.call(source.querySelectorAll('.modules > li.hg-module-launcher'));
    if (!items.length) return;
    var anchor = source;
    items.forEach(function (item, index) {
      var titleNode = item.querySelector('.title');
      var title = titleNode ? titleNode.textContent.replace(/\s+/g, ' ').trim() : t('moduleWidget') + ' ' + (index + 1);
      var moduleLink = item.querySelector('[data-capp]');
      var moduleName = moduleLink ? moduleLink.getAttribute('data-capp') : '';
      var navigationItems = Array.prototype.slice.call(document.querySelectorAll('#heritage-mobile-navigation [data-heritage-module], #main-navigation [data-heritage-module]'));
      var matchingNavigationItems = navigationItems.filter(function (candidate) {
        return candidate.getAttribute('data-heritage-module') === moduleName;
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
      article.className = 'hg-dashlet hg-dashlet-module-atomic';
      article.dataset.heritageDashlet = 'module-' + slug(title) + '-' + index;
      article.dataset.heritageAtomicSource = 'modules';
      article.dataset.heritageAtomicLabel = t('individualModule');
      article.dataset.heritageDashboardCockpit = 'module';
      article.dataset.heritagePriority = 'primary';
      article.dataset.heritageDefaultOrder = String(10 + index);
      article.setAttribute('data-heritage-cockpit-card', 'module');
      var heading = makeEl('h3', '', title);
      var wrapper = makeEl('div', 'dashboard-modules-wrapper hg-dashboard-atomic-module');
      var list = makeEl('ul', 'modules');
      wrapper.appendChild(list);
      article.appendChild(heading);
      article.appendChild(wrapper);
      list.appendChild(item);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.heritageAtomicSplit = 'true';
    source.remove();
  }

  function decorateDonate(node) {
    if (node.dataset.heritageDonateDecorated === 'true') return;
    var button = node.querySelector('.hg-donate-card__toggle');
    var description = node.querySelector('[data-heritage-donate-description], #description');
    if (!button || !description) {
      node.dataset.heritageDonateDecorated = 'true';
      return;
    }
    if (!description.id) {
      description.id = 'hg-donate-description-' + Math.random().toString(36).slice(2, 8);
    }
    button.setAttribute('aria-controls', description.id);
    description.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      description.hidden = expanded;
    });
    node.dataset.heritageDonateDecorated = 'true';
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
    return card.querySelector('canvas, .hg-dashboard-sparkline');
  }

  function metricValuesFromSparkline(source) {
    if (!source || !source.dataset || !source.dataset.heritageMetricValues) return [];
    return source.dataset.heritageMetricValues.split(',').map(Number).filter(Number.isFinite);
  }

  function metricLabelFromSource(source) {
    if (!source) return t('currentValue');
    return source.dataset && source.dataset.heritageMetricLabel || source.getAttribute('aria-label') || metricFallback(source);
  }

  function syncMetricCards(node) {
    Array.prototype.forEach.call(node.querySelectorAll('.hg-dashboard-metric-card'), function (card) {
      var canvas = card.querySelector('canvas');
      var source = metricSource(card);
      var chart = canvas && chartInstance(canvas);
      var dataset = chart && chart.data && chart.data.datasets && chart.data.datasets[0];
      var values = dataset && dataset.data || metricValuesFromSparkline(source);
      var latest = values.length ? values[values.length - 1] : null;
      var label = card.querySelector('.hg-dashboard-metric-card__label');
      var value = card.querySelector('.hg-dashboard-metric-card__value');
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
    if (node.dataset.heritageMetricsDecorated === 'true') return;
    var content = node.querySelector(':scope > div');
    if (!content) return;
    var title = content.querySelector(':scope > div:first-child > h3');
    var titleHolder = title && title.parentElement;
    if (title) node.insertBefore(title, content);
    if (titleHolder && !titleHolder.textContent.trim() && !titleHolder.children.length) titleHolder.remove();
    content.classList.add('hg-dashboard-metrics-grid');
    Array.prototype.forEach.call(content.children, function (container) {
      var metric = container.querySelector && container.querySelector(':scope > canvas, :scope > .hg-dashboard-sparkline');
      if (!metric) return;
      container.classList.add('hg-dashboard-metric-card');
      container.style.removeProperty('padding-bottom');
      if (!container.querySelector('.hg-dashboard-metric-card__header')) {
        var header = document.createElement('header');
        header.className = 'hg-dashboard-metric-card__header';
        var label = makeEl('span', 'hg-dashboard-metric-card__label', metricLabelFromSource(metric));
        var value = makeEl('strong', 'hg-dashboard-metric-card__value', '-');
        value.setAttribute('aria-label', t('currentValue'));
        header.appendChild(label);
        header.appendChild(value);
        container.insertBefore(header, metric);
      }
    });
    node.dataset.heritageMetricsDecorated = 'true';
    window.requestAnimationFrame(function () { syncMetricCards(node); });
    window.setTimeout(function () { syncMetricCards(node); }, 120);
  }

  function splitMetricDashlet(host) {
    var source = host.querySelector(':scope > .hg-dashlet[data-heritage-dashlet="metrics"]');
    if (!source || source.dataset.heritageAtomicSplit === 'true') return;
    // Render the declarative metric payload before the source dashlet is split
    // into atomic widgets. Removing the source first also removed its JSON
    // payload, leaving all four charts permanently empty after login.
    if (window.heritageDashboardMetrics && typeof window.heritageDashboardMetrics.enhance === 'function') {
      window.heritageDashboardMetrics.enhance(source);
    }
    decorateMetrics(source);
    var cards = Array.prototype.slice.call(source.querySelectorAll('.hg-dashboard-metric-card'));
    if (!cards.length) return;
    var anchor = source;
    cards.forEach(function (card, index) {
      var metric = metricSource(card);
      var label = card.querySelector('.hg-dashboard-metric-card__label');
      var title = label ? label.textContent.replace(/\s+/g, ' ').trim() : metricLabelFromSource(metric || {});
      var article = document.createElement('section');
      article.className = 'hg-dashlet hg-dashlet-metric-atomic';
      article.dataset.heritageDashlet = 'metric-' + slug(metric && metric.id || title) + '-' + index;
      article.dataset.heritageAtomicSource = 'metrics';
      article.dataset.heritageAtomicLabel = t('individualMetric');
      article.dataset.heritageDashboardCockpit = 'metric';
      article.dataset.heritagePriority = 'primary';
      // Keep the four live metrics together as one visual dashboard group.
      // Operational limit cards follow afterwards and must not split the
      // metric sequence or impose their taller row height between charts.
      article.dataset.heritageDefaultOrder = String(20 + index);
      article.setAttribute('data-heritage-cockpit-card', 'metric');
      var heading = makeEl('h3', '', title);
      var metricHost = makeEl('div', 'hg-dashboard-single-metric');
      article.appendChild(heading);
      article.appendChild(metricHost);
      metricHost.appendChild(card);
      anchor.insertAdjacentElement('afterend', article);
      anchor = article;
    });
    source.dataset.heritageAtomicSplit = 'true';
    source.remove();
    window.requestAnimationFrame(function () {
      dashlets(host).forEach(function (node) {
        if (node.dataset.heritageAtomicSource === 'metrics') syncMetricCards(node);
      });
    });
  }

  function splitAtomicDashlets(host) {
    var unsplitSource = host.querySelector(':scope > .hg-dashlet[data-heritage-dashlet="modules"], :scope > .hg-dashlet[data-heritage-dashlet="metrics"]');
    if (host.dataset.heritageAtomicDashboard === 'true' && !unsplitSource) return;
    if (unsplitSource) delete host.dataset.heritageAtomicDashboard;
    splitModuleDashlet(host);
    splitMetricDashlet(host);
    host.dataset.heritageAtomicDashboard = 'true';
  }

  function decorateHero(header) {
    if (!header || header.dataset.heritageHeroDecorated === 'true') return;
    var title = header.querySelector('h1');
    if (!title) return;
    var eyebrow = document.createElement('span');
    eyebrow.className = 'hg-dashboard-hero__eyebrow';
    eyebrow.textContent = t('workspace');
    title.insertAdjacentElement('beforebegin', eyebrow);
    var summary = document.createElement('p');
    summary.className = 'hg-dashboard-hero__summary';
    summary.textContent = t('workspaceSummary');
    title.insertAdjacentElement('afterend', summary);
    header.classList.add('hg-dashboard-hero');
    header.dataset.heritageHeroDecorated = 'true';
  }

  function syncOverview(host) {
    var header = host.querySelector(':scope > .page-header');
    if (!header) return null;
    decorateHero(header);
    var overview = host.querySelector(':scope > .hg-dashboard-overview');
    if (!overview) {
      overview = document.createElement('section');
      overview.className = 'hg-dashboard-overview';
      overview.setAttribute('aria-label', t('overview'));
      header.insertAdjacentElement('afterend', overview);
    }
    var moduleCount = host.querySelectorAll('.hg-module-launcher').length;
    var warningCount = host.querySelectorAll('.progress-bar-warning').length;
    var criticalCount = host.querySelectorAll('.progress-bar-danger').length;
    var visibleCount = dashlets(host).filter(function(node) { return node.dataset.heritageHidden !== 'true'; }).length;
    var totalCount = dashlets(host).length;
    var attention = warningCount + criticalCount;
    var modulesCard = overviewStat(t('availableModules'), moduleCount, t('quickDestinations'));
    var attentionCard = overviewStat(t('needsAttention'), attention, t('attentionDetail', { critical: criticalCount, warning: warningCount }), attention ? 'hg-dashboard-overview__stat--attention' : 'hg-dashboard-overview__stat--healthy');
    var layoutCard = overviewStat(t('activeWidgets'), visibleCount, t('personalLayout'), '', totalCount);
    overview.dataset.heritageAttention = attention ? 'true' : 'false';
    while (overview.firstChild) overview.removeChild(overview.firstChild);
    (attention ? [attentionCard, modulesCard, layoutCard] : [modulesCard, attentionCard, layoutCard]).forEach(function (card) {
      overview.appendChild(card);
    });
    return overview;
  }

  function overviewStat(label, value, detail, modifier, total) {
    var card = makeEl('article', 'hg-dashboard-overview__stat' + (modifier ? ' ' + modifier : ''));
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
      node.dataset.heritageHidden = 'false';
    });
    save(host);
    syncToolbar(host);
  }

  function restoreRecommended(host) {
    dashlets(host).forEach(function (node) {
      var hiddenByDefault = Boolean(defaultHidden[node.dataset.heritageDashlet]);
      node.hidden = hiddenByDefault;
      node.dataset.heritageHidden = hiddenByDefault ? 'true' : 'false';
      setSize(node, defaultSizeFor(node));
    });
    save(host);
    syncToolbar(host);
  }

  function syncEmptyState(host) {
    var visible = dashlets(host).some(function (node) { return node.dataset.heritageHidden !== 'true'; });
    var state = host.querySelector(':scope > .hg-dashboard-empty-state');
    if (visible) {
      if (state) state.remove();
      return;
    }
    if (state) return;
    state = document.createElement('section');
    state.className = 'hg-dashboard-empty-state';
    state.setAttribute('role', 'status');
    var content = makeEl('div');
    content.appendChild(makeEl('h2', '', t('emptyTitle')));
    content.appendChild(makeEl('p', '', t('emptyText')));
    state.appendChild(hiddenIcon('hg-dashboard-empty-state__icon'));
    state.appendChild(content);
    var restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'hg-dashboard-button hg-dashboard-button--primary';
    restore.textContent = t('restoreWidgets');
    restore.addEventListener('click', function () { restoreRecommended(host); });
    state.appendChild(restore);
    var toolbar = host.querySelector(':scope > .hg-dashboard-toolbar');
    (toolbar || host.querySelector(':scope > .hg-dashboard-overview') || host.querySelector(':scope > .page-header')).insertAdjacentElement('afterend', state);
  }

  function syncToolbar(host) {
    var toolbar = host.querySelector(':scope > .hg-dashboard-toolbar');
    if (!toolbar) return;
    var editing = host.classList.contains('hg-dashboard-layout-edit');
    var count = hiddenCount(host);
    var status = toolbar.querySelector('[data-heritage-layout-status]');
    var toggle = toolbar.querySelector('[data-heritage-layout-toggle]');
    var show = toolbar.querySelector('[data-heritage-layout-show-hidden]');
    toolbar.classList.toggle('hg-dashboard-toolbar--editing', editing);
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
      var name = node.dataset.heritageDashlet;
      if (name) layout[name] = { size: node.dataset.heritageSize || '1x1', order: index, hidden: node.dataset.heritageHidden === 'true' };
    });
    writeLayout(layout);
  }

  function makeControls(node, host) {
    var widgetTitle = node.querySelector(':scope > h2, :scope > h3, :scope > header');
    var widgetHeader = node.querySelector(':scope > .hg-dashlet__header');
    if (!widgetHeader) {
      widgetHeader = document.createElement('div');
      widgetHeader.className = 'hg-dashlet__header';
      node.insertBefore(widgetHeader, node.firstChild);
      if (widgetTitle) widgetHeader.appendChild(widgetTitle);
    }
    if (!widgetHeader.querySelector('.hg-dashlet__type-icon')) {
      var typeIcon = document.createElement('span');
      typeIcon.className = 'hg-dashlet__type-icon';
      typeIcon.setAttribute('aria-hidden', 'true');
      widgetHeader.insertBefore(typeIcon, widgetHeader.firstChild);
    }
    var titleText = widgetTitle ? widgetTitle.textContent.replace(/\s+/g, ' ').trim() : (node.dataset.heritageDashlet || t('dashboardWidget'));
    var dragHandle = document.createElement('span');
    dragHandle.className = 'hg-dashlet__drag-handle';
    dragHandle.setAttribute('role', 'button');
    dragHandle.setAttribute('tabindex', '0');
    dragHandle.setAttribute('aria-label', t('dragWidget', { name: titleText }));
    dragHandle.setAttribute('draggable', 'true');
    for (var dot = 0; dot < 6; dot += 1) dragHandle.appendChild(document.createElement('i'));
    widgetHeader.insertBefore(dragHandle, widgetHeader.firstChild);
    var editHint = document.createElement('span');
    editHint.className = 'hg-dashlet__edit-hint';
    editHint.textContent = t('editHint');
    widgetHeader.appendChild(editHint);
    var controls = document.createElement('div');
    controls.className = 'hg-dashlet__layout-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t('layoutControls', { name: titleText }));
    // Regression fix: inside makeControls the `node` parameter (the dashlet
    // element) shadows the module-level makeEl() element helper, so calling
    // makeEl('span', ...) threw "node is not a function". Build the label inline.
    var layoutLabel = document.createElement('span');
    layoutLabel.className = 'hg-dashlet__layout-label';
    layoutLabel.textContent = t('editHint');
    controls.appendChild(layoutLabel);
    controls.appendChild(dashboardButton('\u2191', { 'data-heritage-layout-move': 'up', 'aria-label': t('moveEarlier') }));
    controls.appendChild(dashboardButton('\u2193', { 'data-heritage-layout-move': 'down', 'aria-label': t('moveLater') }));
    controls.appendChild(dashboardButton('1\u00d71', { 'data-heritage-layout-size': '1x1' }));
    controls.appendChild(dashboardButton('1\u00d72', { 'data-heritage-layout-size': '1x2' }));
    controls.appendChild(dashboardButton('2\u00d72', { 'data-heritage-layout-size': '2x2' }));
    controls.appendChild(dashboardButton(t('hide'), { 'data-heritage-layout-hide': 'true' }));
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-heritage-layout-size]');
      var move = event.target.closest('[data-heritage-layout-move]');
      var hide = event.target.closest('[data-heritage-layout-hide]');
      if (hide) {
        node.dataset.heritageHidden = 'true';
        node.hidden = true;
        save(host);
        syncToolbar(host);
        return;
      }
      if (move) {
        var sibling = move.getAttribute('data-heritage-layout-move') === 'up' ? node.previousElementSibling : node.nextElementSibling;
        if (sibling && sibling.classList.contains('hg-dashlet')) {
          if (move.getAttribute('data-heritage-layout-move') === 'up') node.parentNode.insertBefore(node, sibling);
          else node.parentNode.insertBefore(sibling, node);
          save(host);
        }
        return;
      }
      if (!button) return;
      setSize(node, button.getAttribute('data-heritage-layout-size'));
      save(host);
    });
    widgetHeader.appendChild(controls);
    var moveUp = controls.querySelector('[data-heritage-layout-move="up"]');
    var moveDown = controls.querySelector('[data-heritage-layout-move="down"]');
    var sizeLabels = controls.querySelectorAll('[data-heritage-layout-size]');
    if (moveUp) moveUp.textContent = '\u2191';
    if (moveDown) moveDown.textContent = '\u2193';
    Array.prototype.forEach.call(sizeLabels, function (button) {
      var size = button.getAttribute('data-heritage-layout-size');
      button.textContent = size.replace('x', '\u00d7');
      button.setAttribute('data-heritage-size-code', size.replace('x', '\u00d7'));
      button.setAttribute('data-heritage-size-label', sizeLabel(size));
      button.setAttribute('title', sizeHint(size));
      button.setAttribute('aria-label', t('resizeTo', { name: titleText, size: sizeLabel(size) + ' ' + size.replace('x', '\u00d7') }));
      button.setAttribute('aria-pressed', button.getAttribute('data-heritage-layout-size') === node.dataset.heritageSize ? 'true' : 'false');
    });
    var hideButton = controls.querySelector('[data-heritage-layout-hide]');
    if (hideButton) hideButton.setAttribute('aria-label', t('hideWidget', { name: titleText }));
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'article');
    if (titleText) node.setAttribute('aria-label', titleText);
    syncDensity(node);
    node.addEventListener('keydown', function (event) {
      if (!host.classList.contains('hg-dashboard-layout-edit') || event.target.closest('button, a, input, select, textarea')) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      var sibling = event.key === 'ArrowUp' ? node.previousElementSibling : node.nextElementSibling;
      if (!sibling || !sibling.classList.contains('hg-dashlet')) return;
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
    if (!table || table.dataset.heritageDashboardLabels === 'true') return;
    var headings = Array.prototype.map.call(table.querySelectorAll('thead th'), function (cell) {
      return cell.textContent.replace(/\s+/g, ' ').trim();
    });
    Array.prototype.forEach.call(table.querySelectorAll('tbody > tr'), function (row) {
      var cells = Array.prototype.slice.call(row.cells || []);
      var rowLabel = cells[0] ? cells[0].textContent.replace(/\s+/g, ' ').trim() : '';
      cells.forEach(function (cell, index) {
        if ((cell.getAttribute('data-heritage-label') || '').trim()) return;
        var label = headings[index] || (index === 0 ? t('accountLimit') : rowLabel);
        if (label) cell.setAttribute('data-heritage-label', label);
      });
    });
    table.dataset.heritageDashboardLabels = 'true';
  }

  function decorateLimits(node) {
    if (node.dataset.heritageLimitsDecorated === 'true') return;
    var table = node.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = table.querySelectorAll('tbody > tr');
    var warning = table.querySelectorAll('.progress-bar-warning').length;
    var critical = table.querySelectorAll('.progress-bar-danger').length;
    var summary = document.createElement('div');
    summary.className = 'hg-limit-summary';
    summary.setAttribute('aria-label', t('accountLimitSummary'));
    summary.appendChild(limitSummaryItem('', rows.length, t('limitsTracked')));
    summary.appendChild(limitSummaryItem('hg-limit-summary__warning', warning, t('warnings')));
    summary.appendChild(limitSummaryItem('hg-limit-summary__critical', critical, t('critical')));
    var detailsToggle = dashboardButton(t('showDetails'), { 'class': 'hg-limit-summary__toggle', 'aria-expanded': 'false' });
    summary.appendChild(detailsToggle);
    var wrapper = table.closest('.table-wrapper');
    (wrapper && wrapper.parentNode || node).insertBefore(summary, wrapper || table);
    var alertRows = Array.prototype.filter.call(rows, function (row) {
      return row.querySelector('.progress-bar-warning, .progress-bar-danger');
    });
    var alerts = document.createElement('div');
    alerts.className = 'hg-limit-alerts';
    alerts.setAttribute('aria-label', t('accountLimitWarnings'));
    if (!alertRows.length) {
      alerts.appendChild(makeEl('span', 'hg-limit-alerts__empty', t('limitsHealthy')));
    } else {
      alertRows.slice(0, 4).forEach(function (row) {
        var bar = row.querySelector('.progress-bar-warning, .progress-bar-danger');
        var label = row.cells && row.cells[0] ? row.cells[0].textContent.trim() : t('accountLimit');
        var severity = bar.classList.contains('progress-bar-danger') ? 'critical' : 'warning';
        var alert = makeEl('span', 'hg-limit-alert hg-limit-alert--' + severity);
        alert.appendChild(makeEl('strong', '', label));
        alert.appendChild(makeEl('em', '', t(severity)));
        alerts.appendChild(alert);
      });
      if (alertRows.length > 4) alerts.appendChild(makeEl('span', 'hg-limit-alerts__more', t('moreInDetails', { count: alertRows.length - 4 })));
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
    groupOverview.className = 'hg-limit-groups';
    groupOverview.setAttribute('aria-label', t('accountLimitSummary'));
    Object.keys(groups).forEach(function (name) {
      var group = groups[name];
      if (!group.total) return;
      var card = document.createElement('article');
      card.className = 'hg-limit-group' + (group.attention ? ' hg-limit-group--attention' : '');
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
    summary.querySelector('.hg-limit-summary__toggle').addEventListener('click', function (event) {
      var expanded = node.classList.toggle('hg-dashlet-limits--expanded');
      event.currentTarget.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      event.currentTarget.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    node.dataset.heritageLimitsDecorated = 'true';
  }

  function quotaSummaryItem(className, label, value) {
    var item = makeEl('article', className || '');
    item.appendChild(makeEl('span', '', label));
    item.appendChild(makeEl('strong', '', value));
    return item;
  }

  function decorateQuota(node) {
    if (node.dataset.heritageQuotaDecorated === 'true') return;
    var wrapper = node.querySelector('.table-wrapper');
    var table = wrapper && wrapper.querySelector('table');
    if (!table) return;
    decorateDashboardTableLabels(table);
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody > tr'));
    var alertRows = rows.filter(function (row) { return row.querySelector('.progress-bar-warning, .progress-bar-danger'); });
    var footerValues = Array.prototype.map.call(table.querySelectorAll('tfoot th'), function (cell) { return cell.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var totalUsage = footerValues.length > 1 ? footerValues[footerValues.length - 1] : '-';
    var summary = document.createElement('div');
    summary.className = 'hg-quota-summary';
    summary.appendChild(quotaSummaryItem('', t('quotaEntries'), rows.length));
    summary.appendChild(quotaSummaryItem('', t('totalUsage'), totalUsage));
    summary.appendChild(quotaSummaryItem(alertRows.length ? 'hg-quota-summary__attention' : 'hg-quota-summary__healthy', alertRows.length ? t('quotaAttention', { count: alertRows.length }) : t('quotaHealthy'), alertRows.length));
    var alerts = document.createElement('div');
    alerts.className = 'hg-quota-alerts';
    alertRows.slice(0, 3).forEach(function (row) {
      var label = row.cells && row.cells[0] ? row.cells[0].textContent.replace(/\s+/g, ' ').trim() : t('quotaEntries');
      var progress = row.querySelector('[role="progressbar"]');
      var item = document.createElement('span');
      item.className = 'hg-quota-alert';
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
    toggle.className = 'hg-quota-details-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = t('showDetails');
    toggle.addEventListener('click', function () {
      var expanded = node.classList.toggle('hg-dashlet-quota-expanded');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.textContent = expanded ? t('hideDetails') : t('showDetails');
    });
    wrapper.parentNode.insertBefore(summary, wrapper);
    if (alertRows.length) wrapper.parentNode.insertBefore(alerts, wrapper);
    wrapper.parentNode.insertBefore(toggle, wrapper);
    node.classList.add('hg-dashlet-quota-collapsed');
    node.dataset.heritageQuotaDecorated = 'true';
  }

  function syncCardState(node) {
    var state = node.querySelector('.progress-bar-danger, .hg-limit-alert--critical') ? 'critical' :
      node.querySelector('.progress-bar-warning, .hg-limit-alert--warning') ? 'warning' : 'neutral';
    node.classList.remove('hg-dashlet-state-neutral', 'hg-dashlet-state-warning', 'hg-dashlet-state-critical');
    node.classList.add('hg-dashlet-state-' + state);
    node.dataset.heritageState = state;
  }

  function syncPrimaryContext(node) {
    var name = node.dataset.heritageDashlet;
    var atomicModule = node.dataset.heritageAtomicSource === 'modules';
    var atomicMetric = node.dataset.heritageAtomicSource === 'metrics';
    if (name !== 'modules' && name !== 'metrics' && name !== 'statistics' && !atomicModule && !atomicMetric) return;
    var header = node.querySelector(':scope > .hg-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .hg-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'hg-dashlet__context';
      header.insertBefore(context, header.querySelector('.hg-dashlet__edit-hint, .hg-dashlet__layout-controls'));
    }
    var count = name === 'modules' || atomicModule ? node.querySelectorAll('.hg-module-launcher').length : name === 'statistics' ? node.querySelectorAll('.hg-statistics-launcher').length : node.querySelectorAll('.hg-dashboard-metric-card').length;
    if (atomicModule || atomicMetric) {
      context.textContent = node.dataset.heritageAtomicLabel || t(atomicMetric ? 'individualMetric' : 'individualModule');
      return;
    }
    var singleKey = name === 'metrics' || atomicMetric ? 'metricSingle' : 'destinationSingle';
    var pluralKey = name === 'metrics' || atomicMetric ? 'metricCount' : 'destinationCount';
    context.textContent = count === 1 ? t(singleKey) : t(pluralKey, { count: count });
  }

  function defaultSizeFor(node) {
    var name = node.dataset.heritageDashlet;
    if (node.dataset.heritageAtomicSource === 'modules') return '1x1';
    if (node.dataset.heritageAtomicSource === 'metrics') return '1x1';
    return defaults[name] || '1x1';
  }

  function syncOperationalContext(node) {
    var name = node.dataset.heritageDashlet;
    var operational = name === 'limits' || name === 'quota' || name === 'mailquota' || name === 'databasequota';
    if (!operational) return;
    var header = node.querySelector(':scope > .hg-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .hg-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'hg-dashlet__context hg-dashlet__context--capacity';
      header.insertBefore(context, header.querySelector('.hg-dashlet__edit-hint, .hg-dashlet__layout-controls'));
    }
    var count = name === 'limits' ? node.querySelectorAll('.hg-limit-group').length : node.querySelectorAll('.hg-quota-summary > article').length;
    var attention = node.querySelectorAll('.hg-limit-alert--warning, .hg-limit-alert--critical, .hg-quota-alert').length;
    context.dataset.heritageState = attention ? 'attention' : 'healthy';
    context.textContent = t(attention ? 'capacityAttention' : 'capacityHealthy', { count: count, attention: attention });
  }

  function syncSecondaryContext(node) {
    var name = node.dataset.heritageDashlet;
    if (name !== 'news' && name !== 'donate') return;
    var header = node.querySelector(':scope > .hg-dashlet__header');
    if (!header) return;
    var context = header.querySelector(':scope > .hg-dashlet__context');
    if (!context) {
      context = document.createElement('span');
      context.className = 'hg-dashlet__context hg-dashlet__context--secondary';
      header.insertBefore(context, header.querySelector('.hg-dashlet__edit-hint, .hg-dashlet__layout-controls'));
    }
    context.textContent = name === 'news' ? t('newsCount', { count: node.querySelectorAll('ul > li').length }) : t('optionalContent');
  }

  function enhance() {
    // Self-sufficient + idempotent: enhance is the single authority on the
    // dashboard state. It detects the dashboard by its raw, direct-child
    // .hg-dashlet widgets, sets the gating classes itself, and clears them on
    // non-dashboard pages. This removes the earlier fragile dependency on some
    // other code having set body.hg-dashboard-page first, which caused the
    // SPA-return race where the dashboard rendered undecorated.
    var host = document.getElementById('pageContent');
    if (!host) return false;
    normalizeServerDashlets(host);
    if (!host.querySelector(':scope > .hg-dashlet')) {
      document.body.classList.remove('hg-dashboard-page');
      host.classList.remove('hg-dashboard-layout');
      return false;
    }
    document.body.classList.add('hg-dashboard-page');
    host.classList.add('hg-dashboard-layout');
    splitAtomicDashlets(host);
    var layout = readLayout();
    var nodes = dashlets(host);
    nodes.forEach(function (node, index) {
      var name = node.dataset.heritageDashlet;
      if (node.dataset.heritageDefaultOrder === undefined) node.dataset.heritageDefaultOrder = String(defaultOrder[name] || 500 + index);
      node.dataset.heritagePriority = node.dataset.heritagePriority || priority[name] || 'standard';
    });
    nodes.sort(function (a, b) {
      var ao = layout[a.dataset.heritageDashlet] && layout[a.dataset.heritageDashlet].order;
      var bo = layout[b.dataset.heritageDashlet] && layout[b.dataset.heritageDashlet].order;
      return (typeof ao === 'number' ? ao : Number(a.dataset.heritageDefaultOrder)) - (typeof bo === 'number' ? bo : Number(b.dataset.heritageDefaultOrder));
    }).forEach(function (node) { host.appendChild(node); });
    dashlets(host).forEach(function (node) {
      var name = node.dataset.heritageDashlet;
      setSize(node, layout[name] && layout[name].size || defaultSizeFor(node));
      node.dataset.heritageHidden = layout[name] ? (layout[name].hidden ? 'true' : 'false') : (defaultHidden[name] ? 'true' : 'false');
      node.hidden = node.dataset.heritageHidden === 'true';
      node.draggable = false;
      node.setAttribute('aria-grabbed', 'false');
      if (name === 'limits') decorateLimits(node);
      if (name === 'modules') decorateModules(node);
      if (name === 'donate') decorateDonate(node);
      if (name === 'metrics') decorateMetrics(node);
      if (name === 'quota' || name === 'mailquota' || name === 'databasequota') decorateQuota(node);
      if (!node.querySelector('.hg-dashlet__layout-controls')) makeControls(node, host);
      syncCardState(node);
      syncPrimaryContext(node);
      syncOperationalContext(node);
      syncSecondaryContext(node);
    });
    if (!host.dataset.heritageLayoutDnD) {
      host.dataset.heritageLayoutDnD = 'true';
      var pointerSource = null;
      host.addEventListener('pointerdown', function (event) {
        var node = event.target.closest('.hg-dashlet');
        if (!node || !host.classList.contains('hg-dashboard-layout-edit') || !event.target.closest('.hg-dashlet__drag-handle')) return;
        pointerSource = node;
        node.classList.add('hg-dashlet--dragging');
        node.setPointerCapture(event.pointerId);
      });
      host.addEventListener('pointerup', function (event) {
        if (!pointerSource) return;
        var target = document.elementFromPoint(event.clientX, event.clientY);
        var destination = target && target.closest('.hg-dashlet');
        if (destination && destination !== pointerSource && host.contains(destination)) {
          destination.parentNode.insertBefore(pointerSource, destination);
          save(host);
        }
        pointerSource.classList.remove('hg-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('pointercancel', function () {
        if (pointerSource) pointerSource.classList.remove('hg-dashlet--dragging');
        pointerSource = null;
      });
      host.addEventListener('dragstart', function (event) {
        var node = event.target.closest('.hg-dashlet');
        if (!node || !host.classList.contains('hg-dashboard-layout-edit') || !event.target.closest('.hg-dashlet__drag-handle')) { event.preventDefault(); return; }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', node.dataset.heritageDashlet || '');
        node.setAttribute('aria-grabbed', 'true');
      });
      host.addEventListener('dragend', function (event) {
        var node = event.target.closest('.hg-dashlet');
        if (node) node.setAttribute('aria-grabbed', 'false');
      });
      host.addEventListener('dragover', function (event) {
        if (host.classList.contains('hg-dashboard-layout-edit') && event.target.closest('.hg-dashlet')) event.preventDefault();
      });
      host.addEventListener('drop', function (event) {
        if (!host.classList.contains('hg-dashboard-layout-edit')) return;
        var target = event.target.closest('.hg-dashlet');
        var name = event.dataTransfer.getData('text/plain');
        var source = name && host.querySelector('.hg-dashlet[data-heritage-dashlet="' + name + '"]');
        if (!target || !source || target === source) return;
        event.preventDefault();
        target.parentNode.insertBefore(source, target);
        save(host);
      });
    }
    var header = host.querySelector(':scope > .page-header');
    var overview = syncOverview(host);
    if (header && !host.querySelector(':scope > .hg-dashboard-toolbar')) {
      var toolbar = document.createElement('div');
      toolbar.className = 'hg-dashboard-toolbar';
      toolbar.setAttribute('aria-label', t('dashboardLayoutControls'));
      var status = document.createElement('span');
      status.className = 'hg-dashboard-toolbar__status';
      status.setAttribute('data-heritage-layout-status', 'true');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      toolbar.appendChild(status);
      var actions = document.createElement('div');
      actions.className = 'hg-dashboard-toolbar__actions';
      toolbar.appendChild(actions);
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'hg-dashboard-button hg-dashboard-button--primary hg-dashboard-layout-toggle hg-dashboard-toolbar__primary';
      toggle.textContent = t('customizeDashboard');
      toggle.setAttribute('data-heritage-layout-toggle', 'true');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', function () {
        host.classList.toggle('hg-dashboard-layout-edit');
        if (reset) {
          reset.dataset.heritageConfirm = 'false';
          reset.classList.remove('hg-dashboard-layout-reset--armed');
          reset.textContent = t('resetLayout');
        }
        syncToolbar(host);
      });
      actions.appendChild(toggle);
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'hg-dashboard-button hg-dashboard-layout-reset';
      reset.textContent = t('resetLayout');
      reset.setAttribute('data-heritage-layout-reset', 'true');
      var resetTimer = null;
      reset.addEventListener('click', function () {
        if (reset.dataset.heritageConfirm !== 'true') {
          reset.dataset.heritageConfirm = 'true';
          reset.classList.add('hg-dashboard-layout-reset--armed');
          reset.textContent = t('confirmReset');
          status.textContent = t('resetWarning');
          if (resetTimer) window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            reset.dataset.heritageConfirm = 'false';
            reset.classList.remove('hg-dashboard-layout-reset--armed');
            reset.textContent = t('resetLayout');
            syncToolbar(host);
          }, 6000);
          return;
        }
        if (resetTimer) window.clearTimeout(resetTimer);
        reset.dataset.heritageConfirm = 'false';
        reset.classList.remove('hg-dashboard-layout-reset--armed');
        reset.textContent = t('resetLayout');
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignore */ }
        dashlets(host).sort(function (a, b) {
          return Number(a.dataset.heritageDefaultOrder || 0) - Number(b.dataset.heritageDefaultOrder || 0);
        }).forEach(function (node) {
          var hiddenByDefault = Boolean(defaultHidden[node.dataset.heritageDashlet]);
          node.hidden = hiddenByDefault;
          node.dataset.heritageHidden = hiddenByDefault ? 'true' : 'false';
          setSize(node, defaultSizeFor(node));
          host.appendChild(node);
        });
        save(host);
        syncToolbar(host);
      });
      actions.appendChild(reset);
      var show = document.createElement('button');
      show.type = 'button';
      show.className = 'hg-dashboard-button hg-dashboard-layout-show-hidden';
      show.textContent = t('showHiddenWidgets');
      show.setAttribute('data-heritage-layout-show-hidden', 'true');
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
  window.heritageDashboardLayout = { enhance: enhance, storageKey: STORAGE_KEY };
}());

