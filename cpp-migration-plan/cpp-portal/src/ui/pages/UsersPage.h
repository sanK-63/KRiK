#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QLineEdit;
class QGridLayout;

class UsersPage : public QWidget
{
    Q_OBJECT

public:
    explicit UsersPage(QWidget *parent = nullptr);

private slots:
    void onSearchChanged(const QString &text);

private:
    void setupUi();
    void loadUsers();
    void renderUsers(const QJsonArray &users);
    void filterUsers(const QString &query);

    QVBoxLayout *m_mainLayout = nullptr;
    QLineEdit *m_searchInput = nullptr;
    QGridLayout *m_gridLayout = nullptr;
    QWidget *m_gridContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
    QJsonArray m_allUsers;
};
