#pragma once

#include <QWidget>
#include <QListWidget>

class SidebarWidget : public QWidget {
    Q_OBJECT

public:
    explicit SidebarWidget(QWidget *parent = nullptr);

signals:
    void routeSelected(const QString &route);

private:
    void setupUi();
    void onItemClicked(int index);

    QListWidget *m_list;
    QStringList m_routes;
};
