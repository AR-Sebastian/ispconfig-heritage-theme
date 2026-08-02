(function () {
  'use strict';

  var storageKey = 'ispconfig-heritage-login-username';
  var stayStorageKey = 'ispconfig-heritage-login-stay';
  var legacyStorageKey = 'ispconfig-workbench-login-username';
  var legacyStayStorageKey = 'ispconfig-workbench-login-stay';

  function getStorage() {
    try {
      var testKey = storageKey + '-test';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function migrateStorage(storage) {
    [[storageKey, legacyStorageKey], [stayStorageKey, legacyStayStorageKey]].forEach(function (keys) {
      if (storage.getItem(keys[0]) === null && storage.getItem(keys[1]) !== null) {
        storage.setItem(keys[0], storage.getItem(keys[1]));
      }
      storage.removeItem(keys[1]);
    });
  }

  function normalizeFeedback() {
    var surface = document.querySelector('.hg-login-form-surface');
    if (!surface) return;

    var nodes = surface.querySelectorAll('.alert, .box_error, .box_warning, .box_success, .box_info');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.heritageLoginFeedbackNormalized === 'true') return;
      var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      node.dataset.heritageLoginFeedbackNormalized = 'true';
      node.classList.add('hg-login-feedback-normalized');
      if (!node.getAttribute('role')) node.setAttribute('role', 'alert');
      if (!node.getAttribute('aria-live')) node.setAttribute('aria-live', 'polite');

      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      var message = document.createElement('span');
      message.className = 'hg-login-feedback-text';
      message.textContent = text;
      node.appendChild(message);
    });
  }

  function observeFeedback() {
    var surface = document.querySelector('.hg-login-form-surface');
    if (!surface || !('MutationObserver' in window)) return;

    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () {
        pending = false;
        normalizeFeedback();
      });
    });

    observer.observe(surface, { childList: true, subtree: true });
  }

  ready(function () {
    var storage = getStorage();
    var form = document.querySelector('.hg-login-form-surface form');
    var username = document.getElementById('username');
    var remember = document.getElementById('remember_username');
    var stay = document.getElementById('stay');
    var card = document.querySelector('.hg-login-card');

    normalizeFeedback();
    observeFeedback();

    document.addEventListener('click', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('[data-login-navigate]') : null;
      if (!control) return;
      var target = control.getAttribute('data-login-navigate');
      if (!target) return;
      event.preventDefault();
      window.location.href = target;
    });

    if (!form || !username || !storage) {
      return;
    }

    migrateStorage(storage);

    var rememberedUsername = storage.getItem(storageKey);
    if (rememberedUsername && !username.value) {
      username.value = rememberedUsername;
      if (remember) remember.checked = true;
      if (card) {
        card.setAttribute('data-heritage-remembered-user', 'true');
      }
    }

    if (stay && storage.getItem(stayStorageKey) === '1') {
      stay.checked = true;
    }

    username.addEventListener('input', function () {
      if (card) {
        card.removeAttribute('data-heritage-remembered-user');
      }
    });

    form.addEventListener('submit', function () {
      var value = (username.value || '').trim();
      if (remember && remember.checked && value) {
        storage.setItem(storageKey, value);
      } else {
        storage.removeItem(storageKey);
      }

      if (stay && stay.checked) {
        storage.setItem(stayStorageKey, '1');
      } else {
        storage.removeItem(stayStorageKey);
      }
    });
  });
}());
