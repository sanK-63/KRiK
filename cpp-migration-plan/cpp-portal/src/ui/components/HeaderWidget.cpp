#include "ui/components/HeaderWidget.h"
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QPushButton>
#include <QLabel>
#include <QLineEdit>
#include <QListWidget>
#include <QFrame>
#include <QScrollBar>

HeaderWidget::HeaderWidget(QWidget *parent)
    : QWidget(parent)
{
    setFixedHeight(56);
    setObjectName("header");
    setupUi();
    setupNotificationsPopup();
}

void HeaderWidget::setupUi()
{
    auto *layout = new QHBoxLayout(this);
    layout->setContentsMargins(16, 0, 16, 0);

    auto *sidebarToggle = new QPushButton(QString::fromUtf8("\u2630"));
    sidebarToggle->setFixedSize(32, 32);
    sidebarToggle->setObjectName("sidebarToggle");
    connect(sidebarToggle, &QPushButton::clicked, this, &HeaderWidget::sidebarToggleClicked);
    layout->addWidget(sidebarToggle);

    auto *logo = new QLabel("Piga i Kopyta");
    logo->setObjectName("headerLogo");
    layout->addWidget(logo);

    layout->addStretch();

    m_searchInput = new QLineEdit();
    m_searchInput->setPlaceholderText("Poisk...");
    m_searchInput->setObjectName("searchInput");
    m_searchInput->setFixedWidth(288);
    connect(m_searchInput, &QLineEdit::returnPressed, this, [this]() {
        emit searchSubmitted(m_searchInput->text());
    });
    layout->addWidget(m_searchInput);

    auto *notifContainer = new QWidget();
    auto *notifLayout = new QVBoxLayout(notifContainer);
    notifLayout->setContentsMargins(0, 0, 0, 0);
    notifLayout->setAlignment(Qt::AlignCenter);

    m_notifBtn = new QPushButton(QString::fromUtf8("\U0001F514"));
    m_notifBtn->setFixedSize(32, 32);
    m_notifBtn->setObjectName("notifBtn");
    connect(m_notifBtn, &QPushButton::clicked, this, [this]() {
        toggleNotifications();
        emit notificationBellClicked();
    });
    notifLayout->addWidget(m_notifBtn);

    m_badgeLabel = new QLabel("0", notifContainer);
    m_badgeLabel->setObjectName("notifBadge");
    m_badgeLabel->setFixedSize(18, 18);
    m_badgeLabel->setAlignment(Qt::AlignCenter);
    m_badgeLabel->setStyleSheet(
        "background: #ff4444; color: white; border-radius: 9px; font-size: 10px; font-weight: bold;");
    m_badgeLabel->hide();
    m_badgeLabel->move(22, -2);

    layout->addWidget(notifContainer);
}

void HeaderWidget::setupNotificationsPopup()
{
    m_notifPopup = new QWidget(this);
    m_notifPopup->setObjectName("notifPopup");
    m_notifPopup->setFixedSize(360, 400);
    m_notifPopup->hide();

    auto *popupLayout = new QVBoxLayout(m_notifPopup);
    popupLayout->setContentsMargins(0, 0, 0, 0);
    popupLayout->setSpacing(0);

    auto *headerRow = new QHBoxLayout();
    headerRow->setContentsMargins(16, 12, 16, 8);

    auto *title = new QLabel(QString::fromUtf8("Uvedomleniya"));
    title->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
    headerRow->addWidget(title);
    headerRow->addStretch();

    auto *markAllBtn = new QPushButton(QString::fromUtf8("Otmeit' vse"));
    markAllBtn->setStyleSheet("color: #FA6814; font-size: 12px; border: none; background: transparent;");
    connect(markAllBtn, &QPushButton::clicked, this, &HeaderWidget::markAllReadClicked);
    headerRow->addWidget(markAllBtn);

    popupLayout->addLayout(headerRow);

    auto *line = new QFrame();
    line->setFrameShape(QFrame::HLine);
    line->setStyleSheet("background: #3b3b3b;");
    line->setFixedHeight(1);
    popupLayout->addWidget(line);

    m_notifList = new QListWidget();
    m_notifList->setObjectName("notifList");
    m_notifList->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    m_notifList->verticalScrollBar()->setStyleSheet(
        "QScrollBar:vertical { width: 6px; background: transparent; }"
        "QScrollBar::handle:vertical { background: #555; border-radius: 3px; min-height: 30px; }");
    popupLayout->addWidget(m_notifList, 1);

    m_notifEmptyLabel = new QLabel(QString::fromUtf8("Net uvedomlenij"));
    m_notifEmptyLabel->setAlignment(Qt::AlignCenter);
    m_notifEmptyLabel->setStyleSheet("color: #888; font-size: 13px; padding: 40px;");
    popupLayout->addWidget(m_notifEmptyLabel);
    m_notifEmptyLabel->hide();
}

void HeaderWidget::toggleNotifications()
{
    if (m_notifPopup->isVisible()) {
        m_notifPopup->hide();
    } else {
        QPoint btnPos = m_notifBtn->mapToGlobal(QPoint(0, m_notifBtn->height()));
        m_notifPopup->move(btnPos.x() - m_notifPopup->width() + m_notifBtn->width(), btnPos.y());
        m_notifPopup->show();
        m_notifPopup->raise();
    }
}

void HeaderWidget::toggleUserMenu() {}

void HeaderWidget::setUnreadCount(int count)
{
    if (count > 0) {
        m_badgeLabel->show();
        m_badgeLabel->setText(count > 99 ? "99+" : QString::number(count));
    } else {
        m_badgeLabel->hide();
    }
}
