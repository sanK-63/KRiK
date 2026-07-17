#include "network/SocketManager.h"
#include "core/Logger.h"

SocketManager::SocketManager(QObject *parent)
    : QObject(parent)
{
}

void SocketManager::connectToServer(const QString &url, const QString &token)
{
    Q_UNUSED(url)
    Q_UNUSED(token)
    LOG_WARN("Socket.IO: Qt6WebSockets not available. Realtime features disabled.");
    LOG_WARN("Install mingw-w64-x86_64-qt6-base-websockets to enable.");
}

void SocketManager::disconnect()
{
    m_connected = false;
}

bool SocketManager::isConnected() const
{
    return m_connected;
}

void SocketManager::emitEvent(const QString &event, const QJsonObject &data)
{
    Q_UNUSED(event)
    Q_UNUSED(data)
}

void SocketManager::on(const QString &event, std::function<void(const QJsonObject &)> callback)
{
    m_handlers[event] = callback;
}

void SocketManager::off(const QString &event)
{
    m_handlers.remove(event);
}
