#include "ui/pages/TournamentPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"

#include <QStackedWidget>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QPushButton>
#include <QLineEdit>
#include <QTextEdit>
#include <QComboBox>
#include <QFrame>
#include "ui/components/ClickableFrame.h"
#include <QMessageBox>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QDate>

static const QString ACCENT = "#FA6814";
static const QString CARD_BG = "#2a2a2a";
static const QString BORDER = "#3b3b3b";
static const QString SECONDARY = "#888";
static const QString PRIMARY = "#F2F2F2";
static const QString INPUT_BG = "#1e1e1e";

static QString cardStyle()
{
    return QString(
        "QFrame { background: %1; border: 1px solid %2; border-radius: 8px; }"
        "QFrame:hover { border-color: %3; }"
    ).arg(CARD_BG, BORDER, ACCENT);
}

static QString btnStyle(const QString &bg)
{
    return QString(
        "QPushButton { background: %1; color: %2; border: none; padding: 8px 16px; "
        "border-radius: 4px; font-weight: bold; font-size: 12px; }"
        "QPushButton:hover { opacity: 0.85; }"
    ).arg(bg, PRIMARY);
}

static QString inputStyle()
{
    return QString(
        "QLineEdit, QTextEdit, QComboBox { background: %1; color: %2; border: 1px solid %3; "
        "border-radius: 4px; padding: 8px; font-size: 13px; }"
        "QLineEdit:focus, QTextEdit:focus, QComboBox:focus { border-color: %4; }"
    ).arg(INPUT_BG, PRIMARY, BORDER, ACCENT);
}

TournamentPage::TournamentPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadTournaments();
}

void TournamentPage::refresh()
{
    loadTournaments();
}

void TournamentPage::setupUi()
{
    m_stack = new QStackedWidget(this);

    setupListView();
    setupDetailView();
    setupCreateView();

    m_stack->addWidget(m_listContent);
    m_stack->addWidget(m_detailContent);
    m_stack->addWidget(m_createContent);
    m_stack->setCurrentIndex(0);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(m_stack);
}

void TournamentPage::setupListView()
{
    m_listScroll = new QScrollArea();
    m_listScroll->setWidgetResizable(true);
    m_listScroll->setFrameShape(QFrame::NoFrame);
    m_listScroll->setStyleSheet("QScrollArea { background: transparent; border: none; }");

    m_listContent = new QWidget();
    m_listLayout = new QVBoxLayout(m_listContent);
    m_listLayout->setContentsMargins(24, 24, 24, 24);
    m_listLayout->setSpacing(16);

    auto *headerRow = new QHBoxLayout();
    auto *heading = new QLabel(QString::fromUtf8("TOURNAMENTS"));
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: #F2F2F2;");
    headerRow->addWidget(heading);
    headerRow->addStretch();

    auto *createBtn = new QPushButton(QString::fromUtf8("+ Novyi turnir"));
    createBtn->setStyleSheet(btnStyle(ACCENT));
    connect(createBtn, &QPushButton::clicked, this, [this]() {
        loadGames();
        m_stack->setCurrentIndex(2);
    });
    headerRow->addWidget(createBtn);

    m_listLayout->addLayout(headerRow);

    m_tournamentGrid = new QGridLayout();
    m_tournamentGrid->setSpacing(16);
    m_listLayout->addLayout(m_tournamentGrid);
    m_listLayout->addStretch();

    m_listScroll->setWidget(m_listContent);
}

