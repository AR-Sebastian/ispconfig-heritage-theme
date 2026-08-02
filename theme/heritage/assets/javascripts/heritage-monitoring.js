(function (window, document) {
  'use strict';

  function chartFor(canvas) {
    if (!canvas || !window.Chart || typeof window.Chart.getChart !== 'function') return null;
    return window.Chart.getChart(canvas) || null;
  }

  function destroy(scope) {
    if (!scope || !window.Chart) return;
    scope.querySelectorAll('.wb-monitor-chart canvas').forEach(function (canvas) {
      var chart = chartFor(canvas);
      if (chart) chart.destroy();
    });
  }

  function numberList(values) {
    return Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
  }

  function formatNumber(value) {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  function isGerman() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('de') === 0;
  }

  function copy(key) {
    var german = {
      current: 'Aktuell',
      minimum: 'Minimum',
      maximum: 'Maximum',
      average: 'Durchschnitt',
      trend: 'Trend',
      samples: 'Messpunkte',
      value: 'Wert',
      empty: 'Keine Messdaten',
      show: 'Details anzeigen',
      hide: 'Details ausblenden',
      chart: 'Zeitverlauf'
    };
    var english = {
      current: 'Current',
      minimum: 'Minimum',
      maximum: 'Maximum',
      average: 'Average',
      trend: 'Trend',
      samples: 'Samples',
      value: 'Value',
      empty: 'No monitoring data',
      show: 'Show details',
      hide: 'Hide details',
      chart: 'Time series'
    };
    return (isGerman() ? german : english)[key] || key;
  }

  function chartPalette(canvas, theme) {
    var palettes = {
      loadchart: ['--wb-info', '#1769aa', 'load'],
      memchart: ['--wb-chart-violet', '#6d5bd0', 'memory'],
      rxchart: ['--wb-chart-teal', '#087f8c', 'network-in'],
      txchart: ['--wb-chart-amber', '#996515', 'network-out']
    };
    var selected = palettes[canvas.id] || ['--wb-info', '#1769aa', 'neutral'];
    var color = theme.getPropertyValue(selected[0]).trim() || selected[1];
    return { color: color, fallback: selected[1], metric: selected[2] };
  }

  function translucent(color, fallback) {
    var candidate = /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
    return candidate + '20';
  }

  function metricStats(data) {
    if (!data.length) return null;
    var min = Math.min.apply(Math, data);
    var max = Math.max.apply(Math, data);
    var sum = data.reduce(function(total, value) { return total + value; }, 0);
    var latest = data[data.length - 1];
    var previous = data.length > 1 ? data[data.length - 2] : latest;
    return {
      latest: latest,
      min: min,
      max: max,
      avg: sum / data.length,
      delta: latest - previous,
      samples: data.length
    };
  }

  function markEmpty(canvas, message) {
    var card = canvas && canvas.closest('[data-wb-chart-card]');
    if (!card) return;
    card.dataset.wbChartState = 'empty';
    var value = card.querySelector('[data-wb-chart-value]');
    if (value) {
      value.textContent = '-';
      value.setAttribute('title', message || copy('empty'));
    }
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

  function setDetails(card, id, stats) {
    var details = card && card.querySelector('[data-wb-monitor-chart-details="' + id + '"]');
    if (!details || !stats) return;
    details.replaceChildren(
      detailRow(copy('current'), formatNumber(stats.latest)),
      detailRow(copy('minimum'), formatNumber(stats.min)),
      detailRow(copy('maximum'), formatNumber(stats.max)),
      detailRow(copy('average'), formatNumber(stats.avg)),
      detailRow(copy('trend'), (stats.delta >= 0 ? '+' : '') + formatNumber(stats.delta)),
      detailRow(copy('samples'), stats.samples)
    );
  }

  function render(canvas, labels, series) {
    var data = numberList(series && series.data);
    if (!canvas || !window.Chart || !data.length) {
      markEmpty(canvas, copy('empty'));
      return false;
    }

    var existing = chartFor(canvas);
    if (existing) existing.destroy();
    var card = canvas.closest('[data-wb-chart-card]');
    var value = card && card.querySelector('[data-wb-chart-value]');
    var stats = metricStats(data);
    if (value && stats) {
      value.textContent = formatNumber(stats.latest);
      value.setAttribute('title', series.label || '');
    }
    if (card) setDetails(card, canvas.id, stats);

    var theme = getComputedStyle(document.documentElement);
    var palette = chartPalette(canvas, theme);
    var text = theme.getPropertyValue('--wb-text-muted').trim() || '#687389';
    var grid = theme.getPropertyValue('--wb-border').trim() || '#e1e5ed';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (series.label || copy('value')) + ' \u2013 ' + copy('chart'));
    if (card) {
      card.dataset.wbMonitorMetric = palette.metric;
      card.style.setProperty('--wb-monitor-chart-color', palette.color);
    }
    var chart = new window.Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: Array.isArray(labels) ? labels.slice(-data.length) : [],
        datasets: [{
          label: series.label || '',
          data: data,
          borderWidth: 2,
          tension: 0.4,
          cubicInterpolationMode: 'default',
          borderColor: palette.color,
          backgroundColor: translucent(palette.color, palette.fallback),
          pointRadius: 2,
          pointHoverRadius: 5,
          pointHitRadius: 14,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { display: false },
          y: {
            beginAtZero: true,
            ticks: { color: text, maxTicksLimit: 4 },
            grid: { color: grid }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(items) {
                return items && items[0] ? String(items[0].label || series.label || '') : String(series.label || '');
              },
              label: function(item) {
                return String(series.label || copy('value')) + ': ' + formatNumber(item.parsed.y);
              }
            }
          }
        }
      }
    });
    if (card) card.dataset.wbChartState = 'rendering';
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (!canvas.isConnected) return;
        if (card) card.dataset.wbChartState = 'ready';
      });
    });
    return Boolean(chart);
  }

  function enhance(scope) {
    scope = scope || document;
    var payloadNode = scope.querySelector('[data-wb-monitor-chart-data]');
    if (!payloadNode || payloadNode.dataset.wbMonitoringReady === 'true') return false;
    scope.querySelectorAll('[data-wb-monitor-chart-toggle]').forEach(function (button) {
      var id = button.getAttribute('data-wb-monitor-chart-toggle');
      var details = id && scope.querySelector('[data-wb-monitor-chart-details="' + id + '"]');
      button.textContent = copy('show');
      if (details) {
        if (!details.id) details.id = id + '-details';
        button.setAttribute('aria-controls', details.id);
      }
    });
    var payload;
    try { payload = JSON.parse(payloadNode.textContent || '{}'); }
    catch (error) { payload = {}; }
    var rendered = 0;
    Object.keys(payload.series || {}).forEach(function (id) {
      if (render(document.getElementById(id), payload.labels || [], payload.series[id])) rendered += 1;
    });
    payloadNode.dataset.wbMonitoringReady = 'true';
    document.dispatchEvent(new CustomEvent('workbench:monitoring-ready', { detail: { rendered: rendered } }));
    return rendered > 0;
  }

  function toggleDetails(button) {
    var id = button && button.getAttribute('data-wb-monitor-chart-toggle');
    var details = id ? document.querySelector('[data-wb-monitor-chart-details="' + id + '"]') : null;
    if (!details) return;
    var expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    details.hidden = expanded;
    button.textContent = expanded ? copy('show') : copy('hide');
  }

  window.workbenchMonitoring = { enhance: enhance, destroy: destroy };
  window.workbenchMonitoringInstalled = true;
  document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-wb-monitor-chart-toggle]') : null;
    if (!button) return;
    event.preventDefault();
    toggleDetails(button);
  });
})(window, document);
