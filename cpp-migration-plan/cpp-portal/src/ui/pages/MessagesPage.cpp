#include "ui/pages/MessagesPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "network/AuthInterceptor.h"
#include "ui/MainWindow.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QScrollArea>
#include <QSplitter>
#include <QListWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QFrame>
#include <QJsonArray>
#include <QJsonObject>
#include <QScrollBar>
#include <QDateTime>

static const QString ACCENT = "#FA6814";
static const QString BG = "#2a2a2a";
static const QString BORDER = "#3b3b3b";
static const QString SECONDARY = "#888";
static const QString PRIMARY = "#F2F2F2";

MessagesPage::MessagesPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadConversations();
}

void MessagesPage::setupUi()
{
    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);

    auto *heading = new QLabel("SOOBSCHENIYA");
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: " + PRIMARY + "; padding: 12px 24px 0 24px;");
    outer->addWidget(heading);

    m_splitter = new QSplitter(Qt::Horizontal);
    m_splitter->setStyleSheet(
        "QSplitter::handle { background: " + BORDER + "; width: 1px; }"
    );
    m_splitter->setHandleWidth(1);

    auto *listPanel = new QWidget();
    listPanel->setStyleSheet("background: " + BG + ";");
    auto *listLayout = new QVBoxLayout(listPanel);
    listLayout->setContentsMargins(0, 0, 0, 0);
    listLayout->setSpacing(0);

    m_conversationList = new QListWidget();
    m_conversationList->setFrameShape(QFrame::NoFrame);
    m_conversationList->setStyleSheet(
        "QListWidget { background: " + BG + "; color: " + PRIMARY + "; border: none; }"
        "QListWidget::item { padding: 12px 16px; border-bottom: 1px solid " + BORDER + "; }"
        "QListWidget::item:selected { background: #353535; }"
        "QListWidget::item:hover { background: #333333; }"
    );
    connect(m_conversationList, &QListWidget::currentRowChanged, this, [this](int row) {
        if (row < 0) return;
        auto *item = m_conversationList->item(row);
        int convId = item->data(Qt::UserRole).toInt();
        m_activeConversationId = convId;
        m_chatTitle->setText(item->text());
        loadMessages(convId);
    });
    listLayout->addWidget(m_conversationList);

    m_splitter->addWidget(listPanel);

    m_chatPanel = new QWidget();
    m_chatPanel->setStyleSheet("background: #242424;");
    m_chatLayout = new QVBoxLayout(m_chatPanel);
    m_chatLayout->setContentsMargins(0, 0, 0, 0);
    m_chatLayout->setSpacing(0);

    auto *chatHeader = new QFrame();
    chatHeader->setStyleSheet("background: " + BG + "; border-bottom: 1px solid " + BORDER + "; padding: 12px 16px;");
    auto *chatHeaderLayout = new QHBoxLayout(chatHeader);
    chatHeaderLayout->setContentsMargins(16, 12, 16, 12);
    m_chatTitle = new QLabel("Vyberite besedu");
    m_chatTitle->setStyleSheet("color: " + PRIMARY + "; font-size: 15px; font-weight: bold;");
    chatHeaderLayout->addWidget(m_chatTitle);
    chatHeaderLayout->addStretch();
    m_chatLayout->addWidget(chatHeader);

    auto *messagesScroll = new QScrollArea();
    messagesScroll->setWidgetResizable(true);
    messagesScroll->setFrameShape(QFrame::NoFrame);
    messagesScroll->setStyleSheet("background: #242424;");

    m_messagesContainer = new QWidget();
    m_messagesContainer->setStyleSheet("background: #242424;");
    auto *msgLayout = new QVBoxLayout(m_messagesContainer);
    msgLayout->setContentsMargins(16, 16, 16, 16);
    msgLayout->setSpacing(8);
    msgLayout->addStretch();

    m_emptyLabel = new QLabel("Vyberite besedu dlya prosmotra soobschenij");
    m_emptyLabel->setAlignment(Qt::AlignCenter);
    m_emptyLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 14px;");
    msgLayout->addWidget(m_emptyLabel);

    messagesScroll->setWidget(m_messagesContainer);
    m_chatLayout->addWidget(messagesScroll, 1);

    auto *inputBar = new QFrame();
    inputBar->setStyleSheet("background: " + BG + "; border-top: 1px solid " + BORDER + ";");
    auto *inputLayout = new QHBoxLayout(inputBar);
    inputLayout->setContentsMargins(16, 12, 16, 12);
    inputLayout->setSpacing(8);

    m_inputEdit = new QLineEdit();
    m_inputEdit->setPlaceholderText("Napishite soobschenie...");
    m_inputEdit->setStyleSheet(
        "QLineEdit { background: #353535; color: " + PRIMARY + "; border: 1px solid " + BORDER + "; border-radius: 6px; padding: 10px 14px; font-size: 13px; }"
        "QLineEdit:focus { border-color: " + ACCENT + "; }"
    );
    connect(m_inputEdit, &QLineEdit::returnPressed, this, &MessagesPage::sendMessage);
    inputLayout->addWidget(m_inputEdit, 1);

    m_sendButton = new QPushButton("Otpravit");
    m_sendButton->setStyleSheet(
        "QPushButton { background: " + ACCENT + "; color: #fff; border: none; border-radius: 6px; padding: 10px 20px; font-size: 13px; font-weight: bold; }"
        "QPushButton:hover { background: #e05a0e; }"
        "QPushButton:pressed { background: #c44f0c; }"
    );
    connect(m_sendButton, &QPushButton::clicked, this, &MessagesPage::sendMessage);
    inputLayout->addWidget(m_sendButton);

    m_chatLayout->addWidget(inputBar);

    m_splitter->addWidget(m_chatPanel);
    m_splitter->setStretchFactor(0, 0);
    m_splitter->setStretchFactor(1, 1);
    m_splitter->setSizes({250, 750});

    outer->addWidget(m_splitter, 1);
}

