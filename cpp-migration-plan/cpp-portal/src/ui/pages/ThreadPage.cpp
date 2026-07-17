#include "ui/pages/ThreadPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFrame>
#include <QPushButton>
#include <QTextEdit>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QMessageBox>
#include <QDateTime>

ThreadPage::ThreadPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();

    connect(Application::instance()->mainWindow(), &MainWindow::routeChanged,
            this, &ThreadPage::onRouteChanged);
}

void ThreadPage::setThreadId(int id)
{
    if (m_threadId == id) return;
    m_threadId = id;
    if (m_threadId > 0)
        loadThread();
}

void ThreadPage::onRouteChanged(const QString &route)
{
    if (!route.startsWith("/forum/")) return;
    QString idStr = route.section('/', 2);
    bool ok = false;
    int id = idStr.toInt(&ok);
    if (ok && id > 0)
        setThreadId(id);
}

void ThreadPage::setupUi()
{
    m_mainLayout = new QVBoxLayout(this);
    m_mainLayout->setContentsMargins(0, 0, 0, 0);
    m_mainLayout->setSpacing(0);

    m_scroll = new QScrollArea();
    m_scroll->setWidgetResizable(true);
    m_scroll->setFrameShape(QFrame::NoFrame);
    m_scroll->setStyleSheet("QScrollArea { background: transparent; }");

    auto *content = new QWidget();
    content->setStyleSheet("background: transparent;");
    auto *contentLayout = new QVBoxLayout(content);
    contentLayout->setContentsMargins(32, 20, 32, 0);
    contentLayout->setSpacing(16);

    auto *backRow = new QWidget();
    backRow->setStyleSheet("background: transparent;");
    auto *backLayout = new QHBoxLayout(backRow);
    backLayout->setContentsMargins(0, 0, 0, 0);

    auto *backBtn = new QPushButton(QString::fromUtf8("\u2190 Nazad k forumu"));
    backBtn->setCursor(Qt::PointingHandCursor);
    backBtn->setStyleSheet(
        "QPushButton { background: transparent; color: #888; font-size: 13px; "
        "border: none; padding: 4px 0; }"
        "QPushButton:hover { color: #FA6814; }");
    connect(backBtn, &QPushButton::clicked, this, []() {
        if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
            w->navigateTo("/forum");
    });
    backLayout->addWidget(backBtn);
    backLayout->addStretch();
    contentLayout->addWidget(backRow);

    m_loadingWidget = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingWidget->setStyleSheet("color: #888; font-size: 14px; padding: 64px;");
    qobject_cast<QLabel *>(m_loadingWidget)->setAlignment(Qt::AlignCenter);
    contentLayout->addWidget(m_loadingWidget);

    m_headerWidget = new QWidget();
    m_headerWidget->setStyleSheet("background: transparent;");
    m_headerWidget->hide();
    contentLayout->addWidget(m_headerWidget);

    m_postsContainer = new QWidget();
    m_postsContainer->setStyleSheet("background: transparent;");
    m_postsLayout = new QVBoxLayout(m_postsContainer);
    m_postsLayout->setContentsMargins(0, 0, 0, 0);
    m_postsLayout->setSpacing(10);
    m_postsContainer->hide();
    contentLayout->addWidget(m_postsContainer, 1);

    m_replyBar = new QWidget();
    m_replyBar->setStyleSheet(
        "QWidget#replyBar { background: #1a1a1a; border: 1px solid #3b3b3b; "
        "border-radius: 8px; }");
    m_replyBar->setObjectName("replyBar");
    auto *replyLayout = new QVBoxLayout(m_replyBar);
    replyLayout->setContentsMargins(16, 12, 16, 12);
    replyLayout->setSpacing(10);

    m_replyEdit = new QTextEdit();
    m_replyEdit->setPlaceholderText(QString::fromUtf8("Napishite otvet..."));
    m_replyEdit->setMinimumHeight(60);
    m_replyEdit->setMaximumHeight(120);
    m_replyEdit->setStyleSheet(
        "QTextEdit { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 6px; padding: 8px; font-size: 13px; }"
        "QTextEdit:focus { border: 1px solid #FA6814; }");
    replyLayout->addWidget(m_replyEdit);

    auto *sendRow = new QHBoxLayout();
    sendRow->addStretch();
    auto *sendBtn = new QPushButton(QString::fromUtf8("Otpravit"));
    sendBtn->setCursor(Qt::PointingHandCursor);
    sendBtn->setStyleSheet(
        "QPushButton { background: #FA6814; color: #1a1a1a; font-size: 13px; "
        "font-weight: bold; padding: 8px 24px; border: none; border-radius: 6px; }"
        "QPushButton:hover { background: #e55a0e; }");
    connect(sendBtn, &QPushButton::clicked, this, [this]() {
        QString text = m_replyEdit->toPlainText().trimmed();
        if (text.isEmpty() || m_threadId <= 0) return;

        QJsonObject body;
        body["content"] = text;

        QString path = QString("/api/forum/%1/posts").arg(m_threadId);
        Application::instance()->httpClient()->post(path, body,
            [this](const QJsonObject &) {
                m_replyEdit->clear();
                loadThread();
            },
            [this](const QString &err) {
                QMessageBox::warning(this, QString::fromUtf8("Oshibka"),
                    QString::fromUtf8("Ne udalos otpravit: %1").arg(err));
            }
        );
    });
    sendRow->addWidget(sendBtn);
    replyLayout->addLayout(sendRow);

    m_replyBar->hide();
    contentLayout->addWidget(m_replyBar);

    contentLayout->addStretch();
    m_scroll->setWidget(content);

    m_mainLayout->addWidget(m_scroll, 1);
}

