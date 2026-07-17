#pragma once

#include <QWidget>

class QLabel;

class OfflineBanner : public QWidget {
    Q_OBJECT

public:
    explicit OfflineBanner(QWidget *parent = nullptr);
    void setOffline(bool offline);

private:
    QLabel *m_label;
};
