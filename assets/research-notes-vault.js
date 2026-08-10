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
  const baseTitle = document.title;
  let vault = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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

  const renderInline = (source) => {
    const tokens = [];
    const tokenized = String(source)
      .replace(/`([^`]+)`/g, (_, code) => {
        const index = tokens.push(`<code>${escapeHtml(code)}</code>`) - 1;
        return `%%TOKEN${index}%%`;
      })
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, href) => {
        const index = tokens.push(
          `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
        ) - 1;
        return `%%TOKEN${index}%%`;
      });

    return escapeHtml(tokenized)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/%%TOKEN(\d+)%%/g, (_, index) => tokens[Number(index)] || '');
  };

  const renderMarkdown = (source) => {
    const markdown = String(source).replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n').trim();
    if (!markdown) return '';

    const output = [];
    const paragraph = [];
    let listType = null;
    let codeFence = null;
    let codeLines = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph.length = 0;
    };

    const closeList = () => {
      if (!listType) return;
      output.push(`</${listType}>`);
      listType = null;
    };

    const openList = (type) => {
      if (listType === type) return;
      closeList();
      output.push(`<${type}>`);
      listType = type;
    };

    for (const line of markdown.split('\n')) {
      const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/);
      if (fence) {
        flushParagraph();
        closeList();
        if (codeFence !== null) {
          const language = codeFence ? ` class="language-${escapeHtml(codeFence)}"` : '';
          output.push(`<pre><code${language}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
          codeFence = null;
          codeLines = [];
        } else {
          codeFence = fence[1];
        }
        continue;
      }

      if (codeFence !== null) {
        codeLines.push(line);
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = Math.min(heading[1].length + 1, 6);
        output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        continue;
      }

      const unordered = line.match(/^[-*]\s+(.+)$/);
      if (unordered) {
        flushParagraph();
        openList('ul');
        output.push(`<li>${renderInline(unordered[1])}</li>`);
        continue;
      }

      const ordered = line.match(/^\d+[.)]\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        openList('ol');
        output.push(`<li>${renderInline(ordered[1])}</li>`);
        continue;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph();
        closeList();
        output.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`);
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        flushParagraph();
        closeList();
        output.push('<hr>');
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        closeList();
        continue;
      }

      closeList();
      paragraph.push(line.trim());
    }

    if (codeFence !== null) {
      const language = codeFence ? ` class="language-${escapeHtml(codeFence)}"` : '';
      output.push(`<pre><code${language}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }
    flushParagraph();
    closeList();
    return output.join('');
  };

  const routeHref = (segments = []) => `#/${segments.map(encodeURIComponent).join('/')}`;

  const readRoute = () => window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch (error) {
        return '';
      }
    });

  const breadcrumb = (items) => `
    <nav class="private-breadcrumbs" aria-label="Research Notes breadcrumb">
      ${items.map((item, index) => {
        const label = escapeHtml(item.label);
        if (!item.href || index === items.length - 1) return `<span>${label}</span>`;
        return `<a href="${item.href}">${label}</a><span aria-hidden="true">/</span>`;
      }).join('')}
    </nav>`;

  const emptyState = (text) => `
    <div class="empty-state">
      <strong>${escapeHtml(text)}</strong>
    </div>`;

  const pageHeader = ({ kicker, title, description }) => `
    <header class="private-page-header">
      <p class="section-kicker">${escapeHtml(kicker)}</p>
      <h1 tabindex="-1">${escapeHtml(title)}</h1>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    </header>`;

  const renderProjectIndex = () => {
    document.title = baseTitle;
    const projects = vault.projects || [];
    return `
      ${pageHeader({
        kicker: 'Private archive',
        title: 'Research Notes',
        description: '프로젝트를 선택하면 알고리즘 설명, 관련 연구와 연구 진행 기록을 볼 수 있습니다.'
      })}
      <div class="research-project-index">
        ${projects.length ? projects.map((project, index) => `
          <a class="research-project-link" href="${routeHref(['projects', project.id])}">
            <span>Project ${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(project.title)}</strong>
            <small>프로젝트 열기 →</small>
          </a>`).join('') : emptyState('아직 등록된 프로젝트가 없습니다.')}
      </div>`;
  };

  const renderProject = (project) => {
    document.title = `${project.title} · Research Notes`;
    const progressCount = project.researchProgress.length;
    return `
      ${breadcrumb([
        { label: 'Research Notes', href: routeHref() },
        { label: project.title }
      ])}
      ${pageHeader({
        kicker: 'Project',
        title: project.title,
        description: '아래 분류를 선택해 프로젝트 기록을 확인하세요.'
      })}
      <div class="private-category-grid">
        <a class="private-category-card" href="${routeHref(['projects', project.id, 'algorithm-description'])}">
          <span>01</span><h2>알고리즘 설명</h2><p>프로젝트의 핵심 알고리즘을 정리합니다.</p><small>페이지 열기 →</small>
        </a>
        <a class="private-category-card" href="${routeHref(['projects', project.id, 'related-work'])}">
          <span>02</span><h2>관련 연구</h2><p>연결되는 논문과 선행 연구를 정리합니다.</p><small>페이지 열기 →</small>
        </a>
        <a class="private-category-card" href="${routeHref(['projects', project.id, 'research-progress'])}">
          <span>03</span><h2>연구 진행</h2><p>날짜별 실험과 진행 상황을 기록합니다.</p><small>${progressCount}개의 포스트 →</small>
        </a>
      </div>`;
  };

  const renderDocumentPage = (project, category, markdown) => {
    document.title = `${category} · ${project.title}`;
    const rendered = renderMarkdown(markdown);
    return `
      ${breadcrumb([
        { label: 'Research Notes', href: routeHref() },
        { label: project.title, href: routeHref(['projects', project.id]) },
        { label: category }
      ])}
      ${pageHeader({ kicker: project.title, title: category })}
      <article class="private-document private-markdown">
        ${rendered || emptyState(`아직 ${category} 내용이 없습니다.`)}
      </article>`;
  };

  const renderProgressIndex = (project) => {
    document.title = `연구 진행 · ${project.title}`;
    const posts = project.researchProgress;
    return `
      ${breadcrumb([
        { label: 'Research Notes', href: routeHref() },
        { label: project.title, href: routeHref(['projects', project.id]) },
        { label: '연구 진행' }
      ])}
      ${pageHeader({
        kicker: project.title,
        title: '연구 진행',
        description: '날짜와 소제목을 선택하면 해당 연구 기록으로 이동합니다.'
      })}
      <div class="research-progress-list">
        ${posts.length ? posts.map((post) => `
          <a class="research-progress-link" href="${routeHref(['projects', project.id, 'research-progress', post.id])}">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date.replaceAll('-', '.'))}</time>
            <strong>${escapeHtml(post.title)}</strong>
            <span aria-hidden="true">→</span>
          </a>`).join('') : emptyState('아직 등록된 연구 진행 포스트가 없습니다.')}
      </div>`;
  };

  const renderProgressPost = (project, post) => {
    document.title = `${post.title} · ${project.title}`;
    const rendered = renderMarkdown(post.content);
    return `
      ${breadcrumb([
        { label: 'Research Notes', href: routeHref() },
        { label: project.title, href: routeHref(['projects', project.id]) },
        { label: '연구 진행', href: routeHref(['projects', project.id, 'research-progress']) },
        { label: post.title }
      ])}
      ${pageHeader({
        kicker: post.date.replaceAll('-', '.'),
        title: post.title,
        description: project.title
      })}
      <article class="private-document private-markdown">
        ${rendered || emptyState('아직 작성된 내용이 없습니다.')}
      </article>`;
  };

  const renderNotFound = () => {
    document.title = `페이지를 찾을 수 없음 · Research Notes`;
    return `
      ${pageHeader({ kicker: 'Research Notes', title: '페이지를 찾을 수 없습니다.' })}
      <p><a href="${routeHref()}">Research Notes 목록으로 돌아가기</a></p>`;
  };

  const renderRoute = () => {
    if (!vault) return;
    const route = readRoute();
    let html = '';

    if (!route.length) {
      html = renderProjectIndex();
    } else if (route[0] === 'projects' && route[1]) {
      const project = vault.projects.find((item) => item.id === route[1]);
      if (!project) {
        html = renderNotFound();
      } else if (route.length === 2) {
        html = renderProject(project);
      } else if (route.length === 3 && route[2] === 'algorithm-description') {
        html = renderDocumentPage(project, '알고리즘 설명', project.algorithmDescription);
      } else if (route.length === 3 && route[2] === 'related-work') {
        html = renderDocumentPage(project, '관련 연구', project.relatedWork);
      } else if (route.length === 3 && route[2] === 'research-progress') {
        html = renderProgressIndex(project);
      } else if (route.length === 4 && route[2] === 'research-progress') {
        const post = project.researchProgress.find((item) => item.id === route[3]);
        html = post ? renderProgressPost(project, post) : renderNotFound();
      } else {
        html = renderNotFound();
      }
    } else {
      html = renderNotFound();
    }

    if (window.MathJax?.typesetClear) window.MathJax.typesetClear([content]);
    content.innerHTML = html;
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([content]).catch(() => {});
    }
    content.querySelector('h1[tabindex]')?.focus({ preventScroll: true });
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
      const decrypted = await decrypt(passwordInput.value, payload);
      const parsed = JSON.parse(decrypted);
      if (parsed.version !== 2 || !Array.isArray(parsed.projects)) {
        throw new Error('unsupported-vault');
      }

      vault = parsed;
      form.hidden = true;
      passwordInput.value = '';
      root.classList.add('is-unlocked');
      content.hidden = false;
      renderRoute();
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

  window.addEventListener('hashchange', renderRoute);
})();
