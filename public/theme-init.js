/* theme-init.js — Aplica el tema antes del render para evitar flash.
   Lógica idéntica a la del sistema mercedario:
   - Por defecto: auto por hora (18:00–05:00 oscuro, resto claro).
   - Si el usuario tocó el botón, guarda 'theme-mode=manual' + timestamp.
   - El override manual dura 4 horas; después vuelve al automático. */
(function() {
  var MANUAL_TTL_MS = 4 * 60 * 60 * 1000;

  function timeBasedTheme() {
    var h = new Date().getHours();
    return (h >= 18 || h < 5) ? 'dark' : 'light';
  }

  var mode    = localStorage.getItem('theme-mode');
  var saved   = localStorage.getItem('theme');
  var atStr   = localStorage.getItem('theme-manual-at');
  var at      = atStr ? parseInt(atStr, 10) : 0;
  var age     = Date.now() - at;
  var manualValid = mode === 'manual' && saved && at > 0 && age < MANUAL_TTL_MS;

  if (!manualValid && mode === 'manual') {
    localStorage.removeItem('theme-mode');
    localStorage.removeItem('theme-manual-at');
  }

  var theme = manualValid ? saved : timeBasedTheme();
  document.documentElement.setAttribute('data-theme', theme);
})();
