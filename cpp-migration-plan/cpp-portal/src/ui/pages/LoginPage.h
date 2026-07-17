#pragma once

#include <QWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QProgressBar>
#include <QLabel>

class LoginPage : public QWidget {
    Q_OBJECT

public:
    explicit LoginPage(QWidget *parent = nullptr);

signals:
    void loginSuccess();

private slots:
    void handleLogin();

private:
    void setupUi();
    void setState(const QString &state);

    QLineEdit *m_keyInput;
    QPushButton *m_loginBtn;
    QProgressBar *m_progressBar;
    QLabel *m_errorLabel;
    QWidget *m_idlePanel;
    QWidget *m_loadingPanel;
    QWidget *m_successPanel;
};
