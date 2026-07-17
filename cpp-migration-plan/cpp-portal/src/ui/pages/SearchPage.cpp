#include "ui/pages/SearchPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include "ui/components/ClickableFrame.h"

SearchPage::SearchPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
}

void SearchPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("POISK"));
    titleLabel->setAlignment(Qt::AlignCenter);
    titleLabel->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "padding: 16px; background: #1a1a1a; border: 1px solid #3b3b3b; border-radius: 8px;");
    m_mainLayout->addWidget(titleLabel);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_usersTitle = new QLabel(QString::fromUtf8("POL'ZOVATELI"));
    m_usersTitle->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 12px; color: #FA6814; padding: 8px 0;");
    m_usersTitle->hide();
    m_mainLayout->addWidget(m_usersTitle);

    m_usersContainer = new QWidget();
    m_usersContainer->setStyleSheet("background: transparent;");
    m_usersLayout = new QVBoxLayout(m_usersContainer);
    m_usersLayout->setContentsMargins(0, 0, 0, 0);
    m_usersLayout->setSpacing(8);
    m_mainLayout->addWidget(m_usersContainer);

    m_topicsTitle = new QLabel(QString::fromUtf8("TEMY FORUMA"));
    m_topicsTitle->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 12px; color: #FA6814; padding: 8px 0;");
    m_topicsTitle->hide();
    m_mainLayout->addWidget(m_topicsTitle);

    m_topicsContainer = new QWidget();
    m_topicsContainer->setStyleSheet("background: transparent;");
    m_topicsLayout = new QVBoxLayout(m_topicsContainer);
    m_topicsLayout->setContentsMargins(0, 0, 0, 0);
    m_topicsLayout->setSpacing(8);
    m_mainLayout->addWidget(m_topicsContainer);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void SearchPage::setSearchQuery(const QString &query)
{
    m_query = query;
    m_usersLoaded = false;
    m_topicsLoaded = false;

    QLayoutItem *item;
    while ((item = m_usersLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }
    while ((item = m_topicsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    if (m_query.trimmed().isEmpty()) {
        m_loadingLabel->setText(QString::fromUtf8("Vvedite zapros dlya poiska"));
        m_loadingLabel->show();
        m_usersTitle->hide();
        m_topicsTitle->hide();
        return;
    }

    performSearch();
}

void SearchPage::performSearch()
{
    m_loadingLabel->setText(QString::fromUtf8("Poisk..."));
    m_loadingLabel->show();
    m_usersTitle->hide();
    m_topicsTitle->hide();

    Application::instance()->httpClient()->get("/api/users",
        [this](const QJsonObject &resp) {
            QJsonArray users;
            if (resp.contains("users")) {
                users = resp["users"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { users = it.value().toArray(); break; }
                }
            }
            m_allUsers = users;
            m_usersLoaded = true;
            if (m_topicsLoaded) renderResults();
        },
        [this](const QString &) {
            m_usersLoaded = true;
            m_allUsers = QJsonArray();
            if (m_topicsLoaded) renderResults();
        }
    );

    Application::instance()->httpClient()->get("/api/forum",
        [this](const QJsonObject &resp) {
            QJsonArray topics;
            if (resp.contains("topics")) {
                topics = resp["topics"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { topics = it.value().toArray(); break; }
                }
            }
            m_allTopics = topics;
            m_topicsLoaded = true;
            if (m_usersLoaded) renderResults();
        },
        [this](const QString &) {
            m_topicsLoaded = true;
            m_allTopics = QJsonArray();
            if (m_usersLoaded) renderResults();
        }
    );
}

void SearchPage::renderResults()
{
    QString lower = m_query.toLower();

    QJsonArray matchedUsers;
    for (const auto &u : m_allUsers) {
        QJsonObject user = u.toObject();
        if (user.value("username").toString().toLower().contains(lower) ||
            user.value("displayName").toString().toLower().contains(lower)) {
            matchedUsers.append(user);
        }
    }

    QJsonArray matchedTopics;
    for (const auto &t : m_allTopics) {
        QJsonObject topic = t.toObject();
        if (topic.value("title").toString().toLower().contains(lower) ||
            topic.value("category").toString().toLower().contains(lower)) {
            matchedTopics.append(topic);
        }
    }

    if (matchedUsers.isEmpty() && matchedTopics.isEmpty()) {
        m_loadingLabel->setText(QString::fromUtf8("Po zaprosu \"%1\" nichego ne naydeno").arg(m_query));
        m_loadingLabel->show();
        m_usersTitle->hide();
        m_topicsTitle->hide();
        return;
    }

    m_loadingLabel->hide();

    if (!matchedUsers.isEmpty()) {
        m_usersTitle->setText(QString::fromUtf8("POL'ZOVATELI (%1)").arg(matchedUsers.size()));
        m_usersTitle->show();

        for (const auto &u : matchedUsers) {
            QJsonObject user = u.toObject();
            auto *card = new ClickableFrame();
            card->setStyleSheet(
                "QFrame { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 6px; }");
            card->setCursor(Qt::PointingHandCursor);

            auto *h = new QHBoxLayout(card);
            h->setContentsMargins(16, 12, 16, 12);
            h->setSpacing(12);

            auto *avatar = new QLabel();
            avatar->setFixedSize(40, 40);
            avatar->setStyleSheet(
                "background: #FA6814; color: #1a1a1a; border-radius: 20px; font-size: 16px; font-weight: bold;");
            avatar->setAlignment(Qt::AlignCenter);
            QString init = user.value("displayName").toString().left(1).toUpper();
            if (init.isEmpty()) init = user.value("username").toString().left(1).toUpper();
            avatar->setText(init);
            h->addWidget(avatar);

            auto *info = new QVBoxLayout();
            info->setSpacing(2);
            auto *name = new QLabel(user.value("displayName").toString());
            name->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
            info->addWidget(name);
            auto *uname = new QLabel("@" + user.value("username").toString());
            uname->setStyleSheet("color: #888; font-size: 12px;");
            info->addWidget(uname);
            h->addLayout(info, 1);

            QString uid = user.value("_id").toString();
            connect(card, &ClickableFrame::clicked, this, [uid]() {
                if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
                    w->navigateTo("/user/" + uid);
            });

            m_usersLayout->addWidget(card);
        }
    } else {
        m_usersTitle->hide();
    }

    if (!matchedTopics.isEmpty()) {
        m_topicsTitle->setText(QString::fromUtf8("TEMY (%1)").arg(matchedTopics.size()));
        m_topicsTitle->show();

        for (const auto &t : matchedTopics) {
            QJsonObject topic = t.toObject();
            auto *card = new ClickableFrame();
            card->setStyleSheet(
                "QFrame { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 6px; }");
            card->setCursor(Qt::PointingHandCursor);

            auto *h = new QHBoxLayout(card);
            h->setContentsMargins(16, 12, 16, 12);
            h->setSpacing(12);

            auto *info = new QVBoxLayout();
            info->setSpacing(4);
            auto *title = new QLabel(topic.value("title").toString());
            title->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
            title->setWordWrap(true);
            info->addWidget(title);

            QString cat = topic.value("category").toString();
            auto *meta = new QLabel(cat.isEmpty() ? QString() : cat);
            meta->setStyleSheet("color: #FA6814; font-size: 11px;");
            info->addWidget(meta);

            h->addLayout(info, 1);

            QString tid = topic.value("_id").toString();
            connect(card, &ClickableFrame::clicked, this, [tid]() {
                if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
                    w->navigateTo("/forum/" + tid);
            });

            m_topicsLayout->addWidget(card);
        }
    } else {
        m_topicsTitle->hide();
    }
}
