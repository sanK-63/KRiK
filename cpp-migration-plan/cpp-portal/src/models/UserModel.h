#pragma once

#include <QObject>
#include <QJsonObject>
#include <QJsonArray>
#include <QList>

struct UserData {
    int id = 0;
    QString uuid;
    QString username;
    QString displayName;
    QString surname;
    QString patronymic;
    QString dateOfBirth;
    QString phone;
    QString email;
    QString avatar;
    QString status;
    QString createdAt;
    QString lastLogin;
    bool isOnline = false;

    struct Role {
        int roleId = 0;
        QString name;
        QString color;
        int priority = 0;
    };

    struct Profile {
        QString discord;
        QString steam;
        QString ea;
        QString battleNet;
        QString country;
        QString bio;
    };

    QList<Role> roles;
    Profile profile;

    static UserData fromJson(const QJsonObject &json);
    QJsonObject toJson() const;
};

class UserModel : public QObject {
    Q_OBJECT

public:
    explicit UserModel(QObject *parent = nullptr);

public slots:
    void fetchAll();
    void fetchById(int id);

signals:
    void usersLoaded(const QJsonObject &resp);
    void userLoaded(const QJsonObject &user);
    void error(const QString &error);
};
