#pragma once

#include <QMainWindow>
#include <QStackedWidget>
#include <QPropertyAnimation>
#include <QSystemTrayIcon>
#include <QMap>
#include <QVBoxLayout>
#include <QHBoxLayout>

class TitleBar;
class HeaderWidget;
class SidebarWidget;
class OfflineBanner;

class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

public slots:
    void navigateTo(const QString &route);
    void showLogin();
    void showMainContent();
    void updateUnreadCount(int count);

signals:
    void routeChanged(const QString &route);

protected:
    void closeEvent(QCloseEvent *event) override;

private:
    void setupUi();
    void setupTray();
    void applyStyleSheet();
    void registerPages();
    void setSidebarOpen(bool open);

    QString m_currentRoute;
    bool m_sidebarOpen = true;

    QWidget *m_centralWidget = nullptr;
    QVBoxLayout *m_mainLayout = nullptr;
    TitleBar *m_titleBar = nullptr;
    OfflineBanner *m_offlineBanner = nullptr;
    HeaderWidget *m_header = nullptr;
    QHBoxLayout *m_contentRow = nullptr;
    SidebarWidget *m_sidebar = nullptr;
    QWidget *m_sidebarContainer = nullptr;
    QStackedWidget *m_contentStack = nullptr;
    QPropertyAnimation *m_sidebarAnimation = nullptr;
    QSystemTrayIcon *m_trayIcon = nullptr;

    QMap<QString, int> m_routeToIndex;
};
