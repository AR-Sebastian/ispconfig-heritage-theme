(function () {
  'use strict';
  var key = 'ispconfig-workbench-theme';
  var root = document.documentElement;
  var eye = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  var eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 3 18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6.1 0 9.5 6 9.5 6a18 18 0 0 1-3.1 3.8M6.1 6.8C3.8 8.2 2.5 12 2.5 12s3.4 6 9.5 6a9.7 9.7 0 0 0 3.1-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.7 15.3A8.5 8.5 0 0 1 8.7 3.3 8.5 8.5 0 1 0 20.7 15.3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var sun = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function svgFromMarkup(markup) {
    var source = String(markup || '');
    if (source.indexOf('xmlns=') === -1) source = source.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    var parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    var icon = parsed.documentElement;
    if (!icon || String(icon.nodeName).toLowerCase() === 'parsererror') return document.createTextNode('');
    return document.importNode(icon, true);
  }

  function setIcon(host, markup) {
    if (!host) return;
    host.replaceChildren(svgFromMarkup(markup));
  }

  function cssToken(name, fallback) {
    var value = window.getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  function colorWithAlpha(color, alpha) {
    var hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      var value = parseInt(hex[1], 16);
      return 'rgba(' + ((value >> 16) & 255) + ',' + ((value >> 8) & 255) + ',' + (value & 255) + ',' + alpha + ')';
    }
    var rgb = color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) return 'rgba(' + rgb[1].split(',').slice(0, 3).join(',') + ',' + alpha + ')';
    return color;
  }

  function colorChannels(color) {
    color = String(color || '').trim();
    var hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      var value = parseInt(hex[1], 16);
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    }
    var rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
  }

  function relativeLuminance(channels) {
    var linear = channels.map(function (channel) {
      var normalized = Math.max(0, Math.min(255, channel)) / 255;
      return normalized <= .04045 ? normalized / 12.92 : Math.pow((normalized + .055) / 1.055, 2.4);
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  }

  function contrastRatio(first, second) {
    var one = relativeLuminance(first);
    var two = relativeLuminance(second);
    return (Math.max(one, two) + .05) / (Math.min(one, two) + .05);
  }

  function accessibleAction(color, dark) {
    var source = colorChannels(color);
    if (!source) return color;
    var background = dark ? [21, 30, 45] : [244, 246, 250];
    if (contrastRatio(source, background) >= 4.55) return 'rgb(' + source.join(',') + ')';
    var target = dark ? [255, 255, 255] : [17, 24, 39];
    for (var step = 1; step <= 20; step++) {
      var amount = step / 20;
      var adjusted = source.map(function (channel, index) { return Math.round(channel + (target[index] - channel) * amount); });
      if (contrastRatio(adjusted, background) >= 4.55) return 'rgb(' + adjusted.join(',') + ')';
    }
    return 'rgb(' + target.join(',') + ')';
  }

  function applyActionContrast(color) {
    color = String(color || cssToken('--wb-action', '#cc151c')).trim();
    var channels = colorChannels(color);
    if (!channels) {
      root.style.setProperty('--wb-action-contrast', '#ffffff');
      return '#ffffff';
    }
    var luminance = relativeLuminance(channels);
    var contrast = ((luminance + .05) / .05) >= (1.05 / (luminance + .05)) ? '#111827' : '#ffffff';
    root.style.setProperty('--wb-action-contrast', contrast);
    return contrast;
  }

  function applyAccessibleAction(color) {
    var adjusted = accessibleAction(color || cssToken('--wb-accent', '#cc151c'), root.getAttribute('data-wb-theme') === 'dark');
    root.style.setProperty('--wb-action', adjusted);
    applyActionContrast(adjusted);
    return adjusted;
  }

  function applyChartTheme() {
    if (!document.getElementById('pageContent')) return;
    Array.prototype.forEach.call(document.querySelectorAll('#pageContent canvas'), function (canvas) {
      canvas.classList.add('wb-themed-chart');
      canvas.style.removeProperty('background-color');
    });
  }

  function scheduleChartTheme() {
    window.requestAnimationFrame(function () { applyChartTheme(); });
    window.setTimeout(applyChartTheme, 80);
  }

  function apply(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-wb-theme', dark ? 'dark' : 'light');
    applyAccessibleAction(cssToken('--wb-accent', '#cc151c'));
    Array.prototype.forEach.call(document.querySelectorAll('.wb-theme-toggle'), function (button) {
      var german = typeof window.workbenchLanguage === 'function' && window.workbenchLanguage() === 'de';
      button.setAttribute('aria-label', dark
        ? (german ? 'Zum hellen Design wechseln' : 'Switch to light theme')
        : (german ? 'Zum dunklen Design wechseln' : 'Switch to dark theme'));
      setIcon(button, dark ? sun : moon);
    });
    scheduleChartTheme();
  }
  apply(window.localStorage ? localStorage.getItem(key) : 'light');
  function enhanceLogin() {
    if (!document.body.classList.contains('wb-login-page')) return;
    var surface = document.querySelector('.wb-login-form-surface');
    var form = surface && surface.querySelector('form');
    if (!surface || !form) return;
    form.classList.add('wb-auth-form');
    var action = (form.getAttribute('action') || '').toLowerCase();
    var mode = action.indexOf('otp') !== -1 ? 'otp' : action.indexOf('password_reset') !== -1 ? 'reset' : action.indexOf('force_password') !== -1 ? 'password' : 'login';
    document.querySelector('.wb-login-card').setAttribute('data-wb-auth-mode', mode);
    var fieldMap = {
      username: { text: 'Benutzername', autocomplete: 'username' },
      password: { text: 'Passwort', autocomplete: 'current-password' },
      new_password: { text: 'Neues Passwort', autocomplete: 'new-password' },
      confirm_password: { text: 'Passwort wiederholen', autocomplete: 'new-password' },
      email: { text: 'E-Mail-Adresse', autocomplete: 'email', type: 'email' },
      code: { text: 'Best\u00e4tigungscode', autocomplete: 'one-time-code', inputmode: 'numeric' }
    };
    Array.prototype.forEach.call(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])'), function (input) {
      var field = fieldMap[input.id] || fieldMap[input.name] || { text: input.placeholder || input.name || 'Eingabe' };
      if (field.autocomplete) input.setAttribute('autocomplete', field.autocomplete);
      if (field.inputmode) input.setAttribute('inputmode', field.inputmode);
      if (field.type && input.type === 'text') input.type = field.type;
      input.setAttribute('aria-label', input.getAttribute('aria-label') || field.text);
      var group = input.closest('.form-group') || input.parentElement;
      if (group) group.classList.add('wb-auth-field');
      if (group && !group.querySelector('[data-wb-login-label]')) {
        var label = document.createElement('label');
        label.textContent = field.text;
        label.setAttribute('for', field.id);
        label.setAttribute('data-wb-login-label', 'true');
        group.insertBefore(label, input);
      }
      if (input.type === 'password' && group && !group.querySelector('[data-wb-password-toggle]')) {
        group.classList.add('wb-password-field');
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'wb-password-toggle';
        toggle.setAttribute('data-wb-password-toggle', 'true');
        setIcon(toggle, eye);
        toggle.setAttribute('aria-label', 'Passwort anzeigen');
        toggle.addEventListener('click', function () {
          var visible = input.type === 'text';
          input.type = visible ? 'password' : 'text';
          toggle.setAttribute('aria-label', visible ? 'Passwort anzeigen' : 'Passwort verbergen');
          setIcon(toggle, visible ? eye : eyeOff);
        });
        group.appendChild(toggle);
      }
      if ((input.id || input.name) === 'code') {
        input.classList.add('wb-auth-code');
        group.classList.add('wb-auth-field--code');
      }
    });
    Array.prototype.forEach.call(surface.querySelectorAll('.alert'), function (alert) {
      alert.classList.add('wb-auth-feedback');
      alert.setAttribute('aria-live', 'polite');
    });
    Array.prototype.forEach.call(form.querySelectorAll('input[type="submit"]'), function (button, index) {
      button.classList.add(index === 0 ? 'wb-auth-primary' : 'wb-auth-secondary');
    });
    Array.prototype.forEach.call(form.querySelectorAll('button'), function (button) {
      if (button.type === 'submit' && button.value !== 'resend') button.classList.add('wb-auth-primary');
      else button.classList.add('wb-auth-secondary');
    });
    var heading = surface.querySelector('h2');
    if (heading) heading.classList.add('wb-auth-context-title');
    var description = heading && heading.nextElementSibling;
    if (description && description.tagName === 'P') description.classList.add('wb-auth-context-copy');
    if (form && !form.dataset.wbLoginSubmitBound) {
      form.dataset.wbLoginSubmitBound = 'true';
      form.addEventListener('submit', function () {
        var submit = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submit) {
          submit.disabled = true;
          submit.setAttribute('aria-busy', 'true');
        }
        var card = document.querySelector('.wb-login-card');
        if (card) card.classList.add('wb-login-is-submitting');
      });
    }
  }
  enhanceLogin();
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.wb-theme-toggle');
    if (!button) return;
    var next = root.getAttribute('data-wb-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, next); } catch (ignore) {}
    apply(next);
  });
  document.addEventListener('workbench:navigation-complete', scheduleChartTheme);
  window.workbenchChartTheme = { apply: applyChartTheme };
  window.workbenchApplyAccentContrast = applyAccessibleAction;
}());
