#pragma once

#include <QObject>
#include <QSettings>
#include <QVariant>

class Config : public QObject {
    Q_OBJECT

public:
    static Config &instance();

    void load();
    void save();
    QVariant value(const QString &key, const QVariant &defaultValue = QVariant()) const;
    void setValue(const QString &key, const QVariant &value);
    void remove(const QString &key);

private:
    Config();
    QSettings m_settings;
};
