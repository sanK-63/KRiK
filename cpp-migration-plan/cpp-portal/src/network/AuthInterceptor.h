#pragma once

#include <QObject>
#include <QJsonObject>

class HttpClient;

class AuthInterceptor : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool isLoggedIn READ isLoggedIn NOTIFY loggedInChanged)
    Q_PROPERTY(QString token READ token NOTIFY tokenChanged)
    Q_PROPERTY(QJsonObject user READ user NOTIFY userChanged)

public:
    explicit AuthInterceptor(QObject *parent = nullptr);

    bool isLoggedIn() const { return m_loggedIn; }
    QString token() const { return m_token; }
    QJsonObject user() const { return m_user; }
    bool hasSavedToken() const;

public slots:
    void login(const QString &key);
    void logout();
    void refreshUser();

signals:
    void loggedInChanged(bool loggedIn);
    void tokenChanged(const QString &token);
    void userChanged(const QJsonObject &user);
    void loginSuccess();
    void loggedOut();
    void loginError(const QString &error);
    void loginProgress(int percent);

private:
    void setToken(const QString &token);
    void setUser(const QJsonObject &user);
    void setLoggedIn(bool loggedIn);
    void loadToken();
    void saveToken();
    void removeToken();

    bool m_loggedIn = false;
    QString m_token;
    QJsonObject m_user;
    HttpClient *m_http;
};
