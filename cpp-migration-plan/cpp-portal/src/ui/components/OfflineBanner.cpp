#include "ui/components/OfflineBanner.h"
#include <QHBoxLayout>
#include <QLabel>

OfflineBanner::OfflineBanner(QWidget *parent)
    : QWidget(parent)
{
    setFixedHeight(32);
    setObjectName("offlineBanner");
    auto *layout = new QHBoxLayout(this);
    layout->setContentsMargins(0, 0, 0, 0);

    m_label = new QLabel("Net podklyucheniya k serveru");
    m_label->setAlignment(Qt::AlignCenter);
    m_label->setObjectName("offlineText");
    layout->addWidget(m_label);

    hide();
}

void OfflineBanner::setOffline(bool offline)
{
    setVisible(offline);
}
