#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QTableWidget;

class AdminPage : public QWidget
{
    Q_OBJECT

public:
    explicit AdminPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadUsers();
    void populateTable(const QJsonArray &users);

    QVBoxLayout *m_mainLayout;
    QTableWidget *m_table;
};
