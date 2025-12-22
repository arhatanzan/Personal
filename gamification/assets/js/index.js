document.addEventListener('DOMContentLoaded', () => {
    // Load the shared carousel component
    fetch('partials/carousel.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('games-carousel-container').innerHTML = html;
            
            // Load carousel JS
            const script = document.createElement('script');
            script.src = "assets/js/carousel.js";
            script.onload = () => {
                if (window.initCarousel) {
                    window.initCarousel();
                }
            };
            document.body.appendChild(script);
        })
        .catch(err => console.error('Error loading carousel:', err));
});