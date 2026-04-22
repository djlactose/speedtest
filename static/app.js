(function () {
  'use strict';

  const HOSTNAME_RE = /^[A-Za-z0-9.\-_]+$/;

  function sanitizeServerName(raw) {
    if (typeof raw !== 'string') return '';
    const trimmed = raw.slice(0, 253);
    return HOSTNAME_RE.test(trimmed) ? trimmed : '';
  }

  // DOM elements
  const allBtn = document.getElementById('allBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const statusText = document.getElementById('statusText');
  const errorMsg = document.getElementById('errorMsg');
  const errorText = document.getElementById('errorText');
  const retryBtn = document.getElementById('retryBtn');
  const testBtns = document.querySelectorAll('.test-btn');
  const serverInfo = document.getElementById('serverInfo');
  const copyBtn = document.getElementById('copyBtn');

  let serverName = '';

  const cards = {
    download: {
      card: document.getElementById('downloadCard'),
      value: document.getElementById('downloadValue'),
      quality: document.getElementById('downloadQuality'),
      progress: document.getElementById('downloadProgress'),
      bar: document.getElementById('downloadBar')
    },
    upload: {
      card: document.getElementById('uploadCard'),
      value: document.getElementById('uploadValue'),
      quality: document.getElementById('uploadQuality'),
      progress: document.getElementById('uploadProgress'),
      bar: document.getElementById('uploadBar')
    },
    ping: {
      card: document.getElementById('pingCard'),
      value: document.getElementById('pingValue'),
      quality: document.getElementById('pingQuality'),
      progress: document.getElementById('pingProgress'),
      bar: document.getElementById('pingBar')
    },
    jitter: {
      card: document.getElementById('jitterCard'),
      value: document.getElementById('jitterValue'),
      quality: document.getElementById('jitterQuality'),
      progress: document.getElementById('jitterProgress'),
      bar: document.getElementById('jitterBar')
    }
  };

  let abortController = null;
  let isTesting = false;
  let lastTestFn = null;

  // Quality thresholds
  function getSpeedQuality(mbps) {
    if (mbps >= 100) return { cls: 'result-excellent', label: 'Excellent' };
    if (mbps >= 50) return { cls: 'result-good', label: 'Good' };
    if (mbps >= 25) return { cls: 'result-fair', label: 'Fair' };
    return { cls: 'result-poor', label: 'Poor' };
  }

  function getPingQuality(ms) {
    if (ms <= 20) return { cls: 'result-excellent', label: 'Excellent' };
    if (ms <= 50) return { cls: 'result-good', label: 'Good' };
    if (ms <= 100) return { cls: 'result-fair', label: 'Fair' };
    return { cls: 'result-poor', label: 'Poor' };
  }

  function getJitterQuality(ms) {
    if (ms <= 5) return { cls: 'result-excellent', label: 'Excellent' };
    if (ms <= 15) return { cls: 'result-good', label: 'Good' };
    if (ms <= 30) return { cls: 'result-fair', label: 'Fair' };
    return { cls: 'result-poor', label: 'Poor' };
  }

  // UI helpers
  function setButtonsDisabled(disabled) {
    allBtn.disabled = disabled;
    testBtns.forEach(b => b.disabled = disabled);
  }

  function setTesting(active, label) {
    isTesting = active;
    setButtonsDisabled(active);
    cancelBtn.classList.toggle('visible', active);
    allBtn.classList.toggle('testing', active);
    if (active) {
      allBtn.querySelector('.btn-label').textContent = label || 'Testing...';
      abortController = new AbortController();
    } else {
      allBtn.querySelector('.btn-label').textContent = 'Test All';
      abortController = null;
    }
  }

  function showError(message) {
    errorText.textContent = message;
    errorMsg.classList.add('visible');
  }

  function hideError() {
    errorMsg.classList.remove('visible');
  }

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function setCardActive(key) {
    Object.values(cards).forEach(c => c.card.classList.remove('active'));
    if (key) cards[key].card.classList.add('active');
  }

  function setCardError(key) {
    cards[key].card.classList.add('error');
  }

  function updateProgress(key, pct) {
    const p = Math.min(Math.max(pct, 0), 100);
    cards[key].progress.style.width = p + '%';
    cards[key].bar.setAttribute('aria-valuenow', Math.round(p));
  }

  function showSpinner(key) {
    const spinner = document.createElement('div');
    spinner.className = 'card-spinner';
    cards[key].value.replaceChildren(spinner);
  }

  function showResult(key, number, unit, qualityFn) {
    const q = qualityFn(parseFloat(number));
    cards[key].card.className = 'metric-card ' + q.cls;
    cards[key].card.setAttribute('data-metric', key);
    const numSpan = document.createElement('span');
    numSpan.className = 'number';
    numSpan.textContent = number;
    const unitSpan = document.createElement('span');
    unitSpan.className = 'unit';
    unitSpan.textContent = unit;
    const v = cards[key].value;
    v.replaceChildren(numSpan, unitSpan);
    v.classList.add('result-appear');
    cards[key].quality.textContent = q.label;
  }

  function resetCard(key) {
    cards[key].card.className = 'metric-card';
    cards[key].card.setAttribute('data-metric', key);
    const placeholder = document.createElement('span');
    placeholder.className = 'placeholder';
    placeholder.textContent = '—';
    cards[key].value.replaceChildren(placeholder);
    cards[key].value.classList.remove('result-appear');
    cards[key].quality.textContent = '';
    updateProgress(key, 0);
  }

  function resetAll() {
    ['download', 'upload', 'ping', 'jitter'].forEach(resetCard);
    hideError();
    setStatus('');
  }

  function applyServerName(raw) {
    const clean = sanitizeServerName(raw);
    if (clean && !serverName) {
      serverName = clean;
      serverInfo.textContent = 'Server: ' + serverName;
    }
  }

  // Test functions
  async function testDownload(signal) {
    setCardActive('download');
    showSpinner('download');
    setStatus('Testing download speed...');
    updateProgress('download', 0);

    const startTime = performance.now();
    const response = await fetch('/download', { signal });
    if (!response.ok) throw new Error('Download failed');

    const reader = response.body.getReader();
    const totalBytes = 100 * 1024 * 1024;
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.length;
      updateProgress('download', (loaded / totalBytes) * 100);
    }

    const duration = (performance.now() - startTime) / 1000;
    const mbps = ((loaded / duration) / (1024 * 1024)).toFixed(1);
    updateProgress('download', 100);
    showResult('download', mbps, 'Mbps', getSpeedQuality);
    return mbps;
  }

  async function testUpload(signal) {
    setCardActive('upload');
    showSpinner('upload');
    setStatus('Testing upload speed...');
    updateProgress('upload', 0);

    const fileSize = 99 * 1024 * 1024;
    const blob = new Blob([new ArrayBuffer(fileSize)], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', blob, 'speedtest.bin');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (signal) {
        signal.addEventListener('abort', () => xhr.abort());
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          updateProgress('upload', (e.loaded / e.total) * 100);
        }
      });

      const startTime = performance.now();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const duration = (performance.now() - startTime) / 1000;
          const mbps = ((fileSize / duration) / (1024 * 1024)).toFixed(1);
          updateProgress('upload', 100);
          showResult('upload', mbps, 'Mbps', getSpeedQuality);
          resolve(mbps);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Cancelled')));

      xhr.open('POST', '/upload');
      xhr.send(formData);
    });
  }

  async function testPing(signal) {
    setCardActive('ping');
    showSpinner('ping');
    setStatus('Testing ping...');
    updateProgress('ping', 0);

    const startTime = performance.now();
    const response = await fetch('/ping', { signal });
    if (!response.ok) throw new Error('Ping failed');
    const data = await response.json();
    applyServerName(data.server);
    const ms = (performance.now() - startTime).toFixed(1);

    updateProgress('ping', 100);
    showResult('ping', ms, 'ms', getPingQuality);
    return ms;
  }

  async function testJitter(signal) {
    setCardActive('jitter');
    showSpinner('jitter');
    setStatus('Testing jitter...');
    updateProgress('jitter', 0);

    const samples = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      const response = await fetch('/ping', { signal });
      if (!response.ok) throw new Error('Jitter test failed');
      await response.json();
      samples.push(performance.now() - start);
      updateProgress('jitter', ((i + 1) / count) * 100);
    }

    let totalDiff = 0;
    for (let i = 1; i < samples.length; i++) {
      totalDiff += Math.abs(samples[i] - samples[i - 1]);
    }
    const jitter = (totalDiff / (samples.length - 1)).toFixed(1);

    showResult('jitter', jitter, 'ms', getJitterQuality);
    return jitter;
  }

  async function runSingleTest(key, testFn) {
    if (isTesting) return;
    hideError();
    lastTestFn = () => runSingleTest(key, testFn);
    setTesting(true, 'Testing...');
    resetCard(key);

    try {
      await testFn(abortController.signal);
      copyBtn.classList.add('visible');
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'Cancelled') {
        setStatus('Test cancelled.');
        resetCard(key);
      } else {
        setCardError(key);
        showError('Test failed. Check your connection and try again.');
      }
    } finally {
      setCardActive(null);
      setTesting(false);
      if (!errorMsg.classList.contains('visible')) setStatus('');
    }
  }

  async function runAllTests() {
    if (isTesting) return;
    if (!navigator.onLine) {
      showError('You appear to be offline. Check your connection and try again.');
      return;
    }

    hideError();
    resetAll();
    lastTestFn = runAllTests;
    setTesting(true, 'Testing...');

    const tests = [
      ['download', testDownload],
      ['upload', testUpload],
      ['ping', testPing],
      ['jitter', testJitter]
    ];

    try {
      for (const [key, fn] of tests) {
        await fn(abortController.signal);
      }
      setStatus('All tests complete.');
      copyBtn.classList.add('visible');
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'Cancelled') {
        setStatus('Tests cancelled.');
      } else {
        showError('A test failed. Check your connection and try again.');
      }
    } finally {
      setCardActive(null);
      setTesting(false);
    }
  }

  // Event listeners
  allBtn.addEventListener('click', runAllTests);

  cancelBtn.addEventListener('click', () => {
    if (abortController) abortController.abort();
  });

  retryBtn.addEventListener('click', () => {
    hideError();
    if (lastTestFn) lastTestFn();
  });

  copyBtn.addEventListener('click', () => {
    const lines = ['Speed Test Results'];
    if (serverName) lines.push('Server: ' + serverName);
    const dl = cards.download.quality.textContent;
    const ul = cards.upload.quality.textContent;
    const pg = cards.ping.quality.textContent;
    const jt = cards.jitter.quality.textContent;
    if (dl) lines.push('Download: ' + cards.download.value.textContent);
    if (ul) lines.push('Upload: ' + cards.upload.value.textContent);
    if (pg) lines.push('Ping: ' + cards.ping.value.textContent);
    if (jt) lines.push('Jitter: ' + cards.jitter.value.textContent);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Results'; }, 2000);
    });
  });

  document.getElementById('downloadBtn').addEventListener('click', () => runSingleTest('download', testDownload));
  document.getElementById('uploadBtn').addEventListener('click', () => runSingleTest('upload', testUpload));
  document.getElementById('pingBtn').addEventListener('click', () => runSingleTest('ping', testPing));
  document.getElementById('jitterBtn').addEventListener('click', () => runSingleTest('jitter', testJitter));

  // Fetch server info on page load
  fetch('/ping').then(r => r.json()).then(data => {
    applyServerName(data.server);
  }).catch(() => {});
})();
