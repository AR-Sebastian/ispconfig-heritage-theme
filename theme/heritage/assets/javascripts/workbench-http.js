(function(window) {
  'use strict';

  if (window.workbenchHttp) return;

  function HttpError(message, status, url) {
    this.name = 'WorkbenchHttpError';
    this.message = message;
    this.status = status || 0;
    this.url = url || '';
  }
  HttpError.prototype = Object.create(Error.prototype);
  HttpError.prototype.constructor = HttpError;

  function normalizeFetchError(error, url) {
    if (error && error.name === 'WorkbenchHttpError') return error;
    if (error && error.name === 'AbortError') return error;
    if (error instanceof TypeError) return new HttpError('Network request failed.', 0, url && url.href || '');
    return error;
  }

  function shouldRetry(error, handle) {
    if (handle && handle.aborted) return false;
    if (!error) return false;
    if (error.name === 'AbortError') return false;
    if (error.name === 'WorkbenchHttpError' && error.status === 0) return true;
    return error instanceof TypeError;
  }

  function fetchWithRetry(url, init, handle, retries) {
    var attempt = 0;
    function run() {
      attempt += 1;
      return window.fetch(url.href, init).catch(function(error) {
        if (attempt <= retries && shouldRetry(error, handle)) {
          return new Promise(function(resolve) {
            window.setTimeout(resolve, 180 * attempt);
          }).then(run);
        }
        throw error;
      });
    }
    return run();
  }

  function sameOriginUrl(input, query) {
    var url = new URL(input, window.location.href);
    if (url.origin !== window.location.origin) {
      throw new HttpError('Cross-origin Workbench requests are blocked.', 0, url.href);
    }
    if (query) {
      var values = typeof query === 'string' ? new URLSearchParams(query) : new URLSearchParams();
      if (typeof query !== 'string') {
        Object.keys(query).forEach(function(key) {
          if (query[key] !== undefined && query[key] !== null) values.append(key, String(query[key]));
        });
      }
      values.forEach(function(value, key) { url.searchParams.append(key, value); });
    }
    return url;
  }

  function get(input, options) {
    options = options || {};
    var url = sameOriginUrl(input, options.query);
    var controller = window.AbortController ? new window.AbortController() : null;
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    var init = {
      method: 'GET',
      credentials: 'same-origin',
      cache: options.cache || 'no-store',
      headers: { 'Accept': options.accept || 'text/html' },
      signal: controller ? controller.signal : undefined
    };
    handle.promise = fetchWithRetry(url, init, handle, options.retries === undefined ? 1 : Number(options.retries) || 0).then(function(response) {
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return options.response === 'json' ? response.json() : response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (handle.aborted) throw new HttpError('Request was superseded.', 0, url.href);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function postForm(form, input, options) {
    options = options || {};
    if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
    var url = sameOriginUrl(input);
    var controller = window.AbortController ? new window.AbortController() : null;
    var body = new URLSearchParams();
    new FormData(form).forEach(function(value, key) {
      if (typeof value === 'string') body.append(key, value);
    });
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 30000);
    var init = {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body.toString(),
      signal: controller ? controller.signal : undefined
    };
    // Mutating requests are never retried implicitly. A lost response does not
    // prove that the server rejected the first write, so repeating it could
    // create duplicate records or execute an action twice.
    handle.promise = fetchWithRetry(url, init, handle, options.retries === undefined ? 0 : Number(options.retries) || 0).then(function(response) {
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      if (handle.aborted) throw new HttpError('Request was superseded.', 0, url.href);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function multipart(body, input, options) {
    options = options || {};
    if (!(body instanceof window.FormData)) throw new TypeError('A FormData body is required.');
    var url = sameOriginUrl(input);
    var controller = window.AbortController ? new window.AbortController() : null;
    var handle = {
      readyState: 1,
      aborted: false,
      abort: function() {
        handle.aborted = true;
        if (controller) controller.abort();
      }
    };
    var timer = window.setTimeout(handle.abort, options.timeout || 120000);
    handle.promise = window.fetch(url.href, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body,
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      if (options.response === 'json') {
        return response.json().then(function(payload) { return { ok: response.ok, status: response.status, payload: payload }; });
      }
      if (!response.ok) throw new HttpError('HTTP ' + response.status, response.status, url.href);
      return response.text();
    }).then(function(payload) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      return payload;
    }, function(error) {
      handle.readyState = 4;
      window.clearTimeout(timer);
      throw normalizeFetchError(error, url);
    });
    return handle;
  }

  function postMultipart(form, input, options) {
    if (!form || form.nodeName !== 'FORM') throw new TypeError('A form element is required.');
    return multipart(new FormData(form), input, options);
  }

  window.workbenchHttp = {
    getText: function(input, options) { return get(input, options); },
    getJson: function(input, options) {
      options = Object.assign({}, options || {}, { response: 'json', accept: 'application/json' });
      return get(input, options);
    },
    postForm: postForm,
    postMultipart: postMultipart,
    postMultipartJson: function(body, input, options) {
      return multipart(body, input, Object.assign({}, options || {}, { response: 'json' }));
    },
    HttpError: HttpError
  };
})(window);
