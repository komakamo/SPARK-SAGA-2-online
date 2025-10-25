import { loadGameData, gameData } from './data-loader';

const loadingScreen = document.getElementById('loading-screen')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;
const mainContent = document.querySelector('.card')!;
const devDiagnostics = document.getElementById('dev-diagnostics')!;

async function startGame() {
  loadingScreen.hidden = false;
  errorScreen.hidden = true;
  mainContent.hidden = true;

  const { logs } = await loadGameData();

  const fatalErrors = logs.filter(log => log.level === 'FATAL');
  const warnings = logs.filter(log => log.level === 'WARN');

  if (fatalErrors.length > 0) {
    errorMessage.textContent = fatalErrors.map(e => e.msg).join('\n');
    loadingScreen.hidden = true;
    errorScreen.hidden = false;
    return;
  }

  if (warnings.length > 0) {
    console.warn('Data loading warnings:', warnings);
  }

  loadingScreen.hidden = true;
  mainContent.hidden = false;

  if (import.meta.env.DEV) {
    devDiagnostics.hidden = false;
    devDiagnostics.textContent = `Loaded ${Object.keys(gameData).length} data files with ${warnings.length} warnings.`;
  }

  // You can now access the loaded and indexed data from the `gameData` object.
  console.log('Game data is ready:', gameData);
}

retryButton.addEventListener('click', startGame);

// PWA install prompt
let deferredPrompt: any;
const btn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if(btn) btn.hidden = false;
});
btn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  if(btn) btn.hidden = true;
});

startGame();
