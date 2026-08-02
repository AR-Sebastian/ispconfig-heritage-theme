(function () {
  'use strict';

  var generatedId = 0;

  function donationRoot(link) {
    var root = link && link.closest('div');
    if (!root || !root.querySelector('h4 button.btn-link.btn-xs') || !root.querySelector('#description')) return null;
    return root;
  }

  function enhanceDonation(root) {
    if (!root || root.dataset.workbenchDisclosure === 'true') return false;
    var legacyTrigger = root.querySelector('h4 button.btn-link.btn-xs');
    var panel = root.querySelector('#description');
    if (!legacyTrigger || !panel) return false;

    generatedId += 1;
    var panelId = 'workbench-donation-details-' + generatedId;
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'wb-disclosure__trigger';
    trigger.textContent = legacyTrigger.textContent.trim();
    trigger.setAttribute('aria-controls', panelId);
    trigger.setAttribute('aria-expanded', 'false');

    panel.id = panelId;
    panel.classList.add('wb-disclosure__panel');
    panel.style.removeProperty('display');
    panel.hidden = true;
    root.classList.add('wb-disclosure');
    root.dataset.workbenchDisclosure = 'true';
    legacyTrigger.replaceWith(trigger);

    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;
      root.dispatchEvent(new CustomEvent('workbench:disclosure-change', {
        bubbles: true,
        detail: { expanded: !expanded }
      }));
    });
    return true;
  }

  function enhance(root) {
    var host = root && root.querySelectorAll ? root : document;
    var links = [];
    if (host.matches && host.matches('a[href*="ispconfig.org/donation"]')) links.push(host);
    host.querySelectorAll('a[href*="ispconfig.org/donation"]').forEach(function (link) { links.push(link); });
    links.forEach(function (link) { enhanceDonation(donationRoot(link)); });
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) enhance(node);
        });
      });
    });
    var observe = function () {
      var pageContent = document.getElementById('pageContent');
      if (pageContent) observer.observe(pageContent, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
  }

  document.addEventListener('workbench:navigation-complete', function () {
    enhance(document.getElementById('pageContent'));
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); }, { once: true });
  } else {
    enhance(document);
  }

  window.workbenchDisclosure = { enhance: enhance };
  window.workbenchDisclosureInstalled = true;
}());
