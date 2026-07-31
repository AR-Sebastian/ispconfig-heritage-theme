(function () {
  'use strict';

  var activeTooltipControl = null;
  var tooltipNode = null;
  var tooltipId = 'workbench-native-tooltip';

  function emitNative(element, name, detail, cancelable) {
    if (!element) return false;
    return element.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      cancelable: cancelable === true,
      detail: detail || {}
    }));
  }

  function selectorFor(trigger) {
    var value = trigger && (trigger.getAttribute('data-target') || trigger.getAttribute('href')) || '';
    var hash = value.indexOf('#');
    return hash >= 0 ? value.slice(hash) : '';
  }

  function triggersFor(target) {
    if (!target || !target.id) return [];
    return Array.from(document.querySelectorAll('[data-workbench-collapse]')).filter(function (trigger) {
      return selectorFor(trigger) === '#' + target.id;
    });
  }

  function updateTriggers(target, expanded) {
    triggersFor(target).forEach(function (trigger) {
      trigger.classList.toggle('collapsed', !expanded);
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (!trigger.getAttribute('aria-controls') && target.id) trigger.setAttribute('aria-controls', target.id);
    });
  }

  function setCollapse(target, expanded, relatedTarget) {
    if (!target) return false;
    var current = target.classList.contains('in');
    var detail = { expanded: expanded, relatedTarget: relatedTarget || null };
    if (current === expanded) {
      target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      updateTriggers(target, expanded);
      return true;
    }
    if (!emitNative(target, expanded ? 'workbench:collapse-before-open' : 'workbench:collapse-before-close', detail, true)) return false;
    target.classList.toggle('in', expanded);
    target.hidden = !expanded;
    target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    updateTriggers(target, expanded);
    emitNative(target, expanded ? 'workbench:collapse-open' : 'workbench:collapse-close', detail, false);
    return true;
  }

  function closeAccordionPeers(trigger, target) {
    var parentSelector = trigger.getAttribute('data-parent');
    if (!parentSelector) return;
    var parent;
    try { parent = document.querySelector(parentSelector); } catch (error) { parent = null; }
    if (!parent) return;
    parent.querySelectorAll('.collapse.in, .wb-collapse.in').forEach(function (peer) {
      if (peer !== target) setCollapse(peer, false, trigger);
    });
  }

  function toggleCollapse(trigger) {
    var selector = selectorFor(trigger);
    var target;
    try { target = selector ? document.querySelector(selector) : null; } catch (error) { target = null; }
    if (!target) return false;
    var expanded = !target.classList.contains('in');
    if (expanded) closeAccordionPeers(trigger, target);
    return setCollapse(target, expanded, trigger);
  }

  function dismissAlert(control) {
    var alert = control && control.closest('.alert');
    var detail = { relatedTarget: control || null };
    if (!alert) return false;
    if (!emitNative(alert, 'workbench:alert-before-dismiss', detail, true)) return false;
    alert.remove();
    emitNative(alert, 'workbench:alert-dismiss', detail, false);
    return true;
  }

  function setModal(element, visible, relatedTarget) {
    if (!element || element.getAttribute('role') !== 'dialog' || !window.workbenchDialog) return false;
    return visible ? window.workbenchDialog.open(element, relatedTarget) : window.workbenchDialog.close(element, true);
  }

  function ensureTooltipNode() {
    if (tooltipNode && tooltipNode.isConnected) return tooltipNode;
    tooltipNode = document.createElement('div');
    tooltipNode.id = tooltipId;
    tooltipNode.className = 'wb-native-tooltip';
    tooltipNode.setAttribute('role', 'tooltip');
    tooltipNode.hidden = true;
    document.body.appendChild(tooltipNode);
    return tooltipNode;
  }

  function tooltipText(element, action) {
    return String(
      element.dataset.workbenchTooltipText ||
      element.getAttribute('data-original-title') ||
      element.getAttribute('title') ||
      action && action.title ||
      ''
    ).replace(/\s+/g, ' ').trim();
  }

  function positionTooltip(control, tooltip) {
    var rect = control.getBoundingClientRect();
    var gap = 9;
    var margin = 10;
    var left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.offsetWidth - margin));
    var top = rect.top - tooltip.offsetHeight - gap;
    var placement = 'top';
    if (top < margin) {
      top = rect.bottom + gap;
      placement = 'bottom';
    }
    tooltip.style.left = Math.round(left) + 'px';
    tooltip.style.top = Math.round(Math.max(margin, top)) + 'px';
    tooltip.dataset.placement = placement;
  }

  function showTooltip(control) {
    if (!control || control.dataset.workbenchNativeTooltip !== 'true') return false;
    var value = tooltipText(control);
    if (!value) return false;
    var tooltip = ensureTooltipNode();
    activeTooltipControl = control;
    tooltip.textContent = value;
    tooltip.hidden = false;
    control.setAttribute('aria-describedby', tooltipId);
    window.requestAnimationFrame(function() {
      if (activeTooltipControl === control && !tooltip.hidden) positionTooltip(control, tooltip);
    });
    return true;
  }

  function hideTooltip(control) {
    if (control && activeTooltipControl && control !== activeTooltipControl) return false;
    if (activeTooltipControl) {
      var previous = activeTooltipControl.dataset.workbenchTooltipDescribedBy || '';
      if (previous) activeTooltipControl.setAttribute('aria-describedby', previous);
      else activeTooltipControl.removeAttribute('aria-describedby');
    }
    activeTooltipControl = null;
    if (tooltipNode) tooltipNode.hidden = true;
    return true;
  }

  function initializeTooltip(element, action) {
    if (!element) return false;
    if (action === 'destroy') {
      hideTooltip(element);
      if (element.dataset.workbenchTooltipText && !element.getAttribute('title')) element.setAttribute('title', element.dataset.workbenchTooltipText);
      delete element.dataset.workbenchTooltipText;
      delete element.dataset.workbenchTooltipDescribedBy;
      delete element.dataset.workbenchNativeTooltip;
      return true;
    }
    var title = tooltipText(element, action);
    if (!title) return false;
    if (!element.dataset.workbenchTooltipDescribedBy) element.dataset.workbenchTooltipDescribedBy = element.getAttribute('aria-describedby') || '';
    element.dataset.workbenchTooltipText = title;
    element.setAttribute('data-original-title', title);
    element.removeAttribute('title');
    element.dataset.workbenchNativeTooltip = 'true';
    return true;
  }

  function synchronize(root) {
    var host = root && root.querySelectorAll ? root : document;
    host.querySelectorAll('[data-dismiss="alert"], [data-bs-dismiss="alert"]').forEach(function (trigger) {
      trigger.setAttribute('data-workbench-dismiss', 'alert');
      trigger.removeAttribute('data-dismiss');
      trigger.removeAttribute('data-bs-dismiss');
    });
    host.querySelectorAll('.wb-row-action[title]').forEach(function(element) {
      element.setAttribute('data-workbench-tooltip', 'true');
    });
    host.querySelectorAll('[data-workbench-tooltip]').forEach(function (element) {
      initializeTooltip(element);
    });
    host.querySelectorAll('.collapse, .wb-collapse').forEach(function (target) {
      var expanded = target.classList.contains('in');
      target.hidden = !expanded;
      target.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      updateTriggers(target, expanded);
    });
  }

  document.addEventListener('click', function (event) {
    var alertControl = event.target.closest('[data-workbench-dismiss="alert"]');
    if (alertControl) {
      event.preventDefault();
      dismissAlert(alertControl);
      return;
    }
    var collapseControl = event.target.closest('[data-workbench-collapse]');
    if (collapseControl) {
      event.preventDefault();
      toggleCollapse(collapseControl);
    }
  });

  document.addEventListener('pointerover', function(event) {
    var control = event.target.closest('[data-workbench-native-tooltip="true"]');
    if (control) showTooltip(control);
  });

  document.addEventListener('pointerout', function(event) {
    var control = event.target.closest('[data-workbench-native-tooltip="true"]');
    if (control && !control.contains(event.relatedTarget) && !control.contains(document.activeElement)) hideTooltip(control);
  });

  document.addEventListener('focusin', function(event) {
    var control = event.target.closest('[data-workbench-native-tooltip="true"]');
    if (control) showTooltip(control);
  });

  document.addEventListener('focusout', function(event) {
    var control = event.target.closest('[data-workbench-native-tooltip="true"]');
    if (control && !control.contains(event.relatedTarget)) hideTooltip(control);
  });

  document.addEventListener('workbench:navigation-complete', function (event) {
    hideTooltip(activeTooltipControl);
    synchronize(event.detail && event.detail.container || document.getElementById('pageContent'));
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && activeTooltipControl) hideTooltip(activeTooltipControl);
  });

  window.addEventListener('resize', function() {
    if (activeTooltipControl && tooltipNode && !tooltipNode.hidden) positionTooltip(activeTooltipControl, tooltipNode);
  });

  window.addEventListener('scroll', function() {
    if (!activeTooltipControl) return;
    if (activeTooltipControl.contains(document.activeElement) && tooltipNode && !tooltipNode.hidden) {
      positionTooltip(activeTooltipControl, tooltipNode);
    } else {
      hideTooltip(activeTooltipControl);
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { synchronize(document); }, { once: true });
  } else {
    synchronize(document);
  }

  window.workbenchInteractions = {
    collapse: setCollapse,
    toggleCollapse: toggleCollapse,
    dismissAlert: dismissAlert,
    modal: setModal,
    tooltip: initializeTooltip,
    synchronize: synchronize
  };
  window.workbenchInteractionsInstalled = true;
}());
