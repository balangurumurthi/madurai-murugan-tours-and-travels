(function () {
  // Default order in the HTML is A then B
  var PHONE_A = { raw: '+919994667622', display: '+91 99946 67622' };
  var PHONE_B = { raw: '+919087967622', display: '+91 90879 67622' };

  var CONFIG_URL =
    'https://maduraimuruganmobilechange-default-rtdb.asia-southeast1.firebasedatabase.app/number/-OxniEDFUylOTOC22JI_.json';
  var CONFIG_TIMEOUT_MS = 4000;

  // Applied config state; null until the admin setting is loaded.
  // Both-numbers mode: primary/secondary set, keep/hide null.
  // Single-number mode: keep/hide set, primary = keep.
  var primary = null;
  var secondary = null;
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

  function swapRaw(str) {
    return str.replace(/\+919994667622|\+919087967622/g, function (m) {
      return m === PHONE_A.raw ? primary.raw : secondary.raw;
    });
  }

  // ---------- both-numbers mode: apply the admin-chosen order ----------

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
      el.setAttribute('href', swapRaw(href));
    });
  }

  function applyOrder() {
    if (primary === PHONE_A) return; // A→B is already the default in HTML
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
      } else if (primary) {
        url = swapRaw(url);
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
    if (!config) return; // fetch failed → leave the HTML as-is (both numbers)

    var phone1 = phoneByDigits(last10Digits(config.phone1));
    var phone2 = phoneByDigits(last10Digits(config.phone2));

    if ((config.display === 'phone1' || config.display === 'phone2')) {
      var chosen = config.display === 'phone1' ? phone1 : phone2;
      if (chosen) {
        keep = chosen;
        primary = chosen;
        hide = chosen === PHONE_A ? PHONE_B : PHONE_A;
        applySingle();
        return;
      }
    }

    // Both-numbers modes; legacy "both" and unknown values mean phone1 first
    if (phone1 && phone2 && phone1 !== phone2) {
      primary = config.display === 'both_phone2_first' ? phone2 : phone1;
      secondary = primary === phone1 ? phone2 : phone1;
      applyOrder();
    }
  });
})();
