// Progressive enhancement: content and navigation also work without JavaScript.
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
menuButton.hidden = false;
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  navLinks.classList.toggle('is-open', expanded);
});
navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(max-width: 680px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();
