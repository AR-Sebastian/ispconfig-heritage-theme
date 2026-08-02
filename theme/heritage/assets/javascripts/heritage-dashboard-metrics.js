(function (window, document) {
  'use strict';

  function queryAll(root, selector) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var translations = {
    de: {
      current: 'Aktuell', minimum: 'Minimum', maximum: 'Maximum', average: 'Durchschnitt',
      trend: 'Trend', trendHint: 'Entwicklung seit dem ersten sichtbaren Messpunkt',
      stable: 'stabil', samples: 'Messpunkte', sample: 'Messpunkt', period: 'Zeitraum',
      latestValues: 'letzte Werte', noValues: 'Keine Messwerte',
      unavailable: 'Messwerte nicht verfügbar', analysis: 'Analyse',
      meanShort: 'Mittel', minShort: 'Min', maxShort: 'Max'
    },
    en: {
      current: 'Current', minimum: 'Minimum', maximum: 'Maximum', average: 'Average',
      trend: 'Trend', trendHint: 'Change since the first visible sample',
      stable: 'stable', samples: 'Samples', sample: 'Sample', period: 'Period',
      latestValues: 'latest values', noValues: 'No measurements',
      unavailable: 'Measurements unavailable', analysis: 'Analysis',
      meanShort: 'Average', minShort: 'Min', maxShort: 'Max'
    }
  };

  function text() {
    var language = String(document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
    return translations[language] || translations.en;
  }

  function numberList(values) {
    return Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
  }

  function normalizeLegacyStringTokens(source) {
    return String(source || '').replace(/'((?:\\.|[^'\\])*)'/g, function (match, value) {
      return JSON.stringify(value
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\'));
    });
  }

  function parsePayload(source) {
    try {
      return JSON.parse(String(source || '{}'));
    } catch (nativeError) {
      return JSON.parse(normalizeLegacyStringTokens(source));
    }
  }

  function formatNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-';
  }

  function stats(data) {
    if (!data.length) return null;
    var latest = data[data.length - 1];
    var first = data[0];
    var min = Math.min.apply(Math, data);
    var max = Math.max.apply(Math, data);
    var avg = data.reduce(function (sum, entry) { return sum + entry; }, 0) / data.length;
    var delta = latest - first;
    var trend = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down';
    return { latest: latest, first: first, min: min, max: max, avg: avg, delta: delta, trend: trend, samples: data.length };
  }

  function sparklinePoints(data, width, height, pad, min, max) {
    var span = max - min || 1;
    return data.map(function (entry, index) {
      var x = data.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (data.length - 1));
      var y = height - pad - ((entry - min) / span) * (height - pad * 2);
      return [x, y];
    });
  }

  function detailRow(label, value) {
    var row = document.createElement('div');
    var term = document.createElement('dt');
    var definition = document.createElement('dd');
    term.textContent = label;
    definition.textContent = value;
    row.appendChild(term);
    row.appendChild(definition);
    return row;
  }

  function renderSparkline(host, width, height, label, state, points, area, line, data, labels) {
    var namespace = 'http://www.w3.org/2000/svg';
    host.replaceChildren();
    host.classList.remove('wb-dashboard-sparkline--empty', 'wb-dashboard-sparkline--error');
    var svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('focusable', 'false');
    var title = document.createElementNS(namespace, 'title');
    var copy = text();
    title.textContent = label + ': ' + copy.current + ' ' + formatNumber(state.latest) + ', ' + copy.minimum + ' ' + formatNumber(state.min) + ', ' + copy.maximum + ' ' + formatNumber(state.max);
    var polygon = document.createElementNS(namespace, 'polygon');
    polygon.setAttribute('points', area);
    polygon.setAttribute('class', 'wb-dashboard-sparkline__area');
    var polyline = document.createElementNS(namespace, 'polyline');
    polyline.setAttribute('points', line);
    polyline.setAttribute('class', 'wb-dashboard-sparkline__line');
    svg.appendChild(title);
    svg.appendChild(polygon);
    svg.appendChild(polyline);
    var guide = document.createElementNS(namespace, 'line');
    guide.setAttribute('y1', String(7));
    guide.setAttribute('y2', String(height - 7));
    guide.setAttribute('class', 'wb-dashboard-sparkline__guide');
    guide.hidden = true;
    svg.appendChild(guide);
    var tooltip = document.createElement('output');
    tooltip.className = 'wb-dashboard-sparkline__tooltip';
    tooltip.id = 'wb-metric-tooltip-' + String(host.id || label).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.hidden = true;
    svg.setAttribute('aria-describedby', tooltip.id);

    function activatePoint(point, coordinates, description) {
      queryAll(svg, '.wb-dashboard-sparkline__hit').forEach(function (entry) {
        entry.classList.toggle('is-active', entry === point);
      });
      guide.setAttribute('x1', coordinates[0].toFixed(1));
      guide.setAttribute('x2', coordinates[0].toFixed(1));
      guide.hidden = false;
      tooltip.textContent = description;
      tooltip.style.setProperty('--wb-metric-point-x', ((coordinates[0] / width) * 100).toFixed(2) + '%');
      tooltip.hidden = false;
    }

    function clearPoint(point) {
      if (document.activeElement === point || host.dataset.wbMetricPinned === point.dataset.wbMetricIndex) return;
      point.classList.remove('is-active');
      guide.hidden = true;
      tooltip.hidden = true;
    }

    function releasePinnedPoint() {
      delete host.dataset.wbMetricPinned;
      queryAll(svg, '.wb-dashboard-sparkline__hit').forEach(function (entry) {
        entry.classList.remove('is-active');
      });
      guide.hidden = true;
      tooltip.hidden = true;
    }

    function movePoint(point, offset) {
      var pointNodes = queryAll(svg, '.wb-dashboard-sparkline__hit');
      var current = pointNodes.indexOf(point);
      if (current < 0) return;
      pointNodes[(current + offset + pointNodes.length) % pointNodes.length].focus();
    }

    points.forEach(function (coordinates, index) {
      var point = document.createElementNS(namespace, 'circle');
      var pointLabel = Array.isArray(labels) && labels[index] ? String(labels[index]) : copy.sample + ' ' + (index + 1);
      var description = pointLabel + ': ' + formatNumber(data[index]);
      point.setAttribute('cx', coordinates[0].toFixed(1));
      point.setAttribute('cy', coordinates[1].toFixed(1));
      point.setAttribute('r', index === points.length - 1 ? '3.5' : '2.5');
      point.setAttribute('class', 'wb-dashboard-sparkline__point wb-dashboard-sparkline__hit');
      point.setAttribute('tabindex', '0');
      point.setAttribute('role', 'img');
      point.setAttribute('aria-label', description);
      point.setAttribute('data-wb-metric-index', String(index));
      var pointTitle = document.createElementNS(namespace, 'title');
      pointTitle.textContent = description;
      point.appendChild(pointTitle);
      point.addEventListener('pointerenter', function () { activatePoint(point, coordinates, description); });
      point.addEventListener('pointerleave', function () { clearPoint(point); });
      point.addEventListener('focus', function () { activatePoint(point, coordinates, description); });
      point.addEventListener('blur', function () { clearPoint(point); });
      point.addEventListener('click', function (event) {
        event.preventDefault();
        if (host.dataset.wbMetricPinned === String(index)) {
          releasePinnedPoint();
          return;
        }
        host.dataset.wbMetricPinned = String(index);
        activatePoint(point, coordinates, description);
      });
      point.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          movePoint(point, 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          movePoint(point, -1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          queryAll(svg, '.wb-dashboard-sparkline__hit')[0].focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          var pointNodes = queryAll(svg, '.wb-dashboard-sparkline__hit');
          pointNodes[pointNodes.length - 1].focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          releasePinnedPoint();
          point.focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          point.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      svg.appendChild(point);
    });
    host.addEventListener('pointerleave', function () {
      if (!host.dataset.wbMetricPinned && !host.contains(document.activeElement)) releasePinnedPoint();
    });
    host.appendChild(svg);
    host.appendChild(tooltip);
  }

  function renderMetric(root, id, series, labels) {
    var node = root.querySelector('#' + id);
    if (!node) return false;
    var card = root.querySelector('[data-wb-metric-card="' + id + '"]') || node.closest('.wb-dashboard-metric-card');
    var data = numberList(series && series.data);
    var value = root.querySelector('[data-wb-dashboard-metric-value="' + id + '"]');
    var trend = root.querySelector('[data-wb-metric-trend="' + id + '"]');
    var meta = root.querySelector('[data-wb-metric-meta="' + id + '"]');
    var details = root.querySelector('[data-wb-metric-details="' + id + '"]');
    var toggle = root.querySelector('[data-wb-metric-toggle="' + id + '"]');
    var label = node.getAttribute('aria-label') || id;
    var copy = text();
    if (toggle) toggle.textContent = label + ' ' + copy.analysis;

    if (!data.length) {
      node.replaceChildren();
      node.classList.add('wb-dashboard-sparkline--empty');
      var emptyState = document.createElement('span');
      emptyState.className = 'wb-dashboard-sparkline__state';
      emptyState.textContent = copy.noValues;
      node.appendChild(emptyState);
      if (value) value.textContent = '-';
      if (trend) trend.textContent = copy.trend + ' -';
      if (meta) meta.textContent = copy.noValues;
      if (details) details.hidden = true;
      if (toggle) toggle.hidden = true;
      if (card) card.dataset.wbMetricState = 'empty';
      node.setAttribute('role', 'status');
      return false;
    }

    var state = stats(data);
    var width = 260;
    var height = 86;
    var pad = 7;
    var points = sparklinePoints(data, width, height, pad, state.min, state.max);
    var line = points.map(function (point) { return point[0].toFixed(1) + ',' + point[1].toFixed(1); }).join(' ');
    var area = pad + ',' + (height - pad) + ' ' + line + ' ' + (width - pad) + ',' + (height - pad);
    var firstLabel = Array.isArray(labels) && labels.length ? String(labels[0]) : '';
    var lastLabel = Array.isArray(labels) && labels.length ? String(labels[labels.length - 1]) : '';
    var trendText = state.trend === 'flat' ? copy.stable : (state.delta > 0 ? '+' : '') + formatNumber(state.delta);

    if (value) value.textContent = formatNumber(state.latest);
    if (trend) {
      trend.textContent = copy.trend + ' ' + trendText;
      trend.dataset.wbMetricTrendDirection = state.trend;
      trend.title = copy.trendHint;
    }
    if (meta) meta.textContent = copy.meanShort + ' ' + formatNumber(state.avg) + ' \u00b7 ' + copy.minShort + ' ' + formatNumber(state.min) + ' \u00b7 ' + copy.maxShort + ' ' + formatNumber(state.max);
    if (card) {
      card.dataset.wbMetricState = 'ready';
      card.dataset.wbMetricLatest = String(state.latest);
      card.dataset.wbMetricMin = String(state.min);
      card.dataset.wbMetricMax = String(state.max);
      card.dataset.wbMetricAverage = String(state.avg);
      card.dataset.wbMetricDelta = String(state.delta);
      card.dataset.wbMetricTrend = state.trend;
      card.dataset.wbMetricSamples = String(state.samples);
    }

    node.dataset.wbMetricValues = data.join(',');
    node.dataset.wbMetricLabel = label;
    node.dataset.wbMetricLatest = String(state.latest);
    node.title = label + ': ' + formatNumber(state.latest) + (lastLabel ? ' - ' + lastLabel : '');
    renderSparkline(node, width, height, label, state, points, area, line, data, labels);

    if (details) {
      details.replaceChildren(
        detailRow(copy.current, formatNumber(state.latest)),
        detailRow(copy.trend, trendText),
        detailRow(copy.minimum, formatNumber(state.min)),
        detailRow(copy.average, formatNumber(state.avg)),
        detailRow(copy.maximum, formatNumber(state.max)),
        detailRow(copy.samples, state.samples),
        detailRow(copy.period, firstLabel && lastLabel ? firstLabel + ' - ' + lastLabel : copy.latestValues)
      );
    }
    if (toggle) toggle.hidden = false;
    return true;
  }

  function enhance(root) {
    root = root || document;
    queryAll(root, '[data-wb-dashboard-metrics-data]').forEach(function (payload) {
      if (payload.dataset.wbDashboardMetricsReady === 'true') return;
      payload.dataset.wbDashboardMetricsState = 'loading';
      queryAll(root, '[data-wb-metric-card]').forEach(function (card) {
        card.dataset.wbMetricState = 'loading';
        card.setAttribute('aria-busy', 'true');
      });
      var data;
      try {
        data = parsePayload(payload.textContent || '{}');
      } catch (error) {
        payload.dataset.wbDashboardMetricsState = 'error';
        queryAll(root, '.wb-dashboard-sparkline').forEach(function (node) {
          node.replaceChildren();
          node.classList.add('wb-dashboard-sparkline--error');
          var errorState = document.createElement('span');
          errorState.className = 'wb-dashboard-sparkline__state';
          errorState.textContent = text().unavailable;
          node.appendChild(errorState);
          node.setAttribute('role', 'status');
          var card = node.closest('[data-wb-metric-card]');
          if (card) {
            card.dataset.wbMetricState = 'error';
            card.removeAttribute('aria-busy');
          }
        });
        payload.removeAttribute('data-wb-dashboard-metrics-ready');
        document.dispatchEvent(new CustomEvent('workbench:dashboard-metrics-error', {
          detail: { payload: payload, error: error }
        }));
        return;
      }
      var rendered = 0;
      Object.keys(data.series || {}).forEach(function (id) {
        if (renderMetric(root, id, data.series[id], data.labels || [])) rendered += 1;
      });
      payload.dataset.wbDashboardMetricsState = rendered ? 'rendered' : 'empty';
      payload.dataset.wbDashboardMetricsRendered = String(rendered);
      payload.dataset.wbDashboardMetricsReady = 'true';
      queryAll(root, '[data-wb-metric-card]').forEach(function (card) {
        card.removeAttribute('aria-busy');
      });
      document.dispatchEvent(new CustomEvent('workbench:dashboard-metrics-ready', {
        detail: { payload: payload, rendered: rendered }
      }));
    });
  }

  function toggleDetails(button) {
    var id = button && button.getAttribute('data-wb-metric-toggle');
    var details = id ? document.querySelector('[data-wb-metric-details="' + id + '"]') : null;
    if (!details) return;
    var expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    details.hidden = expanded;
  }

  window.workbenchDashboardMetrics = { enhance: enhance, parsePayload: parsePayload };
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  document.addEventListener('workbench:content-ready', function (event) { enhance(event.detail && event.detail.root ? event.detail.root : document); });
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-wb-metric-toggle]') : null;
    if (!button) return;
    event.preventDefault();
    toggleDetails(button);
  });
})(window, document);
