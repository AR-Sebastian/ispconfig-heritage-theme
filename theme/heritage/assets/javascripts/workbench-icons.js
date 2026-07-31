(function(window, document) {
  'use strict';

  if (window.workbenchIconsInstalled) return;

  var paths = {
    calendar: '<path d="M7 2v3M17 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/>',
    billing: '<path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2V3Zm4 5h8M8 12h8M8 16h5"/>',
    lens: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    bulb: '<path d="M9 18h6M10 22h4M8.5 15.5A7 7 0 1 1 15.5 15.5C14.6 16.2 14 17 14 18h-4c0-1-.6-1.8-1.5-2.5Z"/>',
    tools: '<path d="M14 6a4 4 0 0 0-5-4l2 3-3 3-3-2a4 4 0 0 0 5 5L20 21l2-2-10-10a4 4 0 0 0 2-3Z"/>',
    admin: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-5"/>',
    sites: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    monitor: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.2 2.2c-1.2.8-1.7 1.3-1.7 2.8M12 18h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    dns: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M12 8v4M7.5 16l4.5-4 4.5 4"/>',
    client: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 5v1"/>',
    edit: '<path d="m4 16-1 5 5-1L19 9l-4-4L4 16ZM13 7l4 4"/>',
    filter: '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
    action: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
    dbadmin: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    loginas: '<path d="M10 17l5-5-5-5M15 12H3M14 3h7v18h-7"/>',
    delete: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    signal: '<path d="M4 20v-4M9 20v-8M14 20V8M19 20V4"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l2 2M14 9l2 2"/>',
    clone: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  var aliases = { mailuser: 'mail', add: 'plus', remove: 'close', th: 'grid', login: 'loginas' };
  var legacy = {
    'glyphicon-remove-circle': 'close', 'glyphicon-remove': 'close',
    'glyphicon-calendar': 'calendar', 'glyphicon-signal': 'signal',
    'glyphicon-arrow-right': 'arrow-right', 'glyphicon-arrow-left': 'arrow-left',
    'glyphicon-th': 'grid', 'glyphicon-time': 'time',
    'fa-times': 'close', 'fa-calendar': 'calendar', 'fa-clock-o': 'time',
    'fa-arrow-right': 'arrow-right', 'fa-arrow-left': 'arrow-left',
    'fa-lock': 'lock', 'fa-key': 'key', 'fa-clone': 'clone', 'fa-link': 'link'
  };
  var messages = {};
  try {
    var source = document.getElementById('workbench-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) { messages = {}; }

  function svgIcon(name) {
    var parsed = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + paths[name] + '</svg>', 'image/svg+xml');
    return document.importNode(parsed.documentElement, true);
  }

  function accessibleName(node, name) {
    var control = node.closest('a,button');
    if (!control || control.getAttribute('aria-label') || control.getAttribute('title')) return;
    var visibleText = Array.prototype.filter.call(control.childNodes, function(child) {
      return child.nodeType === 3 && child.textContent.trim();
    }).map(function(child) { return child.textContent.trim(); }).join(' ');
    if (visibleText) return;
    var language = typeof window.workbenchLanguage === 'function'
      ? window.workbenchLanguage()
      : String(document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
    var fallback = language === 'de'
      ? {delete:'Löschen',filter:'Filtern',edit:'Bearbeiten',loginas:'Als Benutzer anmelden',dbadmin:'Datenbankverwaltung öffnen',link:'Link öffnen',signal:'Statistiken öffnen',close:'Schließen',calendar:'Kalender öffnen',clone:'Kopieren',key:'Schlüssel',lock:'Gesperrt','arrow-left':'Zurück','arrow-right':'Weiter'}
      : {delete:'Delete',filter:'Filter',edit:'Edit',loginas:'Log in as user',dbadmin:'Open database administration',link:'Open link',signal:'Open statistics',close:'Close',calendar:'Open calendar',clone:'Copy',key:'Key',lock:'Locked','arrow-left':'Previous','arrow-right':'Next'};
    var label = messages['icon_' + name.replace(/-/g, '_')] || fallback[name];
    if (label) control.setAttribute('aria-label', label);
  }

  function render(root) {
    var nodes = (root || document).querySelectorAll('.icon:not(.wb-svg-icon),.glyphicon:not(.wb-svg-icon),.fa:not(.wb-svg-icon)');
    Array.prototype.forEach.call(nodes, function(node) {
      var name = '';
      Array.prototype.some.call(node.classList, function(className) {
        if (legacy[className]) {
          name = legacy[className];
          return true;
        }
        if (className.indexOf('icon-') === 0 && paths[className.slice(5)]) {
          name = className.slice(5);
          return true;
        }
        if (className.indexOf('icon-') === 0 && aliases[className.slice(5)]) {
          name = aliases[className.slice(5)];
          return true;
        }
        return false;
      });
      if (!name) return;
      node.classList.add('wb-svg-icon');
      node.setAttribute('data-workbench-icon', name);
      node.replaceChildren(svgIcon(name));
      accessibleName(node, name);
    });
  }

  render(document);
  var runtime = typeof window.workbenchRuntime === 'function' ? window.workbenchRuntime() : null;
  if (runtime && runtime.registerHook) {
    runtime.registerHook('onAfterContentLoad', function() {
      render(document.getElementById('pageContent'));
    });
  }

  window.workbenchIcons = { render: render, names: Object.keys(paths) };
  window.workbenchIconsInstalled = true;
})(window, document);
