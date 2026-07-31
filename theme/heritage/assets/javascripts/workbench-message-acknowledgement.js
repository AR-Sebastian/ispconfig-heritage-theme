(function (window, document) {
  'use strict';

  if (window.workbenchMessageAcknowledgement) return;

  function acknowledge(alert) {
    var url = alert && alert.getAttribute('data-wb-ack-url');
    if (!url || alert.dataset.wbAckState === 'pending' || alert.dataset.wbAckState === 'complete') return false;
    if (!window.workbenchHttp) return false;

    alert.dataset.wbAckState = 'pending';
    var request = window.workbenchHttp.getText(url, { accept: 'text/plain', timeout: 10000 });
    request.promise.then(function () {
      alert.dataset.wbAckState = 'complete';
      alert.dispatchEvent(new CustomEvent('workbench:message-acknowledged', { detail: { url: url } }));
    }).catch(function (error) {
      alert.dataset.wbAckState = 'error';
      alert.dispatchEvent(new CustomEvent('workbench:message-acknowledgement-error', {
        detail: { url: url, error: error }
      }));
    });
    return true;
  }

  function enhance(scope) {
    var host = scope && scope.querySelectorAll ? scope : document;
    host.querySelectorAll('[data-wb-ack-url]').forEach(function (alert) {
      if (alert.dataset.wbAckBound === 'true') return;
      alert.dataset.wbAckBound = 'true';
      alert.addEventListener('workbench:alert-dismiss', function () { acknowledge(alert); }, { once: true });
    });
  }

  window.workbenchMessageAcknowledgement = { enhance: enhance, acknowledge: acknowledge };
  window.workbenchMessageAcknowledgementInstalled = true;
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
})(window, document);
