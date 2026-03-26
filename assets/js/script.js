const header = document.querySelector('header');
const sidenav = document.querySelector('.sidenav');

function updateNavTop() {
  sidenav.style.top = header.offsetHeight + 'px';
}

window.addEventListener('load', updateNavTop);
window.addEventListener('resize', updateNavTop);

function toggleNav() {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.body.classList.toggle('nav-open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.body.classList.remove('nav-open');
}

document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});