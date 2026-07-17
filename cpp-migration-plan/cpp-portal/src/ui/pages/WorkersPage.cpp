#include "ui/pages/WorkersPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include <QJsonArray>
#include <QJsonObject>
#include <QFrame>
#include <QMouseEvent>

// --- WorkerCard ---

class WorkerCard : public QFrame {
public:
    WorkerCard(int userId, const QString &displayName, const QString &initial, const QStringList &roles)
    {
        setCursor(Qt::PointingHandCursor);
        setStyleSheet(
            "WorkerCard { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 8px; padding: 16px; }"
            "WorkerCard:hover { border-color: #FA6814; }"
        );
        auto *hl = new QVBoxLayout(this);
        hl->setSpacing(8);

        auto *avatar = new QLabel();
        avatar->setFixedSize(48, 48);
        avatar->setAlignment(Qt::AlignCenter);
        avatar->setStyleSheet(
            "background: #3b3b3b; border-radius: 24px; font-size: 20px; color: #F2F2F2;"
        );
        avatar->setText(initial);
        hl->addWidget(avatar, 0, Qt::AlignLeft);

        auto *name = new QLabel(displayName);
        name->setStyleSheet("color: #F2F2F2; font-size: 16px; font-weight: bold;");
        hl->addWidget(name);

        auto *rolesLabel = new QLabel(roles.join(", "));
        rolesLabel->setStyleSheet("color: #888; font-size: 12px;");
        hl->addWidget(rolesLabel);

        m_userId = userId;
    }

protected:
    void mousePressEvent(QMouseEvent *event) override {
        QFrame::mousePressEvent(event);
        if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
            w->navigateTo(QString("/user/%1").arg(m_userId));
    }

private:
    int m_userId;
};

// --- WorkersPage ---

WorkersPage::WorkersPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadWorkers();
}

void WorkersPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel(QString::fromUtf8("RABOTYAGI"));
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: #F2F2F2;");
    m_mainLayout->addWidget(heading);

    m_listContainer = new QWidget();
    m_mainLayout->addWidget(m_listContainer);
    m_mainLayout->addStretch();

    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void WorkersPage::loadWorkers()
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

            auto *old = m_listContainer;
            m_listContainer = new QWidget();
            auto *layout = new QVBoxLayout(m_listContainer);
            layout->setContentsMargins(0, 0, 0, 0);
            layout->setSpacing(12);

            for (const auto &u : users) {
                QJsonObject user = u.toObject();
                QString displayName = user["displayName"].toString();
                QString initial = displayName.left(1).toUpper();
                if (initial.isEmpty()) initial = user["username"].toString().left(1).toUpper();

                QStringList roles;
                auto rArr = user["roles"].toArray();
                for (const auto &r : rArr) roles << r.toString();

                auto *card = new WorkerCard(
                    user["id"].toInt(), displayName, initial, roles
                );
                layout->addWidget(card);
            }

            auto *outerLayout = qobject_cast<QVBoxLayout *>(old->parentWidget()->layout());
            if (outerLayout) {
                int idx = outerLayout->indexOf(old);
                outerLayout->insertWidget(idx, m_listContainer);
            }
            delete old;
        },
        [this](const QString &err) {
            auto *errLabel = new QLabel(QString::fromUtf8("Oshibka: ") + err);
            errLabel->setStyleSheet("color: #ff4444;");
            m_mainLayout->addWidget(errLabel);
        }
    );
}
