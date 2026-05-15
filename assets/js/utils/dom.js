/**
 * Lightweight DOM utility helpers.
 */

/** Create an element with optional properties */
function el(tag, attrs = {}, children = []) {
  const elem = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') {
      elem.className = val;
    } else if (key === 'html') {
      elem.innerHTML = val;
    } else if (key.startsWith('data-')) {
      elem.setAttribute(key, val);
    } else if (key === 'style') {
      Object.assign(elem.style, val);
    } else {
      elem[key] = val;
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string') {
      elem.appendChild(document.createTextNode(child));
    } else {
      elem.appendChild(child);
    }
  }
  return elem;
}

/** Clear all children from a DOM element */
function clearChildren(elem) {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
}

/** Show or hide an element using the 'hidden' utility class */
function setVisible(elem, visible) {
  elem.classList.toggle('hidden', !visible);
}

/** Safely set inner HTML (plain text only; use innerHTML directly for trusted SVG) */
function setText(elem, text) {
  elem.textContent = text;
}

/** Return the element with the given id, throws if missing in dev */
function byId(id) {
  return document.getElementById(id);
}

/**
 * Trap focus within a container element.
 * Returns a cleanup function that removes the listener.
 */
function trapFocus(container) {
  const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    const items = Array.from(container.querySelectorAll(focusable));
    if (!items.length) return;
    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeydown);
  // Auto-focus first focusable element
  const first = container.querySelector(focusable);
  if (first) first.focus();

  return () => container.removeEventListener('keydown', handleKeydown);
}
