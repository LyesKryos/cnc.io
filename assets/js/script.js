const header = document.querySelector('header');
const sidenav = document.querySelector('.sidenav');

function updateNavTop() {
  sidenav.style.top = header.offsetHeight + 'px';
}

window.addEventListener('load', updateNavTop);
window.addEventListener('resize', updateNavTop);