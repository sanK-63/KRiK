@echo off
setlocal

set "SRC=%~dp0"
set "BUILD_SRC=C:\Users\stts0\cpp-portal"

echo [1/4] Syncing source to build location...
robocopy "%SRC%src" "%BUILD_SRC%\src" /E /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "%SRC%resources" "%BUILD_SRC%\resources" /E /NFL /NDL /NJH /NJS /NC /NS /NP
copy /Y "%SRC%CMakeLists.txt" "%BUILD_SRC%\CMakeLists.txt" >nul

echo [2/4] Configuring CMake...
set "PATH=C:\msys64\mingw64\bin;C:\msys64\usr\bin;C:\Program Files\CMake\bin;%PATH%"
cd /d "%BUILD_SRC%"
cmake -B build -G Ninja -DCMAKE_PREFIX_PATH="C:/msys64/mingw64" -DCMAKE_BUILD_TYPE=Debug

if %ERRORLEVEL% neq 0 (
    echo CMake configure failed!
    exit /b 1
)

echo [3/4] Building...
cmake --build build

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b 1
)

echo [4/4] Build succeeded! CorporatePortal.exe is at %BUILD_SRC%\build\CorporatePortal.exe
endlocal
