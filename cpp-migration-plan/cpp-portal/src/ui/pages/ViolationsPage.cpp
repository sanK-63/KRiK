#include "ui/pages/ViolationsPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include <QJsonArray>
#include <QJsonObject>
#include <QFrame>

ViolationsPage::ViolationsPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadViolations();
}

void ViolationsPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel(QString::fromUtf8("NARUSHENIYA"));
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

void ViolationsPage::loadViolations()
{
    Application::instance()->httpClient()->get("/api/admin",
        [this](const QJsonObject &resp) {
            QJsonArray violations;
            if (resp.contains("violations")) {
                violations = resp["violations"].toArray();
            } else if (resp.contains("data")) {
                violations = resp["data"].toArray();
            }

            auto *old = m_listContainer;
            m_listContainer = new QWidget();
            auto *layout = new QVBoxLayout(m_listContainer);
            layout->setContentsMargins(0, 0, 0, 0);
            layout->setSpacing(12);

            if (violations.isEmpty()) {
                auto *msg = new QLabel(QString::fromUtf8("Narushenij net"));
                msg->setAlignment(Qt::AlignCenter);
                msg->setStyleSheet("color: #888; font-size: 18px; padding: 40px;");
                layout->addWidget(msg);
            } else {
                for (const auto &v : violations) {
                    QJsonObject obj = v.toObject();
                    auto *card = new QFrame();
                    card->setStyleSheet(
                        "QFrame { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 8px; padding: 16px; }"
                    );
                    auto *cl = new QVBoxLayout(card);
                    cl->setSpacing(8);

                    auto *header = new QLabel(
                        QString::fromUtf8("%1 — %2")
                            .arg(obj["user"].toString(), obj["type"].toString())
                    );
                    header->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
                    cl->addWidget(header);

                    auto *dateLabel = new QLabel(obj["date"].toString());
                    dateLabel->setStyleSheet("color: #888; font-size: 12px;");
                    cl->addWidget(dateLabel);

                    auto *desc = new QLabel(obj["description"].toString());
                    desc->setStyleSheet("color: #F2F2F2; font-size: 13px;");
                    desc->setWordWrap(true);
                    cl->addWidget(desc);

                    layout->addWidget(card);
                }
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
