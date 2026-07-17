#pragma once

#include <QWidget>
#include <QTextEdit>
#include <QTimer>

class LogWindow : public QWidget {
    Q_OBJECT

public:
    static LogWindow *instance();

    void appendLog(const QString &line);

private:
    explicit LogWindow(QWidget *parent = nullptr);

    QTextEdit *m_textEdit = nullptr;
    QTimer m_flushTimer;
    QStringList m_buffer;
};
