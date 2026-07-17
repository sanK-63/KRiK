#pragma once

#include <QString>
#include <QDebug>
#include <QDateTime>
#include <QFile>
#include <QTextStream>

class Logger {
public:
    static Logger &instance();

    void init();

    void info(const QString &msg);
    void warn(const QString &msg);
    void error(const QString &msg);
    void debug(const QString &msg);

private:
    Logger() = default;
    QFile *m_file = nullptr;
};

// Convenience macros
#define LOG_INFO(msg)    Logger::instance().info(msg)
#define LOG_WARN(msg)    Logger::instance().warn(msg)
#define LOG_ERROR(msg)   Logger::instance().error(msg)
#define LOG_DEBUG(msg)   Logger::instance().debug(msg)