void ThreadPage::loadThread()
{
    m_loadingWidget->show();
    m_headerWidget->hide();
    m_postsContainer->hide();
    m_replyBar->hide();

    QString path = QString("/api/forum/%1").arg(m_threadId);
    Application::instance()->httpClient()->get(path,
        [this](const QJsonObject &resp) {
            QJsonObject topic = resp.value("topic").toObject();
            QJsonArray posts = resp.value("posts").toArray();

            if (topic.isEmpty()) {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isObject() && !it.value().toObject().isEmpty()) {
                        topic = it.value().toObject();
                        break;
                    }
                }
            }

            renderThread(topic, posts);
        },
        [this](const QString &err) {
            m_loadingWidget->show();
            qobject_cast<QLabel *>(m_loadingWidget)->setText(
                QString::fromUtf8("Oshibka: %1").arg(err));
            m_headerWidget->hide();
            m_postsContainer->hide();
            m_replyBar->hide();
        }
    );
}

void ThreadPage::renderThread(const QJsonObject &topic, const QJsonArray &posts)
{
    m_loadingWidget->hide();
    m_headerWidget->show();
    m_postsContainer->show();
    m_replyBar->show();

    QLayout *oldLayout = m_headerWidget->layout();
    if (oldLayout) {
        QLayoutItem *item;
        while ((item = oldLayout->takeAt(0)) != nullptr) {
            if (item->widget()) item->widget()->deleteLater();
            delete item;
        }
        delete oldLayout;
    }

    auto *hLayout = new QVBoxLayout(m_headerWidget);
    hLayout->setContentsMargins(0, 0, 0, 16);
    hLayout->setSpacing(8);

    QString title = topic.value("title").toString();
    auto *titleLabel = new QLabel(title);
    titleLabel->setStyleSheet(
        "color: #F2F2F2; font-size: 20px; font-weight: bold; background: transparent;");
    titleLabel->setWordWrap(true);
    hLayout->addWidget(titleLabel);

    QString authorName = topic.value("authorName").toString();
    if (authorName.isEmpty()) {
        QJsonObject author = topic.value("author").toObject();
        authorName = author.value("displayName").toString();
    }
    QString createdAt = topic.value("createdAt").toString();
    QString category = topic.value("category").toString();

    QString metaText;
    if (!category.isEmpty()) {
        metaText = QString::fromUtf8("%1 \u2022 %2 \u2022 %3")
                       .arg(authorName, createdAt.left(10), category);
    } else {
        metaText = QString::fromUtf8("%1 \u2022 %2")
                       .arg(authorName, createdAt.left(10));
    }
    auto *metaLabel = new QLabel(metaText);
    metaLabel->setStyleSheet("color: #888; font-size: 13px; background: transparent;");
    hLayout->addWidget(metaLabel);

    while (m_postsLayout->count() > 0) {
        QLayoutItem *item = m_postsLayout->takeAt(0);
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    for (const auto &p : posts) {
        m_postsLayout->addWidget(createPostWidget(p.toObject()));
    }

    if (posts.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Poka net otvetov. Bud't pervym!"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 32px;");
        m_postsLayout->addWidget(empty);
    }
}

QWidget *ThreadPage::createPostWidget(const QJsonObject &post)
{
    QString authorName = post.value("authorName").toString();
    if (authorName.isEmpty()) {
        QJsonObject author = post.value("author").toObject();
        authorName = author.value("displayName").toString();
    }
    QString content = post.value("content").toString();
    QString createdAt = post.value("createdAt").toString();
    QJsonObject reactions = post.value("reactions").toObject();

    auto *card = new QFrame();
    card->setStyleSheet(
        "QFrame { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 8px; }");
    card->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Minimum);

    auto *cardLayout = new QVBoxLayout(card);
    cardLayout->setContentsMargins(16, 14, 16, 14);
    cardLayout->setSpacing(8);

    auto *topRow = new QHBoxLayout();
    topRow->setSpacing(12);

    QString initial = authorName.isEmpty() ? "?" : authorName.left(1).toUpper();
    auto *avatar = new QLabel(initial);
    avatar->setFixedSize(36, 36);
    avatar->setAlignment(Qt::AlignCenter);
    avatar->setStyleSheet(
        "background: #FA6814; color: #1a1a1a; font-size: 14px; font-weight: bold; "
        "border-radius: 18px;");
    topRow->addWidget(avatar);

    auto *authorInfo = new QVBoxLayout();
    authorInfo->setSpacing(2);

    auto *nameLabel = new QLabel(authorName);
    nameLabel->setStyleSheet("color: #F2F2F2; font-size: 13px; font-weight: bold; background: transparent;");
    authorInfo->addWidget(nameLabel);

    auto *dateLabel = new QLabel(createdAt.left(16).replace("T", " "));
    dateLabel->setStyleSheet("color: #888; font-size: 11px; background: transparent;");
    authorInfo->addWidget(dateLabel);

    topRow->addLayout(authorInfo, 1);
    cardLayout->addLayout(topRow);

    auto *contentLabel = new QLabel(content);
    contentLabel->setStyleSheet("color: #F2F2F2; font-size: 14px; background: transparent;");
    contentLabel->setWordWrap(true);
    contentLabel->setTextInteractionFlags(Qt::TextSelectableByMouse);
    cardLayout->addWidget(contentLabel);

    if (!reactions.isEmpty()) {
        auto *reactionsRow = new QHBoxLayout();
        reactionsRow->setSpacing(8);
        reactionsRow->setContentsMargins(0, 4, 0, 0);

        for (auto it = reactions.constBegin(); it != reactions.constEnd(); ++it) {
            QString emoji = it.key();
            int count = it.value().toInt();
            if (count <= 0) continue;

            auto *reactionLabel = new QLabel(
                QString("%1 %2").arg(emoji, QString::number(count)));
            reactionLabel->setStyleSheet(
                "background: #3b3b3b; color: #F2F2F2; font-size: 12px; "
                "padding: 2px 8px; border-radius: 10px;");
            reactionsRow->addWidget(reactionLabel);
        }

        reactionsRow->addStretch();
        cardLayout->addLayout(reactionsRow);
    }

    return card;
}
