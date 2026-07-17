#pragma once

#include <QWidget>
#include <QVBoxLayout>

class DashboardPage : public QWidget {
    Q_OBJECT

public:
    explicit DashboardPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadFounders();

    QVBoxLayout *m_mainLayout;
    QWidget *m_foundersContainer = nullptr;
};
