#pragma once

#include <QObject>
#include <QSqlDatabase>
#include <QSqlRecord>
#include <QVariant>
#include <QVariantList>
#include <QVariantMap>

class DatabaseManager : public QObject {
    Q_OBJECT

public:
    static DatabaseManager &instance();

    void init(const QString &dbPath);
    void close();
    bool isOpen() const;

    bool execute(const QString &query, const QVariantList &params = QVariantList());
    QVariantMap selectOne(const QString &query, const QVariantList &params = QVariantList());
    QVariantList selectAll(const QString &query, const QVariantList &params = QVariantList());
    int insert(const QString &query, const QVariantList &params = QVariantList());
    bool tableExists(const QString &tableName);

signals:
    void databaseError(const QString &error);

private:
    DatabaseManager() : QObject(nullptr) {}
    QSqlDatabase m_db;
};
