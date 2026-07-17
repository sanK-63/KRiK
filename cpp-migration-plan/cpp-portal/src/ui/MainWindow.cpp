#include "ui/MainWindow.h"
#include "ui/components/TitleBar.h"
#include "ui/components/HeaderWidget.h"
#include "ui/components/SidebarWidget.h"
#include "ui/components/OfflineBanner.h"
#include "ui/pages/LoginPage.h"
#include "ui/pages/DashboardPage.h"
#include "ui/pages/ForumPage.h"
#include "ui/pages/ThreadPage.h"
#include "ui/pages/ConstitutionPage.h"
#include "ui/pages/TournamentPage.h"
#include "ui/pages/UsersPage.h"
#include "ui/pages/ProfilePage.h"
#include "ui/pages/MessagesPage.h"
#include "ui/pages/CinemaPage.h"
#include "ui/pages/EventsPage.h"
#include "ui/pages/MemesPage.h"
#include "ui/pages/TavernPage.h"
#include "ui/pages/LibraryPage.h"
#include "ui/pages/SoftwarePage.h"
#include "ui/pages/LeaderboardPage.h"
#include "ui/pages/LogsPage.h"
#include "ui/pages/SearchPage.h"
#include "ui/pages/AdminPage.h"
#include "ui/pages/FeedPage.h"
#include "ui/pages/ArchivePage.h"
#include "ui/pages/WorkersPage.h"
#include "ui/pages/ViolationsPage.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QMenu>
#include <QCloseEvent>
#include <QApplication>
#include <QFile>
#include <QShortcut>
#include "ui/LogWindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    setWindowFlag(Qt::FramelessWindowHint);
    setMinimumSize(900, 600);
    resize(1200, 800);
    setWindowTitle("Corporate Portal");
    setObjectName("mainWindow");

    setupUi();
    setupTray();
    registerPages();
    applyStyleSheet();
    navigateTo("/");

    auto *devToolsShortcut = new QShortcut(QKeySequence(Qt::Key_F12), this);
    connect(devToolsShortcut, &QShortcut::activated, this, []() {
        auto *lw = LogWindow::instance();
        if (lw->isVisible()) { lw->hide(); } else { lw->show(); lw->raise(); lw->activateWindow(); }
    });
}

MainWindow::~MainWindow() = default;

void MainWindow::setupUi()
{
    m_centralWidget = new QWidget(this);
    setCentralWidget(m_centralWidget);

    m_mainLayout = new QVBoxLayout(m_centralWidget);
    m_mainLayout->setContentsMargins(0, 0, 0, 0);
    m_mainLayout->setSpacing(0);

    m_titleBar = new TitleBar(this);
    m_mainLayout->addWidget(m_titleBar);

    m_offlineBanner = new OfflineBanner(this);
    m_mainLayout->addWidget(m_offlineBanner);

    m_header = new HeaderWidget(this);
    m_mainLayout->addWidget(m_header);

    m_contentRow = new QHBoxLayout();
    m_contentRow->setContentsMargins(0, 0, 0, 0);
    m_contentRow->setSpacing(0);

    m_sidebarContainer = new QWidget(this);
    m_sidebarContainer->setObjectName("sidebarContainer");
    m_sidebarContainer->setFixedWidth(224);
    auto *sidebarLayout = new QVBoxLayout(m_sidebarContainer);
    sidebarLayout->setContentsMargins(0, 0, 0, 0);
    m_sidebar = new SidebarWidget(this);
    sidebarLayout->addWidget(m_sidebar);
    m_contentRow->addWidget(m_sidebarContainer);

    m_contentStack = new QStackedWidget(this);
    m_contentStack->setObjectName("contentStack");
    m_contentRow->addWidget(m_contentStack, 1);

    m_mainLayout->addLayout(m_contentRow, 1);

    m_sidebarAnimation = new QPropertyAnimation(m_sidebarContainer, "maximumWidth", this);
    m_sidebarAnimation->setDuration(250);
    m_sidebarAnimation->setEasingCurve(QEasingCurve::InOutCubic);

    connect(m_titleBar, &TitleBar::minimizeClicked, this, &MainWindow::showMinimized);
    connect(m_titleBar, &TitleBar::maximizeClicked, this, [this]() {
        isMaximized() ? showNormal() : showMaximized();
    });
    connect(m_titleBar, &TitleBar::closeClicked, this, &MainWindow::close);
    connect(m_header, &HeaderWidget::sidebarToggleClicked, this, [this]() {
        setSidebarOpen(!m_sidebarOpen);
    });
    connect(m_header, &HeaderWidget::searchSubmitted, this, [this](const QString &q) {
        navigateTo("/search?q=" + q);
    });
}

