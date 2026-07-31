(function () {
  'use strict';

  var button = document.querySelector('.menu-btn');
  var panel = document.querySelector('#workbench-mobile-navigation');
  var overlay = document.querySelector('.wb-navigation-overlay');
  var closeButton = panel && panel.querySelector('.wb-mobile-navigation__close');
  var content = panel && panel.querySelector('.wb-mobile-navigation__content');
  var pendingModule = null;
  var currentPageTarget = '';
  var userCollapsedModule = '';
  var collapsedModules = {};
  var desktopQuery = window.matchMedia('(min-width: 1025px)');
  var dashboardTarget = 'dashboard/dashboard.php';
  var cachedPrimaryNavigation = [];
  var legacy = window.ISPConfig;

  function runtime() {
    return typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  }

  if (!button || !panel || !overlay || !closeButton || !content || !legacy || !runtime()) return;

  function focusableElements() {
    return Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  function cloneLink(source, className) {
    var link = source.cloneNode(true);
    link.removeAttribute('id');
    link.classList.add(className);
    return link;
  }

  function linkContentTarget(link) {
    return link ? (link.getAttribute('data-workbench-load-content') || link.getAttribute('data-load-content') || link.getAttribute('href') || '') : '';
  }

  function setLinkContentTarget(link, target) {
    if (!link) return;
    link.setAttribute('data-workbench-load-content', target);
    link.removeAttribute('data-load-content');
  }

  function linkModule(link) {
    return link ? (link.getAttribute('data-workbench-module') || link.getAttribute('data-capp') || '') : '';
  }

  function setLinkModule(link, module) {
    if (!link) return;
    link.setAttribute('data-workbench-module', module);
    link.removeAttribute('data-capp');
  }

  function navigationRoute(link) {
    var target = linkContentTarget(link);
    return target.split('#')[0].split('?')[0].replace(/^\/+/, '').toLowerCase();
  }

  function canonicalNavigationTarget(target) {
    var value = String(target || '').replace(/&amp;/gi, '&').split('#')[0].trim();
    if (!value) return '';
    try {
      var url = new URL(value, window.location.origin + '/');
      var route = url.pathname.replace(/^\/+/, '').toLowerCase();
      var parameters = Array.from(url.searchParams.entries()).sort(function (left, right) {
        var keyOrder = left[0].localeCompare(right[0]);
        return keyOrder || left[1].localeCompare(right[1]);
      });
      var query = new URLSearchParams();
      parameters.forEach(function (parameter) { query.append(parameter[0].toLowerCase(), parameter[1].toLowerCase()); });
      return route + (query.toString() ? '?' + query.toString() : '');
    } catch (error) {
      return value.replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
    }
  }

  function normalizeModule(value) {
    return String(value || '').toLowerCase().trim();
  }

  function normalizePageModule(value) {
    var canonical = canonicalNavigationTarget(value);
    return moduleFromTarget(canonical);
  }

  function setWorkbenchModule(module, options) {
    if (!runtime()) return '';
    var nextModule = normalizeModule(module);
    if (!nextModule) return '';
    runtime().workbenchActiveModule = nextModule;
    if (options && options.resetUserCollapsed) {
      userCollapsedModule = '';
      collapsedModules = {};
    }
    if (options && options.preserveCollapsed !== true && nextModule !== 'dashboard') {
      delete collapsedModules[nextModule];
    }
    return nextModule;
  }

  function moduleIsCollapsed(module) {
    return Boolean(module && collapsedModules[module]);
  }

  function setModuleCollapsed(module, collapsed) {
    if (!module) return;
    var next = Boolean(collapsed);
    if (module === 'dashboard') {
      return;
    }
    if (next) {
      collapsedModules[module] = true;
      userCollapsedModule = module;
    } else {
      delete collapsedModules[module];
      if (userCollapsedModule === module) userCollapsedModule = '';
    }
  }

  function resolveActiveModule(target, fallback) {
    var canonical = canonicalNavigationTarget(target || currentPageTarget);
    var moduleFromPage = normalizeModule(normalizePageModule(canonical));
    if (moduleFromPage) return moduleFromPage;
    var runtimeModule = normalizeModule((runtime() && runtime().workbenchActiveModule) || '');
    if (runtimeModule) return runtimeModule;
    if (fallback) return normalizeModule(fallback);
    if (canonical === '' && currentPageTarget === dashboardTarget) return 'dashboard';
    if (canonical.indexOf('dashboard') === 0 || canonical.indexOf('index.php') === 0 || canonical === dashboardTarget) return 'dashboard';
    return '';
  }

  function navigationTarget(link) {
    return canonicalNavigationTarget(linkContentTarget(link));
  }

  function moduleFromTarget(target) {
    var canonical = canonicalNavigationTarget(target);
    var route = canonical.split('?')[0];
    if (!route || route === 'index.php' || route === dashboardTarget) return 'dashboard';
    var moduleName = route.split('/')[0] || '';
    return moduleName || (route.indexOf('dashboard') === 0 ? 'dashboard' : '');
  }

  function navigationTargetMatches(actual, expected) {
    var actualTarget = canonicalNavigationTarget(actual);
    var expectedTarget = canonicalNavigationTarget(expected);
    var actualParts = actualTarget.split('?');
    var expectedParts = expectedTarget.split('?');
    if (actualParts[0] !== expectedParts[0]) return false;
    var actualParameters = new URLSearchParams(actualParts[1] || '');
    var expectedParameters = new URLSearchParams(expectedParts[1] || '');
    return Array.from(expectedParameters.entries()).every(function (parameter) {
      return actualParameters.get(parameter[0]) === parameter[1];
    });
  }

  var navigationPairs = [
    { list: 'help/support_message_list.php', create: 'help/support_message_edit.php', de: 'Nachrichten', createDe: 'Nachricht erstellen' },
    { list: 'help/faq_sections_list.php', create: 'help/faq_sections_edit.php', de: 'Kategorien', createDe: 'Kategorie erstellen' },
    { list: 'help/faq_manage_questions_list.php', create: 'help/faq_edit.php', de: 'Fragen', createDe: 'Frage erstellen' },
    { list: 'client/client_circle_list.php', create: 'client/client_circle_edit.php', de: 'Kundenkreise', createDe: 'Kundenkreis erstellen' },
    { list: 'client/client_list.php', create: 'client/client_edit.php', de: 'Kunden', createDe: 'Kunde erstellen' },
    { list: 'client/client_template_list.php', create: 'client/client_template_edit.php', de: 'Kundenvorlagen', createDe: 'Kundenvorlage erstellen' },
    { list: 'client/message_template_list.php', create: 'client/message_template_edit.php', de: 'E-Mail-Templates', createDe: 'E-Mail-Template erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=domain', create: 'sites/web_vhost_domain_edit.php?type=domain', de: 'Webseiten', createDe: 'Webseite erstellen' },
    { list: 'sites/web_childdomain_list.php?type=subdomain', create: 'sites/web_childdomain_edit.php?type=subdomain', de: 'Subdomains', createDe: 'Subdomain erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=subdomain', create: 'sites/web_vhost_domain_edit.php?type=subdomain', de: 'Subdomains (vHost)', createDe: 'vHost-Subdomain erstellen' },
    { list: 'sites/web_childdomain_list.php?type=aliasdomain', create: 'sites/web_childdomain_edit.php?type=aliasdomain', de: 'Aliasdomains', createDe: 'Aliasdomain erstellen' },
    { list: 'sites/web_vhost_domain_list.php?type=aliasdomain', create: 'sites/web_vhost_domain_edit.php?type=aliasdomain', de: 'Aliasdomains (vHost)', createDe: 'vHost-Aliasdomain erstellen' },
    { list: 'sites/database_list.php', create: 'sites/database_edit.php', de: 'Datenbanken', createDe: 'Datenbank erstellen' },
    { list: 'sites/database_user_list.php', create: 'sites/database_user_edit.php', de: 'DB-Benutzer', createDe: 'DB-Benutzer erstellen' },
    { list: 'sites/ftp_user_list.php', create: 'sites/ftp_user_edit.php', de: 'FTP-Benutzer', createDe: 'FTP-Benutzer erstellen' },
    { list: 'sites/webdav_user_list.php', create: 'sites/webdav_user_edit.php', de: 'WebDAV-Benutzer', createDe: 'WebDAV-Benutzer erstellen' },
    { list: 'sites/web_folder_list.php', create: 'sites/web_folder_edit.php', de: 'Gesch\u00fctzte Ordner', createDe: 'Gesch\u00fctzten Ordner erstellen' },
    { list: 'sites/web_folder_user_list.php', create: 'sites/web_folder_user_edit.php', de: 'Ordner-Benutzer', createDe: 'Ordner-Benutzer erstellen' },
    { list: 'sites/shell_user_list.php', create: 'sites/shell_user_edit.php', de: 'SSH/SFTP-Benutzer', createDe: 'SSH/SFTP-Benutzer erstellen' },
    { list: 'sites/cron_list.php', create: 'sites/cron_edit.php', de: 'Cronjobs', createDe: 'Cronjob erstellen' }
  ];

  var fallbackNavigationGroups = {
    help: [
      { titleDe: 'Support', pairs: ['help/support_message_list.php'] },
      { titleDe: 'FAQ', pairs: ['help/faq_sections_list.php', 'help/faq_manage_questions_list.php'] }
    ],
    client: [
      { titleDe: 'Kunden', pairs: ['client/client_list.php'] },
      { titleDe: 'Reseller', pairs: ['client/reseller_list.php'] },
      { titleDe: 'Benachrichtigungen', pairs: ['client/client_circle_list.php'] },
      { titleDe: 'Vorlagen', pairs: ['client/client_template_list.php', 'client/message_template_list.php'] }
    ],
    sites: [
      { titleDe: 'Webseiten', pairs: ['sites/web_vhost_domain_list.php?type=domain', 'sites/web_childdomain_list.php?type=subdomain', 'sites/web_childdomain_list.php?type=aliasdomain'] },
      { titleDe: 'Datenbanken', pairs: ['sites/database_list.php', 'sites/database_user_list.php'] },
      { titleDe: 'Web-Zugriff', pairs: ['sites/ftp_user_list.php', 'sites/webdav_user_list.php', 'sites/web_folder_list.php', 'sites/web_folder_user_list.php'] },
      { titleDe: 'Kommandozeile', pairs: ['sites/shell_user_list.php', 'sites/cron_list.php'] }
    ]
  };

  // Resource destinations use plural nouns consistently. Action labels remain
  // singular and are exposed through the adjacent + control.
  var pluralNavigationLabels = {
    'admin/directive_snippets_list.php': 'Direktiven-Schnipsel',
    'admin/extension_install_list.php': 'Installierte Erweiterungen',
    'admin/extension_repo_list.php': 'Verfügbare Erweiterungen',
    'admin/firewall_filter_list.php': 'Paketfilter',
    'admin/firewall_forward_list.php': 'Portweiterleitungen',
    'admin/firewall_list.php': 'Firewalls',
    'admin/iptables_list.php': 'IPTables-Regeln',
    'admin/remote_user_list.php': 'Remote-Benutzer',
    'admin/server_config_list.php': 'Serverkonfigurationen',
    'admin/server_ip_list.php': 'Server-IP-Adressen',
    'admin/server_ip_map_list.php': 'Server-IPv4-Zuordnungen',
    'admin/server_list.php': 'Server',
    'admin/server_php_list.php': 'PHP-Versionen',
    'admin/users_list.php': 'ISPConfig-Benutzer',
    'client/client_circle_list.php': 'Kundenkreise',
    'client/client_list.php': 'Kunden',
    'client/client_template_list.php': 'Kundenvorlagen',
    'client/domain_list.php': 'Domains',
    'client/message_template_list.php': 'E-Mail-Templates',
    'client/reseller_list.php': 'Reseller',
    'dns/dns_slave_list.php': 'Sekund\u00e4re DNS-Zonen',
    'dns/dns_soa_list.php': 'DNS-Zonen',
    'dns/dns_template_list.php': 'DNS-Vorlagen',
    'help/faq_list.php': 'FAQ-Eintraege',
    'help/faq_manage_questions_list.php': 'Fragen',
    'help/faq_sections_list.php': 'Kategorien',
    'help/support_message_list.php': 'Nachrichten',
    'mail/mail_alias_list.php': 'E-Mail-Aliase',
    'mail/mail_aliasdomain_list.php': 'Domain-Aliase',
    'mail/mail_blacklist_list.php': 'E-Mail-Blacklists',
    'mail/mail_content_filter_list.php': 'Inhaltsfilter',
    'mail/mail_domain_catchall_list.php': 'E-Mail-Catchalls',
    'mail/mail_domain_list.php': 'E-Mail-Domains',
    'mail/mail_forward_list.php': 'E-Mail-Weiterleitungen',
    'mail/mail_get_list.php': 'Fetchmail-Konten',
    'mail/mail_relay_domain_list.php': 'Relay-Domains',
    'mail/mail_relay_recipient_list.php': 'Relay-Empf\u00e4nger',
    'mail/mail_transport_list.php': 'E-Mail-Routen',
    'mail/mail_user_list.php': 'E-Mail-Postf\u00e4cher',
    'mail/mail_whitelist_list.php': 'E-Mail-Whitelists',
    'mail/spamfilter_blacklist_list.php': 'Spamfilter-Blacklists',
    'mail/spamfilter_config_list.php': 'Serverkonfigurationen',
    'mail/spamfilter_policy_list.php': 'Spamfilter-Richtlinien',
    'mail/spamfilter_users_list.php': 'Spamfilter-Benutzer',
    'mail/spamfilter_whitelist_list.php': 'Spamfilter-Whitelists',
    'mailuser/mail_user_filter_list.php': 'E-Mail-Filter',
    'monitor/datalog_list.php': 'Datenprotokolle',
    'monitor/dataloghistory_list.php': 'Datenprotokoll-Verl\u00e4ufe',
    'monitor/log_list.php': 'Protokolldateien',
    'sites/cron_list.php': 'Cronjobs',
    'sites/database_list.php': 'Datenbanken',
    'sites/database_user_list.php': 'DB-Benutzer',
    'sites/ftp_user_list.php': 'FTP-Benutzer',
    'sites/shell_user_list.php': 'SSH/SFTP-Benutzer',
    'sites/web_childdomain_list.php?type=aliasdomain': 'Aliasdomains',
    'sites/web_childdomain_list.php?type=subdomain': 'Subdomains',
    'sites/web_folder_list.php': 'Gesch\u00fctzte Ordner',
    'sites/web_folder_user_list.php': 'Ordner-Benutzer',
    'sites/web_vhost_domain_list.php?type=aliasdomain': 'Aliasdomains (vHost)',
    'sites/web_vhost_domain_list.php?type=domain': 'Webseiten',
    'sites/web_vhost_domain_list.php?type=subdomain': 'Subdomains (vHost)',
    'sites/webdav_user_list.php': 'WebDAV-Benutzer'
  };

  var legacyNavigationLabels = {
    'datenbank-benutzer': 'DB-Benutzer',
    'db benutzer': 'DB-Benutzer',
    'fragen verwalten': 'Fragen',
    'kategorien verwalten': 'Kategorien',
    'kunde': 'Kunden',
    'kunden bearbeiten': 'Kunden',
    'kundenkreis': 'Kundenkreise',
    'kundenkreis bearbeiten': 'Kundenkreise',
    'nachricht ansehen': 'Nachrichten',
    'nachrichten ansehen': 'Nachrichten',
    'webseite': 'Webseiten',
    'webseiten bearbeiten': 'Webseiten'
  };

  function normalizedLabel(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
  }

  function pairFromSourceLabel(link) {
    var text = normalizedLabel(link && link.textContent);
    if (!text) return null;
    var legacy = legacyNavigationLabels[text] || '';
    var normalizedLegacy = normalizedLabel(legacy);
    return navigationPairs.find(function (pair) {
      return normalizedLabel(pair.de) === text || (normalizedLegacy && normalizedLabel(pair.de) === normalizedLegacy);
    }) || null;
  }

  function explicitPair(link) {
    var target = navigationTarget(link);
    return navigationPairs.find(function (pair) { return navigationTargetMatches(target, pair.list); }) || pairFromSourceLabel(link);
  }

  function createLinkForPair(source, pair, sources) {
    var existing = sources.find(function (candidate) { return navigationTargetMatches(navigationTarget(candidate), pair.create); });
    if (existing) return existing;
    var link = document.createElement('a');
    link.href = '#';
    setLinkContentTarget(link, pair.create);
    link.textContent = isGermanInterface() ? pair.createDe : 'Create new';
    link.dataset.workbenchSyntheticCreate = 'true';
    return link;
  }

  function linkForPairTarget(pairTarget, create) {
    var pair = navigationPairs.find(function (candidate) {
      return navigationTargetMatches(pairTarget, candidate.list) ||
        (create && navigationTargetMatches(pairTarget, candidate.create));
    });
    if (!pair) return null;
    var link = document.createElement('a');
    link.href = '#';
    setLinkContentTarget(link, create ? pair.create : pair.list);
    link.dataset.workbenchSyntheticNavigation = 'true';
    link.textContent = create ? (isGermanInterface() ? pair.createDe : 'Create new') : (isGermanInterface() ? pair.de : pair.list);
    if (!create) link.dataset.workbenchCompactLabel = pair.de;
    return link;
  }

  function primaryNavigationSources() {
    var live = Array.from(document.querySelectorAll('#main-navigation a[data-workbench-module], #main-navigation a[data-capp]')).filter(function (source) {
      return linkModule(source) !== 'vm';
    });
    if (live.length) {
      cachedPrimaryNavigation = live.map(function (source) { return source.cloneNode(true); });
      return live;
    }
    return cachedPrimaryNavigation.filter(function (source) {
      return linkModule(source) !== 'vm';
    }).map(function (source) { return source.cloneNode(true); });
  }

  function isDashboardContent() {
    var pageContent = document.querySelector('#pageContent');
    if (!pageContent) return false;
    // Regression fix: detect the raw dashboard by its shipped .wb-dashlet
    // widgets too. The other markers (.wb-dashboard-layout, ul.modules, ...) are
    // only added by enhance(), which itself requires body.wb-dashboard-page — so
    // without .wb-dashlet here the detection deadlocked and the dashboard stayed
    // unstyled.
    return Boolean(pageContent.querySelector(':scope > .wb-dashlet, ul.modules, .wb-dashboard-layout, .wb-dashboard-hero, .wb-dashboard-overview'));
  }

  function isGermanInterface() {
    var declared = (document.documentElement.lang || '').toLowerCase();
    var primary = document.querySelector('#main-navigation');
    var footer = document.querySelector('.wb-app-navigation__footer');
    return declared.indexOf('de') === 0 || /\u00fcbersicht|kunden|webseiten|\u00fcberwachung|einstellungen/i.test(primary ? primary.textContent : '') || /ispconfig workbench/i.test(footer ? footer.textContent : '');
  }

  function navigationResource(link, suffix) {
    var route = navigationRoute(link);
    var match = route.match(new RegExp('^(.+)' + suffix + '\\.php$'));
    return match ? match[1] : '';
  }

  function isSafeCreateLink(link) {
    var target = linkContentTarget(link);
    var query = target.split('?')[1] || '';
    return Boolean(navigationResource(link, '_edit')) && !query;
  }

  function compactListLabel(link, preferred) {
    var label = link.querySelector('strong') || link;
    var text = label.textContent.trim();
    var legacy = legacyNavigationLabels[text.toLocaleLowerCase()];
    if (legacy && isGermanInterface()) {
      label.textContent = legacy;
      return;
    }
    if (preferred && isGermanInterface()) {
      label.textContent = preferred;
      return;
    }
    if (isGermanInterface()) {
      var target = navigationTarget(link);
      var plural = pluralNavigationLabels[target] || pluralNavigationLabels[target.split('?')[0]];
      if (plural) {
        label.textContent = plural;
        return;
      }
    }
    var compact = text
      .replace(/^(edit|manage|bearbeiten|verwalten)\s+/i, '')
      .replace(/\s+(edit|manage|bearbeiten|verwalten)$/i, '');
    if (compact && compact !== text) label.textContent = compact;
  }

  function appendNavigationItem(groupList, source, createSource) {
    var item = document.createElement('li');
    var row = document.createElement('div');
    var secondaryLink = cloneLink(source, 'wb-mobile-navigation__secondary-link');
    item.dataset.workbenchSearchText = (source.textContent + ' ' + (createSource ? createSource.textContent : '')).trim();
    if (isCurrentLink(source)) secondaryLink.setAttribute('aria-current', 'page');
    compactListLabel(secondaryLink, source.dataset.workbenchCompactLabel || '');
    if (!createSource) {
      item.appendChild(secondaryLink);
      groupList.appendChild(item);
      return;
    }

    row.className = 'wb-mobile-navigation__secondary-row';
    row.appendChild(secondaryLink);
    var quickAction = cloneLink(createSource, 'wb-mobile-navigation__quick-action');
    var createLabel = createSource.textContent.trim() || 'Create new';
    quickAction.replaceChildren();
    quickAction.setAttribute('aria-label', createLabel);
    quickAction.setAttribute('title', createLabel);
    if (isCurrentLink(createSource)) quickAction.setAttribute('aria-current', 'page');
    var quickIcon = document.createElement('span');
    quickIcon.setAttribute('aria-hidden', 'true');
    quickIcon.textContent = '+';
    quickAction.appendChild(quickIcon);
    quickAction.dataset.workbenchQuickAction = 'true';
    row.appendChild(quickAction);
    item.classList.add('wb-mobile-navigation__paired-item');
    item.appendChild(row);
    groupList.appendChild(item);
  }

  function appendSecondaryControl(groupList, source) {
    var select = source.querySelector('select');
    if (!select) return;
    var item = document.createElement('li');
    var label = document.createElement('label');
    var control = select.cloneNode(true);
    item.className = 'wb-mobile-navigation__secondary-control';
    item.dataset.workbenchSearchText = select.textContent.trim();
    label.className = 'wb-visually-hidden';
    label.textContent = isGermanInterface() ? 'Server ausw\u00e4hlen' : 'Select server';
    control.removeAttribute('id');
    control.removeAttribute('onchange');
    control.classList.add('wb-mobile-navigation__server-select');
    control.setAttribute('aria-label', label.textContent);
    control.addEventListener('change', function () {
      var api = runtime();
      if (api && typeof api.navigateTo === 'function') {
        api.navigateTo('monitor/show_sys_state.php?state=server&server=' + encodeURIComponent(control.value));
      }
      if (!desktopQuery.matches) close(false);
    });
    item.appendChild(label);
    item.appendChild(control);
    groupList.appendChild(item);
  }

  function appendSecondaryGroupLabel(group, groupList, header, index, sourceList) {
    if (!header || !header.textContent.trim()) return;
    var label = document.createElement('div');
    var labelText = header.textContent.trim();
    var listId = 'workbench-mobile-secondary-group-' + (index + 1);
    groupList.id = listId;
    label.className = 'wb-mobile-navigation__secondary-label';
    label.setAttribute('role', 'presentation');
    var labelTextNode = document.createElement('span');
    labelTextNode.textContent = labelText;
    var labelRule = document.createElement('i');
    labelRule.setAttribute('aria-hidden', 'true');
    label.appendChild(labelTextNode);
    label.appendChild(labelRule);
    group.appendChild(label);
  }

  function ensureBrand() {
    var header = panel.querySelector('.wb-mobile-navigation__header');
    var source = document.querySelector('#logo');
    if (!header || !source || header.querySelector('.wb-app-navigation__brand-logo')) return;
    var brand = source.cloneNode(true);
    brand.removeAttribute('id');
    brand.className = 'wb-app-navigation__brand-logo';
    brand.removeAttribute('aria-hidden');
    var brandLink = brand.querySelector('a');
    if (brandLink) {
      brandLink.removeAttribute('tabindex');
      setLinkModule(brandLink, 'dashboard');
      brandLink.dataset.workbenchDirectDashboard = 'true';
      brandLink.setAttribute('aria-label', 'Overview');
    }
    header.insertBefore(brand, header.firstChild);
  }

  function sidebarMatchesModule(sidebar, activeModule) {
    if (!sidebar || !activeModule) return false;
    return Array.from(sidebar.querySelectorAll('#sub-navigation a, .wb-secondary-navigation__group a')).some(function (link) {
      return moduleFromTarget(navigationTarget(link)) === activeModule;
    });
  }

  function buildSecondaryNavigation(activeModuleOverride) {
    var sidebar = document.querySelector('#sidebar');
    var container = document.createElement('ul');
    var api = runtime();
    var activeModule = String(activeModuleOverride || (api && api.workbenchActiveModule) || '');
    var dashboard = activeModule === 'dashboard' && isDashboardContent();
    if (dashboard) return { node: container, count: 0 };
    var useSidebar = sidebarMatchesModule(sidebar, activeModule);
    var links = useSidebar ? Array.from(sidebar.querySelectorAll('#sub-navigation a, .wb-secondary-navigation__group a')) : [];
    container.className = 'wb-mobile-navigation__secondary';
    container.id = 'workbench-mobile-secondary-navigation';
    if (!sidebar) return { node: container, count: 0 };

    var groups = useSidebar ? Array.from(sidebar.querySelectorAll(':scope > header')) : [];
    if (!groups.length) groups = [null];
    groups.forEach(function (header, groupIndex) {
      var sourceList = useSidebar ? (header ? header.nextElementSibling : sidebar.querySelector('#sub-navigation, .wb-secondary-navigation__group')) : null;
      if (!sourceList || sourceList.tagName !== 'UL') return;
      var group = document.createElement('li');
      group.className = 'wb-mobile-navigation__secondary-group';
      var groupList = document.createElement('ul');
      appendSecondaryGroupLabel(group, groupList, header, groupIndex, sourceList);
      var sources = Array.from(sourceList.querySelectorAll(':scope > li > a')).filter(function (source) {
        var target = canonicalNavigationTarget(navigationTarget(source));
        var retired = target.indexOf('mail/mail_mailinglist_') === 0 ||
          target.indexOf('mail/xmpp_') === 0 ||
          target.indexOf('sites/aps_') === 0;
        return !retired && !navigationTargetMatches(target, 'help/version.php');
      });
      var consumed = new Set();
      var pairByList = new Map();
      sources.forEach(function (source) {
        var pair = explicitPair(source);
        if (pair) {
          source.dataset.workbenchCompactLabel = pair.de;
          var explicitCreate = createLinkForPair(source, pair, sources);
          pairByList.set(source, explicitCreate);
          if (!explicitCreate.dataset.workbenchSyntheticCreate) consumed.add(explicitCreate);
          return;
        }
        var resource = navigationResource(source, '_list');
        if (!resource) return;
        var candidates = sources.filter(function (candidate) {
          return candidate !== source && isSafeCreateLink(candidate) && navigationResource(candidate, '_edit') === resource;
        });
        if (candidates.length === 1) {
          pairByList.set(source, candidates[0]);
          consumed.add(candidates[0]);
        }
      });
      sources.forEach(function (source) {
        if (consumed.has(source)) return;
        appendNavigationItem(groupList, source, pairByList.get(source) || null);
      });
      Array.from(sourceList.querySelectorAll(':scope > li')).filter(function (item) {
        return !item.querySelector(':scope > a') && item.querySelector(':scope > select');
      }).forEach(function (item) { appendSecondaryControl(groupList, item); });
      group.appendChild(groupList);
      container.appendChild(group);
    });
    if (!container.querySelector('.wb-mobile-navigation__secondary-link, .wb-mobile-navigation__secondary-control')) {
      (fallbackNavigationGroups[activeModule] || []).forEach(function (fallbackGroup, groupIndex) {
        var group = document.createElement('li');
        var groupList = document.createElement('ul');
        var header = document.createElement('header');
        group.className = 'wb-mobile-navigation__secondary-group wb-mobile-navigation__secondary-group--fallback';
        header.textContent = isGermanInterface() ? fallbackGroup.titleDe : fallbackGroup.titleDe;
        appendSecondaryGroupLabel(group, groupList, header, groupIndex, groupList);
        fallbackGroup.pairs.forEach(function (pairTarget) {
          var source = linkForPairTarget(pairTarget, false);
          if (!source) return;
          appendNavigationItem(groupList, source, linkForPairTarget(pairTarget, true));
        });
        if (groupList.children.length) {
          group.appendChild(groupList);
          container.appendChild(group);
        }
      });
    }
    return { node: container, count: Math.max(links.length, container.querySelectorAll('.wb-mobile-navigation__secondary-link, .wb-mobile-navigation__secondary-control').length) };
  }

  function isCurrentLink(link) {
    return link.classList.contains('active') || link.getAttribute('aria-current') === 'page';
  }

  function groupContainsTarget(list, canonicalPage) {
    if (!list || !canonicalPage) return false;
    return Array.from(list.querySelectorAll('a')).some(function (link) {
      return navigationTargetMatches(navigationTarget(link), canonicalPage);
    });
  }

  function syncSecondaryGroupExpansion(canonicalPage) {
    var sidebar = document.querySelector('#sidebar');
    if (!sidebar) return;
    Array.from(sidebar.querySelectorAll(':scope > header')).forEach(function (header, index) {
      var list = header.nextElementSibling;
      if (!list || list.tagName !== 'UL') return;
      list.hidden = false;
      header.classList.toggle('wb-secondary-navigation__header--active', groupContainsTarget(list, canonicalPage));
    });
    panel.querySelectorAll('.wb-mobile-navigation__secondary-group').forEach(function (group) {
      var list = group.querySelector(':scope > ul');
      if (!list) return;
      if (groupContainsTarget(list, canonicalPage)) list.hidden = false;
    });
  }

  function syncActiveNavigationState(pageTarget) {
    if (pageTarget) currentPageTarget = pageTarget;
    var canonicalPage = canonicalNavigationTarget(currentPageTarget);
    var api = runtime();
    var activeModule = resolveActiveModule(canonicalPage);
    if (!activeModule && canonicalPage.indexOf('dashboard/') === 0) activeModule = 'dashboard';
    if (activeModule && api) api.workbenchActiveModule = activeModule;
    if (activeModule === 'dashboard') {
      collapsedModules = {};
      userCollapsedModule = '';
    }

    document.querySelectorAll('#main-navigation a[data-workbench-module], #main-navigation a[data-capp]').forEach(function (link) {
      var active = activeModule && linkModule(link) === activeModule;
      link.classList.toggle('active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      var item = link.closest('li');
      if (item) item.classList.toggle('active', Boolean(active));
    });

    panel.querySelectorAll('.wb-mobile-navigation__module[data-workbench-module], .wb-mobile-navigation__module[data-capp]').forEach(function (link) {
      var active = activeModule && linkModule(link) === activeModule;
      var submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      link.classList.toggle('active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      if (!submenu) {
        link.classList.remove('wb-has-submenu');
        link.removeAttribute('aria-controls');
        link.removeAttribute('aria-expanded');
      } else if (!active) {
        submenu.hidden = true;
        link.setAttribute('aria-expanded', 'false');
      } else if (active && submenu) {
        var module = linkModule(link);
        var manuallyCollapsed = moduleIsCollapsed(module);
        submenu.hidden = Boolean(manuallyCollapsed);
        link.setAttribute('aria-expanded', manuallyCollapsed ? 'false' : 'true');
      }
    });

    if (!canonicalPage) return;
    document.querySelectorAll('#sidebar a, #workbench-mobile-navigation a:not(.wb-mobile-navigation__module)').forEach(function (link) {
      var active = navigationTargetMatches(navigationTarget(link), canonicalPage);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    syncSecondaryGroupExpansion(canonicalPage);
  }

  function finalizeNavigationState(pageTarget) {
    if (pageTarget) currentPageTarget = pageTarget;
    render();
    syncActiveNavigationState(pageTarget || currentPageTarget || dashboardTarget);
    panel.dataset.workbenchNavigationFinalized = 'true';
  }

  function collapseOtherModuleSubmenus(activeLink) {
    panel.querySelectorAll('.wb-mobile-navigation__module.wb-has-submenu[aria-expanded="true"]').forEach(function (module) {
      if (module === activeLink) return;
      module.setAttribute('aria-expanded', 'false');
      var moduleSubmenu = module.closest('li') && module.closest('li').querySelector('.wb-mobile-navigation__secondary');
      if (moduleSubmenu) moduleSubmenu.hidden = true;
    });
  }

  function setModuleSubmenuExpanded(link, expanded) {
    if (!link) return false;
    var submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
    if (!submenu) {
      link.classList.remove('wb-has-submenu');
      link.removeAttribute('aria-controls');
      link.removeAttribute('aria-expanded');
      return false;
    }
    link.classList.add('wb-has-submenu');
    submenu.hidden = expanded === false;
    var module = linkModule(link);
    if (!expanded) {
      setModuleCollapsed(module, true);
    } else {
      setModuleCollapsed(module, false);
    }
    link.setAttribute('aria-expanded', expanded === false ? 'false' : 'true');
    if (expanded) collapseOtherModuleSubmenus(link);
    return true;
  }

  function loadDashboardFromNavigation() {
    var api = runtime();
    setWorkbenchModule('dashboard', { resetUserCollapsed: true });
    currentPageTarget = dashboardTarget;
    pendingModule = null;
    render();
    syncActiveNavigationState(dashboardTarget);
    if (api && typeof api.loadContent === 'function') {
      api.loadContent(dashboardTarget);
    } else if (api && typeof api.capp === 'function') {
      api.capp('dashboard');
    }
  }

  function enhanceSecondaryNavigation() {
    var sidebar = document.querySelector('#sidebar');
    if (!sidebar) return 0;
    var headers = Array.from(sidebar.querySelectorAll(':scope > header'));
    headers.forEach(function (header, index) {
      var list = header.nextElementSibling;
      if (!list || list.tagName !== 'UL') return;
      var groupId = 'workbench-secondary-group-' + (index + 1);
      list.id = groupId;
      list.classList.add('wb-secondary-navigation__group');
      header.classList.add('wb-secondary-navigation__header');
      var canonicalPage = canonicalNavigationTarget(currentPageTarget);
      var active = Boolean(list.querySelector('a.active, a[aria-current="page"]')) || groupContainsTarget(list, canonicalPage);
      var button = header.querySelector(':scope > .wb-secondary-navigation__toggle');
      if (button) button.remove();
      list.hidden = false;
      header.classList.toggle('wb-secondary-navigation__header--active', active);
    });
    sidebar.classList.toggle('wb-secondary-navigation--grouped', headers.length > 0);
    return headers.length;
  }

  function syncShellLayout() {
    var sidebar = document.querySelector('#sidebar');
    var pageContent = document.querySelector('#pageContent');
    if (!sidebar || !pageContent) return false;
    var secondaryNavigation = Boolean(sidebar.querySelector('#sub-navigation'));
    var dashboardPage = isDashboardContent();
    var dashboardNews = Boolean(dashboardPage && !secondaryNavigation && sidebar.textContent.trim());
    var newsWidget = pageContent.querySelector(':scope > .wb-dashlet-news');
    if (dashboardNews && !newsWidget) {
      newsWidget = document.createElement('article');
      newsWidget.className = 'wb-dashlet wb-dashlet-news';
      newsWidget.setAttribute('data-wb-dashlet', 'news');
      newsWidget.replaceChildren.apply(newsWidget, Array.prototype.map.call(sidebar.childNodes, function(node) {
        return node.cloneNode(true);
      }));
      pageContent.appendChild(newsWidget);
      if (window.workbenchDashboardLayout) window.setTimeout(window.workbenchDashboardLayout.enhance, 0);
    }
    sidebar.classList.toggle('wb-dashboard-news', dashboardNews);
    sidebar.classList.toggle('wb-secondary-navigation', secondaryNavigation);
    sidebar.hidden = !secondaryNavigation;
    document.body.classList.toggle('wb-dashboard-news-layout', dashboardNews);
    document.body.classList.toggle('wb-dashboard-page', dashboardPage);
    // Regression fix: schedule dashboard enhancement whenever the page is a
    // dashboard, not only in the sidebar-news branch above. enhance() runs after
    // this tick, by which time body.wb-dashboard-page is set, so its host lookup
    // resolves and the widgets get their native layout/decoration.
    if (dashboardPage && window.workbenchDashboardLayout) window.setTimeout(window.workbenchDashboardLayout.enhance, 0);
    document.body.classList.toggle('wb-content-only-layout', !dashboardNews && !secondaryNavigation);
    return dashboardNews;
  }

  function render() {
    ensureBrand();
    var api = runtime();
    var activeModule = String(pendingModule || (api && api.workbenchActiveModule) || '');
    var secondary = buildSecondaryNavigation(activeModule);
    enhanceSecondaryNavigation();
    var primary = primaryNavigationSources();
    var list = document.createElement('ul');
    var activeItem = null;
    var activeLink = null;

    list.className = 'wb-mobile-navigation__modules';
    primary.forEach(function (source) {
      var item = document.createElement('li');
      var link = cloneLink(source, 'wb-mobile-navigation__module');
    if (linkModule(link) === 'dashboard') {
        link.dataset.workbenchDirectDashboard = 'true';
        setLinkContentTarget(link, dashboardTarget);
        link.setAttribute('href', '#');
        link.setAttribute('aria-label', isGermanInterface() ? '\u00dcbersicht' : 'Overview');
      }
      item.appendChild(link);
      list.appendChild(item);
      if ((activeModule && linkModule(source) === activeModule) || (!activeModule && isCurrentLink(source))) {
        activeItem = item;
        activeLink = link;
      }
    });

    if (secondary.count) {
      (activeItem || list).appendChild(secondary.node);
      if (activeLink) {
        var activeCollapsed = userCollapsedModule && userCollapsedModule === linkModule(activeLink);
        activeLink.classList.add('wb-has-submenu');
        activeLink.setAttribute('aria-controls', secondary.node.id);
        activeLink.setAttribute('aria-expanded', activeCollapsed ? 'false' : 'true');
        secondary.node.hidden = Boolean(activeCollapsed);
      }
    }

    content.replaceChildren(list);
    panel.classList.add('wb-app-navigation');
    document.body.classList.add('wb-app-navigation-enabled');
    if (window.workbenchIcons) window.workbenchIcons.render(panel);
    syncShellLayout();
    syncActiveNavigationState();
    panel.dataset.workbenchNavigationReady = 'true';

    if (isOpen() && pendingModule) {
      var pendingLink = Array.from(panel.querySelectorAll('[data-workbench-module], [data-capp]')).find(function (link) {
        return linkModule(link) === pendingModule;
      });
      var submenuLink = pendingLink && pendingLink.closest('li').querySelector('.wb-mobile-navigation__secondary a');
      window.setTimeout(function () {
        if (submenuLink) {
          submenuLink.focus();
          pendingModule = null;
        } else if (pendingLink) {
          pendingLink.focus();
        }
      }, 0);
    }
    return primary.length + secondary.count;
  }

  function isOpen() {
    return desktopQuery.matches || document.body.classList.contains('wb-navigation-open');
  }

  function syncMode() {
    var desktop = desktopQuery.matches;
    panel.inert = false;
    panel.setAttribute('role', desktop ? 'navigation' : 'dialog');
    panel.setAttribute('aria-modal', desktop ? 'false' : 'true');
    panel.setAttribute('aria-hidden', desktop ? 'false' : (document.body.classList.contains('wb-navigation-open') ? 'false' : 'true'));
    overlay.setAttribute('aria-hidden', desktop ? 'true' : overlay.getAttribute('aria-hidden'));
    document.body.classList.toggle('wb-app-navigation-desktop', desktop);
    if (desktop) {
      document.body.classList.remove('wb-navigation-open');
      button.setAttribute('aria-expanded', 'false');
    } else if (!document.body.classList.contains('wb-navigation-open')) {
      panel.inert = true;
    }
  }

  function focusNavigation() {
    if (!isOpen()) return false;
    closeButton.focus();
    return panel.contains(document.activeElement);
  }

  function open() {
    if (desktopQuery.matches) return;
    render();
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('wb-navigation-open');
    focusNavigation();
    window.setTimeout(focusNavigation, 0);
    window.setTimeout(function () {
      if (!panel.contains(document.activeElement)) focusNavigation();
    }, 250);
  }

  function close(restoreFocus) {
    if (desktopQuery.matches) return;
    document.body.classList.remove('wb-navigation-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    pendingModule = null;
    if (restoreFocus !== false && document.contains(button)) button.focus();
  }

  button.addEventListener('click', function () {
    if (isOpen()) close(true); else open();
  });
  closeButton.addEventListener('click', function () { close(true); });
  overlay.addEventListener('click', function () { close(true); });
  panel.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;

    if (link.dataset.workbenchDirectDashboard === 'true') {
      event.preventDefault();
      event.stopPropagation();
      userCollapsedModule = '';
      loadDashboardFromNavigation();
      close(false);
      return;
    }

    if (link.classList.contains('wb-mobile-navigation__module') && linkModule(link)) {
      var submenu = link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      var module = linkModule(link);
      if (link.classList.contains('active') && submenu) {
        event.preventDefault();
        event.stopPropagation();
        var nextExpanded = link.getAttribute('aria-expanded') !== 'true';
        setModuleCollapsed(module, !nextExpanded);
        setModuleSubmenuExpanded(link, nextExpanded);
        if (nextExpanded) {
          pendingModule = module;
          setWorkbenchModule(module, { resetUserCollapsed: false });
        }
        return;
      }
      if (desktopQuery.matches && link.classList.contains('active') && !submenu) {
        event.preventDefault();
        return;
      }
      pendingModule = module;
      setWorkbenchModule(module, { resetUserCollapsed: true });
      var api = runtime();
      syncActiveNavigationState(pendingModule + '/');
      render();
      link = Array.from(panel.querySelectorAll('.wb-mobile-navigation__module[data-workbench-module], .wb-mobile-navigation__module[data-capp]')).find(function (candidate) {
        return linkModule(candidate) === module;
      }) || link;
      submenu = link.closest('li') && link.closest('li').querySelector('.wb-mobile-navigation__secondary');
      if (submenu) setModuleSubmenuExpanded(link, true);
      else setModuleSubmenuExpanded(link, false);
      event.preventDefault();
      event.stopPropagation();
      link.classList.add('wb-module-transition-source');
      if (api && typeof api.capp === 'function') api.capp(pendingModule);
      return;
    }

    var target = linkContentTarget(link);
    if (target && target !== '#') {
      currentPageTarget = target;
      var targetModule = moduleFromTarget(target);
      var api = runtime();
      if (targetModule && api) {
        setWorkbenchModule(targetModule, { resetUserCollapsed: true });
      }
      syncActiveNavigationState(target);
    }
    close(false);
  });
  panel.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var focusable = focusableElements();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) close(true);
  });
  document.addEventListener('click', function (event) {
    var brandLink = event.target.closest('#logo a, .wb-app-navigation__brand-logo a, #main-navigation a[data-workbench-module="dashboard"], #main-navigation a[data-capp="dashboard"]');
    if (!brandLink) return;
    event.preventDefault();
    loadDashboardFromNavigation();
    close(false);
  });
  function handleModeChange() {
    syncMode();
    render();
  }
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleModeChange);
  else desktopQuery.addListener(handleModeChange);

  document.addEventListener('workbench:navigation-complete', function (event) {
    var page = event.detail && event.detail.page;
    if (page) currentPageTarget = page;
    syncShellLayout();
    finalizeNavigationState(page || currentPageTarget);
  });
  document.addEventListener('workbench:content-ready', function (event) {
    var page = event.detail && event.detail.page;
    if (page) currentPageTarget = page;
    // Race fix: navigation-complete can fire before the page fragment is in the
    // DOM, so isDashboardContent() misses the widgets and the dashboard renders
    // undecorated on SPA return. content-ready fires once the fragment is
    // present, so re-run the shell sync here to (re)detect the dashboard and
    // trigger its enhancement reliably.
    syncShellLayout();
    if (!page && !currentPageTarget) return;
    finalizeNavigationState(page || currentPageTarget);
  });

  syncMode();
  legacy.loadPushyMenu = render;
  render();
  window.workbenchNavigation = {
    render: render,
    open: open,
    close: close,
    isOpen: isOpen,
    focus: focusNavigation,
    syncActiveNavigationState: syncActiveNavigationState,
    finalizeNavigationState: finalizeNavigationState,
    syncShellLayout: syncShellLayout,
    enhanceSecondaryNavigation: enhanceSecondaryNavigation
  };
  window.workbenchNavigationInstalled = true;
}());
