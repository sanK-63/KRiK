#pragma once

#include <QObject>
#include <QMap>
#include <QList>
#include <QVariant>
#include <functional>
#include <algorithm>

class EventBus : public QObject {
    Q_OBJECT

public:
    static EventBus &instance();

    using Callback = std::function<void(const QVariant &)>;

    void subscribe(const QString &event, QObject *context, Callback callback);
    void unsubscribe(const QString &event, QObject *context);
    void publish(const QString &event, const QVariant &data = QVariant());

signals:
    void eventPublished(const QString &event, const QVariant &data);

private:
    EventBus() : QObject(nullptr) {}

    struct Subscription {
        QObject *context;
        Callback callback;
    };

    QMap<QString, QList<Subscription>> m_subscriptions;
};
