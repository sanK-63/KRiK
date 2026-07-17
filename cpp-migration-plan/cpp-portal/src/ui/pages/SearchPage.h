#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;

class SearchPage : public QWidget
{
    Q_OBJECT

public:
    explicit SearchPage(QWidget *parent = nullptr);

    void setSearchQuery(const QString &query);
    QString searchQuery() const { return m_query; }

private:
    void setupUi();
    void performSearch();
    void renderResults();

    QVBoxLayout *m_mainLayout = nullptr;
    QVBoxLayout *m_usersLayout = nullptr;
    QVBoxLayout *m_topicsLayout = nullptr;
    QWidget *m_usersContainer = nullptr;
    QWidget *m_topicsContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
    QLabel *m_usersTitle = nullptr;
    QLabel *m_topicsTitle = nullptr;

    QString m_query;
    QJsonArray m_allUsers;
    QJsonArray m_allTopics;
    bool m_usersLoaded = false;
    bool m_topicsLoaded = false;
};
