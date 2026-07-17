#include "ui/pages/AdminPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include <QTableWidget>
#include <QHeaderView>
#include <QPushButton>
#include <QJsonObject>

AdminPage::AdminPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadUsers();
}

void AdminPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel(QString::fromUtf8("ADMIN PANEL — Pol'zovateli"));
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: #F2F2F2;");
    m_mainLayout->addWidget(heading);

    m_table = new QTableWidget();
    m_table->setColumnCount(6);
    m_table->setHorizontalHeaderLabels({
        "ID", QString::fromUtf8("Username"),
        QString::fromUtf8("Display Name"), "Email",
        "Status", "Roles"
    });
    m_table->horizontalHeader()->setStretchLastSection(true);
    m_table->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    m_table->setSelectionBehavior(QAbstractItemView::SelectRows);
    m_table->setEditTriggers(QAbstractItemView::NoEditTriggers);
    m_table->setAlternatingRowColors(true);
    m_table->setStyleSheet(
        "QTableWidget { background: #1e1e1e; color: #F2F2F2; gridline-color: #3b3b3b; border: 1px solid #3b3b3b; }"
        "QTableWidget::item { padding: 8px; }"
        "QTableWidget::item:selected { background: #FA6814; }"
        "QHeaderView::section { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; padding: 8px; }"
        "QTableWidget { alternate-background-color: #252525; }"
    );
    m_mainLayout->addWidget(m_table);

    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void AdminPage::loadUsers()
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
            populateTable(users);
        },
        [this](const QString &err) {
            auto *errLabel = new QLabel(QString::fromUtf8("Oshibka zagruzki: ") + err);
            errLabel->setStyleSheet("color: #ff4444;");
            m_mainLayout->addWidget(errLabel);
        }
    );
}

void AdminPage::populateTable(const QJsonArray &users)
{
    m_table->setRowCount(users.size());
    for (int i = 0; i < users.size(); ++i) {
        QJsonObject u = users[i].toObject();
        QString id = QString::number(u["id"].toInt());
        QString username = u["username"].toString();
        QString displayName = u["displayName"].toString();
        QString email = u["email"].toString();
        bool banned = u["banned"].toBool();
        QString status = banned ? QString::fromUtf8("Zablokirovan") : QString::fromUtf8("Aktiven");

        QStringList roles;
        auto rArr = u["roles"].toArray();
        for (const auto &r : rArr) roles << r.toString();

        auto *idItem = new QTableWidgetItem(id);
        idItem->setForeground(QColor("#888"));
        m_table->setItem(i, 0, idItem);
        m_table->setItem(i, 1, new QTableWidgetItem(username));
        m_table->setItem(i, 2, new QTableWidgetItem(displayName));
        m_table->setItem(i, 3, new QTableWidgetItem(email));

        auto *statusItem = new QTableWidgetItem(status);
        statusItem->setForeground(banned ? QColor("#ff4444") : QColor("#4caf50"));
        m_table->setItem(i, 4, statusItem);

        m_table->setItem(i, 5, new QTableWidgetItem(roles.join(", ")));

        auto *banBtn = new QPushButton(banned ? QString::fromUtf8("Razblokirovat'") : QString::fromUtf8("Zablokirovat'"));
        banBtn->setStyleSheet(QString(
            "QPushButton { background: %1; color: #F2F2F2; border: none; padding: 6px 12px; border-radius: 4px; }"
            "QPushButton:hover { opacity: 0.8; }"
        ).arg(banned ? "#4caf50" : "#ff4444"));
        int userId = u["id"].toInt();
        connect(banBtn, &QPushButton::clicked, this, [this, userId, banned]() {
            Application::instance()->httpClient()->patch(
                QString("/api/users/%1").arg(userId),
                QJsonObject{{"banned", QJsonValue(!banned)}},
                [this](const QJsonObject &) { loadUsers(); },
                [](const QString &) {}
            );
        });
        m_table->setCellWidget(i, 5, banBtn);
    }
}
