#include "ui/pages/LeaderboardPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include <QTableWidget>
#include <QHeaderView>
#include <QJsonArray>
#include <QJsonObject>

LeaderboardPage::LeaderboardPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadLeaderboard();
}

void LeaderboardPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);

    auto *content = new QWidget();
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel(QString::fromUtf8("LEADERBOARD"));
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: #F2F2F2;");
    m_mainLayout->addWidget(heading);

    m_table = new QTableWidget();
    m_table->setColumnCount(5);
    m_table->setHorizontalHeaderLabels({"#", "Player", "ELO", "Wins", "Losses"});
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

void LeaderboardPage::loadLeaderboard()
{
    Application::instance()->httpClient()->get("/api/elo",
        [this](const QJsonObject &resp) {
            QJsonArray entries;
            if (resp.contains("entries")) {
                entries = resp["entries"].toArray();
            } else if (resp.contains("data")) {
                entries = resp["data"].toArray();
            } else if (resp.contains("leaderboard")) {
                entries = resp["leaderboard"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { entries = it.value().toArray(); break; }
                }
            }

            m_table->setRowCount(entries.size());
            for (int i = 0; i < entries.size(); ++i) {
                QJsonObject e = entries[i].toObject();
                int rank = i + 1;
                QString player = e["username"].toString();
                if (e.contains("displayName")) player = e["displayName"].toString();
                int elo = e["elo"].toInt();
                int wins = e["wins"].toInt();
                int losses = e["losses"].toInt();

                auto *rankItem = new QTableWidgetItem(QString::number(rank));
                rankItem->setForeground(QColor("#888"));
                rankItem->setTextAlignment(Qt::AlignCenter);
                m_table->setItem(i, 0, rankItem);

                m_table->setItem(i, 1, new QTableWidgetItem(player));

                auto *eloItem = new QTableWidgetItem(QString::number(elo));
                eloItem->setTextAlignment(Qt::AlignCenter);
                QColor eloColor;
                if (elo > 1200) eloColor = QColor("#4caf50");
                else if (elo >= 1000) eloColor = QColor("#ffeb3b");
                else eloColor = QColor("#ff4444");
                eloItem->setForeground(eloColor);
                m_table->setItem(i, 2, eloItem);

                auto *winsItem = new QTableWidgetItem(QString::number(wins));
                winsItem->setTextAlignment(Qt::AlignCenter);
                m_table->setItem(i, 3, winsItem);

                auto *lossesItem = new QTableWidgetItem(QString::number(losses));
                lossesItem->setTextAlignment(Qt::AlignCenter);
                m_table->setItem(i, 4, lossesItem);
            }
        },
        [this](const QString &err) {
            auto *errLabel = new QLabel(QString::fromUtf8("Oshibka zagruzki: ") + err);
            errLabel->setStyleSheet("color: #ff4444;");
            m_mainLayout->addWidget(errLabel);
        }
    );
}
