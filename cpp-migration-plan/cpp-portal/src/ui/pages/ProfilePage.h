#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;
class QScrollArea;
class QPushButton;
class QFrame;

class ProfilePage : public QWidget
{
    Q_OBJECT

public:
    explicit ProfilePage(QWidget *parent = nullptr);

    void setUserId(int id);

private:
    void setupUi();
    void loadProfile(int userId);
    void renderProfile(const QJsonObject &user);
    void loadElo(int userId);
    void renderElo(const QJsonObject &data);
    bool isOwnProfile(int userId) const;

    QScrollArea *m_scroll = nullptr;
    QWidget *m_content = nullptr;
    QVBoxLayout *m_mainLayout = nullptr;

    int m_userId = -1;

    QLabel *m_avatarLabel = nullptr;
    QLabel *m_displayNameLabel = nullptr;
    QLabel *m_usernameLabel = nullptr;
    QLabel *m_emailLabel = nullptr;
    QWidget *m_rolesContainer = nullptr;
    QWidget *m_profileSection = nullptr;
    QWidget *m_eloSection = nullptr;
    QPushButton *m_logoutButton = nullptr;

    QFrame *m_eloCard = nullptr;
    QLabel *m_eloValue = nullptr;
    QLabel *m_winsValue = nullptr;
    QLabel *m_lossesValue = nullptr;
};
