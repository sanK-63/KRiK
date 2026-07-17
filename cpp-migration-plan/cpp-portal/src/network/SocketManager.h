#pragma once

#include <QObject>
#include <QJsonObject>
#include <functional>
#include <QMap>

class SocketManager : public QObject {
    Q_OBJECT

public:
    explicit SocketManager(QObject *parent = nullptr);

    void connectToServer(const QString &url, const QString &token);
    void disconnect();
    bool isConnected() const;

    void emitEvent(const QString &event, const QJsonObject &data = QJsonObject());
    void on(const QString &event, std::function<void(const QJsonObject &)> callback);
    void off(const QString &event);

signals:
    void connected();
    void disconnected();
    void notificationNew(const QString &title, const QString &body);
    void recipeCreated();
    void movieCreated();
    void memeCreated();
    void eventCreated();
    void userOnline(int userId);
    void connectionError(const QString &error);

private:
    bool m_connected = false;
    QMap<QString, std::function<void(const QJsonObject &)>> m_handlers;
};
