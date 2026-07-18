(function () {
  var PHONE_A = { raw: '+919994667622', display: '+91 99946 67622' };
  var PHONE_B = { raw: '+919087967622', display: '+91 90879 67622' };

  var CONFIG_URL =
    'https://maduraimuruganmobilechange-default-rtdb.asia-southeast1.firebasedatabase.app/number/-OxniEDFUylOTOC22JI_.json';
  var CONFIG_TIMEOUT_MS = 4000;

  // Flip the order every visit; randomise on first visit
  var stored = localStorage.getItem('phone_order');
  var swapped;

  if (stored === null) {
    swapped = Math.random() < 0.5;
  } else {
    swapped = stored === '0'; // last visit was 0 (not swapped) → swap this time
  }
  localStorage.setItem('phone_order', swapped ? '1' : '0');

  var primary   = swapped ? PHONE_B : PHONE_A;
  var secondary = swapped ? PHONE_A : PHONE_B;

  // Single-number mode state; stays null when both numbers are shown
  var keep = null;
  var hide = null;

  function last10Digits(value) {
    return String(value || '').replace(/\D/g, '').slice(-10);
  }

  function phoneByDigits(digits) {
    if (digits === last10Digits(PHONE_A.raw)) return PHONE_A;
    if (digits === last10Digits(PHONE_B.raw)) return PHONE_B;
    return null;
  }

  // ---------- both-numbers mode: rotate order (original behaviour) ----------

  function swapTextNodes(el) {
    el.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var t = node.textContent;
        if (t.indexOf(PHONE_A.display) !== -1 || t.indexOf(PHONE_B.display) !== -1) {
          node.textContent = t.replace(/\+91 99946 67622|\+91 90879 67622/g, function (m) {
            return m === PHONE_A.display ? primary.display : secondary.display;
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
        swapTextNodes(node);
      }
    });
  }

  function swapHrefs() {
    document.querySelectorAll('a[href]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href.indexOf(PHONE_A.raw) === -1 && href.indexOf(PHONE_B.raw) === -1) return;
      el.setAttribute('href', href.replace(/\+919994667622|\+919087967622/g, function (m) {
        return m === PHONE_A.raw ? primary.raw : secondary.raw;
      }));
    });
  }

  function applyRotation() {
    if (!swapped) return; // order A→B is already the default in HTML
    swapHrefs();
    swapTextNodes(document.body);
  }

  // ---------- single-number mode: show only the configured number ----------

  var SEPARATOR_RE = /^[\s ]*\/[\s ]*$/;

  function removeAdjacentSeparator(el) {
    var prev = el.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE && SEPARATOR_RE.test(prev.textContent)) {
      prev.remove();
      return;
    }
    var next = el.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE && SEPARATOR_RE.test(next.textContent)) {
      next.remove();
    }
  }

  function replaceHiddenInTextNodes(el) {
    el.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.indexOf(hide.display) !== -1) {
          node.textContent = node.textContent.split(hide.display).join(keep.display);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
        replaceHiddenInTextNodes(node);
      }
    });
  }

  function applySingle() {
    document.querySelectorAll('a[href]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href.indexOf(hide.raw) === -1) return;
      if (href.indexOf('tel:') === 0) {
        // Visible phone link for the hidden number: remove it and its "/" separator
        el.style.display = 'none';
        removeAdjacentSeparator(el);
      } else {
        // WhatsApp / other links: point them at the kept number instead
        el.setAttribute('href', href.split(hide.raw).join(keep.raw));
      }
    });
    // Any remaining plain-text mentions of the hidden number
    replaceHiddenInTextNodes(document.body);
  }

  // Intercept window.open so form-based WhatsApp URLs also follow the config
  var _origOpen = window.open;
  window.open = function (url, target, features) {
    if (typeof url === 'string' && url.indexOf('wa.me') !== -1) {
      if (keep) {
        url = url.split(hide.raw).join(keep.raw);
      } else if (swapped) {
        url = url.replace(/\+919994667622|\+919087967622/g, function (m) {
          return m === PHONE_A.raw ? primary.raw : secondary.raw;
        });
      }
    }
    return _origOpen.call(this, url, target, features);
  };

  // ---------- load config, then apply once the DOM is ready ----------

  function fetchConfig() {
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { resolve(null); }, CONFIG_TIMEOUT_MS);
      fetch(CONFIG_URL)
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) { clearTimeout(timer); resolve(data); })
        .catch(function () { clearTimeout(timer); resolve(null); });
    });
  }

  function whenDomReady() {
    return new Promise(function (resolve) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  Promise.all([fetchConfig(), whenDomReady()]).then(function (results) {
    var config = results[0];
    var chosen = null;
    if (config && (config.display === 'phone1' || config.display === 'phone2')) {
      chosen = phoneByDigits(last10Digits(config[config.display]));
    }
    if (chosen) {
      keep = chosen;
      hide = chosen === PHONE_A ? PHONE_B : PHONE_A;
      applySingle();
    } else {
      // "both", missing config, unknown number, or fetch failure → default behaviour
      applyRotation();
    }
  });
})();
