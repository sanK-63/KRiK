#pragma once

#include <QWidget>
#include <QLineEdit>
#include <QLabel>
#include <QPushButton>
#include <QListWidget>

class HeaderWidget : public QWidget {
    Q_OBJECT

public:
    explicit HeaderWidget(QWidget *parent = nullptr);

    void toggleNotifications();
    void toggleUserMenu();
    void setUnreadCount(int count);

signals:
    void sidebarToggleClicked();
    void searchSubmitted(const QString &query);
    void notificationBellClicked();
    void markAllReadClicked();
    void notificationClicked(int notificationId);

private:
    void setupUi();
    void setupNotificationsPopup();

    QLineEdit *m_searchInput = nullptr;
    QPushButton *m_notifBtn = nullptr;
    QLabel *m_badgeLabel = nullptr;
    QWidget *m_notifPopup = nullptr;
    QListWidget *m_notifList = nullptr;
    QLabel *m_notifEmptyLabel = nullptr;
};
