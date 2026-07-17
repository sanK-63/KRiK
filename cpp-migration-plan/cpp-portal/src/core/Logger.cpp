#include "core/Logger.h"
#include "ui/LogWindow.h"
#include <QFile>
#include <QTextStream>
#include <QCoreApplication>

Logger &Logger::instance()
{
    static Logger s;
    return s;
}

void Logger::init()
{
    QString logPath = QCoreApplication::applicationDirPath() + "/portal.log";
    m_file = new QFile(logPath);
    if (m_file->open(QIODevice::Append | QIODevice::Text)) {
        info("=== Logger initialized ===");
    }
}

void Logger::info(const QString &msg)
{
    QString ts = QDateTime::currentDateTime().toString("hh:mm:ss");
    QString line = QString("[%1] [INFO] %2").arg(ts, msg);
    qDebug().noquote() << line;
    LogWindow::instance()->appendLog(line);
    if (m_file && m_file->isOpen()) {
        QTextStream(m_file) << QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss")
                            << " [INFO] " << msg << "\n";
        m_file->flush();
    }
}

void Logger::warn(const QString &msg)
{
    QString ts = QDateTime::currentDateTime().toString("hh:mm:ss");
    QString line = QString("[%1] [WARN] %2").arg(ts, msg);
    qWarning().noquote() << line;
    LogWindow::instance()->appendLog(line);
    if (m_file && m_file->isOpen()) {
        QTextStream(m_file) << QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss")
                            << " [WARN] " << msg << "\n";
        m_file->flush();
    }
}

void Logger::error(const QString &msg)
{
    QString ts = QDateTime::currentDateTime().toString("hh:mm:ss");
    QString line = QString("[%1] [ERROR] %2").arg(ts, msg);
    qCritical().noquote() << line;
    LogWindow::instance()->appendLog(line);
    if (m_file && m_file->isOpen()) {
        QTextStream(m_file) << QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss")
                            << " [ERROR] " << msg << "\n";
        m_file->flush();
    }
}

void Logger::debug(const QString &msg)
{
    QString ts = QDateTime::currentDateTime().toString("hh:mm:ss");
    QString line = QString("[%1] [DEBUG] %2").arg(ts, msg);
    qDebug().noquote() << line;
    LogWindow::instance()->appendLog(line);
    if (m_file && m_file->isOpen()) {
        QTextStream(m_file) << QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss")
                            << " [DEBUG] " << msg << "\n";
        m_file->flush();
    }
}
