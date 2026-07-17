#pragma once

#include <QWidget>

class QLabel;
class QVBoxLayout;
class QHBoxLayout;
class QListWidget;
class QListWidgetItem;
class QLineEdit;
class QPushButton;
class QSplitter;
class QScrollArea;
class QFrame;

class MessagesPage : public QWidget
{
    Q_OBJECT

public:
    explicit MessagesPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadConversations();
    void loadMessages(int conversationId);
    void sendMessage();
    void appendMessage(const QString &sender, const QString &content, const QString &time);

    QSplitter *m_splitter = nullptr;
    QListWidget *m_conversationList = nullptr;
    QWidget *m_chatPanel = nullptr;
    QVBoxLayout *m_chatLayout = nullptr;
    QWidget *m_messagesContainer = nullptr;
    QLabel *m_chatTitle = nullptr;
    QLineEdit *m_inputEdit = nullptr;
    QPushButton *m_sendButton = nullptr;
    QLabel *m_emptyLabel = nullptr;

    int m_activeConversationId = -1;
};
