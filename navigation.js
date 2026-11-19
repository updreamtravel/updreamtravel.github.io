const sectionLinks = Array.from(document.querySelectorAll('.toc nav a'));
const guideSections = sectionLinks.map(link => document.querySelector(link.hash));

function markCurrentSection() {
  const threshold = window.innerHeight * 0.35;
  const current = guideSections.filter(section => section.getBoundingClientRect().top < threshold).pop();
  sectionLinks.forEach((link, index) => {
    if (guideSections[index] === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let scheduled = false;
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    markCurrentSection();
    scheduled = false;
  });
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
markCurrentSection();