void MessagesPage::loadConversations()
{
    Application::instance()->httpClient()->get("/api/messages",
        [this](const QJsonObject &resp) {
            QJsonArray conversations;
            if (resp.contains("conversations")) {
                conversations = resp["conversations"].toArray();
            } else if (resp.contains("data")) {
                conversations = resp["data"].toArray();
            } else if (resp.contains("messages")) {
                conversations = resp["messages"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { conversations = it.value().toArray(); break; }
                }
            }

            if (conversations.isEmpty()) {
                m_emptyLabel->setText("Net soobschenij");
                m_emptyLabel->show();
                return;
            }

            m_conversationList->clear();
            for (const auto &c : conversations) {
                QJsonObject conv = c.toObject();
                int id = conv["id"].toInt();
                QString title = conv["title"].toString();
                if (title.isEmpty()) title = conv["name"].toString();
                if (title.isEmpty()) title = QString("Beseda #%1").arg(id);

                QString lastMsg;
                if (conv.contains("lastMessage")) {
                    QJsonObject lm = conv["lastMessage"].toObject();
                    lastMsg = lm["content"].toString();
                } else if (conv.contains("preview")) {
                    lastMsg = conv["preview"].toString();
                } else if (conv.contains("last_message")) {
                    lastMsg = conv["last_message"].toString();
                }

                QString timeStr;
                if (conv.contains("updatedAt")) {
                    timeStr = conv["updatedAt"].toString();
                } else if (conv.contains("updated_at")) {
                    timeStr = conv["updated_at"].toString();
                }

                auto *item = new QListWidgetItem();
                item->setData(Qt::UserRole, id);

                auto *widget = new QWidget();
                auto *vLayout = new QVBoxLayout(widget);
                vLayout->setContentsMargins(4, 4, 4, 4);
                vLayout->setSpacing(2);

                auto *titleRow = new QHBoxLayout();
                auto *titleLabel = new QLabel(title);
                titleLabel->setStyleSheet("color: " + PRIMARY + "; font-size: 13px; font-weight: bold;");
                titleRow->addWidget(titleLabel);
                titleRow->addStretch();

                if (!timeStr.isEmpty()) {
                    auto *timeLabel = new QLabel(timeStr);
                    timeLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 10px;");
                    titleRow->addWidget(timeLabel);
                }
                vLayout->addLayout(titleRow);

                if (!lastMsg.isEmpty()) {
                    auto *previewLabel = new QLabel(lastMsg);
                    previewLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 12px;");
                    previewLabel->setMaximumWidth(220);
                    vLayout->addWidget(previewLabel);
                }

                item->setSizeHint(QSize(0, lastMsg.isEmpty() ? 40 : 60));
                m_conversationList->addItem(item);
                m_conversationList->setItemWidget(item, widget);
            }
        },
        [this](const QString &err) {
            m_emptyLabel->setText("Oshibka: " + err);
            m_emptyLabel->show();
        }
    );
}

