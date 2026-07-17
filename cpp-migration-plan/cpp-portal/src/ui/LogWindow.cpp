#include "ui/LogWindow.h"
#include <QVBoxLayout>
#include <QScrollBar>

LogWindow *LogWindow::instance()
{
    static LogWindow w;
    return &w;
}

LogWindow::LogWindow(QWidget *parent)
    : QWidget(parent)
{
    setWindowTitle("Dev Tools - Log");
    setMinimumSize(700, 400);
    resize(800, 500);
    setObjectName("logWindow");

    auto *layout = new QVBoxLayout(this);
    layout->setContentsMargins(4, 4, 4, 4);

    m_textEdit = new QTextEdit();
    m_textEdit->setReadOnly(true);
    m_textEdit->setStyleSheet(
        "QTextEdit { background: #1a1a1a; color: #e0e0e0; font-family: Consolas, monospace; "
        "font-size: 12px; border: 1px solid #333; }");
    layout->addWidget(m_textEdit);

    m_flushTimer.setInterval(200);
    connect(&m_flushTimer, &QTimer::timeout, this, [this]() {
        if (m_buffer.isEmpty()) return;
        QString text = m_buffer.join("\n");
        m_buffer.clear();
        m_textEdit->append(text);
        QScrollBar *sb = m_textEdit->verticalScrollBar();
        sb->setValue(sb->maximum());
    });
    m_flushTimer.start();
}

void LogWindow::appendLog(const QString &line)
{
    m_buffer.append(line);
    if (m_buffer.size() > 500) {
        m_buffer = m_buffer.mid(m_buffer.size() - 250);
    }
}
