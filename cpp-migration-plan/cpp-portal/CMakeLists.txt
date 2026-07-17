cmake_minimum_required(VERSION 3.20)
project(CorporatePortal VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# MSYS2 MinGW64 paths
set(CMAKE_PREFIX_PATH "C:/msys64/mingw64" CACHE PATH "Qt/MinGW install prefix")

find_package(Qt6 REQUIRED COMPONENTS Core Widgets Network Sql)

add_executable(${PROJECT_NAME} WIN32
    src/main.cpp
    src/core/Application.cpp
    src/core/Config.cpp
    src/core/Logger.cpp
    src/core/EventBus.cpp
    src/core/DatabaseManager.cpp
    src/network/HttpClient.cpp
    src/network/SocketManager.cpp
    src/network/AuthInterceptor.cpp
    src/network/NotificationManager.cpp
    src/models/UserModel.cpp
    src/ui/MainWindow.cpp
    src/ui/LogWindow.cpp
    src/ui/components/TitleBar.cpp
    src/ui/components/HeaderWidget.cpp
    src/ui/components/SidebarWidget.cpp
    src/ui/components/OfflineBanner.cpp
    src/ui/components/ClickableFrame.cpp
    src/ui/pages/LoginPage.cpp
    src/ui/pages/DashboardPage.cpp
    src/ui/pages/ForumPage.cpp
    src/ui/pages/ThreadPage.cpp
    src/ui/pages/ConstitutionPage.cpp
    src/ui/pages/TournamentPage.cpp
    src/ui/pages/UsersPage.cpp
    src/ui/pages/ProfilePage.cpp
    src/ui/pages/MessagesPage.cpp
    src/ui/pages/CinemaPage.cpp
    src/ui/pages/EventsPage.cpp
    src/ui/pages/MemesPage.cpp
    src/ui/pages/TavernPage.cpp
    src/ui/pages/LibraryPage.cpp
    src/ui/pages/SoftwarePage.cpp
    src/ui/pages/LeaderboardPage.cpp
    src/ui/pages/LogsPage.cpp
    src/ui/pages/SearchPage.cpp
    src/ui/pages/AdminPage.cpp
    src/ui/pages/FeedPage.cpp
    src/ui/pages/ArchivePage.cpp
    src/ui/pages/WorkersPage.cpp
    src/ui/pages/ViolationsPage.cpp
    resources/resources.qrc
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/resources
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Widgets
    Qt6::Network
    Qt6::Sql
)

install(TARGETS ${PROJECT_NAME} RUNTIME DESTINATION bin)
