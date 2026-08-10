(() => {
  'use strict';

  const root = document.querySelector('[data-protected-notes]');
  if (!root) return;

  const form = root.querySelector('[data-unlock-form]');
  const passwordInput = form.querySelector('input[name="password"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const message = root.querySelector('[data-unlock-message]');
  const content = root.querySelector('[data-private-notes-content]');
  const payloadUrl = root.dataset.payloadUrl;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });

  const decodeBase64 = (value) => {
    const binary = window.atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  };

  const deriveKey = async (password, payload) => {
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: decodeBase64(payload.salt),
        iterations: payload.iterations
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  };

  const decrypt = async (password, payload) => {
    const key = await deriveKey(password, payload);
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: decodeBase64(payload.iv),
        additionalData: encoder.encode(payload.aad),
        tagLength: 128
      },
      key,
      decodeBase64(payload.ciphertext)
    );

    return decoder.decode(plaintext);
  };

  const setLoading = (loading) => {
    form.setAttribute('aria-busy', String(loading));
    passwordInput.disabled = loading;
    submitButton.disabled = loading;
    submitButton.textContent = loading ? 'Unlocking…' : 'Unlock';
  };

  const showError = (text) => {
    message.textContent = text;
    message.classList.add('is-error');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.classList.remove('is-error');
    setLoading(true);

    try {
      const response = await window.fetch(payloadUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('payload-unavailable');

      const payload = await response.json();
      const decryptedHtml = await decrypt(passwordInput.value, payload);

      content.innerHTML = decryptedHtml;
      content.hidden = false;
      form.hidden = true;
      passwordInput.value = '';
      root.classList.add('is-unlocked');

      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([content]).catch(() => {});
      }

      content.querySelector('h1, h2, [tabindex]')?.focus({ preventScroll: true });
    } catch (error) {
      passwordInput.value = '';
      passwordInput.focus();
      showError('비밀번호가 올바르지 않거나 암호화된 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  });

  passwordInput.addEventListener('input', () => {
    message.textContent = '';
    message.classList.remove('is-error');
  });
})();
