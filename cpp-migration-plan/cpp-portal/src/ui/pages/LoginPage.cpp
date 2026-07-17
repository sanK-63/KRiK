#include "ui/pages/LoginPage.h"
#include "core/Application.h"
#include "network/AuthInterceptor.h"
#include <QVBoxLayout>
#include <QTimer>
#include <QRandomGenerator>

LoginPage::LoginPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();

    connect(Application::instance()->authManager(), &AuthInterceptor::loginError,
            this, [this](const QString &err) {
        setState("idle");
        m_errorLabel->setText(err);
        m_errorLabel->show();
    });

    connect(Application::instance()->authManager(), &AuthInterceptor::loginSuccess,
            this, [this]() {
        setState("success");
        QTimer::singleShot(1200, this, &LoginPage::loginSuccess);
    });
}

void LoginPage::setupUi()
{
    auto *outerLayout = new QVBoxLayout(this);
    outerLayout->setAlignment(Qt::AlignCenter);

    auto *card = new QWidget();
    card->setObjectName("loginCard");
    card->setFixedWidth(500);
    auto *cardLayout = new QVBoxLayout(card);
    cardLayout->setContentsMargins(40, 40, 40, 40);

    auto *title = new QLabel(QString::fromUtf8("Kontora\n\u00ABPiga i Kopyta\u00BB"));
    title->setAlignment(Qt::AlignCenter);
    title->setObjectName("loginTitle");
    cardLayout->addWidget(title);

    auto *subtitle = new QLabel("Vvedite personal'nyj kluch dostupa");
    subtitle->setAlignment(Qt::AlignCenter);
    subtitle->setObjectName("loginSubtitle");
    cardLayout->addWidget(subtitle);
    cardLayout->addSpacing(32);

    m_idlePanel = new QWidget();
    auto *idleLayout = new QVBoxLayout(m_idlePanel);
    idleLayout->setContentsMargins(0, 0, 0, 0);

    auto *keyLabel = new QLabel("KLUCH");
    keyLabel->setObjectName("fieldLabel");
    idleLayout->addWidget(keyLabel);

    m_keyInput = new QLineEdit();
    m_keyInput->setEchoMode(QLineEdit::Password);
    m_keyInput->setPlaceholderText("Vvedite kluch...");
    connect(m_keyInput, &QLineEdit::returnPressed, this, &LoginPage::handleLogin);
    idleLayout->addWidget(m_keyInput);

    m_errorLabel = new QLabel();
    m_errorLabel->setObjectName("errorLabel");
    m_errorLabel->hide();
    idleLayout->addWidget(m_errorLabel);

    m_loginBtn = new QPushButton("VOJTI");
    m_loginBtn->setObjectName("loginBtn");
    connect(m_loginBtn, &QPushButton::clicked, this, &LoginPage::handleLogin);
    idleLayout->addWidget(m_loginBtn);

    cardLayout->addWidget(m_idlePanel);

    m_loadingPanel = new QWidget();
    auto *loadingLayout = new QVBoxLayout(m_loadingPanel);
    loadingLayout->setContentsMargins(0, 0, 0, 0);

    auto *loadingLabel = new QLabel("Proverka klucha...");
    loadingLabel->setObjectName("loadingLabel");
    loadingLayout->addWidget(loadingLabel);

    m_progressBar = new QProgressBar();
    m_progressBar->setRange(0, 100);
    m_progressBar->setValue(0);
    m_progressBar->setTextVisible(true);
    loadingLayout->addWidget(m_progressBar);
    m_loadingPanel->hide();
    cardLayout->addWidget(m_loadingPanel);

    m_successPanel = new QWidget();
    auto *successLayout = new QVBoxLayout(m_successPanel);
    successLayout->setContentsMargins(0, 0, 0, 0);
    auto *successLabel = new QLabel("Dostup razreshen");
    successLabel->setAlignment(Qt::AlignCenter);
    successLabel->setObjectName("successLabel");
    successLayout->addWidget(successLabel);
    m_successPanel->hide();
    cardLayout->addWidget(m_successPanel);

    outerLayout->addWidget(card, 0, Qt::AlignCenter);
}

void LoginPage::handleLogin()
{
    QString key = m_keyInput->text().trimmed();
    if (key.isEmpty()) return;
    setState("loading");

    m_progressBar->setValue(0);
    auto *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, [this, timer]() {
        int val = m_progressBar->value() + QRandomGenerator::global()->bounded(5, 15);
        if (val >= 100) {
            val = 100;
            timer->stop();
            timer->deleteLater();
            Application::instance()->authManager()->login(m_keyInput->text().trimmed());
        }
        m_progressBar->setValue(val);
    });
    timer->start(120);
}

void LoginPage::setState(const QString &state)
{
    m_idlePanel->setVisible(state == "idle");
    m_loadingPanel->setVisible(state == "loading");
    m_successPanel->setVisible(state == "success");
    m_keyInput->setEnabled(state == "idle");
    m_loginBtn->setEnabled(state == "idle");
    if (state == "loading") {
        m_progressBar->setValue(0);
        m_errorLabel->hide();
    }
}
