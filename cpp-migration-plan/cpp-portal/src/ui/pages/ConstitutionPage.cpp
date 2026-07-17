#include "ui/pages/ConstitutionPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QTextBrowser>
#include <QFrame>

ConstitutionPage::ConstitutionPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadConstitution();
}

void ConstitutionPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setStyleSheet("QScrollArea { background: transparent; }");

    auto *content = new QWidget();
    content->setStyleSheet("background: transparent;");
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(32, 32, 32, 32);
    m_mainLayout->setSpacing(24);

    m_titleLabel = new QLabel(QString::fromUtf8("KONSTITUCIYA"));
    m_titleLabel->setAlignment(Qt::AlignCenter);
    m_titleLabel->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "padding: 16px; background: #1a1a1a; border: 1px solid #3b3b3b; border-radius: 8px;");
    m_mainLayout->addWidget(m_titleLabel);

    m_versionLabel = new QLabel();
    m_versionLabel->setAlignment(Qt::AlignCenter);
    m_versionLabel->setStyleSheet("color: #888; font-size: 12px; padding: 4px;");
    m_mainLayout->addWidget(m_versionLabel);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_contentBrowser = new QTextBrowser();
    m_contentBrowser->setOpenExternalLinks(true);
    m_contentBrowser->setFrameShape(QFrame::NoFrame);
    m_contentBrowser->setStyleSheet(
        "QTextBrowser { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 8px; padding: 24px; font-size: 14px; line-height: 1.6; }");
    m_contentBrowser->hide();
    m_mainLayout->addWidget(m_contentBrowser);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void ConstitutionPage::showLoading()
{
    m_loadingLabel->show();
    m_contentBrowser->hide();
    m_versionLabel->clear();
}

void ConstitutionPage::renderContent(const QString &content, int version)
{
    m_loadingLabel->hide();
    m_contentBrowser->show();

    m_versionLabel->setText(QString::fromUtf8("Versiya: %1").arg(version));

    QString html = QString(
        "<div style='color: #F2F2F2; font-size: 14px; line-height: 1.8; "
        "font-family: sans-serif;'>%1</div>"
    ).arg(content.toHtmlEscaped().replace("\n", "<br>"));

    m_contentBrowser->setHtml(html);
}

void ConstitutionPage::loadConstitution()
{
    showLoading();

    Application::instance()->httpClient()->get("/api/constitution",
        [this](const QJsonObject &resp) {
            QString content = resp.value("content").toString();
            int version = resp.value("version").toInt(0);
            renderContent(content, version);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka zagruzki: %1").arg(err));
            m_loadingLabel->show();
            m_contentBrowser->hide();
        }
    );
}
