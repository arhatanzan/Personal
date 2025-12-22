class ColoredDivider extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="hr-container">
                <div class="box">
                    <div class="box-sm red"></div>
                    <div class="box-sm orange"></div>
                    <div class="box-sm yellow-bar"></div>
                    <div class="box-sm green-bar"></div>
                    <div class="box-sm blue-bar"></div>
                    <div class="box-sm purple"></div>
                </div>
            </div>
        `;
    }
}

customElements.define('colored-divider', ColoredDivider);

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.link-btn');
    const colors = ['link-btn--blue', 'link-btn--green', 'link-btn--yellow', 'link-btn--pink'];

    buttons.forEach((btn, index) => {
        // Ensure we don't have conflicting classes if they were left in HTML
        colors.forEach(c => btn.classList.remove(c));
        
        // Add the computed color class
        btn.classList.add(colors[index % colors.length]);
    });
});
