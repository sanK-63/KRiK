#include "ui/pages/LibraryPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QFrame>
#include <QJsonArray>
#include <QTabWidget>
#include <QDesktopServices>
#include <QUrl>

LibraryPage::LibraryPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadLibrary();
}

void LibraryPage::setupUi()
{
    m_mainLayout = new QVBoxLayout(this);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(20);

    auto *titleLabel = new QLabel(QString::fromUtf8("Biblioteka"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    m_mainLayout->addWidget(titleLabel);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_tabWidget = new QTabWidget();
    m_tabWidget->setStyleSheet(
        "QTabWidget::pane { border: 1px solid #3b3b3b; background: #1a1a1a; }"
        "QTabBar::tab { background: #2a2a2a; color: #888; padding: 8px 20px; "
        "border: 1px solid #3b3b3b; border-bottom: none; border-radius: 4px 4px 0 0; "
        "margin-right: 2px; font-size: 12px; }"
        "QTabBar::tab:selected { background: #1a1a1a; color: #FA6814; }"
        "QTabBar::tab:hover { color: #F2F2F2; }");
    m_mainLayout->addWidget(m_tabWidget);
}

void LibraryPage::loadLibrary()
{
    m_loadingLabel->show();
    m_tabWidget->hide();

    Application::instance()->httpClient()->get("/api/library",
        [this](const QJsonObject &resp) {
            m_loadingLabel->hide();
            m_tabWidget->show();

            QJsonObject categories;
            if (resp.contains("categories")) {
                categories = resp["categories"].toObject();
            } else if (resp.contains("documents")) {
                QJsonArray docs = resp["documents"].toArray();
                QMap<QString, QJsonArray> catMap;
                for (const auto &d : docs) {
                    QJsonObject doc = d.toObject();
                    QString cat = doc.value("category").toString();
                    if (cat.isEmpty()) cat = QString::fromUtf8("Obschee");
                    catMap[cat].append(doc);
                }
                for (auto it = catMap.constBegin(); it != catMap.constEnd(); ++it) {
                    renderCategory(it.key(), it.value());
                }
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) {
                        renderCategory(it.key(), it.value().toArray());
                    }
                }
            }

            if (!categories.isEmpty()) {
                for (auto it = categories.constBegin(); it != categories.constEnd(); ++it) {
                    renderCategory(it.key(), it.value().toArray());
                }
            }

            if (m_tabWidget->count() == 0) {
                auto *emptyWidget = new QWidget();
                auto *emptyLayout = new QVBoxLayout(emptyWidget);
                auto *empty = new QLabel(QString::fromUtf8("Dokumenty ne naydeny"));
                empty->setAlignment(Qt::AlignCenter);
                empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
                emptyLayout->addWidget(empty);
                m_tabWidget->addTab(emptyWidget, QString::fromUtf8("Pustо"));
                m_tabWidget->show();
            }
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void LibraryPage::renderCategory(const QString &name, const QJsonArray &documents)
{
    auto *tabContent = new QWidget();
    tabContent->setStyleSheet("background: transparent;");

    auto *scroll = new QScrollArea();
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setStyleSheet("QScrollArea { background: transparent; }");

    auto *inner = new QWidget();
    inner->setStyleSheet("background: transparent;");
    auto *layout = new QVBoxLayout(inner);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(10);

    for (const auto &d : documents) {
        QJsonObject doc = d.toObject();

        QString title = doc.value("title").toString();
        QString description = doc.value("description").toString();
        QString fileSize = doc.value("fileSize").toString();
        if (fileSize.isEmpty()) {
            qint64 size = doc.value("fileSize").toVariant().toLongLong();
            if (size > 1048576) fileSize = QString::fromUtf8("%1 MB").arg(size / 1048576.0, 0, 'f', 1);
            else if (size > 1024) fileSize = QString::fromUtf8("%1 KB").arg(size / 1024.0, 0, 'f', 1);
            else fileSize = QString::fromUtf8("%1 B").arg(size);
        }
        int downloads = doc.value("downloadCount").toInt(0);
        if (downloads == 0) downloads = doc.value("downloads").toInt(0);
        QString downloadUrl = doc.value("downloadUrl").toString();
        if (downloadUrl.isEmpty()) downloadUrl = doc.value("fileUrl").toString();

        auto *card = new QFrame();
        card->setObjectName("docCard");
        card->setStyleSheet(
            "QFrame#docCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#docCard:hover { border: 1px solid #FA6814; }");

        auto *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(16, 14, 16, 14);
        cardLayout->setSpacing(16);

        auto *infoLayout = new QVBoxLayout();
        infoLayout->setSpacing(4);

        auto *titleLabel = new QLabel(title);
        titleLabel->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
        titleLabel->setWordWrap(true);
        infoLayout->addWidget(titleLabel);

        if (!description.isEmpty()) {
            QString truncDesc = description;
            if (truncDesc.length() > 120) truncDesc = truncDesc.left(117) + "...";
            auto *descLabel = new QLabel(truncDesc);
            descLabel->setStyleSheet("color: #888; font-size: 12px;");
            descLabel->setWordWrap(true);
            infoLayout->addWidget(descLabel);
        }

        auto *metaRow = new QHBoxLayout();
        metaRow->setSpacing(12);
        if (!fileSize.isEmpty()) {
            auto *sizeLabel = new QLabel(QString::fromUtf8("Razmer: %1").arg(fileSize));
            sizeLabel->setStyleSheet("color: #888; font-size: 11px;");
            metaRow->addWidget(sizeLabel);
        }
        if (downloads > 0) {
            auto *dlLabel = new QLabel(QString::fromUtf8("Zagruzok: %1").arg(downloads));
            dlLabel->setStyleSheet("color: #888; font-size: 11px;");
            metaRow->addWidget(dlLabel);
        }
        metaRow->addStretch();
        infoLayout->addLayout(metaRow);

        cardLayout->addLayout(infoLayout, 1);

        if (!downloadUrl.isEmpty()) {
            auto *dlBtn = new QPushButton(QString::fromUtf8("Skachat'"));
            dlBtn->setStyleSheet(
                "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
                "padding: 6px 16px; border-radius: 4px; border: none; font-size: 12px; }"
                "QPushButton:hover { background: #e05a10; }");
            connect(dlBtn, &QPushButton::clicked, this, [downloadUrl]() {
                QDesktopServices::openUrl(QUrl(downloadUrl));
            });
            cardLayout->addWidget(dlBtn, 0, Qt::AlignVCenter);
        }

        layout->addWidget(card);
    }

    layout->addStretch();
    scroll->setWidget(inner);

    auto *tabLayout = new QVBoxLayout(tabContent);
    tabLayout->setContentsMargins(0, 0, 0, 0);
    tabLayout->addWidget(scroll);

    m_tabWidget->addTab(tabContent, name);
}