void MainWindow::setupTray()
{
    m_trayIcon = new QSystemTrayIcon(this);
    m_trayIcon->setToolTip("Corporate Portal");

    auto *trayMenu = new QMenu(this);
    trayMenu->addAction("Show", this, [this]() { show(); raise(); activateWindow(); });
    trayMenu->addSeparator();
    trayMenu->addAction("Quit", qApp, &QApplication::quit);

    m_trayIcon->setContextMenu(trayMenu);
    connect(m_trayIcon, &QSystemTrayIcon::activated, this, [this](QSystemTrayIcon::ActivationReason r) {
        if (r == QSystemTrayIcon::DoubleClick) { show(); raise(); activateWindow(); }
    });
    m_trayIcon->show();
}

void MainWindow::registerPages()
{
    auto add = [this](const QString &route, QWidget *page) {
        m_routeToIndex[route] = m_contentStack->addWidget(page);
    };

    add("/login",        new LoginPage(this));
    add("/",             new DashboardPage(this));
    add("/feed",         new FeedPage(this));
    add("/constitution", new ConstitutionPage(this));
    add("/forum",        new ForumPage(this));
    add("/forum/:id",    new ThreadPage(this));
    add("/events",       new EventsPage(this));
    add("/workers",      new WorkersPage(this));
    add("/portal",       new QWidget(this));
    add("/software",     new SoftwarePage(this));
    add("/tournament",   new TournamentPage(this));
    add("/cinema",       new CinemaPage(this));
    add("/tavern",       new TavernPage(this));
    add("/memes",        new MemesPage(this));
    add("/leaderboard",  new LeaderboardPage(this));
    add("/library",      new LibraryPage(this));
    add("/archive",      new ArchivePage(this));
    add("/messages",     new MessagesPage(this));
    add("/users",        new UsersPage(this));
    add("/user/:id",     new ProfilePage(this));
    add("/profile",      new ProfilePage(this));
    add("/logs",         new LogsPage(this));
    add("/admin",        new AdminPage(this));
    add("/search",       new SearchPage(this));
    add("/violations",   new ViolationsPage(this));
}

void MainWindow::applyStyleSheet()
{
    QFile qss(":/portal.qss");
    if (qss.open(QIODevice::ReadOnly | QIODevice::Text)) {
        setStyleSheet(QString::fromUtf8(qss.readAll()));
        qss.close();
    }
}

void MainWindow::navigateTo(const QString &route)
{
    QString cleanRoute = route.split('?').first();

    if (m_routeToIndex.contains(cleanRoute)) {
        m_contentStack->setCurrentIndex(m_routeToIndex[cleanRoute]);
    } else {
        QString prefix = cleanRoute.section('/', 0, 1);
        if (m_routeToIndex.contains(prefix)) {
            m_contentStack->setCurrentIndex(m_routeToIndex[prefix]);
        }
    }

    m_currentRoute = cleanRoute;
    emit routeChanged(cleanRoute);
}

void MainWindow::showLogin()
{
    m_sidebarContainer->hide();
    m_header->hide();
    navigateTo("/login");
}

void MainWindow::showMainContent()
{
    m_sidebarContainer->show();
    m_header->show();
    navigateTo("/");
}

void MainWindow::updateUnreadCount(int count)
{
    m_header->setUnreadCount(count);
    if (count > 0 && m_trayIcon && m_trayIcon->isVisible()) {
        m_trayIcon->showMessage("Corporate Portal",
            QString("%1 novyh uvedomlenij").arg(count),
            QSystemTrayIcon::Information, 3000);
    }
}

void MainWindow::setSidebarOpen(bool open)
{
    if (m_sidebarOpen == open) return;
    m_sidebarOpen = open;

    m_sidebarAnimation->stop();
    m_sidebarAnimation->setStartValue(m_sidebarContainer->width());
    m_sidebarAnimation->setEndValue(open ? 224 : 0);
    m_sidebarAnimation->start();
}

void MainWindow::closeEvent(QCloseEvent *event)
{
    event->ignore();
    hide();
}