void TournamentPage::setupDetailView()
{
    m_detailContent = new QWidget();
    m_detailLayout = new QVBoxLayout(m_detailContent);
    m_detailLayout->setContentsMargins(24, 24, 24, 24);
    m_detailLayout->setSpacing(16);

    auto *backBtn = new QPushButton(QString::fromUtf8("< Nazad"));
    backBtn->setStyleSheet(btnStyle(BORDER));
    connect(backBtn, &QPushButton::clicked, this, [this]() {
        m_stack->setCurrentIndex(0);
        loadTournaments();
    });
    m_detailLayout->addWidget(backBtn);

    auto *headerRow = new QHBoxLayout();
    headerRow->setSpacing(16);

    m_detailTitle = new QLabel();
    m_detailTitle->setStyleSheet("font-size: 22px; font-weight: bold; color: #F2F2F2;");
    headerRow->addWidget(m_detailTitle);
    headerRow->addStretch();

    m_detailStatus = new QLabel();
    m_detailStatus->setStyleSheet(QString(
        "padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; color: %1;"
    ).arg(PRIMARY));
    headerRow->addWidget(m_detailStatus);

    m_detailLayout->addLayout(headerRow);

    m_detailGame = new QLabel();
    m_detailGame->setStyleSheet(QString("color: %1; font-size: 14px;").arg(SECONDARY));
    m_detailLayout->addWidget(m_detailGame);

    auto *separator1 = new QFrame();
    separator1->setFrameShape(QFrame::HLine);
    separator1->setStyleSheet(QString("color: %1;").arg(BORDER));
    m_detailLayout->addWidget(separator1);

    auto *infoGrid = new QGridLayout();
    infoGrid->setSpacing(8);

    m_detailDescription = new QLabel();
    m_detailDescription->setWordWrap(true);
    m_detailDescription->setStyleSheet(QString("color: %1; font-size: 13px;").arg(PRIMARY));
    infoGrid->addWidget(new QLabel(QString::fromUtf8("Opisanie:")), 0, 0);
    infoGrid->addWidget(m_detailDescription, 0, 1);

    m_detailFormat = new QLabel();
    m_detailFormat->setStyleSheet(QString("color: %1; font-size: 13px;").arg(PRIMARY));
    infoGrid->addWidget(new QLabel(QString::fromUtf8("Format:")), 1, 0);
    infoGrid->addWidget(m_detailFormat, 1, 1);

    m_detailDates = new QLabel();
    m_detailDates->setStyleSheet(QString("color: %1; font-size: 13px;").arg(PRIMARY));
    infoGrid->addWidget(new QLabel(QString::fromUtf8("Daty:")), 2, 0);
    infoGrid->addWidget(m_detailDates, 2, 1);

    m_detailRules = new QLabel();
    m_detailRules->setWordWrap(true);
    m_detailRules->setStyleSheet(QString("color: %1; font-size: 13px;").arg(PRIMARY));
    infoGrid->addWidget(new QLabel(QString::fromUtf8("Pravila:")), 3, 0);
    infoGrid->addWidget(m_detailRules, 3, 1);

    m_detailLayout->addLayout(infoGrid);

    auto *separator2 = new QFrame();
    separator2->setFrameShape(QFrame::HLine);
    separator2->setStyleSheet(QString("color: %1;").arg(BORDER));
    m_detailLayout->addWidget(separator2);

    auto *regHeader = new QLabel(QString::fromUtf8("Registracii"));
    regHeader->setStyleSheet("font-size: 16px; font-weight: bold; color: #F2F2F2;");
    m_detailLayout->addWidget(regHeader);

    m_registrationsContainer = new QWidget();
    m_registrationsLayout = new QVBoxLayout(m_registrationsContainer);
    m_registrationsLayout->setContentsMargins(0, 0, 0, 0);
    m_registrationsLayout->setSpacing(8);
    m_detailLayout->addWidget(m_registrationsContainer);

    auto *separator3 = new QFrame();
    separator3->setFrameShape(QFrame::HLine);
    separator3->setStyleSheet(QString("color: %1;").arg(BORDER));
    m_detailLayout->addWidget(separator3);

    auto *bracketHeader = new QLabel(QString::fromUtf8("Setka turnira"));
    bracketHeader->setStyleSheet("font-size: 16px; font-weight: bold; color: #F2F2F2;");
    m_detailLayout->addWidget(bracketHeader);

    m_bracketContainer = new QWidget();
    m_bracketLayout = new QVBoxLayout(m_bracketContainer);
    m_bracketLayout->setContentsMargins(0, 0, 0, 0);
    m_bracketLayout->setSpacing(8);
    m_detailLayout->addWidget(m_bracketContainer);

    auto *separator4 = new QFrame();
    separator4->setFrameShape(QFrame::HLine);
    separator4->setStyleSheet(QString("color: %1;").arg(BORDER));
    m_detailLayout->addWidget(separator4);

    auto *statusHeader = new QLabel(QString::fromUtf8("Upravlenie statusom"));
    statusHeader->setStyleSheet("font-size: 16px; font-weight: bold; color: #F2F2F2;");
    m_detailLayout->addWidget(statusHeader);

    auto *statusRow = new QHBoxLayout();
    statusRow->setSpacing(8);

    auto *draftBtn = new QPushButton(QString::fromUtf8("Draft"));
    draftBtn->setStyleSheet(btnStyle("#555"));
    connect(draftBtn, &QPushButton::clicked, this, [this]() {
        advanceStatus(m_selectedTournamentId, "draft");
    });
    statusRow->addWidget(draftBtn);

    auto *pubBtn = new QPushButton(QString::fromUtf8("Published"));
    pubBtn->setStyleSheet(btnStyle(ACCENT));
    connect(pubBtn, &QPushButton::clicked, this, [this]() {
        advanceStatus(m_selectedTournamentId, "published");
    });
    statusRow->addWidget(pubBtn);

    auto *regBtn = new QPushButton(QString::fromUtf8("Registration"));
    regBtn->setStyleSheet(btnStyle("#4caf50"));
    connect(regBtn, &QPushButton::clicked, this, [this]() {
        advanceStatus(m_selectedTournamentId, "registration");
    });
    statusRow->addWidget(regBtn);

    auto *activeBtn = new QPushButton(QString::fromUtf8("Active"));
    activeBtn->setStyleSheet(btnStyle("#2196f3"));
    connect(activeBtn, &QPushButton::clicked, this, [this]() {
        advanceStatus(m_selectedTournamentId, "active");
    });
    statusRow->addWidget(activeBtn);

    auto *completeBtn = new QPushButton(QString::fromUtf8("Completed"));
    completeBtn->setStyleSheet(btnStyle("#9c27b0"));
    connect(completeBtn, &QPushButton::clicked, this, [this]() {
        advanceStatus(m_selectedTournamentId, "completed");
    });
    statusRow->addWidget(completeBtn);

    statusRow->addStretch();
    m_detailLayout->addLayout(statusRow);

    auto *scroll = new QScrollArea();
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setStyleSheet("QScrollArea { background: transparent; border: none; }");
    scroll->setWidget(m_detailContent);

    auto *wrapper = new QWidget();
    auto *wrapperLayout = new QVBoxLayout(wrapper);
    wrapperLayout->setContentsMargins(0, 0, 0, 0);
    wrapperLayout->addWidget(scroll);

    delete m_detailContent;
    m_detailContent = wrapper;
}

