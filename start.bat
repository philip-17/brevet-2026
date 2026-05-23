@echo off
title BrevetBoost - Serveur de developpement
color 0D

echo.
echo  ============================================
echo     BrevetBoost - Lancement de l'app
echo  ============================================
echo.
echo  Le navigateur va s'ouvrir automatiquement.
echo  Pour arreter le serveur : appuie sur Ctrl+C
echo  puis ferme cette fenetre.
echo.

cd /d "%~dp0"

REM Ouvre le navigateur apres 4 secondes (le temps que Vite demarre)
start "" /min cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"

REM Lance le serveur Vite
npm run dev

REM Si on arrive ici, c'est que le serveur s'est arrete
echo.
echo  Le serveur s'est arrete.
pause
