export function checkRules(pw) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function getStrength(pw) {
  const rules = checkRules(pw);
  const allMet = Object.values(rules).every(Boolean);
  if (!pw || !allMet) return { label: 'Weak', color: '#ef4444', percent: pw ? 25 : 0 };
  if (pw.length >= 12) return { label: 'Excellent', color: '#16a34a', percent: 100 };
  if (pw.length >= 10) return { label: 'Very good', color: '#f97316', percent: 75 };
  return { label: 'Good', color: '#3b82f6', percent: 50 };
}

export function attachPasswordStrength(input) {
  if (!input) return;

  const checklist = document.querySelector('[data-pw-checklist]');
  const bar = document.querySelector('[data-pw-bar]');
  const label = document.querySelector('[data-pw-label]');

  function update() {
    const pw = input.value;
    const rules = checkRules(pw);

    if (checklist) {
      checklist.querySelectorAll('[data-rule]').forEach((li) => {
        const met = rules[li.dataset.rule];
        li.querySelector('i').className = met
          ? 'fa-solid fa-circle-check mr-2 text-green-600'
          : 'fa-regular fa-circle mr-2 text-slate-400';
        li.classList.toggle('text-green-700', met);
      });
    }

    const s = getStrength(pw);
    if (bar) {
      bar.style.width = `${s.percent}%`;
      bar.style.backgroundColor = s.color;
    }
    if (label) {
      label.textContent = pw ? s.label : '';
      label.style.color = s.color;
    }
  }

  input.addEventListener('input', update);
  update();
}

export function isPasswordValid(pw) {
  return Object.values(checkRules(pw)).every(Boolean);
}