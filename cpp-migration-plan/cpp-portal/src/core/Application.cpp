#include "core/Application.h"
#include "ui/MainWindow.h"
#include "network/AuthInterceptor.h"
#include "network/SocketManager.h"
#include "network/HttpClient.h"
#include "network/NotificationManager.h"
#include "core/Config.h"
#include "core/Logger.h"

Application *Application::s_instance = nullptr;

Application::Application(QObject *parent)
    : QObject(parent)
{
    s_instance = this;
    m_httpClient = std::make_unique<HttpClient>(this);
    m_authManager = std::make_unique<AuthInterceptor>(this);
    m_socketManager = std::make_unique<SocketManager>(this);
    m_notificationManager = std::make_unique<NotificationManager>(m_httpClient.get(), this);
    m_mainWindow = std::make_unique<MainWindow>();
}

Application::~Application()
{
    s_instance = nullptr;
}

Application *Application::instance()
{
    return s_instance;
}

void Application::start()
{
    Logger::instance().info("Starting application...");
    connectSignals();

    QString apiUrl = Config::instance().value("api/url", "http://localhost:5000").toString();
    m_httpClient->setBaseUrl(apiUrl);

    if (m_authManager->hasSavedToken()) {
        m_authManager->refreshUser();
    } else {
        m_mainWindow->showLogin();
    }

    m_mainWindow->show();
}

void Application::shutdown()
{
    Logger::instance().info("Shutting down...");
    m_socketManager->disconnect();
}

void Application::connectSignals()
{
    connect(m_authManager.get(), &AuthInterceptor::loginSuccess, this, &Application::onUserLoggedIn);
    connect(m_authManager.get(), &AuthInterceptor::loggedOut, this, &Application::onUserLoggedOut);
}

void Application::onUserLoggedIn()
{
    Logger::instance().info("User logged in, connecting socket...");
    m_mainWindow->showMainContent();
    m_notificationManager->refresh();

    connect(m_notificationManager.get(), &NotificationManager::unreadCountChanged,
            m_mainWindow.get(), &MainWindow::updateUnreadCount);

    QString apiUrl = Config::instance().value("api/url", "http://localhost:5000").toString();
    m_socketManager->connectToServer(apiUrl, m_authManager->token());
}

void Application::onUserLoggedOut()
{
    Logger::instance().info("User logged out.");
    m_socketManager->disconnect();
    m_mainWindow->showLogin();
}
