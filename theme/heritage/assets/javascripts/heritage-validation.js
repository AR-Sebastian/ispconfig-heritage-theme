(function () {
  'use strict';

  var generatedId = 0;
  var messages = {};
  try {
    var source = document.getElementById('workbench-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function isGerman() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
  }

  function localizeKnownValidationText(root) {
    if (!root || !isGerman()) return;
    var copy = {
      'Validation failed': 'Eingaben pr\u00fcfen',
      'Please correct the highlighted field.': 'Bitte korrigieren Sie das markierte Feld.',
      'Please correct the highlighted fields.': 'Bitte korrigieren Sie die markierten Felder.',
      'Please check the highlighted fields.': 'Bitte pr\u00fcfen Sie die markierten Felder.',
      'Select a valid interface language.': 'Bitte w\u00e4hlen Sie eine g\u00fcltige Oberfl\u00e4chensprache.'
    };
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || '').trim();
      if (copy[value]) node.nodeValue = node.nodeValue.replace(value, copy[value]);
    }
  }

  function ensureId(element, prefix) {
    if (!element.id) {
      generatedId += 1;
      element.id = prefix + '-' + generatedId;
    }
    return element.id;
  }

  function fieldControl(group) {
    return group.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
  }

  function fieldLabel(group, control, index) {
    var label = group.querySelector('.control-label, label');
    var value = label && label.textContent.trim();
    return value || control.getAttribute('aria-label') || control.name || ((messages.validation_field || 'Field') + ' ' + (index + 1));
  }

  function fieldError(group) {
    var error = group.querySelector('.help-block, .error, [role="alert"]');
    return error ? error.textContent.trim() : '';
  }

  function alignFieldError(group) {
    var error = group && group.querySelector(':scope > .help-block, :scope > .help-inline, :scope > .error, :scope > [role="alert"]');
    var body = group && group.querySelector(':scope > .wb-field-body');
    if (error && body && !body.contains(error)) {
      body.appendChild(error);
      error.setAttribute('data-workbench-field-error-aligned', 'true');
    }
    return error;
  }

  function invalidEntries(host) {
    return Array.from(host.querySelectorAll('.form-group.has-error, .wb-field-group.has-error')).map(function (group, index) {
      var control = fieldControl(group);
      if (!control) return null;
      return { group: group, control: control, label: fieldLabel(group, control, index), error: fieldError(group) };
    }).filter(Boolean);
  }

  function summaryAlert(host, entries) {
    var alert = host.querySelector('.wb-validation-summary, .alert.alert-danger, #errorMsg');
    if (!alert && entries.length) {
      alert = document.createElement('div');
      alert.className = 'wb-validation-summary wb-validation-summary--generated';
      alert.dataset.workbenchValidationGenerated = 'true';
      host.prepend(alert);
    }
    return alert;
  }

  function revealAndFocus(entry) {
    if (!entry || !entry.control) return false;
    var collapsed = entry.group.closest('.collapse:not(.in), .wb-collapse:not(.in)');
    if (collapsed && window.workbenchInteractions) window.workbenchInteractions.collapse(collapsed, true, entry.control);
    window.setTimeout(function () {
      if (entry.control.offsetParent !== null) entry.control.focus();
    }, 0);
    return true;
  }

  function enhance(root, options) {
    var host = root && root.querySelectorAll ? root : document.getElementById('pageContent');
    if (!host) return { errors: 0, focused: false };
    if (window.workbenchAccessibility) window.workbenchAccessibility.enhance(host);

    localizeKnownValidationText(host);
    var entries = invalidEntries(host);
    var alert = summaryAlert(host, entries);
    if (!alert || !alert.textContent.trim() && !entries.length) return { errors: 0, focused: false };

    alert.classList.add('wb-validation-summary');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('tabindex', '-1');
    alert.setAttribute('aria-live', 'assertive');
    alert.querySelectorAll('[data-workbench-validation-list]').forEach(function (node) { node.remove(); });

    var title = alert.querySelector('.alert-label strong, .alert-label, h1, h2, h3, h4');
    if (!title) {
      var label = document.createElement('strong');
      label.className = 'wb-validation-summary__title';
      label.textContent = messages.validation_summary || (isGerman() ? 'Bitte pr\u00fcfen Sie die markierten Felder.' : 'Please check the highlighted fields.');
      alert.prepend(label);
      title = label;
    }
    alert.setAttribute('aria-labelledby', ensureId(title, 'wb-validation-title'));

    if (entries.length) {
      var list = document.createElement('ul');
      list.className = 'wb-validation-summary__list';
      list.dataset.workbenchValidationList = 'true';
      entries.forEach(function (entry) {
        entry.control.setAttribute('aria-invalid', 'true');
        ensureId(entry.control, 'wb-invalid-field');
        alignFieldError(entry.group);
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + entry.control.id;
        link.textContent = entry.label + (entry.error ? ': ' + entry.error : '');
        link.addEventListener('click', function (event) {
          event.preventDefault();
          revealAndFocus(entry);
        });
        item.appendChild(link);
        list.appendChild(item);
      });
      alert.appendChild(list);
    }

    alert.dataset.workbenchValidationSummary = 'true';
    var shouldFocus = options && options.focus === true;
    if (shouldFocus) {
      if (!entries.length || !revealAndFocus(entries[0])) window.setTimeout(function () { alert.focus(); }, 0);
    }
    return { errors: entries.length, focused: shouldFocus };
  }

  document.addEventListener('workbench:navigation-complete', function () {
    enhance(document.getElementById('pageContent'), { focus: false });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document.getElementById('pageContent')); }, { once: true });
  } else {
    enhance(document.getElementById('pageContent'));
  }

  window.workbenchValidation = { enhance: enhance, revealAndFocus: revealAndFocus };
  window.workbenchValidationInstalled = true;
}());