void TournamentPage::setupCreateView()
{
    m_createContent = new QWidget();
    m_createLayout = new QVBoxLayout(m_createContent);
    m_createLayout->setContentsMargins(24, 24, 24, 24);
    m_createLayout->setSpacing(16);

    auto *backBtn = new QPushButton(QString::fromUtf8("< Nazad"));
    backBtn->setStyleSheet(btnStyle(BORDER));
    connect(backBtn, &QPushButton::clicked, this, [this]() {
        m_stack->setCurrentIndex(0);
    });
    m_createLayout->addWidget(backBtn);

    auto *heading = new QLabel(QString::fromUtf8("NOVYI TURNIR"));
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: #F2F2F2;");
    m_createLayout->addWidget(heading);

    auto *formCard = new QFrame();
    formCard->setStyleSheet(cardStyle());
    auto *formLayout = new QVBoxLayout(formCard);
    formLayout->setContentsMargins(20, 20, 20, 20);
    formLayout->setSpacing(14);

    auto *gameLabel = new QLabel(QString::fromUtf8("Igra"));
    gameLabel->setStyleSheet(QString("color: %1; font-size: 12px;").arg(SECONDARY));
    formLayout->addWidget(gameLabel);

    m_gameCombo = new QComboBox();
    m_gameCombo->setStyleSheet(inputStyle());
    formLayout->addWidget(m_gameCombo);

    auto *titleLabel = new QLabel(QString::fromUtf8("Nazvanie"));
    titleLabel->setStyleSheet(QString("color: %1; font-size: 12px;").arg(SECONDARY));
    formLayout->addWidget(titleLabel);

    m_titleEdit = new QLineEdit();
    m_titleEdit->setPlaceholderText(QString::fromUtf8("Nazvanie turnira"));
    m_titleEdit->setStyleSheet(inputStyle());
    formLayout->addWidget(m_titleEdit);

    auto *descLabel = new QLabel(QString::fromUtf8("Opisanie"));
    descLabel->setStyleSheet(QString("color: %1; font-size: 12px;").arg(SECONDARY));
    formLayout->addWidget(descLabel);

    m_descEdit = new QTextEdit();
    m_descEdit->setPlaceholderText(QString::fromUtf8("Opisanie turnira"));
    m_descEdit->setMinimumHeight(100);
    m_descEdit->setStyleSheet(inputStyle());
    formLayout->addWidget(m_descEdit);

    auto *formatLabel = new QLabel(QString::fromUtf8("Format"));
    formatLabel->setStyleSheet(QString("color: %1; font-size: 12px;").arg(SECONDARY));
    formLayout->addWidget(formatLabel);

    m_formatCombo = new QComboBox();
    m_formatCombo->setStyleSheet(inputStyle());
    m_formatCombo->addItem("Single Elimination", "single_elimination");
    m_formatCombo->addItem("Double Elimination", "double_elimination");
    m_formatCombo->addItem("Round Robin", "round_robin");
    formLayout->addWidget(m_formatCombo);

    m_createBtn = new QPushButton(QString::fromUtf8("Sozdat' turnir"));
    m_createBtn->setStyleSheet(btnStyle(ACCENT));
    connect(m_createBtn, &QPushButton::clicked, this, &TournamentPage::createTournament);
    formLayout->addWidget(m_createBtn);

    m_createLayout->addWidget(formCard);
    m_createLayout->addStretch();
}

