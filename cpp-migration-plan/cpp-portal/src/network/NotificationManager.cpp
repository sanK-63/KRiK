#include "network/NotificationManager.h"
#include "network/HttpClient.h"
#include <QJsonArray>

NotificationManager::NotificationManager(HttpClient *http, QObject *parent)
    : QObject(parent), m_http(http)
{
    connect(&m_pollTimer, &QTimer::timeout, this, &NotificationManager::onPoll);
    m_pollTimer.setInterval(30000);
}

void NotificationManager::refresh()
{
    fetchUnreadCount();
    fetchNotifications();
    if (!m_pollTimer.isActive())
        m_pollTimer.start();
}

void NotificationManager::markAllRead()
{
    m_http->patch("/api/notifications/read-all", QJsonObject(),
        [this](const QJsonObject &) {
            m_unreadCount = 0;
            emit unreadCountChanged(0);
            fetchNotifications();
        });
}

void NotificationManager::onPoll()
{
    fetchUnreadCount();
}

void NotificationManager::fetchUnreadCount()
{
    m_http->get("/api/notifications/unread-count",
        [this](const QJsonObject &resp) {
            int count = resp["count"].toInt();
            if (count != m_unreadCount) {
                m_unreadCount = count;
                emit unreadCountChanged(count);
            }
        });
}

void NotificationManager::fetchNotifications()
{
    m_http->get("/api/notifications?limit=20",
        [this](const QJsonObject &resp) {
            QJsonArray notifs = resp["notifications"].toArray();
            if (notifs.isEmpty())
                notifs = resp["data"].toArray();
            m_notifications = notifs;
            emit notificationsChanged(notifs);
        });
}
