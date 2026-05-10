(() => {
  // Prevent double-injection
  if (window.__askLLMInjected) return;
  window.__askLLMInjected = true;

  let tooltip = null;
  let modalOverlay = null;
  let hideTimeout = null;

  /* ─── CREATE TOOLTIP ─── */
  function createTooltip() {
    const el = document.createElement('div');
    el.id = '__ask-llm-tooltip';
    el.innerHTML = `
      <div class="ask-llm-btn" id="__ask-llm-btn">
        <span class="ask-llm-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span class="ask-llm-label">Ask LLM</span>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector('#__ask-llm-btn').addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        showModal(selectedText);
        hideTooltip(true);
      }
    });

    return el;
  }

  /* ─── POSITION & SHOW TOOLTIP ─── */
  function showTooltip(x, y) {
    if (!tooltip) tooltip = createTooltip();

    clearTimeout(hideTimeout);
    tooltip.classList.remove('ask-llm-hidden');
    tooltip.classList.add('ask-llm-visible');

    // Position above selection
    const tooltipW = 120;
    const tooltipH = 38;
    const margin = 10;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const viewW = document.documentElement.clientWidth;

    let left = x + scrollX - tooltipW / 2;
    let top = y + scrollY - tooltipH - margin;

    // Clamp horizontal
    if (left < scrollX + 8) left = scrollX + 8;
    if (left + tooltipW > scrollX + viewW - 8) left = scrollX + viewW - tooltipW - 8;

    // Flip below if not enough room above
    if (top < scrollY + 8) top = y + scrollY + margin;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip(immediate = false) {
    if (!tooltip) return;
    if (immediate) {
      tooltip.classList.remove('ask-llm-visible');
      tooltip.classList.add('ask-llm-hidden');
    } else {
      hideTimeout = setTimeout(() => {
        if (tooltip) {
          tooltip.classList.remove('ask-llm-visible');
          tooltip.classList.add('ask-llm-hidden');
        }
      }, 200);
    }
  }

  /* ─── MODAL ─── */
  function showModal(selectedText) {
    if (modalOverlay) modalOverlay.remove();

    modalOverlay = document.createElement('div');
    modalOverlay.id = '__ask-llm-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="ask-llm-modal" id="__ask-llm-modal">
        <div class="ask-llm-modal-header">
          <div class="ask-llm-modal-title">
            <span class="ask-llm-modal-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            Ask LLM
          </div>
          <button class="ask-llm-close-btn" id="__ask-llm-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ask-llm-selected-text">
          <div class="ask-llm-selected-label">Selected text</div>
          <div class="ask-llm-selected-content">${escapeHtml(selectedText)}</div>
        </div>

        <div class="ask-llm-quick-actions">
          <div class="ask-llm-quick-label">Quick actions</div>
          <div class="ask-llm-chips">
            <button class="ask-llm-chip" data-prompt="Explain this in simple terms:">Explain</button>
            <button class="ask-llm-chip" data-prompt="Summarize this:">Summarize</button>
            <button class="ask-llm-chip" data-prompt="Translate this to English:">Translate</button>
            <button class="ask-llm-chip" data-prompt="Fix grammar and spelling:">Fix grammar</button>
            <button class="ask-llm-chip" data-prompt="What are the key points of:">Key points</button>
          </div>
        </div>

        <div class="ask-llm-input-row">
          <textarea
            class="ask-llm-textarea"
            id="__ask-llm-input"
            placeholder="Ask anything about the selected text…"
            rows="2"
            autofocus
          ></textarea>
          <button class="ask-llm-send-btn" id="__ask-llm-send" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div class="ask-llm-footer-note">Backend not connected yet — UI preview only</div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Animate in
    requestAnimationFrame(() => {
      modalOverlay.classList.add('ask-llm-modal-visible');
    });

    // Close button
    document.getElementById('__ask-llm-close').addEventListener('click', closeModal);

    // Click outside
    modalOverlay.addEventListener('mousedown', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // ESC key
    const onKey = (e) => {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
    };
    document.addEventListener('keydown', onKey);

    // Textarea enable/disable send
    const textarea = document.getElementById('__ask-llm-input');
    const sendBtn = document.getElementById('__ask-llm-send');

    textarea.addEventListener('input', () => {
      sendBtn.disabled = textarea.value.trim().length === 0;
    });

    // Ctrl+Enter to send
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!sendBtn.disabled) sendBtn.click();
      }
    });

    // Quick action chips
    modalOverlay.querySelectorAll('.ask-llm-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        textarea.value = chip.dataset.prompt + ' ';
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        sendBtn.disabled = false;
        // Visual active state
        modalOverlay.querySelectorAll('.ask-llm-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Send button (no backend yet — just shows placeholder)
    sendBtn.addEventListener('click', () => {
      const question = textarea.value.trim();
      if (!question) return;
      showPendingState(question, selectedText);
    });

    textarea.focus();
  }

  function showPendingState(question, selectedText) {
    const modal = document.getElementById('__ask-llm-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="ask-llm-modal-header">
        <div class="ask-llm-modal-title">
          <span class="ask-llm-modal-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          Ask LLM
        </div>
        <button class="ask-llm-close-btn" id="__ask-llm-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="ask-llm-pending">
        <div class="ask-llm-pending-q">
          <div class="ask-llm-selected-label">Your question</div>
          <div class="ask-llm-pending-text">${escapeHtml(question)}</div>
        </div>
        <div class="ask-llm-pending-spinner">
          <div class="ask-llm-dots">
            <span></span><span></span><span></span>
          </div>
          <div class="ask-llm-pending-msg">Waiting for backend…</div>
        </div>
        <div class="ask-llm-footer-note">Backend not connected yet — connect your LLM to get responses</div>
      </div>
    `;

    document.getElementById('__ask-llm-close').addEventListener('click', closeModal);
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('ask-llm-modal-visible');
    modalOverlay.classList.add('ask-llm-modal-hiding');
    setTimeout(() => {
      if (modalOverlay) { modalOverlay.remove(); modalOverlay = null; }
    }, 250);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ─── SELECTION LISTENER ─── */
  document.addEventListener('mouseup', (e) => {
    // Don't trigger inside our own UI
    if (e.target.closest('#__ask-llm-tooltip') || e.target.closest('#__ask-llm-modal-overlay')) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        // Get bounding rect of the selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const topY = rect.top;
        showTooltip(centerX, topY);
      } else {
        hideTooltip();
      }
    }, 10);
  });

  // Hide tooltip when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#__ask-llm-tooltip') || e.target.closest('#__ask-llm-modal-overlay')) return;
    hideTooltip(true);
  });

  // Hide on scroll
  window.addEventListener('scroll', () => hideTooltip(true), { passive: true });

})();
