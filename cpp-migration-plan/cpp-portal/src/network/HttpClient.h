#pragma once

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonObject>
#include <functional>

class HttpClient : public QObject {
    Q_OBJECT

public:
    explicit HttpClient(QObject *parent = nullptr);

    void setBaseUrl(const QString &url);
    void setAuthToken(const QString &token);
    void clearAuthToken();

    using SuccessCb = std::function<void(const QJsonObject &)>;
    using ErrorCb = std::function<void(const QString &)>;

    void get(const QString &path, SuccessCb onSuccess, ErrorCb onError = nullptr);
    void post(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError = nullptr);
    void put(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError = nullptr);
    void patch(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError = nullptr);
    void del(const QString &path, SuccessCb onSuccess, ErrorCb onError = nullptr);

signals:
    void networkError(const QString &error);

private:
    QNetworkRequest buildRequest(const QString &path) const;
    void handleReply(QNetworkReply *reply, SuccessCb onSuccess, ErrorCb onError);

    QNetworkAccessManager *m_manager;
    QString m_baseUrl;
    QString m_authToken;
};
