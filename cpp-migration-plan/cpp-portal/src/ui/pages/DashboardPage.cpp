#include "ui/pages/DashboardPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QGridLayout>
#include <QJsonArray>
#include <QPushButton>

DashboardPage::DashboardPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadFounders();
}

void DashboardPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(24);

    auto *about = new QLabel("Corporate Portal \u2014 Desktop Client");
    about->setAlignment(Qt::AlignCenter);
    about->setObjectName("headingLabel");
    m_mainLayout->addWidget(about);

    auto *foundersTitle = new QLabel(QString::fromUtf8("OSNOVATELI"));
    foundersTitle->setAlignment(Qt::AlignCenter);
    foundersTitle->setObjectName("headingLabel");
    m_mainLayout->addWidget(foundersTitle);

    m_foundersContainer = new QWidget();
    m_mainLayout->addWidget(m_foundersContainer);

    auto *linksTitle = new QLabel(QString::fromUtf8("BYSTRYE SSYLKI"));
    linksTitle->setAlignment(Qt::AlignCenter);
    linksTitle->setObjectName("headingLabel");
    m_mainLayout->addWidget(linksTitle);

    auto *linksGrid = new QGridLayout();
    linksGrid->setSpacing(12);

    struct Link { QString label; QString route; };
    QList<Link> links = {
        {"Forum", "/forum"}, {"Turniry", "/tournament"},
        {"Konstituciya", "/constitution"}, {"Portal", "/portal"},
        {"Soft", "/software"}, {"Taverna", "/tavern"}
    };

    int pos = 0;
    for (const auto &link : links) {
        auto *btn = new QPushButton(link.label);
        btn->setObjectName("quickLink");
        connect(btn, &QPushButton::clicked, this, [link]() {
            if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
                w->navigateTo(link.route);
        });
        linksGrid->addWidget(btn, pos / 6, pos % 6);
        pos++;
    }
    m_mainLayout->addLayout(linksGrid);

    auto *statsGrid = new QGridLayout();
    statsGrid->setSpacing(16);
    struct Stat { QString title; int value; };
    QList<Stat> stats = {
        {QString::fromUtf8("Obraweniya"), 12},
        {QString::fromUtf8("Temy foruma"), 64},
        {QString::fromUtf8("Narusheniya"), 2},
        {QString::fromUtf8("Pol'zovateli"), 0},
    };
    int sp = 0;
    for (const auto &s : stats) {
        auto *card = new QWidget();
        card->setObjectName("statCard");
        auto *cl = new QVBoxLayout(card);
        cl->setAlignment(Qt::AlignCenter);
        auto *val = new QLabel(QString::number(s.value));
        val->setAlignment(Qt::AlignCenter);
        val->setObjectName("headingLabel");
        cl->addWidget(val);
        auto *lbl = new QLabel(s.title);
        lbl->setAlignment(Qt::AlignCenter);
        lbl->setObjectName("textSecondary");
        cl->addWidget(lbl);
        statsGrid->addWidget(card, 0, sp++);
    }
    m_mainLayout->addLayout(statsGrid);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void DashboardPage::loadFounders()
{
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

            auto *grid = new QGridLayout(m_foundersContainer);
            grid->setSpacing(16);

            int col = 0;
            for (const auto &u : users) {
                QJsonObject user = u.toObject();
                auto *card = new QWidget();
                card->setObjectName("founderCard");
                auto *cl = new QVBoxLayout(card);
                cl->setAlignment(Qt::AlignCenter);

                auto *avatar = new QLabel();
                avatar->setFixedSize(120, 120);
                avatar->setObjectName("avatar");
                QString initial = user.value("displayName").toString().left(1).toUpper();
                if (initial.isEmpty()) initial = user.value("username").toString().left(1).toUpper();
                avatar->setText(initial);
                avatar->setAlignment(Qt::AlignCenter);
                cl->addWidget(avatar, 0, Qt::AlignCenter);

                auto *name = new QLabel(user.value("displayName").toString());
                name->setAlignment(Qt::AlignCenter);
                cl->addWidget(name);

                grid->addWidget(card, 0, col);
                col++;
                if (col >= 3) break;
            }
        }
    );
}
