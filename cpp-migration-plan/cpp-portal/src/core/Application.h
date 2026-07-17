#pragma once

#include <QObject>
#include <QApplication>
#include <memory>

class MainWindow;
class AuthInterceptor;
class SocketManager;
class HttpClient;
class NotificationManager;

class Application : public QObject {
    Q_OBJECT

public:
    explicit Application(QObject *parent = nullptr);
    ~Application() override;

    void start();
    void shutdown();

    MainWindow *mainWindow() const { return m_mainWindow.get(); }
    AuthInterceptor *authManager() const { return m_authManager.get(); }
    SocketManager *socketManager() const { return m_socketManager.get(); }
    HttpClient *httpClient() const { return m_httpClient.get(); }
    NotificationManager *notificationManager() const { return m_notificationManager.get(); }

    static Application *instance();

private:
    void connectSignals();
    void onUserLoggedIn();
    void onUserLoggedOut();

    std::unique_ptr<MainWindow> m_mainWindow;
    std::unique_ptr<AuthInterceptor> m_authManager;
    std::unique_ptr<SocketManager> m_socketManager;
    std::unique_ptr<HttpClient> m_httpClient;
    std::unique_ptr<NotificationManager> m_notificationManager;

    static Application *s_instance;
};
