#pragma once

#include <QWidget>
#include <QJsonArray>
#include <QJsonObject>

class QVBoxLayout;
class QTextEdit;
class QScrollArea;

class ThreadPage : public QWidget
{
    Q_OBJECT

public:
    explicit ThreadPage(QWidget *parent = nullptr);

    void setThreadId(int id);

private slots:
    void onRouteChanged(const QString &route);

private:
    void setupUi();
    void loadThread();
    void renderThread(const QJsonObject &topic, const QJsonArray &posts);
    QWidget *createPostWidget(const QJsonObject &post);

    int m_threadId = -1;

    QScrollArea *m_scroll = nullptr;
    QVBoxLayout *m_mainLayout = nullptr;
    QVBoxLayout *m_postsLayout = nullptr;
    QWidget *m_headerWidget = nullptr;
    QWidget *m_postsContainer = nullptr;
    QWidget *m_loadingWidget = nullptr;
    QTextEdit *m_replyEdit = nullptr;
    QWidget *m_replyBar = nullptr;
};
