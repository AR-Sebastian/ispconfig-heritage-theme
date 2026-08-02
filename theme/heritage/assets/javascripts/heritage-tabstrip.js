(function () {
  'use strict';

  var messages = {};
  var sequence = 0;
  try {
    var source = document.getElementById('workbench-content-messages');
    messages = JSON.parse(source ? source.textContent : '{}');
  } catch (error) {
    messages = {};
  }

  function icon(name) {
    var item = document.createElement('span');
    item.className = 'icon icon-' + name;
    item.setAttribute('aria-hidden', 'true');
    return item;
  }

  function update(wrapper) {
    var list = wrapper.querySelector('.wb-form-tabs');
    if (!list) return;
    var maximum = Math.max(0, list.scrollWidth - list.clientWidth);
    var overflow = maximum > 2;
    wrapper.dataset.overflow = String(overflow);
    wrapper.querySelector('.wb-tabstrip__previous').disabled = !overflow || list.scrollLeft <= 1;
    wrapper.querySelector('.wb-tabstrip__next').disabled = !overflow || list.scrollLeft >= maximum - 1;
  }

  function revealActive(wrapper) {
    var list = wrapper.querySelector('.wb-form-tabs');
    var active = list && list.querySelector('li.active');
    if (!active) return;
    var left = active.offsetLeft;
    var right = left + active.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
  }

  function scroll(wrapper, direction) {
    var list = wrapper.querySelector('.wb-form-tabs');
    if (!list) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({ left: direction * Math.max(120, Math.round(list.clientWidth * 0.72)), behavior: reduced ? 'auto' : 'smooth' });
  }

  function synchronizeAccessibility(list) {
    list.setAttribute('role', 'tablist');
    Array.from(list.querySelectorAll('a[data-change-tab]')).forEach(function (anchor) {
      var selected = Boolean(anchor.closest('li.active'));
      anchor.setAttribute('role', 'tab');
      anchor.setAttribute('aria-selected', String(selected));
      anchor.tabIndex = selected ? 0 : -1;
    });
  }

  function removeRetiredTabs(list) {
    Array.from(list.querySelectorAll('li')).forEach(function (item) {
      var anchor = item.querySelector('a');
      var target = ((anchor && (anchor.getAttribute('href') || anchor.getAttribute('data-change-tab'))) || '').toLowerCase();
      var label = ((anchor && anchor.textContent) || item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (target.indexOf('xmpp') !== -1 || label === 'xmpp') item.remove();
    });
  }

  function handleKeyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    var list = event.currentTarget;
    var tabs = Array.from(list.querySelectorAll('a[data-change-tab]'));
    var current = tabs.indexOf(document.activeElement);
    if (current < 0 || !tabs.length) return;
    event.preventDefault();
    var target = event.key === 'Home' ? 0 :
      event.key === 'End' ? tabs.length - 1 :
      (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[target].focus();
  }

  function enhance(root) {
    var scope = root && root.querySelectorAll ? root : document;
    Array.from(scope.querySelectorAll('.content-tab-wrapper > .wb-form-tabs')).forEach(function (list) {
      if (list.parentElement && list.parentElement.classList.contains('wb-tabstrip')) return;
      removeRetiredTabs(list);
      var wrapper = document.createElement('div');
      wrapper.className = 'wb-tabstrip';
      wrapper.dataset.workbenchTabstrip = 'true';
      list.id = list.id || 'workbench-tab-list-' + (++sequence);
      list.setAttribute('aria-label', messages.tab_sections || 'Form sections');
      synchronizeAccessibility(list);
      list.parentNode.insertBefore(wrapper, list);
      wrapper.appendChild(list);

      var previous = document.createElement('button');
      previous.type = 'button';
      previous.className = 'wb-tabstrip__control wb-tabstrip__previous';
      previous.setAttribute('aria-label', messages.tab_previous || 'Scroll tabs left');
      previous.setAttribute('aria-controls', list.id);
      previous.appendChild(icon('arrow-left'));

      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'wb-tabstrip__control wb-tabstrip__next';
      next.setAttribute('aria-label', messages.tab_next || 'Scroll tabs right');
      next.setAttribute('aria-controls', list.id);
      next.appendChild(icon('arrow-right'));

      wrapper.insertBefore(previous, list);
      wrapper.appendChild(next);
      previous.addEventListener('click', function () { scroll(wrapper, -1); });
      next.addEventListener('click', function () { scroll(wrapper, 1); });
      list.addEventListener('scroll', function () { update(wrapper); }, { passive: true });
      list.addEventListener('keydown', handleKeyboard);
      if (window.ResizeObserver) new ResizeObserver(function () { revealActive(wrapper); update(wrapper); }).observe(list);
      revealActive(wrapper);
      update(wrapper);
      if (window.workbenchIcons) window.workbenchIcons.render(wrapper);
    });
  }

  if (window.MutationObserver) {
    var observe = function () {
      var host = document.getElementById('pageContent');
      if (!host) return;
      new MutationObserver(function () { enhance(host); }).observe(host, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
    else observe();
  }
  document.addEventListener('workbench:navigation-complete', function () { enhance(document.getElementById('pageContent')); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { enhance(document); }, { once: true });
  else enhance(document);

  window.workbenchTabstrip = { enhance: enhance, update: update, revealActive: revealActive };
  window.workbenchTabstripInstalled = true;
}());