void MessagesPage::loadMessages(int conversationId)
{
    QLayoutItem *child;
    while ((child = m_messagesContainer->layout()->takeAt(0)) != nullptr) {
        if (child->widget()) child->widget()->deleteLater();
        delete child;
    }
    static_cast<QVBoxLayout*>(m_messagesContainer->layout())->addStretch();

    QString path = QString("/api/messages/%1").arg(conversationId);
    Application::instance()->httpClient()->get(path,
        [this](const QJsonObject &resp) {
            QJsonArray messages;
            if (resp.contains("messages")) {
                messages = resp["messages"].toArray();
            } else if (resp.contains("data")) {
                messages = resp["data"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { messages = it.value().toArray(); break; }
                }
            }

            for (const auto &m : messages) {
                QJsonObject msg = m.toObject();
                QString sender = msg["sender"].toString();
                if (sender.isEmpty()) {
                    QJsonObject senderObj = msg["sender"].toObject();
                    sender = senderObj["displayName"].toString(senderObj["username"].toString());
                }
                QString content = msg["content"].toString();
                if (content.isEmpty()) content = msg["text"].toString();
                QString time = msg["createdAt"].toString();
                if (time.isEmpty()) time = msg["created_at"].toString();
                if (time.isEmpty()) time = msg["time"].toString();
                appendMessage(sender, content, time);
            }
        },
        [this](const QString &err) {
            appendMessage("", "Oshibka zagruzki: " + err, "");
        }
    );
}

void MessagesPage::appendMessage(const QString &sender, const QString &content, const QString &time)
{
    auto *card = new QFrame();
    card->setStyleSheet(
        "QFrame { background: " + BG + "; border: 1px solid " + BORDER + "; border-radius: 8px; padding: 10px 14px; }"
    );
    auto *layout = new QVBoxLayout(card);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(4);

    auto *headerRow = new QHBoxLayout();
    auto *senderLabel = new QLabel(sender);
    senderLabel->setStyleSheet("color: " + ACCENT + "; font-size: 13px; font-weight: bold;");
    headerRow->addWidget(senderLabel);
    headerRow->addStretch();

    if (!time.isEmpty()) {
        auto *timeLabel = new QLabel(time);
        timeLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 10px;");
        headerRow->addWidget(timeLabel);
    }
    layout->addLayout(headerRow);

    auto *contentLabel = new QLabel(content);
    contentLabel->setWordWrap(true);
    contentLabel->setStyleSheet("color: " + PRIMARY + "; font-size: 13px;");
    layout->addWidget(contentLabel);

    m_messagesContainer->layout()->addWidget(card);

    auto *scroll = qobject_cast<QScrollArea *>(m_chatPanel->findChild<QScrollArea *>());
    if (scroll && scroll->viewport()) {
        QScrollBar *sb = scroll->verticalScrollBar();
        sb->setValue(sb->maximum());
    }
}

void MessagesPage::sendMessage()
{
    QString text = m_inputEdit->text().trimmed();
    if (text.isEmpty() || m_activeConversationId < 0) return;

    QJsonObject body;
    body["content"] = text;

    QString path = QString("/api/messages/%1").arg(m_activeConversationId);
    Application::instance()->httpClient()->post(path, body,
        [this, text](const QJsonObject &resp) {
            QString time = QDateTime::currentDateTime().toString("yyyy-MM-dd HH:mm");
            QString sender = Application::instance()->authManager()->user()["displayName"].toString();
            appendMessage(sender, text, time);
            m_inputEdit->clear();
        },
        [this](const QString &err) {
            appendMessage("", "Oshibka otpravki: " + err, "");
        }
    );
}
