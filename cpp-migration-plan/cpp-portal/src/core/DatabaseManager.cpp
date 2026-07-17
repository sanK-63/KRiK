#include "core/DatabaseManager.h"
#include "core/Logger.h"
#include <QSqlQuery>
#include <QSqlError>

DatabaseManager &DatabaseManager::instance()
{
    static DatabaseManager s;
    return s;
}

void DatabaseManager::init(const QString &dbPath)
{
    m_db = QSqlDatabase::addDatabase("QSQLITE");
    m_db.setDatabaseName(dbPath);

    if (!m_db.open()) {
        Logger::instance().error("Failed to open database: " + m_db.lastError().text());
        return;
    }

    QSqlQuery q(m_db);
    q.exec("PRAGMA journal_mode=WAL");
    q.exec("PRAGMA foreign_keys=ON");

    Logger::instance().info("Database opened: " + dbPath);
}

void DatabaseManager::close()
{
    if (m_db.isOpen()) {
        m_db.close();
    }
}

bool DatabaseManager::isOpen() const
{
    return m_db.isOpen();
}

bool DatabaseManager::execute(const QString &query, const QVariantList &params)
{
    QSqlQuery q(m_db);
    q.prepare(query);
    for (int i = 0; i < params.size(); ++i) {
        q.addBindValue(params[i]);
    }
    if (!q.exec()) {
        Logger::instance().error("SQL error: " + q.lastError().text());
        emit databaseError(q.lastError().text());
        return false;
    }
    return true;
}

QVariantMap DatabaseManager::selectOne(const QString &query, const QVariantList &params)
{
    QSqlQuery q(m_db);
    q.prepare(query);
    for (int i = 0; i < params.size(); ++i) {
        q.addBindValue(params[i]);
    }
    QVariantMap result;
    if (q.exec() && q.next()) {
        QSqlRecord record = q.record();
        for (int i = 0; i < record.count(); ++i) {
            result[record.fieldName(i)] = q.value(i);
        }
    }
    return result;
}

QVariantList DatabaseManager::selectAll(const QString &query, const QVariantList &params)
{
    QSqlQuery q(m_db);
    q.prepare(query);
    for (int i = 0; i < params.size(); ++i) {
        q.addBindValue(params[i]);
    }
    QVariantList results;
    if (q.exec()) {
        while (q.next()) {
            QVariantMap row;
            QSqlRecord record = q.record();
            for (int i = 0; i < record.count(); ++i) {
                row[record.fieldName(i)] = q.value(i);
            }
            results.append(row);
        }
    }
    return results;
}

int DatabaseManager::insert(const QString &query, const QVariantList &params)
{
    QSqlQuery q(m_db);
    q.prepare(query);
    for (int i = 0; i < params.size(); ++i) {
        q.addBindValue(params[i]);
    }
    if (!q.exec()) {
        Logger::instance().error("Insert error: " + q.lastError().text());
        return -1;
    }
    return q.lastInsertId().toInt();
}

bool DatabaseManager::tableExists(const QString &tableName)
{
    QSqlQuery q(m_db);
    q.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?");
    q.addBindValue(tableName);
    if (q.exec() && q.next()) {
        return q.value(0).toInt() > 0;
    }
    return false;
}
