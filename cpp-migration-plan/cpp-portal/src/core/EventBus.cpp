#include "core/EventBus.h"

EventBus &EventBus::instance()
{
    static EventBus s;
    return s;
}

void EventBus::subscribe(const QString &event, QObject *context, Callback callback)
{
    m_subscriptions[event].append({context, callback});
}

void EventBus::unsubscribe(const QString &event, QObject *context)
{
    auto it = m_subscriptions.find(event);
    if (it == m_subscriptions.end()) return;

    auto &subs = it.value();
    subs.erase(
        std::remove_if(subs.begin(), subs.end(),
            [context](const Subscription &s) { return s.context == context; }),
        subs.end()
    );
}

void EventBus::publish(const QString &event, const QVariant &data)
{
    emit eventPublished(event, data);

    auto it = m_subscriptions.find(event);
    if (it == m_subscriptions.end()) return;

    auto subsCopy = it.value();
    for (const auto &sub : subsCopy) {
        if (sub.context) {
            sub.callback(data);
        }
    }
}
