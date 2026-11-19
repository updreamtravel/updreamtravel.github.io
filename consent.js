(() => {
  'use strict';

  const form = document.getElementById('application-handoff');
  if (!form) return;

  const companionField = 'entry.195624935';
  const returnField = 'entry.1430566721';
  const referralField = 'entry.212359428';
  const referralInputs = Array.from(form.elements).filter(el => el.name === referralField);
  const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const birthday = form.elements.namedItem('entry.817041516');
  if (todayKst.startsWith('2026-')) birthday.max = '2007' + todayKst.slice(4);
  const telephone = form.elements.namedItem('entry.3274608');
  const submitButton = form.querySelector('button[type="submit"]');
  const status = document.getElementById('survey-status');
  const applicationId = form.elements.namedItem('applicationId');
  if (!applicationId.value) applicationId.value = crypto.randomUUID();
  let sending = false;

  function updateDetail(wrapper) {
    const field = wrapper.querySelector('input');
    const show = form.elements.namedItem(wrapper.dataset.detailFor).value === 'with';
    wrapper.hidden = !show;
    field.disabled = !show;
    field.required = show;
    if (!show) field.setCustomValidity('');
  }

  const detailFields = document.querySelectorAll('[data-detail-for]');
  function updateReferrals() {
    const valid = referralInputs.some(el => el.checked);
    referralInputs[0].setCustomValidity(valid ? '' : '신청 경로를 한 가지 이상 선택해 주세요.');
  }

  function updateText(field) {
    // A whitespace-only name or detail cannot identify an applicant or trip.
    field.setCustomValidity(!field.disabled && field.required && field.value && !field.value.trim()
      ? '공백 이외의 내용을 입력해 주세요.' : '');
  }

  function formatPhone() {
    const digits = telephone.value.replace(/[\s-]/g, '').replace(/^\+8210/, '010');
    if (/^010\d{8}$/.test(digits)) {
      telephone.value = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7);
    }
  }

  for (const wrapper of detailFields) {
    const group = form.elements.namedItem(wrapper.dataset.detailFor);
    for (const radio of group) radio.addEventListener('change', () => updateDetail(wrapper));
    updateDetail(wrapper);
  }
  for (const input of referralInputs) input.addEventListener('change', updateReferrals);
  const textFields = Array.from(form.elements).filter(el => el.type === 'text');
  for (const field of textFields) field.addEventListener('input', () => updateText(field));
  telephone.addEventListener('change', formatPhone);
  telephone.addEventListener('blur', formatPhone);
  updateReferrals();

  function resetButton() {
    sending = false;
    submitButton.disabled = false;
    status.textContent = '';
    for (const wrapper of detailFields) updateDetail(wrapper);
    updateReferrals();
  }
  window.addEventListener('pageshow', resetButton);

  form.addEventListener('formdata', event => {
    const answers = event.formData;
    for (const field of textFields) {
      if (!field.disabled) answers.set(field.name, field.value.trim());
    }
    if (answers.get('companion-status') === 'none') answers.set(companionField, '없음');
    if (answers.get('return-status') === 'none') answers.set(returnField, '첫 방문');
  });

  form.addEventListener('submit', event => {
    if (sending) {
      event.preventDefault();
      return;
    }
    formatPhone();
    for (const field of textFields) updateText(field);
    updateReferrals();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    sending = true;
    submitButton.disabled = true;
    status.textContent = '신청서를 보내고 있습니다.';
  });
  resetButton();
})();
