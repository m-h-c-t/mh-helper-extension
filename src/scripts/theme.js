// Detect system theme
const setTheme = () => {
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.body.dataset.bsTheme = preferredTheme;
};

// Apply theme on load
setTheme();

// Listen for changes in system theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);
