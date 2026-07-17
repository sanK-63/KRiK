#include "ui/components/TitleBar.h"
#include <QHBoxLayout>
#include <QPushButton>
#include <QLabel>
#include <QMouseEvent>

TitleBar::TitleBar(QWidget *parent)
    : QWidget(parent)
{
    setFixedHeight(32);
    setObjectName("titleBar");

    auto *layout = new QHBoxLayout(this);
    layout->setContentsMargins(12, 0, 0, 0);
    layout->setSpacing(0);

    auto *label = new QLabel("CORPORATE PORTAL");
    label->setObjectName("titleBarLabel");
    layout->addWidget(label);

    layout->addStretch();

    auto makeBtn = [](const QString &text, bool isClose = false) {
        auto *btn = new QPushButton(text);
        btn->setFixedSize(46, 32);
        btn->setObjectName(isClose ? "titleBtnClose" : "titleBtn");
        return btn;
    };

    auto *btnMin = makeBtn("-");
    connect(btnMin, &QPushButton::clicked, this, &TitleBar::minimizeClicked);
    layout->addWidget(btnMin);

    auto *btnMax = makeBtn(QString::fromUtf8("\u25A1"));
    connect(btnMax, &QPushButton::clicked, this, &TitleBar::maximizeClicked);
    layout->addWidget(btnMax);

    auto *btnClose = makeBtn(QString::fromUtf8("\u2715"), true);
    connect(btnClose, &QPushButton::clicked, this, &TitleBar::closeClicked);
    layout->addWidget(btnClose);
}

void TitleBar::mousePressEvent(QMouseEvent *event)
{
    if (event->button() == Qt::LeftButton) {
        m_dragging = true;
        m_dragPosition = event->globalPosition().toPoint() - window()->pos();
        event->accept();
    }
}

void TitleBar::mouseMoveEvent(QMouseEvent *event)
{
    if (m_dragging && (event->buttons() & Qt::LeftButton)) {
        window()->move(event->globalPosition().toPoint() - m_dragPosition);
        event->accept();
    }
}

void TitleBar::mouseDoubleClickEvent(QMouseEvent *event)
{
    Q_UNUSED(event)
    emit maximizeClicked();
}
