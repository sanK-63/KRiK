#pragma once

#include <QObject>
#include <QJsonArray>
#include <QTimer>

class HttpClient;

class NotificationManager : public QObject {
    Q_OBJECT

public:
    explicit NotificationManager(HttpClient *http, QObject *parent = nullptr);

    void refresh();
    void markAllRead();
    int unreadCount() const { return m_unreadCount; }
    QJsonArray notifications() const { return m_notifications; }

signals:
    void unreadCountChanged(int count);
    void notificationsChanged(const QJsonArray &notifications);
    void newNotification(const QJsonObject &notification);

private slots:
    void onPoll();

private:
    void fetchUnreadCount();
    void fetchNotifications();

    HttpClient *m_http;
    int m_unreadCount = 0;
    QJsonArray m_notifications;
    QTimer m_pollTimer;
};
