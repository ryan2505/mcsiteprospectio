@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MCSite - Lancement
color 0A

echo ================================================
echo            MCSite - Lancement du site
echo ================================================
echo.

REM --- 1. Verifier que Node.js est installe ---
where node >nul 2>nul
if errorlevel 1 (
  color 0C
  echo [ERREUR] Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo   1. Va sur  https://nodejs.org
  echo   2. Telecharge la version LTS
  echo   3. Installe-la, puis relance ce fichier.
  echo.
  pause
  exit /b
)

for /f "tokens=*" %%v in ('node -v') do echo Node.js detecte : %%v
echo.

REM --- 2. Installer les dependances si necessaire ---
if not exist "node_modules" (
  echo Premiere utilisation detectee.
  echo Installation des dependances en cours... (1 a 3 minutes)
  echo Patiente, ne ferme pas cette fenetre.
  echo.
  call npm install
  if errorlevel 1 (
    color 0C
    echo.
    echo [ERREUR] L'installation a echoue.
    echo Fais une capture du texte ci-dessus et envoie-la pour qu'on corrige.
    echo.
    pause
    exit /b
  )
  echo.
  echo Dependances installees avec succes.
  echo.
) else (
  echo Dependances deja installees. On lance directement.
  echo.
)

REM --- 3. Lancer l'app + ouvrir le navigateur ---
echo ================================================
echo   L'app va demarrer sur :  http://localhost:3100
echo.
echo   - Garde CETTE fenetre ouverte pendant l'utilisation.
echo   - Pour ARRETER l'app : ferme la fenetre, ou Ctrl + C.
echo ================================================
echo.

REM Ouvre le navigateur apres un court delai (laisse le serveur demarrer)
start "" cmd /c "timeout /t 6 >nul & start http://localhost:3100"

call npm run dev

echo.
echo L'app s'est arretee. Appuie sur une touche pour fermer.
pause >nul
