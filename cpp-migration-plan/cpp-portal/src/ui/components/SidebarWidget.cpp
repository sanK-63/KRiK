#include "ui/components/SidebarWidget.h"
#include "ui/MainWindow.h"
#include <QVBoxLayout>

SidebarWidget::SidebarWidget(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
}

void SidebarWidget::setupUi()
{
    auto *layout = new QVBoxLayout(this);
    layout->setContentsMargins(0, 24, 0, 0);

    m_list = new QListWidget(this);
    m_list->setObjectName("sidebarList");
    m_list->setFrameShape(QFrame::NoFrame);

    struct NavItem { QString route; QString label; };

    QList<NavItem> items = {
        {"/", QString::fromUtf8("O nas")},
        {"/feed", QString::fromUtf8("Lenta")},
        {"/constitution", QString::fromUtf8("Konstituciya")},
        {"/forum", QString::fromUtf8("Forum")},
        {"/events", QString::fromUtf8("Iventy")},
        {"/workers", QString::fromUtf8("Rabotyagi")},
        {"/portal", QString::fromUtf8("Portal")},
        {"/software", QString::fromUtf8("Soft")},
        {"/tournament", QString::fromUtf8("Turniry")},
        {"/cinema", QString::fromUtf8("Kinoteka")},
        {"/tavern", QString::fromUtf8("Taverna")},
        {"/memes", QString::fromUtf8("Memy")},
        {"/leaderboard", QString::fromUtf8("Lidery")},
        {"/library", QString::fromUtf8("Biblioteka")},
        {"/archive", QString::fromUtf8("Arhiv")},
        {"/messages", QString::fromUtf8("Soobscheniya")},
    };

    for (const auto &item : items) {
        m_routes.append(item.route);
        auto *widget = new QListWidgetItem(item.label);
        widget->setData(Qt::UserRole, item.route);
        m_list->addItem(widget);
    }

    connect(m_list, &QListWidget::currentRowChanged, this, &SidebarWidget::onItemClicked);
    layout->addWidget(m_list);
}

void SidebarWidget::onItemClicked(int index)
{
    if (index < 0 || index >= m_routes.size()) return;
    MainWindow *mainWin = qobject_cast<MainWindow *>(window());
    if (mainWin) {
        mainWin->navigateTo(m_routes[index]);
    }
    emit routeSelected(m_routes[index]);
}
