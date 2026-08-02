(function (window, document) {
  'use strict';

  if (window.heritageMessageAcknowledgement) return;

  function acknowledge(alert) {
    var url = alert && alert.getAttribute('data-heritage-ack-url');
    if (!url || alert.dataset.heritageAckState === 'pending' || alert.dataset.heritageAckState === 'complete') return false;
    if (!window.heritageHttp) return false;

    alert.dataset.heritageAckState = 'pending';
    var request = window.heritageHttp.getText(url, { accept: 'text/plain', timeout: 10000 });
    request.promise.then(function () {
      alert.dataset.heritageAckState = 'complete';
      alert.dispatchEvent(new CustomEvent('heritage:message-acknowledged', { detail: { url: url } }));
    }).catch(function (error) {
      alert.dataset.heritageAckState = 'error';
      alert.dispatchEvent(new CustomEvent('heritage:message-acknowledgement-error', {
        detail: { url: url, error: error }
      }));
    });
    return true;
  }

  function enhance(scope) {
    var host = scope && scope.querySelectorAll ? scope : document;
    host.querySelectorAll('[data-heritage-ack-url]').forEach(function (alert) {
      if (alert.dataset.heritageAckBound === 'true') return;
      alert.dataset.heritageAckBound = 'true';
      alert.addEventListener('heritage:alert-dismiss', function () { acknowledge(alert); }, { once: true });
    });
  }

  window.heritageMessageAcknowledgement = { enhance: enhance, acknowledge: acknowledge };
  window.heritageMessageAcknowledgementInstalled = true;
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
})(window, document);
