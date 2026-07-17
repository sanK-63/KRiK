#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;

class WorkersPage : public QWidget
{
    Q_OBJECT

public:
    explicit WorkersPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadWorkers();

    QVBoxLayout *m_mainLayout;
    QWidget *m_listContainer;
};
