#include "ui/pages/ArchivePage.h"
#include "core/Application.h"
#include "network/HttpClient.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include <QJsonArray>
#include <QJsonObject>
#include <QFrame>
#include <QPushButton>

ArchivePage::ArchivePage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadArchive();
}

void ArchivePage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel(QString::fromUtf8("ARHIV"));
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

void ArchivePage::loadArchive()
{
    Application::instance()->httpClient()->get("/api/tournaments?status=completed",
        [this](const QJsonObject &resp) {
            QJsonArray items;
            if (resp.contains("tournaments")) {
                items = resp["tournaments"].toArray();
            } else if (resp.contains("data")) {
                items = resp["data"].toArray();
            }

            auto *old = m_listContainer;
            m_listContainer = new QWidget();
            auto *layout = new QVBoxLayout(m_listContainer);
            layout->setContentsMargins(0, 0, 0, 0);
            layout->setSpacing(12);

            if (items.isEmpty()) {
                auto *msg = new QLabel(QString::fromUtf8("Arhiv pust"));
                msg->setAlignment(Qt::AlignCenter);
                msg->setStyleSheet("color: #888; font-size: 18px; padding: 40px;");
                layout->addWidget(msg);
            } else {
                for (const auto &item : items) {
                    QJsonObject obj = item.toObject();
                    auto *card = new QFrame();
                    card->setStyleSheet(
                        "QFrame { background: #2a2a2a; border: 1px solid #3b3b3b; border-radius: 8px; padding: 16px; }"
                    );
                    auto *cl = new QVBoxLayout(card);
                    cl->setSpacing(8);

                    auto *title = new QLabel(obj["title"].toString());
                    title->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
                    cl->addWidget(title);

                    auto *dateLabel = new QLabel(
                        QString::fromUtf8("Zavershen: ") + obj["completedAt"].toString()
                    );
                    dateLabel->setStyleSheet("color: #888; font-size: 12px;");
                    cl->addWidget(dateLabel);

                    auto *winner = new QLabel(
                        QString::fromUtf8("Pobeditel': ") + obj["winner"].toString()
                    );
                    winner->setStyleSheet("color: #FA6814; font-size: 13px;");
                    cl->addWidget(winner);

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
