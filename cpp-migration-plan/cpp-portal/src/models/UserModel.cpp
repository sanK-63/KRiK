#include "models/UserModel.h"
#include "core/Application.h"
#include "network/HttpClient.h"

UserData UserData::fromJson(const QJsonObject &json)
{
    UserData u;
    u.id = json.value("id").toInt();
    u.uuid = json.value("uuid").toString();
    u.username = json.value("username").toString();
    u.displayName = json.value("displayName").toString();
    u.surname = json.value("surname").toString();
    u.patronymic = json.value("patronymic").toString();
    u.dateOfBirth = json.value("dateOfBirth").toString();
    u.phone = json.value("phone").toString();
    u.email = json.value("email").toString();
    u.avatar = json.value("avatar").toString();
    u.status = json.value("status").toString();
    u.createdAt = json.value("createdAt").toString();
    u.lastLogin = json.value("lastLogin").toString();
    u.isOnline = json.value("isOnline").toBool();

    QJsonArray rolesArr = json.value("roles").toArray();
    for (const auto &r : rolesArr) {
        QJsonObject ro = r.toObject();
        u.roles.append({ro.value("roleId").toInt(), ro.value("name").toString(),
                        ro.value("color").toString(), ro.value("priority").toInt()});
    }

    QJsonObject p = json.value("profile").toObject();
    if (!p.isEmpty()) {
        u.profile = {p.value("discord").toString(), p.value("steam").toString(),
                     p.value("ea").toString(), p.value("battleNet").toString(),
                     p.value("country").toString(), p.value("bio").toString()};
    }

    return u;
}

QJsonObject UserData::toJson() const
{
    QJsonObject json;
    json["id"] = id;
    json["uuid"] = uuid;
    json["username"] = username;
    json["displayName"] = displayName;
    json["surname"] = surname;
    json["patronymic"] = patronymic;
    json["email"] = email;
    json["avatar"] = avatar;
    json["status"] = status;
    json["isOnline"] = isOnline;

    QJsonArray rolesArr;
    for (const auto &r : roles) {
        QJsonObject ro;
        ro["roleId"] = r.roleId;
        ro["name"] = r.name;
        ro["color"] = r.color;
        ro["priority"] = r.priority;
        rolesArr.append(ro);
    }
    json["roles"] = rolesArr;

    return json;
}

UserModel::UserModel(QObject *parent)
    : QObject(parent)
{
}

void UserModel::fetchAll()
{
    Application::instance()->httpClient()->get("/api/users",
        [this](const QJsonObject &resp) {
            emit usersLoaded(resp);
        },
        [this](const QString &err) {
            emit error(err);
        }
    );
}

void UserModel::fetchById(int id)
{
    Application::instance()->httpClient()->get(QString("/api/users/%1").arg(id),
        [this](const QJsonObject &resp) {
            emit userLoaded(resp);
        },
        [this](const QString &err) {
            emit error(err);
        }
    );
}
