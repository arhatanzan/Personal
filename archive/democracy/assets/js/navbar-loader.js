// Loads the navbar partial into pages and handles mobile toggle + active link
// Loads the navbar partial into pages and handles active link highlighting
(function(){
  const containerId = 'site-navbar';
  const partialPath = 'assets/partials/navbar.html';

  function insertNavbar(html){
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = html;
    attachBehavior();
  }

  function attachBehavior(){
    // set active link based on current path
    const links = document.querySelectorAll('.nav-link');
    const current = location.pathname.split('/').pop() || 'index.html';
    links.forEach(a => {
      const href = a.getAttribute('href');
      if(!href) return;
      if(href === current || (href === '/' && (current === '' || current === 'index.html'))){
        a.classList.add('active');
      }
    });

    // ensure brand has accessible label
    const brand = document.querySelector('.navbar-brand');
    if(brand) brand.setAttribute('aria-label','Homepage');
  }

  // Fetch and insert
  fetch(partialPath).then(r => {
    if(!r.ok) throw new Error('Navbar partial not found');
    return r.text();
  }).then(html => insertNavbar(html)).catch(err => console.warn('Navbar load failed:', err));
})();
