#include "network/HttpClient.h"
#include "core/Logger.h"
#include <QJsonDocument>
#include <QUrl>

HttpClient::HttpClient(QObject *parent)
    : QObject(parent)
    , m_manager(new QNetworkAccessManager(this))
{
}

void HttpClient::setBaseUrl(const QString &url)
{
    m_baseUrl = url;
}

void HttpClient::setAuthToken(const QString &token)
{
    m_authToken = token;
}

void HttpClient::clearAuthToken()
{
    m_authToken.clear();
}

QNetworkRequest HttpClient::buildRequest(const QString &path) const
{
    QUrl url(m_baseUrl + path);
    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setTransferTimeout(15000);

    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", ("Bearer " + m_authToken).toUtf8());
    }

    return request;
}

void HttpClient::handleReply(QNetworkReply *reply, SuccessCb onSuccess, ErrorCb onError)
{
    reply->deleteLater();

    if (reply->error() != QNetworkReply::NoError) {
        QString errorMsg = reply->errorString();
        QByteArray body = reply->readAll();
        QJsonDocument doc = QJsonDocument::fromJson(body);
        if (!doc.isNull() && doc.isObject()) {
            QString serverError = doc.object().value("error").toString();
            if (!serverError.isEmpty()) errorMsg = serverError;
        }
        if (onError) onError(errorMsg);
        else emit networkError(errorMsg);
        return;
    }

    QByteArray data = reply->readAll();
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (onSuccess) {
        onSuccess(doc.isObject() ? doc.object() : QJsonObject{{"_raw", QString::fromUtf8(data)}});
    }
}

void HttpClient::get(const QString &path, SuccessCb onSuccess, ErrorCb onError)
{
    QNetworkReply *reply = m_manager->get(buildRequest(path));
    handleReply(reply, onSuccess, onError);
}

void HttpClient::post(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError)
{
    QNetworkReply *reply = m_manager->post(buildRequest(path), QJsonDocument(body).toJson());
    handleReply(reply, onSuccess, onError);
}

void HttpClient::put(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError)
{
    QNetworkReply *reply = m_manager->put(buildRequest(path), QJsonDocument(body).toJson());
    handleReply(reply, onSuccess, onError);
}

void HttpClient::patch(const QString &path, const QJsonObject &body, SuccessCb onSuccess, ErrorCb onError)
{
    QNetworkRequest req = buildRequest(path);
    QNetworkReply *reply = m_manager->sendCustomRequest(req, "PATCH", QJsonDocument(body).toJson());
    handleReply(reply, onSuccess, onError);
}

void HttpClient::del(const QString &path, SuccessCb onSuccess, ErrorCb onError)
{
    QNetworkReply *reply = m_manager->deleteResource(buildRequest(path));
    handleReply(reply, onSuccess, onError);
}
