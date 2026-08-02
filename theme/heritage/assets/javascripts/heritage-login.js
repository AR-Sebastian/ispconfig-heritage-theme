(function () {
  'use strict';

  var storageKey = 'ispconfig-workbench-login-username';
  var stayStorageKey = 'ispconfig-workbench-login-stay';

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

  function normalizeFeedback() {
    var surface = document.querySelector('.wb-login-form-surface');
    if (!surface) return;

    var nodes = surface.querySelectorAll('.alert, .box_error, .box_warning, .box_success, .box_info');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.wbLoginFeedbackNormalized === 'true') return;
      var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      node.dataset.wbLoginFeedbackNormalized = 'true';
      node.classList.add('wb-login-feedback-normalized');
      if (!node.getAttribute('role')) node.setAttribute('role', 'alert');
      if (!node.getAttribute('aria-live')) node.setAttribute('aria-live', 'polite');

      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      var message = document.createElement('span');
      message.className = 'wb-login-feedback-text';
      message.textContent = text;
      node.appendChild(message);
    });
  }

  function observeFeedback() {
    var surface = document.querySelector('.wb-login-form-surface');
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
    var form = document.querySelector('.wb-login-form-surface form');
    var username = document.getElementById('username');
    var remember = document.getElementById('remember_username');
    var stay = document.getElementById('stay');
    var card = document.querySelector('.wb-login-card');

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

    var rememberedUsername = storage.getItem(storageKey);
    if (rememberedUsername && !username.value) {
      username.value = rememberedUsername;
      if (remember) remember.checked = true;
      if (card) {
        card.setAttribute('data-wb-remembered-user', 'true');
      }
    }

    if (stay && storage.getItem(stayStorageKey) === '1') {
      stay.checked = true;
    }

    username.addEventListener('input', function () {
      if (card) {
        card.removeAttribute('data-wb-remembered-user');
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
