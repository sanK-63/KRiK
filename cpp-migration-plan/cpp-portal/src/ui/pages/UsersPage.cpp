#include "ui/pages/UsersPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLineEdit>
#include "ui/components/ClickableFrame.h"
#include <QJsonArray>

UsersPage::UsersPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadUsers();
}

void UsersPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("POL'ZOVATELI"));
    titleLabel->setAlignment(Qt::AlignCenter);
    titleLabel->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "padding: 16px; background: #1a1a1a; border: 1px solid #3b3b3b; border-radius: 8px;");
    m_mainLayout->addWidget(titleLabel);

    m_searchInput = new QLineEdit();
    m_searchInput->setPlaceholderText(QString::fromUtf8("Poisk pol'zovatelej..."));
    m_searchInput->setStyleSheet(
        "QLineEdit { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 6px; padding: 10px 16px; font-size: 14px; }"
        "QLineEdit:focus { border: 1px solid #FA6814; }");
    connect(m_searchInput, &QLineEdit::textChanged, this, &UsersPage::onSearchChanged);
    m_mainLayout->addWidget(m_searchInput);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_gridContainer = new QWidget();
    m_gridContainer->setStyleSheet("background: transparent;");
    m_gridLayout = new QGridLayout(m_gridContainer);
    m_gridLayout->setSpacing(16);
    m_gridLayout->setContentsMargins(0, 0, 0, 0);
    m_mainLayout->addWidget(m_gridContainer);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void UsersPage::loadUsers()
{
    m_loadingLabel->show();
    m_gridContainer->hide();

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
            renderUsers(m_allUsers);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void UsersPage::renderUsers(const QJsonArray &users)
{
    m_loadingLabel->hide();
    m_gridContainer->show();

    QLayoutItem *item;
    while ((item = m_gridLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    if (users.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Nichego ne naydeno"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_gridLayout->addWidget(empty, 0, 0, 1, -1);
        return;
    }

    int col = 0;
    int row = 0;
    const int maxCols = 4;

    for (const auto &u : users) {
        QJsonObject user = u.toObject();
        QString id = user.value("_id").toString();
        QString displayName = user.value("displayName").toString();
        QString username = user.value("username").toString();
        QJsonArray roles = user.value("roles").toArray();
        QString avatarUrl = user.value("avatar").toString();

        auto *card = new ClickableFrame();
        card->setObjectName("userCard");
        card->setStyleSheet(
            "QFrame#userCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#userCard:hover { border: 1px solid #FA6814; }");
        card->setCursor(Qt::PointingHandCursor);
        card->setFixedWidth(220);

        auto *cardLayout = new QVBoxLayout(card);
        cardLayout->setContentsMargins(16, 16, 16, 16);
        cardLayout->setSpacing(8);
        cardLayout->setAlignment(Qt::AlignCenter);

        auto *avatarLabel = new QLabel();
        avatarLabel->setFixedSize(64, 64);
        avatarLabel->setStyleSheet(
            "background: #FA6814; color: #1a1a1a; border-radius: 32px; "
            "font-size: 24px; font-weight: bold;");
        avatarLabel->setAlignment(Qt::AlignCenter);
        QString initial = displayName.left(1).toUpper();
        if (initial.isEmpty()) initial = username.left(1).toUpper();
        avatarLabel->setText(initial);
        cardLayout->addWidget(avatarLabel, 0, Qt::AlignCenter);

        auto *nameLabel = new QLabel(displayName.isEmpty() ? username : displayName);
        nameLabel->setAlignment(Qt::AlignCenter);
        nameLabel->setStyleSheet("color: #F2F2F2; font-size: 13px; font-weight: bold;");
        nameLabel->setWordWrap(true);
        cardLayout->addWidget(nameLabel);

        if (!username.isEmpty() && !displayName.isEmpty()) {
            auto *userLabel = new QLabel("@" + username);
            userLabel->setAlignment(Qt::AlignCenter);
            userLabel->setStyleSheet("color: #888; font-size: 11px;");
            cardLayout->addWidget(userLabel);
        }

        if (!roles.isEmpty()) {
            QStringList roleStrs;
            for (const auto &r : roles) roleStrs << r.toString();
            auto *rolesLabel = new QLabel(roleStrs.join(", "));
            rolesLabel->setAlignment(Qt::AlignCenter);
            rolesLabel->setStyleSheet("color: #FA6814; font-size: 10px;");
            rolesLabel->setWordWrap(true);
            cardLayout->addWidget(rolesLabel);
        }

        connect(card, &ClickableFrame::clicked, this, [id]() {
            if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
                w->navigateTo("/user/" + id);
        });

        m_gridLayout->addWidget(card, row, col);
        col++;
        if (col >= maxCols) { col = 0; row++; }
    }
}

void UsersPage::onSearchChanged(const QString &text)
{
    filterUsers(text);
}

void UsersPage::filterUsers(const QString &query)
{
    if (query.trimmed().isEmpty()) {
        renderUsers(m_allUsers);
        return;
    }

    QJsonArray filtered;
    QString lower = query.toLower();
    for (const auto &u : m_allUsers) {
        QJsonObject user = u.toObject();
        if (user.value("username").toString().toLower().contains(lower) ||
            user.value("displayName").toString().toLower().contains(lower)) {
            filtered.append(user);
        }
    }
    renderUsers(filtered);
}
