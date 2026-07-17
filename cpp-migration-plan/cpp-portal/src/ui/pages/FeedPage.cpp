#include "ui/pages/FeedPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include "ui/components/ClickableFrame.h"
#include <QJsonArray>

FeedPage::FeedPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadFeed();
}

void FeedPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("LENTA"));
    titleLabel->setAlignment(Qt::AlignCenter);
    titleLabel->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "padding: 16px; background: #1a1a1a; border: 1px solid #3b3b3b; border-radius: 8px;");
    m_mainLayout->addWidget(titleLabel);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_cardsContainer = new QWidget();
    m_cardsContainer->setStyleSheet("background: transparent;");
    m_cardsLayout = new QVBoxLayout(m_cardsContainer);
    m_cardsLayout->setContentsMargins(0, 0, 0, 0);
    m_cardsLayout->setSpacing(12);
    m_mainLayout->addWidget(m_cardsContainer);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void FeedPage::loadFeed()
{
    m_loadingLabel->show();
    m_cardsContainer->hide();

    Application::instance()->httpClient()->get("/api/forum",
        [this](const QJsonObject &resp) {
            QJsonArray topics;
            if (resp.contains("topics")) {
                topics = resp["topics"].toArray();
            } else if (resp.contains("threads")) {
                topics = resp["threads"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { topics = it.value().toArray(); break; }
                }
            }
            renderTopics(topics);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void FeedPage::renderTopics(const QJsonArray &topics)
{
    m_loadingLabel->hide();
    m_cardsContainer->show();

    QLayoutItem *item;
    while ((item = m_cardsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int count = 0;
    for (const auto &t : topics) {
        if (count >= 20) break;
        QJsonObject topic = t.toObject();

        QString id = topic.value("_id").toString();
        QString title = topic.value("title").toString();
        QString authorName = topic.value("authorName").toString();
        if (authorName.isEmpty()) {
            QJsonObject author = topic.value("author").toObject();
            authorName = author.value("displayName").toString();
        }
        QString category = topic.value("category").toString();
        QString createdAt = topic.value("createdAt").toString();
        int replies = topic.value("replies").toInt(0);

        auto *card = new ClickableFrame();
        card->setObjectName("topicCard");
        card->setStyleSheet(
            "QFrame#topicCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#topicCard:hover { border: 1px solid #FA6814; }");
        card->setCursor(Qt::PointingHandCursor);

        auto *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(20, 16, 20, 16);
        cardLayout->setSpacing(16);

        auto *infoLayout = new QVBoxLayout();
        infoLayout->setSpacing(6);

        auto *titleLabel = new QLabel(title);
        titleLabel->setStyleSheet("color: #F2F2F2; font-size: 15px; font-weight: bold;");
        titleLabel->setWordWrap(true);
        infoLayout->addWidget(titleLabel);

        auto *metaLabel = new QLabel(
            QString::fromUtf8("%1 \u2022 %2 \u2022 %3 otvetov")
                .arg(authorName, createdAt.left(10), QString::number(replies)));
        metaLabel->setStyleSheet("color: #888; font-size: 12px;");
        infoLayout->addWidget(metaLabel);

        cardLayout->addLayout(infoLayout, 1);

        if (!category.isEmpty()) {
            auto *badge = new QLabel(category);
            badge->setAlignment(Qt::AlignCenter);
            badge->setStyleSheet(
                "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
                "padding: 4px 10px; border-radius: 4px;");
            cardLayout->addWidget(badge, 0, Qt::AlignVCenter);
        }

        connect(card, &ClickableFrame::clicked, this, [id]() {
            if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
                w->navigateTo("/forum/" + id);
        });

        m_cardsLayout->addWidget(card);
        count++;
    }

    if (count == 0) {
        auto *empty = new QLabel(QString::fromUtf8("Temy ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_cardsLayout->addWidget(empty);
    }
}
