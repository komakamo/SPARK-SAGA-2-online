import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';
import { SceneManager } from './managers/SceneManager';
import { ConversationManager } from './managers/ConversationManager';
import { TitleScene } from './scenes/TitleScene';
import { FieldScene } from './scenes/FieldScene';
import { BattleScene } from './scenes/BattleScene';
import { ResultScene } from './scenes/ResultScene';
import { MenuScene } from './scenes/MenuScene';
import { FormationScene } from './scenes/FormationScene';
import { loadGameData, gameData } from './data-loader';

const loadingScreen = document.getElementById('loading-screen')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;
const mainContent = document.getElementById('ui-main')!;
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

  // Initialize and start the scene manager
  const inputManager = new InputManager();
  const conversationManager = await ConversationManager.initialize();
  const uiManager = new UIManager(inputManager, conversationManager);
  const sceneManager = new SceneManager(inputManager, uiManager, conversationManager);
  sceneManager.addScene('title', new TitleScene(sceneManager, inputManager, uiManager));
  sceneManager.addScene('field', new FieldScene(sceneManager, inputManager, uiManager));
  sceneManager.addScene('battle', new BattleScene(sceneManager, inputManager, uiManager));
  sceneManager.addScene('result', new ResultScene(sceneManager, inputManager, uiManager));
  sceneManager.addScene('menu', new MenuScene(sceneManager, inputManager, uiManager));
  sceneManager.addScene('formation', new FormationScene(sceneManager, inputManager, uiManager));
  sceneManager.start('title');

  // Expose sceneManager to the window for debugging
  if (import.meta.env.DEV) {
    (window as any).sceneManager = sceneManager;
  }
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
