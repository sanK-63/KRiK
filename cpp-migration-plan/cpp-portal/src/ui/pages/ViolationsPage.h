#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;

class ViolationsPage : public QWidget
{
    Q_OBJECT

public:
    explicit ViolationsPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadViolations();

    QVBoxLayout *m_mainLayout;
    QWidget *m_listContainer;
};
