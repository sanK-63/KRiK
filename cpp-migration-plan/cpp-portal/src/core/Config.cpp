#include "core/Config.h"

Config::Config()
    : QObject(nullptr)
    , m_settings("RogaKopyta", "CorporatePortal")
{
}

Config &Config::instance()
{
    static Config s;
    return s;
}

void Config::load()
{
    m_settings.sync();
}

void Config::save()
{
    m_settings.sync();
}

QVariant Config::value(const QString &key, const QVariant &defaultValue) const
{
    return m_settings.value(key, defaultValue);
}

void Config::setValue(const QString &key, const QVariant &value)
{
    m_settings.setValue(key, value);
}

void Config::remove(const QString &key)
{
    m_settings.remove(key);
}
