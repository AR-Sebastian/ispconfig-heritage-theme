(function () {
  'use strict';

  var openDialog = null;
  var returnFocus = null;

  function focusable(dialog) {
    return Array.from(dialog.querySelectorAll('a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  function resolveDialog(value) {
    if (value && value.nodeType === 1) return value;
    if (typeof value !== 'string' || !value) return null;
    return document.getElementById(value.replace(/^#/, ''));
  }

  function isOpen(dialog) {
    var target = resolveDialog(dialog) || openDialog;
    return Boolean(target && !target.hidden && target.getAttribute('aria-hidden') === 'false');
  }

  function focus(dialog) {
    var target = resolveDialog(dialog) || openDialog;
    if (!isOpen(target)) return false;
    var preferred = target.querySelector('[data-heritage-dialog-autofocus]:not([disabled]):not([hidden])');
    var elements = focusable(target);
    (preferred || elements[0] || target).focus();
    return target.contains(document.activeElement);
  }

  function open(dialog, trigger) {
    var target = resolveDialog(dialog);
    if (!target || target.getAttribute('role') !== 'dialog') return false;
    if (openDialog && openDialog !== target) close(openDialog, false);
    if (target.parentElement !== document.body) {
      document.body.appendChild(target);
      target.setAttribute('data-heritage-dialog-portaled', 'true');
    }
    returnFocus = trigger && trigger.nodeType === 1 ? trigger : document.activeElement;
    openDialog = target;
    target.hidden = false;
    target.setAttribute('aria-hidden', 'false');
    target.setAttribute('data-heritage-dialog-state', 'open');
    document.body.classList.add('hg-dialog-open');
    document.body.setAttribute('data-heritage-dialog-active', target.id || 'dialog');
    if (returnFocus && returnFocus.setAttribute && (returnFocus.getAttribute('aria-haspopup') === 'dialog' || returnFocus.getAttribute('aria-controls') === target.id)) {
      returnFocus.setAttribute('aria-expanded', 'true');
    }
    focus(target);
    window.setTimeout(function () { focus(target); }, 0);
    target.dispatchEvent(new CustomEvent('heritage:dialog-open', { bubbles: true }));
    return true;
  }

  function close(dialog, restoreFocus) {
    var target = resolveDialog(dialog) || openDialog;
    if (!target || !isOpen(target)) return false;
    target.setAttribute('aria-hidden', 'true');
    target.hidden = true;
    target.setAttribute('data-heritage-dialog-state', 'closed');
    document.body.classList.remove('hg-dialog-open');
    document.body.removeAttribute('data-heritage-dialog-active');
    if (returnFocus && returnFocus.setAttribute && (returnFocus.getAttribute('aria-haspopup') === 'dialog' || returnFocus.getAttribute('aria-controls') === target.id)) {
      returnFocus.setAttribute('aria-expanded', 'false');
    }
    target.dispatchEvent(new CustomEvent('heritage:dialog-close', { bubbles: true }));
    openDialog = null;
    if (restoreFocus !== false && returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
    return true;
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-heritage-dialog]');
    if (trigger) {
      event.preventDefault();
      open(trigger.getAttribute('data-heritage-dialog'), trigger);
      return;
    }
    var closeControl = event.target.closest('[data-heritage-dialog-close]');
    if (closeControl && closeControl.closest('.hg-dialog')) {
      event.preventDefault();
      close(closeControl.closest('.hg-dialog'), true);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!openDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(openDialog, true);
      return;
    }
    if (event.key !== 'Tab') return;
    var elements = focusable(openDialog);
    if (!elements.length) {
      event.preventDefault();
      openDialog.focus();
      return;
    }
    var first = elements[0];
    var last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('focusin', function (event) {
    if (!openDialog || openDialog.contains(event.target)) return;
    focus(openDialog);
  });

  window.heritageDialog = {
    open: open,
    close: close,
    focus: focus,
    isOpen: isOpen
  };
  window.heritageDialogInstalled = true;
}());
