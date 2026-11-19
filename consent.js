(() => {
  'use strict';

  // The responder form's entry IDs and option labels must match Google's form.
  const googleChoices = new Map([
    ['entry.1067585811', ['예', '아니요']],
    ['entry.934409909', ['확인 및 동의합니다']],
    ['entry.434964258', ['확인 및 동의합니다']],
    ['entry.587739420', ['확인했습니다']],
    ['entry.726351966', ['확인했습니다']],
    ['entry.500399594', ['확인했습니다']],
    ['entry.627083553', ['확인했습니다']],
    ['entry.966611256', ['확인했습니다']],
    ['entry.723800245', ['확인했습니다']],
    ['entry.1706296548', ['예!']],
    ['entry.450003449', ['예']],
    ['entry.651505261', ['동의합니다']],
    ['entry.2033316155', ['동의합니다']],
    ['entry.1814274679', ['동의합니다']],
    ['entry.935833889', ['20% 계약금은 여행지 특성 상 계약금 환불이 불가합니다. 확인 및 동의합니다.']],
  ]);

  function selectedAnswers(source) {
    const answers = new URLSearchParams();
    for (const [name, choices] of googleChoices) {
      const values = source.getAll(name);
      if (values.length === 1 && choices.includes(values[0])) {
        answers.set(name, values[0]);
      }
    }
    return answers;
  }

  const draftKey = 'updream:mongcance7:guide-v1';
  const maxAge = 2 * 60 * 60 * 1000;
  const handoff = document.getElementById('application-handoff');
  if (handoff) {
    const guide = document.getElementById('guide-consent');
    guide.disabled = false;
    handoff.querySelector('button[type=submit]').disabled = false;
    handoff.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!handoff.reportValidity() || !guide.checked) return;
      const selection = selectedAnswers(new FormData(handoff));
      const nextPage = new URL('apply.html', window.location.href);
      const ticket = crypto.randomUUID();
      try {
        // Only option IDs and values are staged for the next page in this tab.
        sessionStorage.setItem(draftKey, JSON.stringify({
          ticket, answers: selection.toString(), time: Date.now(), guide: true,
        }));
        nextPage.hash = new URLSearchParams({ ticket }).toString();
      } catch {
        // Storage-restricted browsers can carry the same non-identifying choices in a fragment.
        selection.set('guide', 'yes');
        nextPage.hash = selection.toString();
      }
      window.location.assign(nextPage.href);
    });
    return;
  }

  const prepare = document.getElementById('prepare-companion');
  if (!prepare) return;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  let draft = history.state?.guideDraft;
  if (fragment.has('ticket')) {
    draft = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey));
      if (saved && fragment.get('ticket') === saved.ticket) {
        draft = saved;
        sessionStorage.removeItem(draftKey);
      }
    } catch { /* A stale or unrelated link returns to the guide. */ }
  } else if (fragment.get('guide') === 'yes') {
    draft = {guide: true, time: Date.now(), answers: selectedAnswers(fragment).toString()};
  }
  if (fragment.has('ticket') || fragment.has('guide')) {
    history.replaceState({guideDraft: draft}, '', window.location.pathname);
  }
  if (!draft?.guide || !Number.isFinite(draft.time) || Date.now() - draft.time > maxAge) return;

  document.getElementById('read-first').hidden = true;
  prepare.hidden = false;
  const names = document.getElementById('companion-names');
  const namesLabel = document.getElementById('companion-names-label');
  const answerInputs = prepare.querySelectorAll('input[name="companion-status"]');
  function updateCompanionField() {
    const hasCompanion = prepare.elements['companion-status'].value === 'with';
    namesLabel.hidden = !hasCompanion;
    names.disabled = !hasCompanion;
    names.required = hasCompanion;
    names.setCustomValidity('');
  }
  for (const input of answerInputs) input.addEventListener('change', updateCompanionField);
  names.addEventListener('input', () => names.setCustomValidity(''));
  updateCompanionField();

  prepare.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!prepare.reportValidity()) return;
    const alone = prepare.elements['companion-status'].value === 'none';
    const companion = alone ? '없음' : names.value.trim();
    if (!companion) {
      names.setCustomValidity('동행자 이름을 입력해 주세요.');
      names.reportValidity();
      return;
    }
    const googleLink = document.getElementById('google-form-link');
    const externalUrl = new URL(googleLink.href);
    externalUrl.searchParams.set('usp', 'pp_url');
    for (const [field, answer] of selectedAnswers(new URLSearchParams(draft.answers))) {
      externalUrl.searchParams.set(field, answer);
    }
    // The existing form has no dedicated general-notice question. Keep the
    // original companion answer and explicitly label the additional response.
    externalUrl.searchParams.set('entry.195624935', companion + ' | 참가 전 필독 — 확인 및 동의합니다');
    googleLink.href = externalUrl.href;
    const embeddedUrl = new URL(externalUrl);
    embeddedUrl.searchParams.set('embedded', 'true');
    document.getElementById('form').src = embeddedUrl.href;
    prepare.reset();
    prepare.hidden = true;
    document.getElementById('google-application').hidden = false;
    document.getElementById('form-heading').focus();
  });
})();
