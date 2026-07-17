#pragma once

#include <QFrame>
#include <QMouseEvent>

class ClickableFrame : public QFrame {
    Q_OBJECT
public:
    explicit ClickableFrame(QWidget *parent = nullptr) : QFrame(parent) {}

signals:
    void clicked();

protected:
    void mouseReleaseEvent(QMouseEvent *event) override {
        if (event->button() == Qt::LeftButton)
            emit clicked();
        QFrame::mouseReleaseEvent(event);
    }
};
