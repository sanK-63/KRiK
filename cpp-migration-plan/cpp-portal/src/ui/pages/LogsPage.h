#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QTableWidget;

class LogsPage : public QWidget
{
    Q_OBJECT

public:
    explicit LogsPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadLogs();

    QVBoxLayout *m_mainLayout = nullptr;
    QTableWidget *m_table = nullptr;
    QLabel *m_loadingLabel = nullptr;
};
