#include "ui/pages/LogsPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"
#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QTableWidget>
#include <QHeaderView>
#include <QFrame>

LogsPage::LogsPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadLogs();
}

void LogsPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("AUDIT LOGI"));
    titleLabel->setAlignment(Qt::AlignCenter);
    titleLabel->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "padding: 16px; background: #1a1a1a; border: 1px solid #3b3b3b; border-radius: 8px;");
    m_mainLayout->addWidget(titleLabel);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_table = new QTableWidget();
    m_table->setColumnCount(4);
    m_table->setHorizontalHeaderLabels({
        QString::fromUtf8("Vremya"),
        QString::fromUtf8("Pol'zovatel"),
        QString::fromUtf8("Dejstvie"),
        QString::fromUtf8("Ob'ekt")
    });
    m_table->setEditTriggers(QTableWidget::NoEditTriggers);
    m_table->setSelectionBehavior(QTableWidget::SelectRows);
    m_table->setSelectionMode(QTableWidget::SingleSelection);
    m_table->setShowGrid(false);
    m_table->verticalHeader()->hide();
    m_table->horizontalHeader()->setStretchLastSection(true);
    m_table->horizontalHeader()->setSectionResizeMode(0, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(1, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(2, QHeaderView::ResizeToContents);
    m_table->setAlternatingRowColors(true);
    m_table->setStyleSheet(
        "QTableWidget { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 8px; gridline-color: #3b3b3b; font-size: 13px; }"
        "QTableWidget::item { padding: 8px; }"
        "QTableWidget::item:selected { background: #FA6814; color: #1a1a1a; }"
        "QTableWidget::item:alternate { background: #242424; }"
        "QHeaderView::section { background: #1a1a1a; color: #FA6814; border: none; "
        "border-bottom: 2px solid #FA6814; padding: 10px 8px; font-size: 12px; "
        "font-family: 'Press Start 2P'; }");
    m_table->hide();
    m_mainLayout->addWidget(m_table);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void LogsPage::loadLogs()
{
    m_loadingLabel->show();
    m_table->hide();

    Application::instance()->httpClient()->get("/api/admin",
        [this](const QJsonObject &resp) {
            QJsonArray logs;
            if (resp.contains("logs")) {
                logs = resp["logs"].toArray();
            } else if (resp.contains("auditLogs")) {
                logs = resp["auditLogs"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { logs = it.value().toArray(); break; }
                }
            }

            if (logs.isEmpty()) {
                m_loadingLabel->setText(QString::fromUtf8("Logi ne naydeny"));
                return;
            }

            m_loadingLabel->hide();
            m_table->show();

            m_table->setRowCount(logs.size());

            for (int i = 0; i < logs.size(); i++) {
                QJsonObject log = logs[i].toObject();

                QString timestamp = log.value("timestamp").toString();
                if (timestamp.isEmpty()) timestamp = log.value("createdAt").toString();
                timestamp = timestamp.left(19).replace("T", " ");

                QString user = log.value("userName").toString();
                if (user.isEmpty()) {
                    QJsonObject u = log.value("user").toObject();
                    user = u.value("displayName").toString();
                    if (user.isEmpty()) user = u.value("username").toString();
                }

                QString action = log.value("action").toString();
                QString entity = log.value("entity").toString();
                if (entity.isEmpty()) entity = log.value("entityType").toString();

                auto *tsItem = new QTableWidgetItem(timestamp);
                tsItem->setForeground(QColor("#888"));
                m_table->setItem(i, 0, tsItem);

                auto *userItem = new QTableWidgetItem(user);
                userItem->setForeground(QColor("#FA6814"));
                m_table->setItem(i, 1, userItem);

                auto *actionItem = new QTableWidgetItem(action);
                actionItem->setForeground(QColor("#F2F2F2"));
                m_table->setItem(i, 2, actionItem);

                auto *entityItem = new QTableWidgetItem(entity);
                entityItem->setForeground(QColor("#F2F2F2"));
                m_table->setItem(i, 3, entityItem);
            }

            m_table->resizeRowsToContents();
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}
