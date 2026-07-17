#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;

class EventsPage : public QWidget
{
    Q_OBJECT

public:
    explicit EventsPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadEvents();
    void renderEvents(const QJsonArray &events);
    void showCreateDialog();

    QVBoxLayout *m_mainLayout = nullptr;
    QVBoxLayout *m_cardsLayout = nullptr;
    QWidget *m_cardsContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
};
