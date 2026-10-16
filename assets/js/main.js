(() => {
  'use strict';
  document.body.classList.add('js');
  const hr = document.documentElement.lang === 'hr';
  const messages = hr ? {
    open: 'Otvori izbornik', close: 'Zatvori izbornik', required: 'Ispunite ovo polje.',
    email: 'Unesite valjanu e-mail adresu.', tooLong: 'Skratite tekst u ovom polju.',
    invalid: 'Provjerite označena polja.', sending: 'Slanje…', send: 'Pošaljite upit',
    success: 'Hvala na upitu. Vaša je poruka uspješno poslana.',
    error: 'Nismo mogli potvrditi slanje poruke. Uneseni podaci ostali su u obrascu. Pokušajte ponovno kasnije.',
    unavailable: 'Slanje upita trenutačno nije dostupno.',
    ready: 'Opišite svoj projekt. Polja označena zvjezdicom obvezna su.',
    js: 'Za slanje upita omogućite JavaScript.'
  } : {
    open: 'Menü öffnen', close: 'Menü schließen', required: 'Bitte füllen Sie dieses Feld aus.',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', tooLong: 'Bitte kürzen Sie diesen Text.',
    invalid: 'Bitte prüfen Sie die markierten Felder.', sending: 'Wird gesendet…', send: 'Anfrage senden',
    success: 'Vielen Dank für Ihre Anfrage. Ihre Nachricht wurde erfolgreich gesendet.',
    error: 'Das Senden Ihrer Nachricht konnte nicht bestätigt werden. Ihre Angaben bleiben im Formular erhalten. Bitte versuchen Sie es später erneut.',
    unavailable: 'Das Senden von Anfragen ist derzeit nicht möglich.',
    ready: 'Erzählen Sie uns von Ihrem Projekt. Mit einem Sternchen (*) markierte Felder sind Pflichtfelder.',
    js: 'Bitte aktivieren Sie JavaScript, um eine Anfrage zu senden.'
  };
  const config = window.TLM_CONFIG || {};
  const nav = document.querySelector('#main-nav');
  const toggle = document.querySelector('.menu-toggle');
  function setMenu(open, returnFocus = false) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? messages.close : messages.open);
    if (returnFocus) toggle.focus();
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  window.matchMedia('(min-width: 851px)').addEventListener('change', () => setMenu(false));
  // Both languages use the same section IDs, including on legal pages.
  function syncLanguageLinks() {
    document.querySelectorAll('[data-language-link]').forEach(link => {
      const target = new URL(link.href, window.location.href);
      target.hash = window.location.hash;
      link.href = target.href;
    });
  }
  syncLanguageLinks();
  window.addEventListener('hashchange', syncLanguageLinks);
  const approved = Array.isArray(config.confirmedServices) ? config.confirmedServices : [];
  document.querySelectorAll('[data-service]').forEach(element => {
    element.hidden = !approved.includes(element.dataset.service);
    if (element.tagName === 'OPTION') element.disabled = element.hidden;
  });
  const form = document.querySelector('#project-form');
  if (!form) return;
  const submit = form.querySelector('[type="submit"]');
  const notice = document.querySelector('#form-notice');
  const status = document.querySelector('#form-status');
  const fields = [...form.querySelectorAll('[data-validate]')];
  let endpoint;
  try {
    if (config.formEndpoint) {
      const candidate = new URL(config.formEndpoint, window.location.href);
      if (candidate.protocol === 'https:' || (candidate.protocol === 'http:' && ['localhost','127.0.0.1'].includes(candidate.hostname))) endpoint = candidate.href;
    }
  } catch { /* Keep the honest, disabled state for invalid configuration. */ }
  if (endpoint) {
    form.elements.website.disabled = false;
    submit.disabled = false;
    submit.querySelector('[data-submit-label]').textContent = messages.send;
    notice.textContent = messages.ready;
  }
  form.noValidate = true;
  function validate(field) {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) field.setCustomValidity(messages.required);
    const validity = field.validity;
    const error = validity.valid ? '' : validity.typeMismatch ? messages.email : validity.tooLong ? messages.tooLong : messages.required;
    const output = document.getElementById(`${field.id}-error`);
    if (output) output.textContent = error;
    if (error) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !error;
  }
  fields.forEach(field => {
    field.addEventListener('blur', () => { if (endpoint) validate(field); });
    field.addEventListener('input', () => { if (field.hasAttribute('aria-invalid')) validate(field); });
  });
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (!endpoint) { status.textContent = messages.unavailable; return; }
    const valid = fields.map(validate).every(Boolean);
    if (!valid) {
      status.dataset.state = 'error'; status.textContent = messages.invalid;
      fields.find(field => field.getAttribute('aria-invalid') === 'true')?.focus();
      return;
    }
    if (form.elements.website.value) return;
    sending = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'sending'; status.textContent = messages.sending;
    submit.querySelector('[data-submit-label]').textContent = messages.sending;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const payload = Object.fromEntries(new FormData(form));
    Object.keys(payload).forEach(key => { payload[key] = payload[key].trim(); });
    payload.language = hr ? 'hr' : 'de';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit', redirect: 'error'
      });
      if (!response.ok) throw new Error('Request not accepted');
      const result = await response.json();
      if (result.success !== true) throw new Error('Confirmation missing');
      status.dataset.state = 'success'; status.textContent = messages.success;
      form.reset();
      fields.forEach(field => { field.removeAttribute('aria-invalid'); field.setCustomValidity(''); });
    } catch {
      status.dataset.state = 'error'; status.textContent = messages.error;
    } finally {
      window.clearTimeout(timeout); sending = false; submit.disabled = false;
      form.removeAttribute('aria-busy'); submit.querySelector('[data-submit-label]').textContent = messages.send;
    }
  });
})();
