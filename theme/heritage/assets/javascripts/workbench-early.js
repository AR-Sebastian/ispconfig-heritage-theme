(function(window, document) {
  'use strict';

  function detectLanguage() {
    var declared = String(document.documentElement.getAttribute('lang') || '').trim().toLowerCase();
    if (declared.indexOf('de') === 0) return 'de';
    if (declared && declared !== 'en') return declared.split('-')[0];

    var source = document.querySelector('meta[name="workbench-language-probe"]');
    var probe = source ? String(source.getAttribute('content') || '') : '';
    if (/(?:anmelden|benutzername|kennwort)/i.test(probe)) return 'de';
    if (/(?:^|[\s|])(abmelden|ausloggen|suche|schlie(?:ß|ss)en|navigation\s+öffnen)(?:$|[\s|])/i.test(probe)) return 'de';
    return 'en';
  }

  window.workbenchLanguage = detectLanguage;
  var language = detectLanguage();
  document.documentElement.setAttribute('lang', language);

  function localize(root) {
    var scope = root || document;
    var textAttribute = 'data-wb-i18n-' + language;
    Array.prototype.forEach.call(scope.querySelectorAll('[' + textAttribute + ']'), function(node) {
      node.textContent = node.getAttribute(textAttribute);
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-wb-i18n-aria-label-de], [data-wb-i18n-title-de]'), function(node) {
      var aria = node.getAttribute('data-wb-i18n-aria-label-' + language);
      var title = node.getAttribute('data-wb-i18n-title-' + language);
      if (aria !== null) node.setAttribute('aria-label', aria);
      if (title !== null) node.setAttribute('title', title);
    });
    if (document.body) {
      var messages = {
        de: {
          filterReset: 'Filter zurücksetzen', filterResetActive: 'Aktive Filter zurücksetzen',
          searchClear: 'Suche leeren', filterToggle: 'Filter umschalten',
          filterShow: 'Filter anzeigen', filterHide: 'Filter ausblenden',
          pagination: 'Seitennavigation', paginationPage: 'Seite',
          paginationSummary: 'Seite {current} von {total}',
          listVisibleResults: '{count} Einträge auf dieser Seite', tableActions: 'Aktionen',
          tabWarning: 'Diese Seite enthält ungespeicherte Änderungen.',
          tabDiscard: 'Ungespeicherte Änderungen verwerfen und fortfahren?'
        },
        en: {
          filterReset: 'Reset filters', filterResetActive: 'Reset active filters',
          searchClear: 'Clear search', filterToggle: 'Toggle filters',
          filterShow: 'Show filters', filterHide: 'Hide filters',
          pagination: 'Pagination', paginationPage: 'Page',
          paginationSummary: 'Page {current} of {total}',
          listVisibleResults: '{count} items on this page', tableActions: 'Actions',
          tabWarning: 'This page contains unsaved changes.',
          tabDiscard: 'Discard the unsaved changes and continue?'
        }
      };
      var active = messages[language] || messages.en;
      Object.keys(active).forEach(function(key) { document.body.dataset['workbench' + key.charAt(0).toUpperCase() + key.slice(1)] = active[key]; });
      var tabDialog = document.getElementById('workbenchTabChangeDialog');
      if (tabDialog) {
        tabDialog.dataset.warningMessage = active.tabWarning;
        tabDialog.dataset.discardMessage = active.tabDiscard;
      }
    }
  }

  window.workbenchLocalize = localize;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { localize(document); }, { once: true });
  } else {
    localize(document);
  }

  try {
    if (window.localStorage && window.localStorage.getItem('ispconfig-workbench-theme') === 'dark') {
      document.documentElement.setAttribute('data-wb-theme', 'dark');
    }
  } catch (error) {
    /* Keep first paint independent from storage availability. */
  }
})(window, document);
