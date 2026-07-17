#pragma once

#include <QWidget>
#include <QJsonArray>

class QTabWidget;
class QVBoxLayout;
class QWidget;

class ForumPage : public QWidget
{
    Q_OBJECT

public:
    explicit ForumPage(QWidget *parent = nullptr);

    void refresh();

private:
    void setupUi();
    void loadForum();
    void renderTabs(const QJsonArray &categories, const QJsonArray &topics);
    QWidget *createTopicCard(const QJsonObject &topic);
    void openCreateDialog();

    QTabWidget *m_tabWidget = nullptr;
    QVBoxLayout *m_mainLayout = nullptr;
    QWidget *m_loadingWidget = nullptr;

    QJsonArray m_categories;
    QJsonArray m_topics;
};
