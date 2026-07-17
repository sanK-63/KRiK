#include "network/AuthInterceptor.h"
#include "network/HttpClient.h"
#include "core/Application.h"
#include "core/Config.h"
#include "core/Logger.h"

AuthInterceptor::AuthInterceptor(QObject *parent)
    : QObject(parent)
    , m_http(Application::instance()->httpClient())
{
    loadToken();
}

bool AuthInterceptor::hasSavedToken() const
{
    return !Config::instance().value("auth/token").toString().isEmpty();
}

void AuthInterceptor::login(const QString &key)
{
    QJsonObject body;
    body["key"] = key;

    m_http->post("/api/auth/key-login", body,
        [this](const QJsonObject &resp) {
            if (resp.contains("token") && resp.contains("user")) {
                setToken(resp["token"].toString());
                setUser(resp["user"].toObject());

                m_http->get("/api/auth/me",
                    [this](const QJsonObject &me) {
                        if (!me.isEmpty() && !me.contains("error")) {
                            setUser(me);
                        }
                        setLoggedIn(true);
                        emit loginSuccess();
                    },
                    [this](const QString &) {
                        setLoggedIn(true);
                        emit loginSuccess();
                    }
                );
            } else {
                emit loginError(resp.value("error").toString().isEmpty()
                    ? QString("Nevernyj kluch") : resp.value("error").toString());
            }
        },
        [this](const QString &err) {
            emit loginError(err);
        }
    );
}

void AuthInterceptor::logout()
{
    removeToken();
    m_token.clear();
    m_user = QJsonObject();
    m_http->clearAuthToken();
    setLoggedIn(false);
    emit loggedOut();
}

void AuthInterceptor::refreshUser()
{
    if (m_token.isEmpty()) return;
    m_http->setAuthToken(m_token);

    m_http->get("/api/auth/me",
        [this](const QJsonObject &me) {
            if (!me.isEmpty() && !me.contains("error")) {
                setUser(me);
                setLoggedIn(true);
                emit loginSuccess();
            } else {
                logout();
            }
        },
        [this](const QString &) {
            logout();
        }
    );
}

void AuthInterceptor::setToken(const QString &token)
{
    if (m_token == token) return;
    m_token = token;
    m_http->setAuthToken(token);
    saveToken();
    emit tokenChanged(token);
}

void AuthInterceptor::setUser(const QJsonObject &user)
{
    m_user = user;
    emit userChanged(user);
}

void AuthInterceptor::setLoggedIn(bool loggedIn)
{
    if (m_loggedIn == loggedIn) return;
    m_loggedIn = loggedIn;
    emit loggedInChanged(loggedIn);
}

void AuthInterceptor::loadToken()
{
    m_token = Config::instance().value("auth/token").toString();
}

void AuthInterceptor::saveToken()
{
    Config::instance().setValue("auth/token", m_token);
    Config::instance().save();
}

void AuthInterceptor::removeToken()
{
    Config::instance().remove("auth/token");
    Config::instance().save();
}
