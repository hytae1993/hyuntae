(() => {
  'use strict';

  const currentScript = document.currentScript;
  const script = document.createElement('script');
  script.src = new URL('research-notes-vault.js?v=3', currentScript.src).href;
  script.async = false;
  document.head.appendChild(script);
})();
