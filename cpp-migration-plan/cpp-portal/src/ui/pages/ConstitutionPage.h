#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;
class QTextBrowser;

class ConstitutionPage : public QWidget
{
    Q_OBJECT

public:
    explicit ConstitutionPage(QWidget *parent = nullptr);

private slots:
    void loadConstitution();

private:
    void setupUi();
    void showLoading();
    void renderContent(const QString &content, int version);

    QVBoxLayout *m_mainLayout = nullptr;
    QLabel *m_titleLabel = nullptr;
    QLabel *m_versionLabel = nullptr;
    QLabel *m_loadingLabel = nullptr;
    QTextBrowser *m_contentBrowser = nullptr;
};
