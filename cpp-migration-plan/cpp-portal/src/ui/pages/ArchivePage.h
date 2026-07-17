#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;

class ArchivePage : public QWidget
{
    Q_OBJECT

public:
    explicit ArchivePage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadArchive();

    QVBoxLayout *m_mainLayout;
    QWidget *m_listContainer;
};