void TournamentPage::loadTournaments()
{
    Application::instance()->httpClient()->get("/api/tournaments",
        [this](const QJsonObject &resp) {
            QJsonArray tournaments;
            if (resp.contains("tournaments")) {
                tournaments = resp["tournaments"].toArray();
            } else if (resp.contains("data")) {
                tournaments = resp["data"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { tournaments = it.value().toArray(); break; }
                }
            }
            populateTournamentGrid(tournaments);
        },
        [](const QString &) {}
    );
}

void TournamentPage::populateTournamentGrid(const QJsonArray &tournaments)
{
    QLayoutItem *item;
    while ((item = m_tournamentGrid->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int cols = 3;
    for (int i = 0; i < tournaments.size(); ++i) {
        QJsonObject t = tournaments[i].toObject();
        int tId = t["id"].toInt();

        auto *card = new ClickableFrame();
        card->setStyleSheet(cardStyle());
        card->setCursor(Qt::PointingHandCursor);
        card->setMinimumHeight(160);

        auto *cardLayout = new QVBoxLayout(card);
        cardLayout->setContentsMargins(16, 16, 16, 16);
        cardLayout->setSpacing(8);

        auto *topRow = new QHBoxLayout();
        auto *titleLabel = new QLabel(t["title"].toString());
        titleLabel->setStyleSheet("font-size: 15px; font-weight: bold; color: #F2F2F2;");
        titleLabel->setWordWrap(true);
        topRow->addWidget(titleLabel, 1);

        QString status = t["status"].toString();
        auto *badge = new QLabel(statusLabel(status));
        badge->setStyleSheet(QString(
            "background: %1; color: %2; padding: 3px 10px; border-radius: 10px; "
            "font-size: 10px; font-weight: bold;"
        ).arg(statusColor(status), PRIMARY));
        badge->setAlignment(Qt::AlignCenter);
        topRow->addWidget(badge);
        cardLayout->addLayout(topRow);

        auto *gameLabel = new QLabel(t["gameName"].toString());
        gameLabel->setStyleSheet(QString("color: %1; font-size: 12px;").arg(SECONDARY));
        cardLayout->addWidget(gameLabel);

        cardLayout->addStretch();

        QString startDate = t["startDate"].toString();
        QString endDate = t["endDate"].toString();
        auto *dateLabel = new QLabel(startDate + " — " + endDate);
        dateLabel->setStyleSheet(QString("color: %1; font-size: 11px;").arg(SECONDARY));
        cardLayout->addWidget(dateLabel);

        connect(card, &ClickableFrame::clicked, this, [this, tId]() {
            showDetail(tId);
        });

        m_tournamentGrid->addWidget(card, i / cols, i % cols);
    }

    for (int c = 0; c < cols; ++c)
        m_tournamentGrid->setColumnStretch(c, 1);
}

void TournamentPage::showDetail(int tournamentId)
{
    m_selectedTournamentId = tournamentId;
    m_stack->setCurrentIndex(1);
    loadTournamentDetail(tournamentId);
}

void TournamentPage::loadTournamentDetail(int id)
{
    Application::instance()->httpClient()->get(
        QString("/api/tournaments/%1").arg(id),
        [this, id](const QJsonObject &resp) {
            QJsonObject t;
            if (resp.contains("tournament")) {
                t = resp["tournament"].toObject();
            } else if (resp.contains("data")) {
                t = resp["data"].toObject();
            } else {
                t = resp;
            }
            populateDetail(t);
            loadRegistrations(id);
            loadBracket(id);
        },
        [](const QString &) {}
    );
}

void TournamentPage::populateDetail(const QJsonObject &tournament)
{
    m_detailTitle->setText(tournament["title"].toString());

    QString status = tournament["status"].toString();
    m_detailStatus->setText(statusLabel(status));
    m_detailStatus->setStyleSheet(QString(
        "background: %1; color: %2; padding: 4px 12px; border-radius: 12px; "
        "font-size: 11px; font-weight: bold;"
    ).arg(statusColor(status), PRIMARY));

    m_detailGame->setText(QString::fromUtf8("Igra: ") + tournament["gameName"].toString());
    m_detailDescription->setText(tournament["description"].toString());
    m_detailFormat->setText(tournament["format"].toString());
    m_detailRules->setText(tournament["rules"].toString());

    QString startDate = tournament["startDate"].toString();
    QString endDate = tournament["endDate"].toString();
    m_detailDates->setText(startDate + " — " + endDate);
}

void TournamentPage::loadRegistrations(int tournamentId)
{
    QLayoutItem *item;
    while ((item = m_registrationsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    Application::instance()->httpClient()->get(
        QString("/api/tournaments/%1/registrations").arg(tournamentId),
        [this, tournamentId](const QJsonObject &resp) {
            QJsonArray regs;
            if (resp.contains("registrations")) {
                regs = resp["registrations"].toArray();
            } else if (resp.contains("data")) {
                regs = resp["data"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { regs = it.value().toArray(); break; }
                }
            }
            populateRegistrations(regs);
        },
        [](const QString &) {}
    );
}

void TournamentPage::populateRegistrations(const QJsonArray &registrations)
{
    QLayoutItem *item;
    while ((item = m_registrationsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    if (registrations.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Registracii otsutstvuyut"));
        empty->setStyleSheet(QString("color: %1; font-size: 13px; padding: 12px;").arg(SECONDARY));
        m_registrationsLayout->addWidget(empty);
        return;
    }

    for (int i = 0; i < registrations.size(); ++i) {
        QJsonObject reg = registrations[i].toObject();
        int regId = reg["id"].toInt();
        QString teamName = reg["teamName"].toString();
        QString playerName = reg["playerName"].toString();
        QString regStatus = reg["status"].toString();

        auto *card = new QFrame();
        card->setStyleSheet(cardStyle());

        auto *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(14, 10, 14, 10);
        cardLayout->setSpacing(12);

        auto *info = new QLabel(teamName.isEmpty() ? playerName : teamName);
        info->setStyleSheet(QString("color: %1; font-size: 13px;").arg(PRIMARY));
        cardLayout->addWidget(info, 1);

        auto *statusBadge = new QLabel(regStatus);
        statusBadge->setStyleSheet(QString(
            "color: %1; font-size: 11px; padding: 2px 8px; border-radius: 8px; background: #3b3b3b;"
        ).arg(SECONDARY));
        cardLayout->addWidget(statusBadge);

        if (regStatus != "approved" && regStatus != "rejected") {
            auto *approveBtn = new QPushButton(QString::fromUtf8("Odobrit'"));
            approveBtn->setStyleSheet(btnStyle("#4caf50"));
            connect(approveBtn, &QPushButton::clicked, this, [this, regId]() {
                approveRegistration(m_selectedTournamentId, regId);
            });
            cardLayout->addWidget(approveBtn);

            auto *rejectBtn = new QPushButton(QString::fromUtf8("Otklonit'"));
            rejectBtn->setStyleSheet(btnStyle("#ff4444"));
            connect(rejectBtn, &QPushButton::clicked, this, [this, regId]() {
                rejectRegistration(m_selectedTournamentId, regId);
            });
            cardLayout->addWidget(rejectBtn);
        }

        m_registrationsLayout->addWidget(card);
    }
}

void TournamentPage::approveRegistration(int tournamentId, int registrationId)
{
    Application::instance()->httpClient()->patch(
        QString("/api/tournaments/%1/registrations/%2").arg(tournamentId).arg(registrationId),
        QJsonObject{{"status", "approved"}},
        [this, tournamentId](const QJsonObject &) {
            loadRegistrations(tournamentId);
        },
        [](const QString &) {}
    );
}

void TournamentPage::rejectRegistration(int tournamentId, int registrationId)
{
    Application::instance()->httpClient()->patch(
        QString("/api/tournaments/%1/registrations/%2").arg(tournamentId).arg(registrationId),
        QJsonObject{{"status", "rejected"}},
        [this, tournamentId](const QJsonObject &) {
            loadRegistrations(tournamentId);
        },
        [](const QString &) {}
    );
}

void TournamentPage::loadBracket(int tournamentId)
{
    QLayoutItem *item;
    while ((item = m_bracketLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    Application::instance()->httpClient()->get(
        QString("/api/tournaments/%1/bracket").arg(tournamentId),
        [this](const QJsonObject &resp) {
            QJsonArray rounds;
            if (resp.contains("rounds")) {
                rounds = resp["rounds"].toArray();
            } else if (resp.contains("bracket")) {
                QJsonObject bracket = resp["bracket"].toObject();
                rounds = bracket["rounds"].toArray();
            } else if (resp.contains("data")) {
                QJsonObject data = resp["data"].toObject();
                rounds = data["rounds"].toArray();
            }
            populateBracket(rounds);
        },
        [](const QString &) {}
    );
}

void TournamentPage::populateBracket(const QJsonArray &rounds)
{
    QLayoutItem *item;
    while ((item = m_bracketLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    if (rounds.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Setka ne sformirovana"));
        empty->setStyleSheet(QString("color: %1; font-size: 13px; padding: 12px;").arg(SECONDARY));
        m_bracketLayout->addWidget(empty);
        return;
    }

    for (int r = 0; r < rounds.size(); ++r) {
        QJsonObject round = rounds[r].toObject();
        QString roundName = round["name"].toString();
        if (roundName.isEmpty())
            roundName = QString::fromUtf8("Raund %1").arg(r + 1);

        auto *roundLabel = new QLabel(roundName);
        roundLabel->setStyleSheet(QString(
            "color: %1; font-size: 13px; font-weight: bold; padding: 4px 0;"
        ).arg(ACCENT));
        m_bracketLayout->addWidget(roundLabel);

        QJsonArray matches = round["matches"].toArray();
        for (int m = 0; m < matches.size(); ++m) {
            QJsonObject match = matches[m].toObject();
            int matchId = match["id"].toInt();
            QString team1 = match["team1"].toString();
            QString team2 = match["team2"].toString();
            int score1 = match["score1"].toInt();
            int score2 = match["score2"].toInt();
            QString matchStatus = match["status"].toString();

            auto *matchCard = new QFrame();
            matchCard->setStyleSheet(cardStyle());

            auto *matchLayout = new QHBoxLayout(matchCard);
            matchLayout->setContentsMargins(14, 10, 14, 10);
            matchLayout->setSpacing(10);

            auto *t1Label = new QLabel(team1.isEmpty() ? "TBD" : team1);
            t1Label->setStyleSheet(QString("color: %1; font-size: 13px; font-weight: bold;").arg(PRIMARY));
            matchLayout->addWidget(t1Label, 1);

            auto *vsLabel = new QLabel(QString::fromUtf8("VS"));
            vsLabel->setStyleSheet(QString("color: %1; font-size: 11px; font-weight: bold;").arg(SECONDARY));
            vsLabel->setAlignment(Qt::AlignCenter);
            matchLayout->addWidget(vsLabel);

            auto *t2Label = new QLabel(team2.isEmpty() ? "TBD" : team2);
            t2Label->setStyleSheet(QString("color: %1; font-size: 13px; font-weight: bold;").arg(PRIMARY));
            matchLayout->addWidget(t2Label, 1);

            auto *scoreEdit1 = new QLineEdit(QString::number(score1));
            scoreEdit1->setMaximumWidth(40);
            scoreEdit1->setAlignment(Qt::AlignCenter);
            scoreEdit1->setStyleSheet(inputStyle());
            matchLayout->addWidget(scoreEdit1);

            auto *dashLabel = new QLabel(":");
            dashLabel->setStyleSheet(QString("color: %1; font-size: 14px; font-weight: bold;").arg(SECONDARY));
            dashLabel->setAlignment(Qt::AlignCenter);
            matchLayout->addWidget(dashLabel);

            auto *scoreEdit2 = new QLineEdit(QString::number(score2));
            scoreEdit2->setMaximumWidth(40);
            scoreEdit2->setAlignment(Qt::AlignCenter);
            scoreEdit2->setStyleSheet(inputStyle());
            matchLayout->addWidget(scoreEdit2);

            auto *saveBtn = new QPushButton(QString::fromUtf8("Save"));
            saveBtn->setStyleSheet(btnStyle(ACCENT));
            connect(saveBtn, &QPushButton::clicked, this, [this, matchId, scoreEdit1, scoreEdit2]() {
                int s1 = scoreEdit1->text().toInt();
                int s2 = scoreEdit2->text().toInt();
                updateMatchScore(m_selectedTournamentId, matchId, s1, s2);
            });
            matchLayout->addWidget(saveBtn);

            auto *msBadge = new QLabel(matchStatus);
            msBadge->setStyleSheet(QString(
                "color: %1; font-size: 10px; padding: 2px 8px; border-radius: 8px; background: #3b3b3b;"
            ).arg(SECONDARY));
            matchLayout->addWidget(msBadge);

            m_bracketLayout->addWidget(matchCard);
        }
    }
}

void TournamentPage::updateMatchScore(int tournamentId, int matchId, int score1, int score2)
{
    Application::instance()->httpClient()->patch(
        QString("/api/tournaments/%1/matches/%2").arg(tournamentId).arg(matchId),
        QJsonObject{{"score1", score1}, {"score2", score2}},
        [this, tournamentId](const QJsonObject &) {
            loadBracket(tournamentId);
        },
        [](const QString &) {}
    );
}

void TournamentPage::advanceStatus(int tournamentId, const QString &newStatus)
{
    Application::instance()->httpClient()->patch(
        QString("/api/tournaments/%1").arg(tournamentId),
        QJsonObject{{"status", newStatus}},
        [this, tournamentId](const QJsonObject &resp) {
            loadTournamentDetail(tournamentId);
        },
        [](const QString &) {}
    );
}

void TournamentPage::loadGames()
{
    Application::instance()->httpClient()->get("/api/games",
        [this](const QJsonObject &resp) {
            QJsonArray games;
            if (resp.contains("games")) {
                games = resp["games"].toArray();
            } else if (resp.contains("data")) {
                games = resp["data"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { games = it.value().toArray(); break; }
                }
            }

            m_gameCombo->clear();
            m_games = games;
            for (int i = 0; i < games.size(); ++i) {
                QJsonObject g = games[i].toObject();
                m_gameCombo->addItem(g["name"].toString(), g["id"].toInt());
            }
        },
        [](const QString &) {}
    );
}

void TournamentPage::createTournament()
{
    if (m_gameCombo->currentIndex() < 0 || m_titleEdit->text().trimmed().isEmpty()) {
        QMessageBox::warning(this, QString::fromUtf8("Oshibka"),
                             QString::fromUtf8("Zapolnite vse obyazatel'nye polya"));
        return;
    }

    int gameId = m_gameCombo->currentData().toInt();
    QString title = m_titleEdit->text().trimmed();
    QString description = m_descEdit->toPlainText().trimmed();
    QString format = m_formatCombo->currentData().toString();

    QJsonObject body;
    body["gameId"] = gameId;
    body["title"] = title;
    body["description"] = description;
    body["format"] = format;

    m_createBtn->setEnabled(false);

    Application::instance()->httpClient()->post("/api/tournaments", body,
        [this](const QJsonObject &resp) {
            m_titleEdit->clear();
            m_descEdit->clear();
            m_formatCombo->setCurrentIndex(0);
            m_createBtn->setEnabled(true);
            m_stack->setCurrentIndex(0);
            loadTournaments();
        },
        [this](const QString &err) {
            m_createBtn->setEnabled(true);
            QMessageBox::warning(this, QString::fromUtf8("Oshibka"),
                                 QString::fromUtf8("Ne udalos' sozdat': ") + err);
        }
    );
}

QString TournamentPage::statusColor(const QString &status) const
{
    if (status == "draft") return "#555555";
    if (status == "published") return ACCENT;
    if (status == "registration") return "#4caf50";
    if (status == "active") return "#2196f3";
    if (status == "completed") return "#9c27b0";
    return "#555555";
}

QString TournamentPage::statusLabel(const QString &status) const
{
    if (status == "draft") return "Draft";
    if (status == "published") return "Published";
    if (status == "registration") return "Registration";
    if (status == "active") return "Active";
    if (status == "completed") return "Completed";
    return status;
}

QString TournamentPage::nextStatus(const QString &current) const
{
    if (current == "draft") return "published";
    if (current == "published") return "registration";
    if (current == "registration") return "active";
    if (current == "active") return "completed";
    return current;
}
