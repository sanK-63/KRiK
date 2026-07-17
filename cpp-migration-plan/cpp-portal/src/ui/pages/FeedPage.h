#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;

class FeedPage : public QWidget
{
    Q_OBJECT

public:
    explicit FeedPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadFeed();
    void renderTopics(const QJsonArray &topics);

    QVBoxLayout *m_mainLayout = nullptr;
    QVBoxLayout *m_cardsLayout = nullptr;
    QWidget *m_cardsContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
};
