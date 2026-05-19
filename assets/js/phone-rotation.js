(function () {
  var PHONE_A = { raw: '+919994667622', display: '+91 99946 67622' };
  var PHONE_B = { raw: '+919087967622', display: '+91 90879 67622' };

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

  // Walk every text node under el and swap phone display strings
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
        swapTextNodes(node);
      }
    });
  }

  // Swap href attributes on all anchor elements
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

  // Intercept window.open so form-based WhatsApp URLs also rotate
  var _origOpen = window.open;
  window.open = function (url, target, features) {
    if (swapped && typeof url === 'string' && url.indexOf('wa.me') !== -1) {
      url = url.replace(/\+919994667622|\+919087967622/g, function (m) {
        return m === PHONE_A.raw ? primary.raw : secondary.raw;
      });
    }
    return _origOpen.call(this, url, target, features);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRotation);
  } else {
    applyRotation();
  }
})();
