#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;
class QTableWidget;

class LeaderboardPage : public QWidget
{
    Q_OBJECT

public:
    explicit LeaderboardPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadLeaderboard();

    QVBoxLayout *m_mainLayout;
    QTableWidget *m_table;
};
