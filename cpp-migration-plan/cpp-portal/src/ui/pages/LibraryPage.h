#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QTabWidget;

class LibraryPage : public QWidget
{
    Q_OBJECT

public:
    explicit LibraryPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadLibrary();
    void renderCategory(const QString &name, const QJsonArray &documents);

    QVBoxLayout *m_mainLayout = nullptr;
    QTabWidget *m_tabWidget = nullptr;
    QLabel *m_loadingLabel = nullptr;
};
